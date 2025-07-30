import { OpenAIService } from './openai';
import { GeminiService } from './gemini';
import type { WordPressSite } from '@shared/schema';

export interface AIServiceInterface {
  processWordPressCommand(
    userMessage: string,
    siteContext?: WordPressSite & { decryptedPassword: string }
  ): Promise<{
    content: string;
    metadata?: any;
    actions?: Array<{
      type: string;
      description: string;
      params: any;
    }>;
  }>;
  
  analyzeSiteContent(content: string): Promise<{
    suggestions: string[];
    seoScore: number;
    readabilityScore: number;
  }>;
  
  generateThemeRecommendations(
    siteType: string,
    preferences: any
  ): Promise<{
    themes: Array<{
      name: string;
      description: string;
      features: string[];
      price: string;
    }>;
  }>;
  
  generatePluginRecommendations(
    siteNeeds: string[]
  ): Promise<{
    plugins: Array<{
      name: string;
      description: string;
      purpose: string;
      installation: string;
    }>;
  }>;
}

export type AIProvider = 'openai' | 'gemini';

export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private services: Map<AIProvider, AIServiceInterface> = new Map();

  private constructor() {
    // Initialize available services based on environment variables
    if (process.env.OPENAI_API_KEY) {
      this.services.set('openai', new OpenAIService());
    }
    if (process.env.GEMINI_API_KEY) {
      this.services.set('gemini', new GeminiService());
    }
  }

  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  public getService(provider?: AIProvider): AIServiceInterface {
    // If no provider specified, use the first available one
    if (!provider) {
      const availableProviders = Array.from(this.services.keys());
      if (availableProviders.length === 0) {
        throw new Error('No AI services are configured. Please add OPENAI_API_KEY or GEMINI_API_KEY to environment variables.');
      }
      // Prefer Gemini if available, then OpenAI
      provider = availableProviders.includes('gemini') ? 'gemini' : availableProviders[0];
    }

    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`AI service '${provider}' is not available. Please check your API keys.`);
    }

    return service;
  }

  public getAvailableProviders(): AIProvider[] {
    return Array.from(this.services.keys());
  }

  public isProviderAvailable(provider: AIProvider): boolean {
    return this.services.has(provider);
  }
}

// Export singleton instance
export const aiServiceFactory = AIServiceFactory.getInstance();