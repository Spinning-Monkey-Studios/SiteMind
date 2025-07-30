import { storage } from "../storage";
import { WordPressService } from "./wordpress";
import * as cron from "node-cron";

interface MonitoringAlert {
  siteId: string;
  type: 'uptime' | 'performance' | 'security' | 'update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendations: string[];
  timestamp: Date;
}

interface SiteHealthMetrics {
  isOnline: boolean;
  responseTime: number;
  lastUpdated: Date;
  wpVersion: string;
  pluginUpdatesAvailable: number;
  themeUpdatesAvailable: number;
  securityIssues: string[];
  performanceScore: number;
}

class MonitoringService {
  private wordpressService: WordPressService;
  private isRunning: boolean = false;

  constructor() {
    this.wordpressService = new WordPressService();
  }

  async startMonitoring(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting 24/7 WordPress monitoring service...');

    // Run health checks every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.performHealthChecks();
    });

    // Run daily comprehensive scans at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.performDailyScans();
    });

    // Run weekly security scans on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      await this.performSecurityScans();
    });
  }

  async stopMonitoring(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping monitoring service...');
  }

  private async performHealthChecks(): Promise<void> {
    try {
      // Get all active sites from database
      const sites = await this.getAllActiveSites();
      
      for (const site of sites) {
        try {
          const metrics = await this.checkSiteHealth(site.id);
          
          // Generate alerts if needed
          const alerts = await this.generateAlerts(site.id, metrics);
          
          if (alerts.length > 0) {
            await this.sendAlerts(site.userId, alerts);
          }
        } catch (error) {
          console.error(`Error checking site ${site.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in health checks:', error);
    }
  }

  private async performDailyScans(): Promise<void> {
    try {
      const sites = await this.getAllActiveSites();
      
      for (const site of sites) {
        try {
          await this.performComprehensiveScan(site.id);
        } catch (error) {
          console.error(`Error in daily scan for site ${site.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in daily scans:', error);
    }
  }

  private async performSecurityScans(): Promise<void> {
    try {
      const sites = await this.getAllActiveSites();
      
      for (const site of sites) {
        try {
          await this.performSecurityScan(site.id);
        } catch (error) {
          console.error(`Error in security scan for site ${site.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in security scans:', error);
    }
  }

  private async checkSiteHealth(siteId: string): Promise<SiteHealthMetrics> {
    const site = await storage.getSite(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const startTime = Date.now();
    
    try {
      // Test site connectivity using basic WordPress API check
      const healthStatus = await this.wordpressService.testConnection(
        site.url,
        site.username,
        site.encryptedPassword,
        site.authMethod || 'app-password'
      );

      const responseTime = Date.now() - startTime;

      return {
        isOnline: healthStatus.success,
        responseTime,
        lastUpdated: new Date(),
        wpVersion: 'Unknown', // Would need additional API calls to get version
        pluginUpdatesAvailable: 0, // Would need admin access to check updates
        themeUpdatesAvailable: 0, // Would need admin access to check updates
        securityIssues: [], // Would need security scanning tools
        performanceScore: this.calculatePerformanceScore(responseTime)
      };
    } catch (error) {
      return {
        isOnline: false,
        responseTime: Date.now() - startTime,
        lastUpdated: new Date(),
        wpVersion: 'Unknown',
        pluginUpdatesAvailable: 0,
        themeUpdatesAvailable: 0,
        securityIssues: ['Connection failed'],
        performanceScore: 0
      };
    }
  }

  private async generateAlerts(siteId: string, metrics: SiteHealthMetrics): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];

    // Uptime alerts
    if (!metrics.isOnline) {
      alerts.push({
        siteId,
        type: 'uptime',
        severity: 'critical',
        message: 'Your WordPress site is currently offline',
        recommendations: [
          'Check your hosting provider status',
          'Verify domain and DNS settings',
          'Contact your hosting support if the issue persists'
        ],
        timestamp: new Date()
      });
    }

    // Performance alerts
    if (metrics.responseTime > 5000) {
      alerts.push({
        siteId,
        type: 'performance',
        severity: metrics.responseTime > 10000 ? 'high' : 'medium',
        message: `Site response time is slow (${metrics.responseTime}ms)`,
        recommendations: [
          'Consider enabling caching plugins',
          'Optimize images and media files',
          'Review and deactivate unnecessary plugins',
          'Consider upgrading your hosting plan'
        ],
        timestamp: new Date()
      });
    }

    // Security alerts
    if (metrics.securityIssues.length > 0) {
      alerts.push({
        siteId,
        type: 'security',
        severity: 'high',
        message: `Security issues detected: ${metrics.securityIssues.join(', ')}`,
        recommendations: [
          'Update WordPress core to the latest version',
          'Update all plugins and themes',
          'Install a security plugin',
          'Enable two-factor authentication'
        ],
        timestamp: new Date()
      });
    }

    // Update alerts
    if (metrics.pluginUpdatesAvailable > 0 || metrics.themeUpdatesAvailable > 0) {
      alerts.push({
        siteId,
        type: 'update',
        severity: 'medium',
        message: `Updates available: ${metrics.pluginUpdatesAvailable} plugins, ${metrics.themeUpdatesAvailable} themes`,
        recommendations: [
          'Review and install available updates',
          'Create a backup before updating',
          'Test updates on a staging site first'
        ],
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private async sendAlerts(userId: string, alerts: MonitoringAlert[]): Promise<void> {
    try {
      // Store alerts in database for user dashboard
      for (const alert of alerts) {
        await storage.createSiteActivity({
          siteId: alert.siteId,
          activityType: 'monitoring_alert',
          description: alert.message,
          metadata: {
            severity: alert.severity,
            type: alert.type,
            recommendations: alert.recommendations
          }
        });
      }

      // TODO: Implement email/SMS notifications
      // This would require additional services like SendGrid, Twilio, etc.
      console.log(`Generated ${alerts.length} alerts for user ${userId}`);
      
    } catch (error) {
      console.error('Error sending alerts:', error);
    }
  }

  private calculatePerformanceScore(responseTime: number): number {
    if (responseTime < 1000) return 100;
    if (responseTime < 2000) return 80;
    if (responseTime < 3000) return 60;
    if (responseTime < 5000) return 40;
    return 20;
  }

  private async getAllActiveSites(): Promise<Array<{id: string, userId: string, url: string, username: string, encryptedPassword: string, authMethod?: string}>> {
    // Get all active sites - would need a method to fetch from all users
    // For now, return empty array to prevent errors during development
    return [];
  }

  private async performComprehensiveScan(siteId: string): Promise<void> {
    // Comprehensive daily scan implementation
    console.log(`Performing comprehensive scan for site ${siteId}`);
  }

  private async performSecurityScan(siteId: string): Promise<void> {
    // Security scan implementation
    console.log(`Performing security scan for site ${siteId}`);
  }

  // Public method to check if monitoring is actually running
  isMonitoringActive(): boolean {
    return this.isRunning;
  }

  // Get monitoring status for a specific site
  async getSiteMonitoringStatus(siteId: string): Promise<SiteHealthMetrics | null> {
    try {
      return await this.checkSiteHealth(siteId);
    } catch (error) {
      console.error('Error getting site monitoring status:', error);
      return null;
    }
  }
}

export const monitoringService = new MonitoringService();