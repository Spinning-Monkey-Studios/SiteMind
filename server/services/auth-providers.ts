import passport from 'passport';
import { storage } from '../storage';
import { EncryptionService } from './encryption';

// Only import strategies if their packages are available
let FacebookStrategy: any = null;
let MicrosoftStrategy: any = null;

try {
  const facebookPassport = require('passport-facebook');
  FacebookStrategy = facebookPassport.Strategy;
} catch (e) {
  console.log('Facebook strategy not available - install passport-facebook to enable');
}

try {
  const microsoftPassport = require('passport-microsoft');
  MicrosoftStrategy = microsoftPassport.Strategy;
} catch (e) {
  console.log('Microsoft strategy not available - install passport-microsoft to enable');
}

// Facebook OAuth Strategy
if (FacebookStrategy && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'picture']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const user = await storage.upsertUser({
        id: `facebook_${profile.id}`,
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        authProvider: 'facebook',
        authProviderId: profile.id,
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Microsoft OAuth Strategy
if (MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "/api/auth/microsoft/callback",
    scope: ['user.read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await storage.upsertUser({
        id: `microsoft_${profile.id}`,
        email: profile.emails?.[0]?.value,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        authProvider: 'microsoft',
        authProviderId: profile.id,
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Note: WordPress/Hosting Provider Login will be handled via API routes instead of passport strategy

export interface AuthProvider {
  name: string;
  displayName: string;
  loginUrl: string;
  enabled: boolean;
  requiredEnvVars: string[];
}

export const getAuthProviders = (): AuthProvider[] => {
  return [
    {
      name: 'replit',
      displayName: 'Replit',
      loginUrl: '/api/login',
      enabled: true,
      requiredEnvVars: ['REPL_ID'],
    },
    {
      name: 'facebook',
      displayName: 'Facebook',
      loginUrl: '/api/auth/facebook',
      enabled: !!(FacebookStrategy && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      requiredEnvVars: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    },
    {
      name: 'microsoft',
      displayName: 'Microsoft',
      loginUrl: '/api/auth/microsoft',
      enabled: !!(MicrosoftStrategy && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
      requiredEnvVars: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    },
    {
      name: 'wordpress-hosting',
      displayName: 'WordPress/Hosting Account',
      loginUrl: '/api/auth/wordpress-hosting',
      enabled: true,
      requiredEnvVars: [],
    },
  ];
};