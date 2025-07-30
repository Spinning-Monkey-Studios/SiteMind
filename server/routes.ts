import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import passport from "passport";
import express from "express";
import * as path from "path";
import { z } from "zod";
import { WordPressService } from "./services/wordpress";
import { aiServiceFactory, type AIProvider } from "./services/ai-factory";
import { EncryptionService } from "./services/encryption";
import { getAuthProviders } from "./services/auth-providers";
import { consoleMonitor } from "./services/console-monitor";
import { graphicsService } from "./services/graphics-service";
import { GeminiService } from "./services/gemini";
import { 
  insertWordpressSiteSchema, 
  insertMessageSchema,
  insertUserApiKeySchema,
  insertHostingAccountSchema,
  type WordPressSite 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Import localhost configuration
  const { isLocalhost, localhostConfig, localhostAuthMiddleware } = await import('./localhost-config');
  
  // Auth middleware
  await setupAuth(app);

  // Development authentication for localhost
  if (isLocalhost()) {
    app.get('/api/auth/dev-login', async (req: any, res) => {
      try {
        // Create development user in database if not exists
        const devUser = await storage.upsertUser(localhostConfig.defaultDevUser);
        
        // Create session
        req.session.user = {
          claims: { sub: devUser.id }
        };
        
        res.redirect('/');
      } catch (error) {
        console.error('Dev login error:', error);
        res.status(500).json({ message: 'Development login failed' });
      }
    });

    // Auto-authenticate for localhost development
    app.use('/api', localhostAuthMiddleware);
  }

  const wordpressService = new WordPressService();


  // Import admin bypass service
  const { adminBypassService } = await import('./services/admin-bypass');

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // Check for admin bypass on every auth request
      if (user && await adminBypassService.shouldBypassPayment(userId, user.email || undefined)) {
        // User has been upgraded to admin, refetch
        user = await storage.getUser(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin bypass routes
  app.post('/api/admin/bypass/master-key', isAuthenticated, async (req: any, res) => {
    try {
      const { masterKey } = req.body;
      const userId = req.user.claims.sub;
      
      const success = await adminBypassService.applyMasterKeyBypass(userId, masterKey);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Admin access granted via master key',
          tier: 'developer'
        });
      } else {
        res.status(400).json({ message: 'Invalid master key' });
      }
    } catch (error) {
      console.error('Master key bypass error:', error);
      res.status(500).json({ message: 'Bypass failed' });
    }
  });

  app.post('/api/admin/bypass/code', isAuthenticated, async (req: any, res) => {
    try {
      const { bypassCode } = req.body;
      const userId = req.user.claims.sub;
      
      const success = await adminBypassService.applyBypassCode(userId, bypassCode);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Admin access granted via bypass code',
          tier: 'developer'
        });
      } else {
        res.status(400).json({ message: 'Invalid bypass code' });
      }
    } catch (error) {
      console.error('Bypass code error:', error);
      res.status(500).json({ message: 'Bypass failed' });
    }
  });

  app.get('/api/admin/bypass/config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only admins can view bypass config
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const config = adminBypassService.getBypassConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting bypass config:', error);
      res.status(500).json({ message: 'Failed to get bypass config' });
    }
  });

  app.post('/api/admin/bypass/generate-code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only admins can generate bypass codes
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const newCode = adminBypassService.generateBypassCode();
      res.json({ code: newCode, message: 'New bypass code generated' });
    } catch (error) {
      console.error('Error generating bypass code:', error);
      res.status(500).json({ message: 'Failed to generate bypass code' });
    }
  });

  // WordPress site management
  app.get('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sites = await storage.getUserSites(userId);
      res.json(sites);
    } catch (error) {
      console.error("Error fetching sites:", error);
      res.status(500).json({ message: "Failed to fetch sites" });
    }
  });

  app.post('/api/sites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const siteData = insertWordpressSiteSchema.parse({
        ...req.body,
        userId,
      });

      // Test WordPress connection
      const connectionTest = await wordpressService.testConnection(
        siteData.url,
        siteData.username,
        siteData.encryptedPassword,
        siteData.authMethod || 'app-password'
      );

      if (!connectionTest.success) {
        return res.status(400).json({ 
          message: "WordPress connection failed", 
          error: connectionTest.error 
        });
      }

      // Encrypt password before storing
      const encryptedPassword = await wordpressService.encryptCredentials(siteData.encryptedPassword);
      
      const site = await storage.createSite({
        ...siteData,
        encryptedPassword,
        wpVersion: connectionTest.wpVersion,
        activeTheme: connectionTest.activeTheme,
        pluginCount: connectionTest.pluginCount,
        lastConnected: new Date(),
      });

      // Log connection activity
      await storage.createSiteActivity({
        siteId: site.id,
        activityType: 'site_connected',
        description: 'WordPress site successfully connected',
        metadata: { wpVersion: connectionTest.wpVersion },
      });

      res.json(site);
    } catch (error) {
      console.error("Error creating site:", error);
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  app.get('/api/sites/:siteId', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      // Verify ownership
      if (site.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(site);
    } catch (error) {
      console.error("Error fetching site:", error);
      res.status(500).json({ message: "Failed to fetch site" });
    }
  });

  app.delete('/api/sites/:siteId', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      // Verify ownership
      if (site.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteSite(siteId);
      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      console.error("Error deleting site:", error);
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Chat and AI operations
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:conversationId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:conversationId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });

      // Save user message
      const userMessage = await storage.createMessage(messageData);

      // Get site information for AI context
      let siteContext: (WordPressSite & { decryptedPassword: string }) | null = null;
      if (conversation.siteId) {
        const site = await storage.getSite(conversation.siteId);
        if (site) {
          const decryptedPassword = await wordpressService.decryptCredentials(site.encryptedPassword);
          siteContext = {
            ...site,
            decryptedPassword,
          };
        }
      }

      // Process with AI (use available provider)
      const aiService = aiServiceFactory.getService();
      const aiResponse = await aiService.processWordPressCommand(
        messageData.content,
        siteContext
      );

      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata,
      });

      // Execute WordPress actions if any
      if (aiResponse.actions && siteContext) {
        for (const action of aiResponse.actions) {
          const wpAction = await storage.createWpAction({
            siteId: siteContext.id,
            messageId: aiMessage.id,
            actionType: action.type,
            description: action.description,
            status: 'pending',
          });

          // Execute the action
          try {
            await storage.updateWpAction(wpAction.id, { status: 'in_progress' });
            
            const result = await wordpressService.executeAction(
              siteContext,
              action
            );

            await storage.updateWpAction(wpAction.id, {
              status: 'completed',
              result,
              completedAt: new Date(),
            });

            // Log activity
            await storage.createSiteActivity({
              siteId: siteContext.id,
              activityType: action.type,
              description: action.description,
              metadata: result,
            });

          } catch (actionError) {
            console.error("Action execution error:", actionError);
            await storage.updateWpAction(wpAction.id, {
              status: 'failed',
              result: { error: actionError instanceof Error ? actionError.message : String(actionError) },
              completedAt: new Date(),
            });
          }
        }
      }

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Site activities and status
  app.get('/api/sites/:siteId/activities', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site || site.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Site not found" });
      }

      const activities = await storage.getSiteActivities(siteId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // WordPress site status check
  app.post('/api/sites/:siteId/check-status', isAuthenticated, async (req: any, res) => {
    try {
      const { siteId } = req.params;
      const site = await storage.getSite(siteId);
      
      if (!site || site.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Site not found" });
      }

      const decryptedPassword = await wordpressService.decryptCredentials(site.encryptedPassword);
      const status = await wordpressService.getSiteStatus({
        ...site,
        decryptedPassword,
      });

      // Update site info
      await storage.updateSite(siteId, {
        lastConnected: new Date(),
        wpVersion: status.wpVersion,
        activeTheme: status.activeTheme,
        pluginCount: status.pluginCount,
        isActive: status.isOnline,
      });

      res.json(status);
    } catch (error) {
      console.error("Error checking site status:", error);
      res.status(500).json({ message: "Failed to check site status" });
    }
  });

  // Get available AI providers
  app.get('/api/ai/providers', isAuthenticated, async (req: any, res) => {
    try {
      const providers = aiServiceFactory.getAvailableProviders();
      res.json({ providers });
    } catch (error) {
      console.error("Error fetching AI providers:", error);
      res.status(500).json({ message: "Failed to fetch AI providers" });
    }
  });

  // Create new conversation
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { siteId, title } = req.body;

      const conversation = await storage.createConversation({
        userId,
        siteId: siteId || null,
        title: title || 'New Conversation',
      });

      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // API Key Management Routes
  app.get('/api/user/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiKeys = await storage.getUserApiKeys(userId);
      
      // Don't return the actual encrypted keys, just metadata
      const safeApiKeys = apiKeys.map(key => ({
        ...key,
        encryptedKey: undefined,
        hasKey: !!key.encryptedKey,
      }));
      
      res.json(safeApiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post('/api/user/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keyData = insertUserApiKeySchema.parse({
        ...req.body,
        userId,
      });

      // Encrypt the API key before storing
      const encryptedKey = await EncryptionService.encrypt(keyData.encryptedKey);
      
      const apiKey = await storage.createUserApiKey({
        ...keyData,
        encryptedKey,
      });

      res.json({
        ...apiKey,
        encryptedKey: undefined,
        hasKey: true,
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.put('/api/user/api-keys/:keyId', isAuthenticated, async (req: any, res) => {
    try {
      const { keyId } = req.params;
      const updates = req.body;
      
      // Encrypt new API key if provided
      if (updates.encryptedKey) {
        updates.encryptedKey = await EncryptionService.encrypt(updates.encryptedKey);
      }

      const apiKey = await storage.updateUserApiKey(keyId, {
        ...updates,
        lastUsed: new Date(),
      });

      res.json({
        ...apiKey,
        encryptedKey: undefined,
        hasKey: !!apiKey.encryptedKey,
      });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  app.delete('/api/user/api-keys/:keyId', isAuthenticated, async (req: any, res) => {
    try {
      const { keyId } = req.params;
      await storage.deleteUserApiKey(keyId);
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // Hosting Account Management Routes
  app.get('/api/user/hosting-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserHostingAccounts(userId);
      
      // Don't return encrypted credentials, just metadata
      const safeAccounts = accounts.map(account => ({
        ...account,
        encryptedCredentials: undefined,
        hasCredentials: !!account.encryptedCredentials,
      }));
      
      res.json(safeAccounts);
    } catch (error) {
      console.error("Error fetching hosting accounts:", error);
      res.status(500).json({ message: "Failed to fetch hosting accounts" });
    }
  });

  app.post('/api/user/hosting-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertHostingAccountSchema.parse({
        ...req.body,
        userId,
      });

      // Encrypt credentials before storing
      const encryptedCredentials = await EncryptionService.encryptJSON(JSON.parse(accountData.encryptedCredentials));
      
      const account = await storage.createHostingAccount({
        ...accountData,
        encryptedCredentials,
        lastConnected: new Date(),
      });

      res.json({
        ...account,
        encryptedCredentials: undefined,
        hasCredentials: true,
      });
    } catch (error) {
      console.error("Error creating hosting account:", error);
      res.status(500).json({ message: "Failed to create hosting account" });
    }
  });

  app.delete('/api/user/hosting-accounts/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      await storage.deleteHostingAccount(accountId);
      res.json({ message: "Hosting account deleted successfully" });
    } catch (error) {
      console.error("Error deleting hosting account:", error);
      res.status(500).json({ message: "Failed to delete hosting account" });
    }
  });

  // Authentication Provider Routes
  app.get('/api/auth/providers', async (req, res) => {
    try {
      const providers = getAuthProviders();
      res.json({ providers });
    } catch (error) {
      console.error("Error fetching auth providers:", error);
      res.status(500).json({ message: "Failed to fetch auth providers" });
    }
  });

  // Facebook OAuth routes (only register if Facebook strategy is available)
  try {
    app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
    app.get('/api/auth/facebook/callback', 
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  } catch (error) {
    console.log('Facebook OAuth routes not registered - strategy not available');
  }

  // Microsoft OAuth routes (only register if Microsoft strategy is available)
  try {
    app.get('/api/auth/microsoft', passport.authenticate('microsoft'));
    app.get('/api/auth/microsoft/callback',
      passport.authenticate('microsoft', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  } catch (error) {
    console.log('Microsoft OAuth routes not registered - strategy not available');
  }

  // Console Monitoring Routes
  app.post('/api/console/errors', async (req, res) => {
    try {
      const { errors } = req.body;
      
      if (Array.isArray(errors)) {
        errors.forEach(error => {
          consoleMonitor.addError({
            message: error.message || error,
            source: error.source,
            line: error.line,
            column: error.column,
            timestamp: new Date(error.timestamp || Date.now()),
            url: error.url,
            stack: error.stack,
            level: error.level || 'error'
          });
        });
      }
      
      res.json({ message: 'Errors logged successfully' });
    } catch (error) {
      console.error('Error logging console errors:', error);
      res.status(500).json({ message: 'Failed to log errors' });
    }
  });

  app.get('/api/console/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = parseInt(req.query.count as string) || 5;
      
      const analysis = await consoleMonitor.analyzeErrors(userId, count);
      const summary = consoleMonitor.getErrorsSummary();
      
      res.json({ analysis, summary });
    } catch (error) {
      console.error('Error analyzing console errors:', error);
      res.status(500).json({ message: 'Failed to analyze errors' });
    }
  });

  app.get('/api/console/errors', async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 10;
      const errors = consoleMonitor.getRecentErrors(count);
      res.json({ errors });
    } catch (error) {
      console.error('Error fetching console errors:', error);
      res.status(500).json({ message: 'Failed to fetch errors' });
    }
  });

  // Graphics and Media Routes
  app.post('/api/graphics/search', isAuthenticated, async (req: any, res) => {
    try {
      const { theme, section, style, keywords } = req.body;
      
      const graphics = await graphicsService.findFreeGraphics({
        theme,
        section,
        style,
        keywords
      });
      
      res.json({ graphics });
    } catch (error) {
      console.error('Error searching graphics:', error);
      res.status(500).json({ message: 'Failed to search graphics' });
    }
  });

  app.post('/api/graphics/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme, section } = req.body;
      
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const suggestions = await geminiService.suggestFreeGraphics(theme, section);
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Error getting graphics suggestions:', error);
      res.status(500).json({ message: 'Failed to get graphics suggestions' });
    }
  });

  app.post('/api/graphics/generate-prompt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { section, style, purpose } = req.body;
      
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const prompt = await geminiService.generateGraphicsPrompt(section, style, purpose);
      
      res.json({ prompt });
    } catch (error) {
      console.error('Error generating graphics prompt:', error);
      res.status(500).json({ message: 'Failed to generate graphics prompt' });
    }
  });

  app.post('/api/graphics/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, filename } = req.body;
      
      const filePath = await graphicsService.generateCustomGraphics(userId, prompt, filename || `generated-${Date.now()}.jpg`);
      
      res.json({ 
        message: 'Graphics generated successfully',
        filePath: filePath.replace(process.cwd(), ''),
        downloadUrl: `/api/uploads/${path.basename(filePath)}`
      });
    } catch (error) {
      console.error('Error generating custom graphics:', error);
      res.status(500).json({ message: 'Failed to generate custom graphics' });
    }
  });

  app.post('/api/graphics/download', isAuthenticated, async (req: any, res) => {
    try {
      const { url, filename } = req.body;
      
      const filePath = await graphicsService.downloadImage(url, filename);
      
      res.json({ 
        message: 'Image downloaded successfully',
        filePath: filePath.replace(process.cwd(), ''),
        downloadUrl: `/api/uploads/${path.basename(filePath)}`
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      res.status(500).json({ message: 'Failed to download image' });
    }
  });

  // Layout and Image Analysis Routes
  app.post('/api/analyze/layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, imageData } = req.body;
      
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const analysis = await geminiService.analyzeLayoutAndImages(description, imageData);
      
      res.json({ analysis });
    } catch (error) {
      console.error('Error analyzing layout:', error);
      res.status(500).json({ message: 'Failed to analyze layout' });
    }
  });

  // Blog Content Generation Routes
  app.post('/api/content/generate-blog', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topic, style, wordCount } = req.body;
      
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const content = await geminiService.generateBlogContent(topic, style, wordCount);
      
      res.json({ content });
    } catch (error) {
      console.error('Error generating blog content:', error);
      res.status(500).json({ message: 'Failed to generate blog content' });
    }
  });

  // Static file serving for uploads
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Initialize and start monitoring service
  try {
    const { monitoringService } = await import('./services/monitoring-service');
    await monitoringService.startMonitoring();
    
    // Monitoring status routes
    app.get('/api/monitoring/status', isAuthenticated, async (req: any, res) => {
      try {
        const isActive = monitoringService.isMonitoringActive();
        res.json({ 
          active: isActive,
          message: isActive ? 'Monitoring service is active' : 'Monitoring service is not running'
        });
      } catch (error) {
        console.error('Error checking monitoring status:', error);
        res.status(500).json({ message: 'Failed to check monitoring status' });
      }
    });

    app.get('/api/monitoring/site/:siteId', isAuthenticated, async (req: any, res) => {
      try {
        const { siteId } = req.params;
        const status = await monitoringService.getSiteMonitoringStatus(siteId);
        res.json(status);
      } catch (error) {
        console.error('Error getting site monitoring status:', error);
        res.status(500).json({ message: 'Failed to get site monitoring status' });
      }
    });
  } catch (error) {
    console.error('Error initializing monitoring service:', error);
  }

  // Initialize services dynamically to avoid dependency issues  
  try {
    const { paymentService } = await import('./services/payment-service');
    const { subscriptionService } = await import('./services/subscription-service');
    
    await paymentService.initializeProviders();
    await subscriptionService.initializeDefaultPlans();
  } catch (error) {
    console.error('Error initializing payment services:', error);
  }

  // Subscription and payment routes
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/payment-providers', async (req, res) => {
    try {
      const providers = await storage.getEnabledPaymentProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching payment providers:", error);
      res.status(500).json({ message: "Failed to fetch payment providers" });
    }
  });

  app.post('/api/checkout/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId, providerId } = req.body;

      const { paymentService } = await import('./services/payment-service');
      const result = await paymentService.createCheckout(userId, planId, providerId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout" });
    }
  });

  // Admin routes (protected by isDeveloper or isAdmin check)
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || (!user.isAdmin && !user.isDeveloper)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin access" });
    }
  };

  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Mock stats for now - would be calculated from actual data
      const stats = {
        totalUsers: 156,
        activeSubscriptions: 89,
        monthlyRevenue: 435600, // in cents
        totalSites: 234
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/subscription-plans', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching admin plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.get('/api/admin/payment-providers', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const providers = await storage.getPaymentProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching admin providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      // Mock user data for now - would fetch real users
      const users = [
        {
          id: "1",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          subscriptionTier: "pro",
          subscriptionStatus: "active",
          isAdmin: false,
          isDeveloper: false,
          createdAt: new Date().toISOString()
        }
      ];
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/code/:type', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      
      if (type === 'frontend') {
        res.json({
          structure: `client/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── ai/ (AI-related components)
│   │   └── layout/ (Layout components)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Settings.tsx
│   │   ├── Admin.tsx
│   │   └── Pricing.tsx
│   ├── hooks/
│   ├── lib/
│   └── App.tsx`
        });
      } else if (type === 'backend') {
        res.json({
          structure: `server/
├── services/
│   ├── ai-factory.ts
│   ├── gemini.ts
│   ├── graphics-service.ts
│   ├── console-monitor.ts
│   ├── payment-service.ts
│   └── subscription-service.ts
├── storage.ts
├── routes.ts
└── index.ts`
        });
      } else {
        res.status(400).json({ message: "Invalid code type" });
      }
    } catch (error) {
      console.error("Error fetching code structure:", error);
      res.status(500).json({ message: "Failed to fetch code structure" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
