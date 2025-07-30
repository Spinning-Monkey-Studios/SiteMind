import {
  users,
  wordpressSites,
  conversations,
  messages,
  wpActions,
  siteActivities,
  userApiKeys,
  hostingAccounts,
  subscriptionPlans,
  paymentProviders,
  transactions,
  adminConfig,
  type User,
  type UpsertUser,
  type WordPressSite,
  type InsertWordPressSite,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type WpAction,
  type InsertWpAction,
  type SiteActivity,
  type InsertSiteActivity,
  type UserApiKey,
  type InsertUserApiKey,
  type HostingAccount,
  type InsertHostingAccount,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type PaymentProvider,
  type InsertPaymentProvider,
  type Transaction,
  type InsertTransaction,
  type AdminConfig,
  type InsertAdminConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // WordPress site operations
  getUserSites(userId: string): Promise<WordPressSite[]>;
  getSite(siteId: string): Promise<WordPressSite | undefined>;
  createSite(siteData: InsertWordPressSite): Promise<WordPressSite>;
  updateSite(siteId: string, updates: Partial<WordPressSite>): Promise<WordPressSite>;
  deleteSite(siteId: string): Promise<void>;
  
  // Conversation operations
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(conversationId: string): Promise<Conversation | undefined>;
  createConversation(conversationData: InsertConversation): Promise<Conversation>;
  
  // Message operations
  getConversationMessages(conversationId: string): Promise<Message[]>;
  createMessage(messageData: InsertMessage): Promise<Message>;
  
  // WordPress action operations
  createWpAction(actionData: InsertWpAction): Promise<WpAction>;
  updateWpAction(actionId: string, updates: Partial<WpAction>): Promise<WpAction>;
  getSiteActions(siteId: string): Promise<WpAction[]>;
  
  // Site activity operations
  createSiteActivity(activityData: InsertSiteActivity): Promise<SiteActivity>;
  getSiteActivities(siteId: string, limit?: number): Promise<SiteActivity[]>;
  
  // API key operations
  getUserApiKeys(userId: string): Promise<UserApiKey[]>;
  getUserApiKey(userId: string, provider: string): Promise<UserApiKey | undefined>;
  createUserApiKey(keyData: InsertUserApiKey): Promise<UserApiKey>;
  updateUserApiKey(keyId: string, updates: Partial<UserApiKey>): Promise<UserApiKey>;
  deleteUserApiKey(keyId: string): Promise<void>;
  
  // Hosting account operations
  getUserHostingAccounts(userId: string): Promise<HostingAccount[]>;
  getHostingAccount(accountId: string): Promise<HostingAccount | undefined>;
  createHostingAccount(accountData: InsertHostingAccount): Promise<HostingAccount>;
  updateHostingAccount(accountId: string, updates: Partial<HostingAccount>): Promise<HostingAccount>;
  deleteHostingAccount(accountId: string): Promise<void>;
  
  // Subscription and payment operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(planId: string): Promise<void>;
  
  getPaymentProviders(): Promise<PaymentProvider[]>;
  getEnabledPaymentProviders(): Promise<PaymentProvider[]>;
  getDefaultPaymentProvider(): Promise<PaymentProvider | undefined>;
  getPaymentProvider(providerId: string): Promise<PaymentProvider | undefined>;
  createPaymentProvider(providerData: InsertPaymentProvider): Promise<PaymentProvider>;
  updatePaymentProvider(providerId: string, updates: Partial<PaymentProvider>): Promise<PaymentProvider>;
  
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction>;
  
  updateUserSubscription(userId: string, updates: Partial<User>): Promise<User | undefined>;
  getUserSiteCount(userId: string): Promise<number>;
  getUserApiCallCount(userId: string): Promise<number>;
  getUserStorageUsage(userId: string): Promise<number>;
  
  // Admin operations
  getAdminConfig(key: string): Promise<AdminConfig | undefined>;
  setAdminConfig(configData: InsertAdminConfig): Promise<AdminConfig>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // WordPress site operations
  async getUserSites(userId: string): Promise<WordPressSite[]> {
    return await db
      .select()
      .from(wordpressSites)
      .where(eq(wordpressSites.userId, userId))
      .orderBy(desc(wordpressSites.createdAt));
  }

  async getSite(siteId: string): Promise<WordPressSite | undefined> {
    const [site] = await db
      .select()
      .from(wordpressSites)
      .where(eq(wordpressSites.id, siteId));
    return site;
  }

  async createSite(siteData: InsertWordPressSite): Promise<WordPressSite> {
    const [site] = await db
      .insert(wordpressSites)
      .values(siteData)
      .returning();
    return site;
  }

  async updateSite(siteId: string, updates: Partial<WordPressSite>): Promise<WordPressSite> {
    const [site] = await db
      .update(wordpressSites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wordpressSites.id, siteId))
      .returning();
    return site;
  }

  async deleteSite(siteId: string): Promise<void> {
    await db.delete(wordpressSites).where(eq(wordpressSites.id, siteId));
  }

  // Conversation operations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(conversationId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    return conversation;
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  // Message operations
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  // WordPress action operations
  async createWpAction(actionData: InsertWpAction): Promise<WpAction> {
    const [action] = await db
      .insert(wpActions)
      .values(actionData)
      .returning();
    return action;
  }

  async updateWpAction(actionId: string, updates: Partial<WpAction>): Promise<WpAction> {
    const [action] = await db
      .update(wpActions)
      .set(updates)
      .where(eq(wpActions.id, actionId))
      .returning();
    return action;
  }

  async getSiteActions(siteId: string): Promise<WpAction[]> {
    return await db
      .select()
      .from(wpActions)
      .where(eq(wpActions.siteId, siteId))
      .orderBy(desc(wpActions.createdAt));
  }

  // Site activity operations
  async createSiteActivity(activityData: InsertSiteActivity): Promise<SiteActivity> {
    const [activity] = await db
      .insert(siteActivities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getSiteActivities(siteId: string, limit: number = 10): Promise<SiteActivity[]> {
    return await db
      .select()
      .from(siteActivities)
      .where(eq(siteActivities.siteId, siteId))
      .orderBy(desc(siteActivities.createdAt))
      .limit(limit);
  }

  // API key operations
  async getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    return await db
      .select()
      .from(userApiKeys)
      .where(eq(userApiKeys.userId, userId))
      .orderBy(desc(userApiKeys.createdAt));
  }

  async getUserApiKey(userId: string, provider: string): Promise<UserApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(userApiKeys)
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
    return apiKey;
  }

  async createUserApiKey(keyData: InsertUserApiKey): Promise<UserApiKey> {
    const [apiKey] = await db
      .insert(userApiKeys)
      .values(keyData)
      .returning();
    return apiKey;
  }

  async updateUserApiKey(keyId: string, updates: Partial<UserApiKey>): Promise<UserApiKey> {
    const [apiKey] = await db
      .update(userApiKeys)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userApiKeys.id, keyId))
      .returning();
    return apiKey;
  }

  async deleteUserApiKey(keyId: string): Promise<void> {
    await db.delete(userApiKeys).where(eq(userApiKeys.id, keyId));
  }

  // Hosting account operations
  async getUserHostingAccounts(userId: string): Promise<HostingAccount[]> {
    return await db
      .select()
      .from(hostingAccounts)
      .where(eq(hostingAccounts.userId, userId))
      .orderBy(desc(hostingAccounts.createdAt));
  }

  async getHostingAccount(accountId: string): Promise<HostingAccount | undefined> {
    const [account] = await db
      .select()
      .from(hostingAccounts)
      .where(eq(hostingAccounts.id, accountId));
    return account;
  }

  async createHostingAccount(accountData: InsertHostingAccount): Promise<HostingAccount> {
    const [account] = await db
      .insert(hostingAccounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateHostingAccount(accountId: string, updates: Partial<HostingAccount>): Promise<HostingAccount> {
    const [account] = await db
      .update(hostingAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hostingAccounts.id, accountId))
      .returning();
    return account;
  }

  async deleteHostingAccount(accountId: string): Promise<void> {
    await db.delete(hostingAccounts).where(eq(hostingAccounts.id, accountId));
  }

  // Subscription and payment operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));
    return plan;
  }

  async getSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.tier, tier));
    return plan;
  }

  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, planId))
      .returning();
    return plan;
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
  }

  async getPaymentProviders(): Promise<PaymentProvider[]> {
    return await db.select().from(paymentProviders);
  }

  async getEnabledPaymentProviders(): Promise<PaymentProvider[]> {
    return await db
      .select()
      .from(paymentProviders)
      .where(eq(paymentProviders.isEnabled, true));
  }

  async getDefaultPaymentProvider(): Promise<PaymentProvider | undefined> {
    const [provider] = await db
      .select()
      .from(paymentProviders)
      .where(and(eq(paymentProviders.isEnabled, true), eq(paymentProviders.isDefault, true)));
    return provider;
  }

  async getPaymentProvider(providerId: string): Promise<PaymentProvider | undefined> {
    const [provider] = await db
      .select()
      .from(paymentProviders)
      .where(eq(paymentProviders.id, providerId));
    return provider;
  }

  async createPaymentProvider(providerData: InsertPaymentProvider): Promise<PaymentProvider> {
    const [provider] = await db
      .insert(paymentProviders)
      .values(providerData)
      .returning();
    return provider;
  }

  async updatePaymentProvider(providerId: string, updates: Partial<PaymentProvider>): Promise<PaymentProvider> {
    const [provider] = await db
      .update(paymentProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentProviders.id, providerId))
      .returning();
    return provider;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, transactionId))
      .returning();
    return transaction;
  }

  async updateUserSubscription(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserSiteCount(userId: string): Promise<number> {
    const sites = await db.select().from(wordpressSites).where(eq(wordpressSites.userId, userId));
    return sites.length;
  }

  async getUserApiCallCount(userId: string): Promise<number> {
    // This would track API calls over time - for now return 0
    return 0;
  }

  async getUserStorageUsage(userId: string): Promise<number> {
    // This would calculate storage usage - for now return 0
    return 0;
  }

  async getAdminConfig(key: string): Promise<AdminConfig | undefined> {
    const [config] = await db
      .select()
      .from(adminConfig)
      .where(eq(adminConfig.key, key));
    return config;
  }

  async setAdminConfig(configData: InsertAdminConfig): Promise<AdminConfig> {
    const [config] = await db
      .insert(adminConfig)
      .values(configData)
      .onConflictDoUpdate({
        target: adminConfig.key,
        set: {
          ...configData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }
}

export const storage = new DatabaseStorage();
