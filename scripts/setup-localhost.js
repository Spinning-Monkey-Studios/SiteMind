#!/usr/bin/env node
/**
 * Localhost Setup Script for WP AI Manager
 * Helps users set up the application for local development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🏠 Setting up WP AI Manager for localhost development...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}
console.log('✅ Node.js version compatible:', nodeVersion);

// Check if PostgreSQL is available
try {
  execSync('psql --version', { stdio: 'ignore' });
  console.log('✅ PostgreSQL is installed');
} catch (error) {
  console.log('⚠️  PostgreSQL not found. Please install PostgreSQL:');
  console.log('   - Windows: https://www.postgresql.org/download/windows/');
  console.log('   - macOS: brew install postgresql');
  console.log('   - Linux: sudo apt-get install postgresql postgresql-contrib');
}

// Generate environment file
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env.local file...');
  
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  const encryptionKey = crypto.randomBytes(16).toString('hex');
  
  const envContent = `# WP AI Manager - Local Development Environment
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/wp_ai_manager"

# Session Security
SESSION_SECRET="${sessionSecret}"

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Encryption
ENCRYPTION_KEY="${encryptionKey}"

# AI Service API Keys (Optional - users can provide their own)
# GEMINI_API_KEY="your-gemini-api-key-here"
# OPENAI_API_KEY="your-openai-api-key-here"

# Payment Gateway Configuration (Optional)
# STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
# VITE_STRIPE_PUBLIC_KEY="pk_test_your_stripe_public_key"

# Development Settings
DEBUG=true
LOG_LEVEL=debug
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with secure random keys');
} else {
  console.log('✅ .env.local already exists');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Setup database
console.log('\n🗄️  Setting up database...');
console.log('Please ensure PostgreSQL is running and create the database:');
console.log('   createdb wp_ai_manager');
console.log('\nThen run the database migration:');
console.log('   npm run db:push');

console.log('\n🚀 Setup complete! To start development:');
console.log('   1. Start PostgreSQL service');
console.log('   2. Create database: createdb wp_ai_manager');
console.log('   3. Run migration: npm run db:push');
console.log('   4. Start server: npm run dev');
console.log('   5. Open: http://localhost:5000');

console.log('\n📚 Additional commands:');
console.log('   - Database studio: npm run db:studio');
console.log('   - Run tests: npm run test');
console.log('   - Test UI: npm run test:ui');

console.log('\n🔧 Configuration:');
console.log('   - Edit .env.local to add API keys');
console.log('   - Development user auto-login is enabled');
console.log('   - All features available with developer access');