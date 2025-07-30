# GitHub Repository Setup Guide

Your WP AI Manager code is ready to be pushed to GitHub. Here's how to get it working:

## Current Status
- Repository connected to: `https://github.com/Spinning-Monkey-Studios/SiteMind`
- Local commits ready to push
- Authentication needs to be configured

## Step 1: Generate GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Replit WP AI Manager"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

## Step 2: Configure Git Authentication in Replit

### Method 1: Using Replit's Git Integration
1. In Replit, go to the Version Control tab (left sidebar)
2. Click the settings gear icon
3. Add your GitHub username and the personal access token as password
4. Save the configuration

### Method 2: Using Command Line
Run these commands in the Replit Shell:

```bash
# Configure git with your credentials
git config --global user.name "Your GitHub Username"
git config --global user.email "your-email@gmail.com"

# Set the remote URL with token authentication
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/Spinning-Monkey-Studios/SiteMind.git
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_TOKEN` with the personal access token you generated

## Step 3: Push Your Code

After authentication is configured, run:

```bash
# Add all files
git add .

# Commit recent changes
git commit -m "Add comprehensive admin bypass system and localhost deployment support"

# Push to GitHub
git push origin main
```

## Step 4: Verify on GitHub

1. Go to your GitHub repository: https://github.com/Spinning-Monkey-Studios/SiteMind
2. You should see all your files and the commit history
3. Check that files like `README.md`, `package.json`, and your source code are there

## Alternative: Manual Upload

If Git authentication continues to fail:

1. Download your project as a ZIP file from Replit
2. Extract it locally
3. Upload files directly to GitHub using the web interface
4. Or use GitHub Desktop application

## Common Issues

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your GitHub password
- Verify the token has `repo` permissions
- Check that the username in the URL matches your GitHub username exactly

### "Permission denied"
- Ensure you have write access to the repository
- Verify you're the owner of the repository or have been given push permissions

### "Repository not found"
- Check the repository URL is correct
- Make sure the repository exists and is not private (unless you have access)

## Repository Structure

Your repository should include:
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared schemas and types
├── scripts/         # Setup and utility scripts
├── package.json     # Dependencies and scripts
├── README.md        # Project documentation
├── ADMIN_BYPASS_GUIDE.md    # Admin bypass instructions
├── LOCALHOST_DEPLOYMENT.md # Local setup guide
└── replit.md        # Project architecture and notes
```

## Next Steps After Upload

1. Add a comprehensive README.md describing your project
2. Set up GitHub Actions for CI/CD (optional)
3. Configure branch protection rules
4. Add collaborators if working with a team
5. Consider making the repository private if it contains sensitive information

## Security Note

Never commit:
- Environment variables with real API keys
- Database passwords
- OAuth client secrets
- Personal access tokens

Use `.env.example` for environment variable templates instead.