import OpenAI from "openai";
import type { WordPressSite } from '@shared/schema';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AIResponse {
  content: string;
  metadata?: any;
  actions?: Array<{
    type: string;
    description: string;
    params: any;
  }>;
}

export class OpenAIService {
  constructor(private apiKey?: string) {
    if (apiKey && !openai) {
      openai = new OpenAI({ apiKey });
    }
  }

  private ensureOpenAI(): OpenAI {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please add your API key in the settings.");
    }
    return openai;
  }

  async processWordPressCommand(
    userMessage: string,
    siteContext?: WordPressSite & { decryptedPassword: string }
  ): Promise<AIResponse> {
    try {
      const client = this.ensureOpenAI();
      const systemPrompt = this.buildSystemPrompt(siteContext);
      
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(content);
      
      return {
        content: result.content || "I understand your request. Let me help you with that.",
        metadata: result.metadata || {},
        actions: result.actions || [],
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        metadata: { error: true },
      };
    }
  }

  private buildSystemPrompt(siteContext?: WordPressSite & { decryptedPassword: string }): string {
    let prompt = `You are an AI assistant specialized in WordPress site management. You help users manage their WordPress sites through natural language commands.

RESPONSE FORMAT: Always respond with valid JSON in this exact format:
{
  "content": "Your conversational response to the user",
  "metadata": {
    "confidence": 0.9,
    "category": "theme_customization|plugin_management|content_creation|seo_optimization|security|performance|general"
  },
  "actions": [
    {
      "type": "action_type",
      "description": "Human readable description",
      "params": { "key": "value" }
    }
  ]
}

CAPABILITIES:
- Theme customization (colors, fonts, layouts)
- Plugin installation and configuration
- Content creation and management
- SEO optimization
- Security improvements
- Performance optimization
- Site monitoring and analytics

ACTION TYPES:
- theme_customize: For color, font, layout changes
- plugin_install: For installing new plugins
- plugin_activate: For activating existing plugins
- content_update: For creating/updating posts, pages
- settings_update: For site settings changes

LIMITATIONS TO MENTION:
- Some actions require WordPress admin privileges
- Shared hosting may have restrictions on certain operations
- Always recommend backups before major changes
- Rate limiting may apply to prevent server overload

SAFETY GUIDELINES:
- Always confirm destructive actions
- Recommend testing changes in staging first
- Suggest backups before major modifications
- Explain potential risks of requested changes`;

    if (siteContext) {
      prompt += `

CURRENT SITE CONTEXT:
- Site: ${siteContext.name} (${siteContext.url})
- WordPress Version: ${siteContext.wpVersion || 'Unknown'}
- Active Theme: ${siteContext.activeTheme || 'Unknown'}
- Plugin Count: ${siteContext.pluginCount || 0}
- Last Connected: ${siteContext.lastConnected ? new Date(siteContext.lastConnected).toLocaleDateString() : 'Never'}

Use this context to provide specific, relevant assistance.`;
    } else {
      prompt += `

No site is currently connected. Guide the user to connect their WordPress site first if they want to perform site-specific actions.`;
    }

    return prompt;
  }

  async analyzeSiteContent(content: string): Promise<{
    suggestions: string[];
    seoScore: number;
    readabilityScore: number;
  }> {
    try {
      const client = this.ensureOpenAI();
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an SEO and content analysis expert. Analyze the provided content and return suggestions for improvement. Respond with JSON in this format: { 'suggestions': ['suggestion1', 'suggestion2'], 'seoScore': number, 'readabilityScore': number }"
          },
          {
            role: "user",
            content: `Analyze this website content: ${content}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        suggestions: result.suggestions || [],
        seoScore: Math.max(0, Math.min(100, result.seoScore || 50)),
        readabilityScore: Math.max(0, Math.min(100, result.readabilityScore || 50)),
      };

    } catch (error) {
      console.error("Content analysis error:", error);
      return {
        suggestions: ["Unable to analyze content at this time"],
        seoScore: 50,
        readabilityScore: 50,
      };
    }
  }

  async generateThemeRecommendations(
    siteType: string,
    preferences: any
  ): Promise<{
    themes: Array<{
      name: string;
      description: string;
      features: string[];
      price: string;
    }>;
  }> {
    try {
      const client = this.ensureOpenAI();
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a WordPress theme expert. Recommend suitable themes based on site type and preferences. Respond with JSON in this format: { 'themes': [{ 'name': 'Theme Name', 'description': 'Description', 'features': ['feature1', 'feature2'], 'price': 'Free or $XX' }] }"
          },
          {
            role: "user",
            content: `Site type: ${siteType}. Preferences: ${JSON.stringify(preferences)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        themes: result.themes || [],
      };

    } catch (error) {
      console.error("Theme recommendation error:", error);
      return {
        themes: [],
      };
    }
  }

  async generatePluginRecommendations(
    siteNeeds: string[]
  ): Promise<{
    plugins: Array<{
      name: string;
      description: string;
      purpose: string;
      installation: string;
    }>;
  }> {
    try {
      const client = this.ensureOpenAI();
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a WordPress plugin expert. Recommend plugins based on site needs. Respond with JSON in this format: { 'plugins': [{ 'name': 'Plugin Name', 'description': 'Description', 'purpose': 'What it does', 'installation': 'How to install' }] }"
          },
          {
            role: "user",
            content: `Site needs: ${siteNeeds.join(', ')}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        plugins: result.plugins || [],
      };

    } catch (error) {
      console.error("Plugin recommendation error:", error);
      return {
        plugins: [],
      };
    }
  }
}