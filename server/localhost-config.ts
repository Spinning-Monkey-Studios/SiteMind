// Localhost-specific configuration for development

export const localhostConfig = {
  // Development authentication bypass
  enableDevAuth: process.env.NODE_ENV === 'development',
  
  // Default development user for localhost
  defaultDevUser: {
    id: 'localhost-dev-user',
    email: 'dev@localhost.com',
    firstName: 'Dev',
    lastName: 'User',
    profileImageUrl: null,
    subscriptionTier: 'developer', // Give developer access for localhost
    subscriptionStatus: 'active',
    subscriptionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    stripeCustomerId: null,
    paypalCustomerId: null,
    isAdmin: true,
    isDeveloper: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Localhost server configuration
  server: {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 5000,
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:5000', 'http://127.0.0.1:5000']
        : false
    }
  },

  // Development database settings
  database: {
    ssl: false, // Disable SSL for localhost PostgreSQL
    logging: process.env.NODE_ENV === 'development'
  },

  // File upload paths for localhost
  uploads: {
    directory: './uploads',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // Development monitoring settings
  monitoring: {
    enabled: true,
    interval: 60000, // 1 minute for development (faster than production)
    alertThreshold: {
      responseTime: 10000, // 10 seconds for localhost
      uptime: 0.95 // 95% uptime requirement
    }
  }
};

// Helper function to check if running on localhost
export const isLocalhost = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.HOST === 'localhost' ||
         process.env.DATABASE_URL?.includes('localhost');
};

// Development middleware for localhost authentication
export const localhostAuthMiddleware = (req: any, res: any, next: any) => {
  if (localhostConfig.enableDevAuth && !req.user) {
    // Auto-login development user for localhost
    req.user = {
      claims: {
        sub: localhostConfig.defaultDevUser.id
      }
    };
  }
  next();
};