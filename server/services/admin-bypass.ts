import { storage } from "../storage";

interface BypassConfig {
  adminEmails: string[];
  developerEmails: string[];
  masterKey: string;
  bypassCodes: string[];
}

class AdminBypassService {
  private config: BypassConfig;

  constructor() {
    this.config = {
      // Add your admin email addresses here
      adminEmails: [
        'admin@wp-ai-manager.com',
        'owner@wp-ai-manager.com',
        // Add your email addresses
      ],
      
      // Developer accounts that get full access
      developerEmails: [
        'dev@wp-ai-manager.com',
        // Add developer email addresses
      ],

      // Master bypass key (set in environment)
      masterKey: process.env.ADMIN_MASTER_KEY || 'wp-ai-admin-2024',

      // One-time bypass codes
      bypassCodes: [
        'ADMIN-BYPASS-001',
        'OWNER-FULL-ACCESS',
        'DEV-OVERRIDE-123'
      ]
    };
  }

  /**
   * Check if user is an admin/owner and should bypass payment
   */
  async shouldBypassPayment(userId: string, email?: string): Promise<boolean> {
    try {
      // Check if user is marked as admin in database
      const user = await storage.getUser(userId);
      if (user?.isAdmin || user?.isDeveloper) {
        return true;
      }

      // Check email-based bypass
      if (email && this.isAdminEmail(email)) {
        // Automatically upgrade user to admin
        await this.upgradeToAdmin(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking payment bypass:', error);
      return false;
    }
  }

  /**
   * Apply admin bypass using master key
   */
  async applyMasterKeyBypass(userId: string, masterKey: string): Promise<boolean> {
    if (masterKey !== this.config.masterKey) {
      return false;
    }

    try {
      await this.upgradeToAdmin(userId);
      console.log(`Admin bypass applied for user ${userId} using master key`);
      return true;
    } catch (error) {
      console.error('Error applying master key bypass:', error);
      return false;
    }
  }

  /**
   * Apply bypass using one-time code
   */
  async applyBypassCode(userId: string, code: string): Promise<boolean> {
    if (!this.config.bypassCodes.includes(code)) {
      return false;
    }

    try {
      await this.upgradeToAdmin(userId);
      
      // Remove used code (optional - for one-time use)
      this.config.bypassCodes = this.config.bypassCodes.filter(c => c !== code);
      
      console.log(`Admin bypass applied for user ${userId} using code ${code}`);
      return true;
    } catch (error) {
      console.error('Error applying bypass code:', error);
      return false;
    }
  }

  /**
   * Upgrade user to admin with full access
   */
  private async upgradeToAdmin(userId: string): Promise<void> {
    await storage.updateUser(userId, {
      subscriptionTier: 'developer',
      subscriptionStatus: 'active',
      subscriptionExpiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
      isAdmin: true,
      isDeveloper: true,
      updatedAt: new Date()
    });

    // Log the bypass activity
    await storage.createSiteActivity({
      siteId: 'system',
      activityType: 'admin_bypass',
      description: `Admin bypass applied for user ${userId}`,
      metadata: {
        timestamp: new Date().toISOString(),
        bypassType: 'admin_upgrade'
      }
    });
  }

  /**
   * Check if email is in admin list
   */
  private isAdminEmail(email: string): boolean {
    return this.config.adminEmails.includes(email.toLowerCase()) ||
           this.config.developerEmails.includes(email.toLowerCase());
  }

  /**
   * Add new admin email (for runtime configuration)
   */
  addAdminEmail(email: string): void {
    if (!this.config.adminEmails.includes(email.toLowerCase())) {
      this.config.adminEmails.push(email.toLowerCase());
    }
  }

  /**
   * Generate new bypass code
   */
  generateBypassCode(): string {
    const code = `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    this.config.bypassCodes.push(code);
    return code;
  }

  /**
   * Get current bypass configuration (for admin panel)
   */
  getBypassConfig(): Partial<BypassConfig> {
    return {
      adminEmails: this.config.adminEmails,
      developerEmails: this.config.developerEmails,
      bypassCodes: this.config.bypassCodes.map(code => code.substr(0, 10) + '***') // Masked
    };
  }

  /**
   * Override subscription check for admin users
   */
  async checkSubscriptionAccess(userId: string, requiredTier: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    
    // Admin/developer bypass
    if (user?.isAdmin || user?.isDeveloper) {
      return true;
    }

    // Check payment bypass
    if (await this.shouldBypassPayment(userId, user?.email || undefined)) {
      return true;
    }

    // Regular subscription check
    const tierHierarchy = ['free', 'basic', 'pro', 'enterprise', 'developer'];
    const userTierIndex = tierHierarchy.indexOf(user?.subscriptionTier || 'free');
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
    
    return userTierIndex >= requiredTierIndex && user?.subscriptionStatus === 'active';
  }
}

export const adminBypassService = new AdminBypassService();