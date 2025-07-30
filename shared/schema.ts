import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").default('replit'), // 'replit', 'facebook', 'microsoft', 'wordpress'
  authProviderId: varchar("auth_provider_id"), // External provider ID
  subscriptionTier: varchar("subscription_tier", { enum: ["free", "basic", "pro", "enterprise", "developer"] }).default("free"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "cancelled", "expired", "trial"] }).default("trial"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  isAdmin: boolean("is_admin").default(false),
  isDeveloper: boolean("is_developer").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  paypalSubscriptionId: varchar("paypal_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WordPress sites connected by users
export const wordpressSites = pgTable("wordpress_sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  url: varchar("url").notNull(),
  username: varchar("username").notNull(),
  // Encrypted credentials
  encryptedPassword: text("encrypted_password").notNull(),
  authMethod: varchar("auth_method").notNull().default('app-password'), // 'app-password', 'jwt'
  isActive: boolean("is_active").default(true),
  lastConnected: timestamp("last_connected"),
  wpVersion: varchar("wp_version"),
  activeTheme: varchar("active_theme"),
  pluginCount: integer("plugin_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations between user and AI
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  siteId: varchar("site_id").references(() => wordpressSites.id, { onDelete: 'cascade' }),
  title: varchar("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages in conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Store action buttons, task status, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// WordPress actions executed by AI
export const wpActions = pgTable("wp_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => wordpressSites.id, { onDelete: 'cascade' }),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: 'set null' }),
  actionType: varchar("action_type").notNull(), // 'theme_change', 'plugin_install', 'content_update', etc.
  description: text("description").notNull(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'failed'
  result: jsonb("result"), // Store API response or error details
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Site activity log
export const siteActivities = pgTable("site_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id").notNull().references(() => wordpressSites.id, { onDelete: 'cascade' }),
  activityType: varchar("activity_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User API keys and integrations
export const userApiKeys = pgTable("user_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider").notNull(), // 'openai', 'google', 'anthropic', 'hosting_provider'
  keyName: varchar("key_name").notNull(), // e.g., 'OpenAI API Key', 'cPanel API Key'
  encryptedKey: text("encrypted_key").notNull(),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hosting provider accounts
export const hostingAccounts = pgTable("hosting_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider").notNull(), // 'cpanel', 'bluehost', 'godaddy', 'hostgator'
  accountName: varchar("account_name").notNull(),
  serverUrl: varchar("server_url").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(), // JSON with username/password/API keys
  isActive: boolean("is_active").default(true),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans and pricing
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // 'Free', 'Basic', 'Pro', 'Enterprise'
  tier: varchar("tier").notNull(), // 'free', 'basic', 'pro', 'enterprise'
  description: text("description"),
  price: integer("price").notNull().default(0), // Price in cents
  currency: varchar("currency").default("USD"),
  billingPeriod: varchar("billing_period").default("monthly"), // 'monthly', 'yearly'
  features: jsonb("features").notNull(), // Array of feature descriptions
  limits: jsonb("limits").notNull(), // API calls, sites, etc.
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment providers configuration (admin only)
export const paymentProviders = pgTable("payment_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // 'Stripe', 'PayPal', 'LemonSqueezy', etc.
  provider: varchar("provider").notNull(), // 'stripe', 'paypal', 'lemonsqueezy', 'paddle', 'gumroad'
  isEnabled: boolean("is_enabled").default(false),
  isDefault: boolean("is_default").default(false),
  config: jsonb("config").notNull(), // API keys, webhook URLs, etc.
  webhookSecret: varchar("webhook_secret"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  providerId: varchar("provider_id").notNull().references(() => paymentProviders.id),
  externalTransactionId: varchar("external_transaction_id"), // Stripe payment intent, PayPal order ID, etc.
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default("USD"),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'refunded'
  type: varchar("type").notNull().default("subscription"), // 'subscription', 'one-time', 'upgrade'
  metadata: jsonb("metadata"), // Additional payment details
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Admin configuration and customization
export const adminConfig = pgTable("admin_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sites: many(wordpressSites),
  conversations: many(conversations),
  apiKeys: many(userApiKeys),
  hostingAccounts: many(hostingAccounts),
  transactions: many(transactions),
}));

export const wordpressSitesRelations = relations(wordpressSites, ({ one, many }) => ({
  user: one(users, {
    fields: [wordpressSites.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
  actions: many(wpActions),
  activities: many(siteActivities),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  site: one(wordpressSites, {
    fields: [conversations.siteId],
    references: [wordpressSites.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const wpActionsRelations = relations(wpActions, ({ one }) => ({
  site: one(wordpressSites, {
    fields: [wpActions.siteId],
    references: [wordpressSites.id],
  }),
  message: one(messages, {
    fields: [wpActions.messageId],
    references: [messages.id],
  }),
}));

export const siteActivitiesRelations = relations(siteActivities, ({ one }) => ({
  site: one(wordpressSites, {
    fields: [siteActivities.siteId],
    references: [wordpressSites.id],
  }),
}));

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [userApiKeys.userId],
    references: [users.id],
  }),
}));

export const hostingAccountsRelations = relations(hostingAccounts, ({ one }) => ({
  user: one(users, {
    fields: [hostingAccounts.userId],
    references: [users.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  transactions: many(transactions),
}));

export const paymentProvidersRelations = relations(paymentProviders, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [transactions.planId],
    references: [subscriptionPlans.id],
  }),
  provider: one(paymentProviders, {
    fields: [transactions.providerId],
    references: [paymentProviders.id],
  }),
}));

// Insert schemas
export const insertWordpressSiteSchema = createInsertSchema(wordpressSites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertWpActionSchema = createInsertSchema(wpActions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertSiteActivitySchema = createInsertSchema(siteActivities).omit({
  id: true,
  createdAt: true,
});

export const insertUserApiKeySchema = createInsertSchema(userApiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHostingAccountSchema = createInsertSchema(hostingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentProviderSchema = createInsertSchema(paymentProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAdminConfigSchema = createInsertSchema(adminConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type WordPressSite = typeof wordpressSites.$inferSelect;
export type InsertWordPressSite = z.infer<typeof insertWordpressSiteSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type WpAction = typeof wpActions.$inferSelect;
export type InsertWpAction = z.infer<typeof insertWpActionSchema>;
export type SiteActivity = typeof siteActivities.$inferSelect;
export type InsertSiteActivity = z.infer<typeof insertSiteActivitySchema>;
export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = z.infer<typeof insertUserApiKeySchema>;
export type HostingAccount = typeof hostingAccounts.$inferSelect;
export type InsertHostingAccount = z.infer<typeof insertHostingAccountSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type PaymentProvider = typeof paymentProviders.$inferSelect;
export type InsertPaymentProvider = z.infer<typeof insertPaymentProviderSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AdminConfig = typeof adminConfig.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;
