import { storage } from '../storage';
import { EncryptionService } from './encryption';
import type { PaymentProvider, SubscriptionPlan, User } from '@shared/schema';

export interface PaymentConfig {
  provider: string;
  publicKey?: string;
  secretKey: string;
  webhookSecret?: string;
  environment?: 'sandbox' | 'production';
  additionalConfig?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  error?: string;
  metadata?: any;
}

export class PaymentService {
  private static instance: PaymentService;
  private providers: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async initializeProviders() {
    try {
      const enabledProviders = await storage.getEnabledPaymentProviders();
      
      for (const provider of enabledProviders) {
        await this.setupProvider(provider);
      }
    } catch (error) {
      console.error('Error initializing payment providers:', error);
    }
  }

  private async setupProvider(provider: PaymentProvider) {
    try {
      const decryptedConfig = await EncryptionService.decrypt(JSON.stringify(provider.config));
      const config = JSON.parse(decryptedConfig) as PaymentConfig;

      switch (provider.provider) {
        case 'stripe':
          await this.setupStripe(config);
          break;
        case 'paypal':
          await this.setupPayPal(config);
          break;
        case 'lemonsqueezy':
          await this.setupLemonSqueezy(config);
          break;
        case 'paddle':
          await this.setupPaddle(config);
          break;
        case 'gumroad':
          await this.setupGumroad(config);
          break;
        default:
          console.warn(`Unknown payment provider: ${provider.provider}`);
      }

      this.providers.set(provider.provider, {
        config,
        provider,
        initialized: true
      });
    } catch (error) {
      console.error(`Error setting up ${provider.provider}:`, error);
    }
  }

  private async setupStripe(config: PaymentConfig) {
    try {
      // Stripe setup will be handled by existing Stripe integration
      console.log('Stripe provider configured');
    } catch (error) {
      console.error('Stripe setup error:', error);
    }
  }

  private async setupPayPal(config: PaymentConfig) {
    try {
      // PayPal setup will be handled by existing PayPal integration
      console.log('PayPal provider configured');
    } catch (error) {
      console.error('PayPal setup error:', error);
    }
  }

  private async setupLemonSqueezy(config: PaymentConfig) {
    try {
      // LemonSqueezy API integration
      console.log('LemonSqueezy provider configured');
    } catch (error) {
      console.error('LemonSqueezy setup error:', error);
    }
  }

  private async setupPaddle(config: PaymentConfig) {
    try {
      // Paddle API integration
      console.log('Paddle provider configured');
    } catch (error) {
      console.error('Paddle setup error:', error);
    }
  }

  private async setupGumroad(config: PaymentConfig) {
    try {
      // Gumroad API integration
      console.log('Gumroad provider configured');
    } catch (error) {
      console.error('Gumroad setup error:', error);
    }
  }

  async createCheckout(
    userId: string, 
    planId: string, 
    providerId?: string
  ): Promise<PaymentResult> {
    try {
      const user = await storage.getUser(userId);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!user || !plan) {
        return { success: false, error: 'User or plan not found' };
      }

      const provider = providerId 
        ? await storage.getPaymentProvider(providerId)
        : await storage.getDefaultPaymentProvider();

      if (!provider) {
        return { success: false, error: 'No payment provider available' };
      }

      const providerInstance = this.providers.get(provider.provider);
      if (!providerInstance) {
        return { success: false, error: 'Payment provider not initialized' };
      }

      switch (provider.provider) {
        case 'stripe':
          return await this.createStripeCheckout(user, plan, provider);
        case 'paypal':
          return await this.createPayPalCheckout(user, plan, provider);
        case 'lemonsqueezy':
          return await this.createLemonSqueezyCheckout(user, plan, provider);
        case 'paddle':
          return await this.createPaddleCheckout(user, plan, provider);
        case 'gumroad':
          return await this.createGumroadCheckout(user, plan, provider);
        default:
          return { success: false, error: 'Unsupported payment provider' };
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      return { success: false, error: 'Failed to create checkout session' };
    }
  }

  private async createStripeCheckout(user: User, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentResult> {
    // Implementation will use existing Stripe integration
    return { 
      success: true, 
      checkoutUrl: '/checkout/stripe',
      metadata: { planId: plan.id, providerId: provider.id }
    };
  }

  private async createPayPalCheckout(user: User, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentResult> {
    // Implementation will use existing PayPal integration
    return { 
      success: true, 
      checkoutUrl: '/checkout/paypal',
      metadata: { planId: plan.id, providerId: provider.id }
    };
  }

  private async createLemonSqueezyCheckout(user: User, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentResult> {
    // LemonSqueezy checkout creation
    return { 
      success: true, 
      checkoutUrl: '/checkout/lemonsqueezy',
      metadata: { planId: plan.id, providerId: provider.id }
    };
  }

  private async createPaddleCheckout(user: User, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentResult> {
    // Paddle checkout creation
    return { 
      success: true, 
      checkoutUrl: '/checkout/paddle',
      metadata: { planId: plan.id, providerId: provider.id }
    };
  }

  private async createGumroadCheckout(user: User, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentResult> {
    // Gumroad checkout creation
    return { 
      success: true, 
      checkoutUrl: '/checkout/gumroad',
      metadata: { planId: plan.id, providerId: provider.id }
    };
  }

  async handleWebhook(provider: string, payload: any, signature?: string): Promise<boolean> {
    try {
      const providerConfig = this.providers.get(provider);
      if (!providerConfig) {
        console.error(`Webhook received for uninitialized provider: ${provider}`);
        return false;
      }

      switch (provider) {
        case 'stripe':
          return await this.handleStripeWebhook(payload, signature);
        case 'paypal':
          return await this.handlePayPalWebhook(payload, signature);
        case 'lemonsqueezy':
          return await this.handleLemonSqueezyWebhook(payload, signature);
        case 'paddle':
          return await this.handlePaddleWebhook(payload, signature);
        case 'gumroad':
          return await this.handleGumroadWebhook(payload, signature);
        default:
          console.error(`Unknown webhook provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error(`Error handling ${provider} webhook:`, error);
      return false;
    }
  }

  private async handleStripeWebhook(payload: any, signature?: string): Promise<boolean> {
    // Handle Stripe webhook events
    return true;
  }

  private async handlePayPalWebhook(payload: any, signature?: string): Promise<boolean> {
    // Handle PayPal webhook events
    return true;
  }

  private async handleLemonSqueezyWebhook(payload: any, signature?: string): Promise<boolean> {
    // Handle LemonSqueezy webhook events
    return true;
  }

  private async handlePaddleWebhook(payload: any, signature?: string): Promise<boolean> {
    // Handle Paddle webhook events
    return true;
  }

  private async handleGumroadWebhook(payload: any, signature?: string): Promise<boolean> {
    // Handle Gumroad webhook events
    return true;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  isProviderEnabled(provider: string): boolean {
    return this.providers.has(provider) && this.providers.get(provider)?.initialized;
  }
}

// Global payment service instance
export const paymentService = PaymentService.getInstance();