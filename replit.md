# WP AI Manager

## Overview

WP AI Manager is a modern web application that provides intelligent WordPress site management through AI-powered natural language commands. Users can connect their WordPress sites and use conversational AI to perform various administrative tasks like theme customization, plugin management, and site optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between client and server components:

- **Frontend**: React with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth integration
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for routing
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for WordPress branding
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with TypeScript support and hot module replacement
- **Console Monitoring**: Client-side error tracking and AI analysis system

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Authentication**: Multi-provider auth with Passport.js (Replit, Facebook, Microsoft, hosting accounts)
- **Session Management**: Express sessions with PostgreSQL store
- **Database Layer**: Drizzle ORM with type-safe schema definitions
- **AI Services**: OpenAI and Google Gemini integration with user-specific API keys
- **Graphics Services**: Integration with free stock photo APIs (Unsplash, Pexels, Pixabay)
- **Console Monitoring**: Server-side error analysis and AI-powered debugging

### Database Schema
- **Users**: Extended user profile with subscription tiers, payment IDs, and admin/developer flags
- **Subscription Plans**: Configurable pricing plans with features and limits
- **Payment Providers**: Multi-gateway configuration (Stripe, PayPal, LemonSqueezy, Paddle, Gumroad)
- **Transactions**: Payment transaction tracking and status management
- **Admin Config**: Platform configuration and settings storage
- **User API Keys**: Encrypted storage of user's AI service API keys
- **Hosting Accounts**: Encrypted hosting provider credentials
- **WordPress Sites**: Connected WordPress sites with encrypted credentials
- **Conversations**: AI chat conversations between users and the assistant
- **Messages**: Individual messages within conversations
- **WP Actions**: WordPress actions executed by the AI
- **Site Activities**: Activity logs for WordPress site changes
- **Sessions**: Session storage for authentication

## Data Flow

1. **Multi-Provider Authentication**: Users authenticate via Replit, Facebook, Microsoft, or hosting account credentials
2. **Subscription Management**: Users select subscription plans and complete payment through configured gateways
3. **Access Control**: System enforces feature limits based on subscription tier and user type (developer/purchaser)
4. **API Key Management**: 
   - Developer accounts: Automatically use default environment API keys
   - Purchaser accounts: Users must provide their own AI service API keys with encryption
5. **Site Connection**: Users add WordPress sites and hosting account credentials (subject to subscription limits)
6. **AI Interaction**: Users interact with OpenAI or Google Gemini through chat interface (with usage tracking)
7. **Console Monitoring**: Client-side errors are automatically captured and analyzed by AI
8. **Graphics & Content**: AI assists with finding free graphics, generating custom images, and creating blog content
9. **WordPress Integration**: Service layer executes WordPress API calls with encrypted credentials
10. **Activity Logging**: All actions, errors, and changes are logged for audit and analysis
11. **Admin Management**: Administrators manage users, subscriptions, and platform configuration

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **openai**: AI processing for natural language commands
- **axios**: HTTP client for WordPress API integration
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Primitive UI components for accessibility
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety across the application
- **tsx**: TypeScript execution for server development

## Deployment Strategy

### Development
- **Vite Dev Server**: Frontend development with HMR
- **tsx**: Server development with auto-restart
- **Database**: Uses environment variable `DATABASE_URL` for connection

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI processing (optional, users can provide their own)
- `GEMINI_API_KEY`: Google Gemini API key for AI processing
- `SESSION_SECRET`: Session encryption secret
- `ENCRYPTION_KEY`: Key for encrypting user credentials and API keys
- `REPL_ID`: Replit application identifier
- `ISSUER_URL`: OAuth issuer URL (defaults to Replit)
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`: Facebook OAuth credentials (optional)
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`: Microsoft OAuth credentials (optional)
- `UNSPLASH_ACCESS_KEY`: Unsplash API access key for graphics search (optional)
- `PEXELS_API_KEY`: Pexels API key for graphics search (optional)
- `PIXABAY_API_KEY`: Pixabay API key for graphics search (optional)

