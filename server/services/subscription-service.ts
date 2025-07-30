import { storage } from '../storage';
import type { User, SubscriptionPlan, Transaction } from '@shared/schema';

export interface SubscriptionLimits {
  maxSites: number;
  maxApiCalls: number;
  maxStorageGB: number;
  hasAiAccess: boolean;
  hasGraphicsAccess: boolean;
  hasConsoleMonitoring: boolean;
  hasCustomGraphics: boolean;
  hasPrioritySupport: boolean;
  hasWhiteLabel: boolean;
  hasCodeAccess: boolean;
}

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initializeDefaultPlans() {
    const existingPlans = await storage.getSubscriptionPlans();
    
    if (existingPlans.length === 0) {
      await this.createDefaultPlans();
    }
  }

  private async createDefaultPlans() {
    const defaultPlans = [
      {
        name: 'Free',
        tier: 'free',
        description: 'Perfect for trying out the platform',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          '1 WordPress site',
          'Basic AI assistance',
          'Community support',
          'Graphics search (limited)'
        ],
        limits: {
          maxSites: 1,
          maxApiCalls: 100,
          maxStorageGB: 1,
          hasAiAccess: true,
          hasGraphicsAccess: true,
          hasConsoleMonitoring: false,
          hasCustomGraphics: false,
          hasPrioritySupport: false,
          hasWhiteLabel: false,
          hasCodeAccess: false
        },
        sortOrder: 1
      },
      {
        name: 'Basic',
        tier: 'basic',
        description: 'Great for individual developers and small sites',
        price: 1900, // $19/month
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          '5 WordPress sites',
          'Full AI assistance',
          'Console error monitoring',
          'Unlimited graphics search',
          'Email support'
        ],
        limits: {
          maxSites: 5,
          maxApiCalls: 1000,
          maxStorageGB: 5,
          hasAiAccess: true,
          hasGraphicsAccess: true,
          hasConsoleMonitoring: true,
          hasCustomGraphics: false,
          hasPrioritySupport: false,
          hasWhiteLabel: false,
          hasCodeAccess: false
        },
        sortOrder: 2
      },
      {
        name: 'Pro',
        tier: 'pro',
        description: 'Perfect for agencies and professional developers',
        price: 4900, // $49/month
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          '25 WordPress sites',
          'Advanced AI with custom graphics',
          'Priority support',
          'White-label options',
          'Advanced analytics',
          'API access'
        ],
        limits: {
          maxSites: 25,
          maxApiCalls: 10000,
          maxStorageGB: 25,
          hasAiAccess: true,
          hasGraphicsAccess: true,
          hasConsoleMonitoring: true,
          hasCustomGraphics: true,
          hasPrioritySupport: true,
          hasWhiteLabel: true,
          hasCodeAccess: false
        },
        sortOrder: 3
      },
      {
        name: 'Enterprise',
        tier: 'enterprise',
        description: 'For large organizations with custom needs',
        price: 9900, // $99/month
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'Unlimited WordPress sites',
          'Full platform access',
          'Dedicated support',
          'Custom integrations',
          'On-premise deployment options',
          'Full code access',
          'Custom branding'
        ],
        limits: {
          maxSites: -1, // Unlimited
          maxApiCalls: -1, // Unlimited
          maxStorageGB: -1, // Unlimited
          hasAiAccess: true,
          hasGraphicsAccess: true,
          hasConsoleMonitoring: true,
          hasCustomGraphics: true,
          hasPrioritySupport: true,
          hasWhiteLabel: true,
          hasCodeAccess: true
        },
        sortOrder: 4
      },
      {
        name: 'Developer',
        tier: 'developer',
        description: 'Special access for platform developers',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'Full platform access',
          'Code view and editing',
          'Admin panel access',
          'Uses default API keys',
          'Testing and development features'
        ],
        limits: {
          maxSites: -1, // Unlimited
          maxApiCalls: -1, // Unlimited
          maxStorageGB: -1, // Unlimited
          hasAiAccess: true,
          hasGraphicsAccess: true,
          hasConsoleMonitoring: true,
          hasCustomGraphics: true,
          hasPrioritySupport: true,
          hasWhiteLabel: true,
          hasCodeAccess: true
        },
        sortOrder: 0
      }
    ];

    for (const plan of defaultPlans) {
      await storage.createSubscriptionPlan(plan);
    }
  }

  async getUserLimits(userId: string): Promise<SubscriptionLimits> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return this.getFreeLimits();
      }

      // Developer override - gets unlimited access with default API keys
      if (user.isDeveloper) {
        return this.getDeveloperLimits();
      }

      // Admin override
      if (user.isAdmin) {
        return this.getAdminLimits();
      }

      // Check subscription status
      if (user.subscriptionStatus !== 'active' || 
          (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())) {
        return this.getFreeLimits();
      }

      // Get plan limits
      const plan = await storage.getSubscriptionPlanByTier(user.subscriptionTier || 'free');
      if (!plan) {
        return this.getFreeLimits();
      }

      return plan.limits as SubscriptionLimits;
    } catch (error) {
      console.error('Error getting user limits:', error);
      return this.getFreeLimits();
    }
  }

  private getFreeLimits(): SubscriptionLimits {
    return {
      maxSites: 1,
      maxApiCalls: 100,
      maxStorageGB: 1,
      hasAiAccess: true,
      hasGraphicsAccess: true,
      hasConsoleMonitoring: false,
      hasCustomGraphics: false,
      hasPrioritySupport: false,
      hasWhiteLabel: false,
      hasCodeAccess: false
    };
  }

  private getDeveloperLimits(): SubscriptionLimits {
    return {
      maxSites: -1,
      maxApiCalls: -1,
      maxStorageGB: -1,
      hasAiAccess: true,
      hasGraphicsAccess: true,
      hasConsoleMonitoring: true,
      hasCustomGraphics: true,
      hasPrioritySupport: true,
      hasWhiteLabel: true,
      hasCodeAccess: true
    };
  }

  private getAdminLimits(): SubscriptionLimits {
    return {
      maxSites: -1,
      maxApiCalls: -1,
      maxStorageGB: -1,
      hasAiAccess: true,
      hasGraphicsAccess: true,
      hasConsoleMonitoring: true,
      hasCustomGraphics: true,
      hasPrioritySupport: true,
      hasWhiteLabel: true,
      hasCodeAccess: true
    };
  }

  async checkFeatureAccess(userId: string, feature: keyof SubscriptionLimits): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    return Boolean(limits[feature]);
  }

  async checkUsageLimit(userId: string, resource: 'sites' | 'apiCalls' | 'storageGB'): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const limits = await this.getUserLimits(userId);
      const limitKey = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof SubscriptionLimits;
      const limit = limits[limitKey] as number;

      // Unlimited access
      if (limit === -1) {
        return { allowed: true, current: 0, limit: -1 };
      }

      // Get current usage
      let current = 0;
      switch (resource) {
        case 'sites':
          current = await storage.getUserSiteCount(userId);
          break;
        case 'apiCalls':
          current = await storage.getUserApiCallCount(userId);
          break;
        case 'storageGB':
          current = await storage.getUserStorageUsage(userId);
          break;
      }

      return {
        allowed: current < limit,
        current,
        limit
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: false, current: 0, limit: 0 };
    }
  }

  async upgradeSubscription(userId: string, newPlanId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      const newPlan = await storage.getSubscriptionPlan(newPlanId);
      
      if (!user || !newPlan) {
        return false;
      }

      // Update user subscription
      await storage.updateUserSubscription(userId, {
        subscriptionTier: newPlan.tier as any,
        subscriptionStatus: 'active',
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      return true;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
  }

  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'cancelled'
      });
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  async shouldUseDefaultApiKeys(userId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    return Boolean(user?.isDeveloper);
  }
}

// Global subscription service instance
export const subscriptionService = SubscriptionService.getInstance();