# WP AI Manager - Deployment Guide

## Replit Deployment with Custom Domain

### Step 1: Deploy to Replit
1. Your app is already configured for Replit deployment
2. Click the "Deploy" button in your Replit workspace
3. Choose "Autoscale", "Reserved VM", or "Static" deployment type

### Step 2: Set Up Custom Domain
1. Go to the Deployments tab in your Replit App
2. Navigate to Settings > Custom Domains
3. Add your custom domain (e.g., `www.your-domain.com`)
4. Copy the provided DNS records (A and TXT records)

### Step 3: Configure DNS
1. Log into your domain registrar's control panel
2. Add the A and TXT records provided by Replit
3. Wait for DNS propagation (can take a few minutes to 48 hours)

### Step 4: Alternative - Buy Domain Through Replit
- Use Replit's Domain Purchasing feature for automatic configuration
- Search and buy domains directly within the platform
- Automatic DNS configuration and renewals

## Environment Variables Required

### Essential for Production:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET` - Session encryption secret (auto-provided by Replit)
- `GEMINI_API_KEY` - Google Gemini API key (provided by user)

### Optional for Enhanced Features:
- `OPENAI_API_KEY` - OpenAI API key (users can provide their own)
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET` - PayPal payments
- `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET` - Facebook OAuth
- `MICROSOFT_CLIENT_ID` & `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth

## Unit Testing Setup

### Running Tests
```bash
npm run test          # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run with coverage report
```

### Test Structure
- `client/src/test/` - Frontend component tests
- `server/test/` - Backend service tests
- `vitest.config.ts` - Test configuration
- Tests are organized by feature and use Vitest + React Testing Library

### Key Testing Areas
- Payment service functionality
- Subscription management
- WordPress API integration
- User authentication flows
- Component rendering and interactions

## Monitoring System

### Active Monitoring Features
- Health checks every 15 minutes
- Daily comprehensive scans at 2 AM
- Weekly security scans on Sundays
- Real-time uptime monitoring
- Performance tracking
- Alert generation for issues

### Monitoring Endpoints
- `GET /api/monitoring/status` - Check if monitoring is active
- `GET /api/monitoring/site/:siteId` - Get site-specific monitoring data

### Limitations
- Basic connectivity testing (not full security scanning)
- No automatic email/SMS alerts (would require additional services)
- Performance metrics limited to response time
- Security scanning requires additional tools

## Production Considerations

### Scalability
- Use Replit's Autoscale deployment for variable traffic
- Consider Reserved VM for consistent performance
- Database scales automatically with Replit PostgreSQL

### Security
- All sensitive data is encrypted before storage
- Sessions use secure cookies with proper configuration
- CORS and security headers are configured
- Input validation using Zod schemas

### Performance
- Static file serving optimized
- Database queries use indexes where appropriate
- Frontend built with Vite for optimal bundling
- Server-side rendering not required (SPA architecture)