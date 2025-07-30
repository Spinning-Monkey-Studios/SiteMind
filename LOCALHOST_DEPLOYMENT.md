# WP AI Manager - Localhost Deployment Guide

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL** (v13 or higher)
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **macOS**: Use Homebrew: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

3. **Git** (for cloning)
   - Download from: https://git-scm.com/

## Step-by-Step Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd wp-ai-manager
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL service
# Windows: Use Services app or pgAdmin
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
createdb wp_ai_manager

# Or using psql:
psql -U postgres
CREATE DATABASE wp_ai_manager;
\q
```

### 3. Environment Configuration
Create `.env.local` file in root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wp_ai_manager"

# Session Security
SESSION_SECRET="your-super-secret-session-key-here"

# AI Services (Optional - users can provide their own)
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Payment Gateways (Optional)
STRIPE_SECRET_KEY="sk_test_..."
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# OAuth (Optional)
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Graphics APIs (Optional)
UNSPLASH_ACCESS_KEY="your-unsplash-key"
PEXELS_API_KEY="your-pexels-key"
PIXABAY_API_KEY="your-pixabay-key"

# Development Settings
NODE_ENV=development
PORT=5000
```

### 4. Database Migration
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

## Access Your App

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Database Studio**: `npm run db:studio` (opens on http://localhost:4983)

## Production Build for Localhost

### 1. Build the Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

## Networking Options

### Access from Other Devices on Network
1. Find your PC's local IP address:
   - **Windows**: `ipconfig`
   - **macOS/Linux**: `ifconfig` or `ip addr`

2. Update server binding in `server/index.ts`:
```typescript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

3. Access from other devices: `http://YOUR_PC_IP:5000`

### Port Forwarding for External Access
1. Configure your router to forward port 5000 to your PC
2. Access via your public IP: `http://YOUR_PUBLIC_IP:5000`
3. **Security Note**: Use HTTPS and proper authentication for external access

## Localhost-Specific Configuration

### Authentication Setup
For localhost, the Replit OAuth won't work. Configure alternative auth:

1. **Disable Replit Auth** (create local auth bypass):
```typescript
// In server/routes.ts - add this for development
if (process.env.NODE_ENV === 'development') {
  app.get('/api/auth/dev-login', async (req, res) => {
    // Create a development user session
    req.session.user = {
      claims: { sub: 'dev-user-123' }
    };
    res.redirect('/');
  });
}
```

2. **Use Facebook/Microsoft OAuth** with localhost redirect URLs
3. **Implement email/password auth** for local users

### File Storage
- Uploads will be stored in `./uploads/` directory
- Ensure write permissions for the application

### Monitoring Service
- All monitoring features work on localhost
- Cron jobs will run as scheduled
- Monitor local WordPress development sites

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env.local
   - Test connection: `psql $DATABASE_URL`

2. **Port Already in Use**
   - Change PORT in .env.local
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`

3. **Missing Dependencies**
   - Clear node_modules: `rm -rf node_modules`
   - Reinstall: `npm install`

4. **Build Errors**
   - Check Node.js version: `node --version`
   - Clear Vite cache: `rm -rf .vite`

### Performance Optimization
1. **Enable PostgreSQL Performance Tuning**
2. **Configure Node.js Memory Limits**
3. **Use PM2 for Process Management**: `npm install -g pm2`

## Development vs Production

### Development Mode
- Hot reloading enabled
- Detailed error messages
- Debug logging active
- CORS relaxed for localhost

### Production Mode
- Optimized builds
- Compressed assets
- Security headers enabled
- Performance monitoring active

## Security Considerations

### For Local Development
- Use development API keys
- Enable detailed logging
- Test with sample data

### For Local Production
- Use strong SESSION_SECRET
- Enable HTTPS with self-signed certificates
- Configure firewall rules
- Regular security updates

## Backup Strategy

### Database Backups
```bash
# Create backup
pg_dump wp_ai_manager > backup_$(date +%Y%m%d).sql

# Restore backup
psql wp_ai_manager < backup_20241230.sql
```

### File Backups
- Regular backup of uploads folder
- Version control for code changes
- Environment file backups (without secrets)