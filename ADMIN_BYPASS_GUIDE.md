# Admin Bypass Guide - How to Override Payment Gateway as App Owner

As the app owner, you have multiple ways to bypass your own payment system and gain full admin access. This guide covers all available methods.

## Quick Access Methods

### 1. Email-Based Auto-Detection
**Easiest Method** - Add your email to the admin list:

1. Edit `server/services/admin-bypass.ts`
2. Add your email to the `adminEmails` array:
```typescript
adminEmails: [
  'admin@wp-ai-manager.com',
  'owner@wp-ai-manager.com',
  'your-email@domain.com', // Add your email here
],
```
3. Restart the server
4. Login with that email - you'll automatically get admin access

### 2. Master Key Method
**Most Secure** - Use environment variable:

1. Set `ADMIN_MASTER_KEY` in your environment:
```bash
ADMIN_MASTER_KEY="your-super-secret-master-key-2024"
```

2. Visit `/admin-bypass` page in your app
3. Enter the master key
4. Get instant admin access

### 3. Bypass Code Method
**Shareable** - Generate one-time codes:

1. Login to the app (even with free account)
2. Visit `/admin-bypass` page
3. Use bypass code: `ADMIN-BYPASS-001` (default codes)
4. Or generate new codes from admin panel

### 4. Database Direct Method
**Developer** - Direct database modification:

```sql
UPDATE users 
SET 
  "subscriptionTier" = 'developer',
  "subscriptionStatus" = 'active',
  "subscriptionExpiryDate" = '2034-12-31',
  "isAdmin" = true,
  "isDeveloper" = true
WHERE email = 'your-email@domain.com';
```

## Access Levels Granted

When you use any bypass method, you get:

- **Subscription Tier**: Developer (highest level)
- **Admin Access**: Full admin panel access
- **Developer Access**: Code view and system management
- **Subscription Status**: Active with 10-year expiry
- **All Features**: Unlimited sites, API calls, premium features

## Environment Configuration

Add these to your environment file (`.env` or Replit Secrets):

```env
# Master key for admin bypass
ADMIN_MASTER_KEY="your-secret-master-key-here"

# Optional: Override default admin emails via environment
ADMIN_EMAILS="admin@yourdomain.com,owner@yourdomain.com"
```

## Default Bypass Codes

Pre-configured codes that work immediately:
- `ADMIN-BYPASS-001`
- `OWNER-FULL-ACCESS`
- `DEV-OVERRIDE-123`

## How It Works

### Automatic Detection
1. Every time you login, the system checks if your email is in the admin list
2. If found, you're automatically upgraded to admin status
3. Your subscription is set to "developer" tier with 10-year expiry
4. All premium features become available immediately

### Manual Override
1. Visit `/admin-bypass` in your deployed app
2. Use master key or bypass code
3. System upgrades your account immediately
4. Page reloads with full admin access

### Security Features
- Master key is environment-protected
- Bypass codes can be one-time use
- All bypass activities are logged
- Only admins can generate new codes

## Production Deployment

### Replit Deployment
1. Add `ADMIN_MASTER_KEY` to Replit Secrets
2. Add your email to the admin list in code
3. Deploy the app
4. Login and access `/admin-bypass` if needed

### Localhost Deployment
- Development user is automatically an admin
- No bypass needed for localhost
- All features available immediately

## Admin Panel Features

Once you have admin access, you can:
- View all users and their subscriptions
- Manage payment providers and plans
- Generate new bypass codes for others
- View system statistics and logs
- Access code view for debugging
- Manage platform configuration

## Sharing Access

To give admin access to others:

1. **Add their email** to `adminEmails` array
2. **Generate bypass code** from admin panel
3. **Share master key** (not recommended)
4. **Database modification** for developers

## Security Considerations

### Protect These:
- Master key (never expose in client code)
- Admin email list (keep updated)
- Database access credentials

### Best Practices:
- Use master key for initial setup only
- Generate temporary bypass codes for team members
- Regularly audit admin user list
- Remove unused bypass codes

## Troubleshooting

### "Invalid Master Key"
- Check environment variable is set correctly
- Ensure no extra spaces or quotes
- Restart server after environment changes

### "Invalid Bypass Code"
- Code may be one-time use and already consumed
- Generate new code from admin panel
- Check for typos in code entry

### Email Not Auto-Upgrading
- Verify email matches exactly (case-sensitive)
- Check server logs for errors
- Ensure user logs in with correct email
- Restart server after code changes

### Bypass Page Not Loading
- Ensure route is added to router
- Check for authentication (must be logged in)
- Verify component imports are correct

## API Endpoints

For programmatic access:

```bash
# Apply master key bypass
POST /api/admin/bypass/master-key
{
  "masterKey": "your-master-key"
}

# Apply bypass code
POST /api/admin/bypass/code
{
  "bypassCode": "ADMIN-BYPASS-001"
}

# Generate new code (admin only)
POST /api/admin/bypass/generate-code

# View bypass config (admin only)
GET /api/admin/bypass/config
```

## Quick Start Summary

**Fastest method for app owner:**

1. Add your email to `adminEmails` in `admin-bypass.ts`
2. Set `ADMIN_MASTER_KEY` in environment
3. Deploy and login with your email
4. Visit `/admin-bypass` if auto-detection doesn't work
5. Use master key to get instant admin access

You now have full control over your payment system and can access all premium features without going through your own payment gateway.