### Security Considerations
- WordPress credentials are encrypted before storage
- Session-based authentication with secure cookies
- CORS and security headers configured
- SQL injection protection via parameterized queries
- Input validation using Zod schemas

## Recent Enhancements (Latest)

### Complete Payment & Subscription System
- Comprehensive subscription management with tiered plans (Free, Basic, Pro, Enterprise, Developer)
- Multi-provider payment gateway support (Stripe, PayPal, LemonSqueezy, Paddle, Gumroad)
- Developer-specific access levels with default API key usage vs user-provided keys
- Transaction tracking and payment provider configuration
- Admin panel with full subscription and payment management

### Tiered Access Control System
- Developer tier: Unlimited access using default API keys, code view permissions, admin access
- Purchaser tiers: Feature-gated access requiring user's own API keys
- Subscription-based limits on sites, API calls, storage, and premium features
- Dynamic subscription status checking and enforcement

### Advanced Admin Backend
- Full administrative dashboard with user management
- Code view functionality for frontend and backend inspection
- Payment provider configuration and management
- Subscription plan creation and modification
- Real-time statistics and analytics dashboard
- Admin-only routes with proper authentication and authorization

### Enhanced User Management
- Extended user schema with subscription tracking and payment integration
- Stripe and PayPal customer ID storage for recurring billing
- Admin and developer role assignments
- Subscription status and expiry date management

### Multi-Provider Authentication System
- Facebook and Microsoft OAuth integration with Passport.js strategies
- Hosting account management for WordPress credentials
- Enhanced user profile support across different auth providers

### AI Service Expansion  
- Google Gemini integration as primary AI provider alongside OpenAI
- User-specific API key management with encrypted storage
- Fallback system supporting environment and user-provided API keys
- Developer accounts automatically use default environment keys

### Console Error Monitoring & Analysis
- Client-side JavaScript error capture and logging
- Server-side error aggregation and analysis
- AI-powered debugging assistance with actionable solutions
- Real-time error summary dashboard

### Graphics & Content Generation
- Integration with free stock photo APIs (Unsplash, Pexels, Pixabay)
- AI-powered graphics suggestions and search optimization
- Custom graphics generation using Gemini's image generation capabilities
- Automated blog content creation with SEO optimization
- Graphics prompt generation for external AI tools

### Enhanced Security & Data Management
- Modern Node.js crypto APIs for secure encryption/decryption
- Encrypted storage for all sensitive user data (API keys, credentials)
- Session-based authentication with secure cookie handling
- Comprehensive error handling and user feedback systems

The application is designed for flexible deployment across multiple environments:
- **Replit**: Automatic database provisioning and OAuth integration
- **Localhost**: Complete development environment with auto-authentication
- **Other hosting platforms**: Adaptable with appropriate environment configuration

## Localhost Deployment

### Quick Setup
1. Clone repository and run `npm install`
2. Install PostgreSQL and create database: `createdb wp_ai_manager`
3. Copy `.env.example` to `.env.local` and configure
4. Run database migration: `npm run db:push`
5. Start development server: `npm run dev`
6. Access at http://localhost:5000

### Development Features
- **Auto-authentication**: Development user automatically logged in for localhost
- **Developer Access**: Full platform features available including admin panel
- **Real Monitoring**: All monitoring features work with localhost WordPress sites
- **Testing Suite**: Complete unit testing with `npm run test`
- **Database Studio**: Visual database management with `npm run db:studio`

### Custom Domain Support
- Replit deployments support custom domains through DNS configuration
- Domain purchasing available directly through Replit platform
- Automatic SSL and DNS management for purchased domains

## Admin Bypass System

### App Owner Payment Override
- **Email-based auto-detection**: Add owner email to admin list for automatic upgrade
- **Master key bypass**: Environment-protected key for instant admin access
- **Bypass codes**: One-time codes that can be generated and shared
- **Database direct**: Manual database modification for developer access

### Access via `/admin-bypass` Page
- Master key input for immediate admin privileges
- Bypass code redemption system
- Current access level display
- Code generation for existing admins

### Security Features
- All bypass activities logged and tracked
- Master key environment-protected
- Email-based auto-detection for owner accounts
- Developer tier access with 10-year expiry when bypassed