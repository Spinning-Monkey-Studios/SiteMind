import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import type { WordPressSite } from '@shared/schema';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export interface WordPressConnectionTest {
  success: boolean;
  error?: string;
  wpVersion?: string;
  activeTheme?: string;
  pluginCount?: number;
}

export interface WordPressSiteStatus {
  isOnline: boolean;
  wpVersion?: string;
  activeTheme?: string;
  pluginCount?: number;
  responseTime?: number;
}

export interface WordPressAction {
  type: string;
  description: string;
  params: any;
}

export class WordPressService {
  private createClient(site: WordPressSite & { decryptedPassword: string }): AxiosInstance {
    const baseURL = site.url.endsWith('/') ? site.url : site.url + '/';
    
    return axios.create({
      baseURL: `${baseURL}wp-json/wp/v2/`,
      timeout: 30000,
      auth: {
        username: site.username,
        password: site.decryptedPassword,
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WP-AI-Manager/1.0',
      },
    });
  }

  async encryptCredentials(password: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  async decryptCredentials(encryptedPassword: string): Promise<string> {
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async testConnection(
    url: string,
    username: string,
    password: string,
    authMethod: string
  ): Promise<WordPressConnectionTest> {
    try {
      const baseURL = url.endsWith('/') ? url : url + '/';
      
      const client = axios.create({
        baseURL: `${baseURL}wp-json/wp/v2/`,
        timeout: 15000,
        auth: {
          username,
          password,
        },
      });

      // Test basic connection
      const response = await client.get('');
      
      if (response.status !== 200) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Get site info
      const [usersResponse, themesResponse, pluginsResponse] = await Promise.allSettled([
        client.get('users/me'),
        client.get(`${baseURL}wp-json/wp/v2/themes`),
        client.get(`${baseURL}wp-json/wp/v2/plugins`),
      ]);

      let wpVersion = 'Unknown';
      let activeTheme = 'Unknown';
      let pluginCount = 0;

      // Extract WordPress version from headers or response
      if (response.headers['x-wp-version']) {
        wpVersion = response.headers['x-wp-version'];
      }

      // Get active theme
      if (themesResponse.status === 'fulfilled') {
        const themes = themesResponse.value.data;
        const active = themes.find((theme: any) => theme.status === 'active');
        if (active) {
          activeTheme = active.name.rendered || active.name;
        }
      }

      // Get plugin count
      if (pluginsResponse.status === 'fulfilled') {
        pluginCount = pluginsResponse.value.data.length;
      }

      return {
        success: true,
        wpVersion,
        activeTheme,
        pluginCount,
      };

    } catch (error: any) {
      console.error('WordPress connection test failed:', error);
      
      if (error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
        };
      } else if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Connection refused. Please check the URL and ensure the site is accessible.',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown connection error',
        };
      }
    }
  }

  async getSiteStatus(site: WordPressSite & { decryptedPassword: string }): Promise<WordPressSiteStatus> {
    try {
      const startTime = Date.now();
      const client = this.createClient(site);
      
      const response = await client.get('');
      const responseTime = Date.now() - startTime;

      // Get additional site info
      const [themesResponse, pluginsResponse] = await Promise.allSettled([
        client.get('themes'),
        client.get('plugins'),
      ]);

      let activeTheme = site.activeTheme;
      let pluginCount = site.pluginCount || 0;

      if (themesResponse.status === 'fulfilled') {
        const themes = themesResponse.value.data;
        const active = themes.find((theme: any) => theme.status === 'active');
        if (active) {
          activeTheme = active.name.rendered || active.name;
        }
      }

      if (pluginsResponse.status === 'fulfilled') {
        pluginCount = pluginsResponse.value.data.length;
      }

      return {
        isOnline: true,
        wpVersion: response.headers['x-wp-version'] || site.wpVersion,
        activeTheme,
        pluginCount,
        responseTime,
      };

    } catch (error) {
      console.error('Site status check failed:', error);
      return {
        isOnline: false,
        responseTime: 0,
      };
    }
  }

  async executeAction(
    site: WordPressSite & { decryptedPassword: string },
    action: WordPressAction
  ): Promise<any> {
    const client = this.createClient(site);

    switch (action.type) {
      case 'theme_change':
        return await this.changeTheme(client, action.params);
      
      case 'theme_customize':
        return await this.customizeTheme(client, action.params);
      
      case 'plugin_install':
        return await this.installPlugin(client, action.params);
      
      case 'plugin_activate':
        return await this.activatePlugin(client, action.params);
      
      case 'content_update':
        return await this.updateContent(client, action.params);
      
      case 'settings_update':
        return await this.updateSettings(client, action.params);
      
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  private async changeTheme(client: AxiosInstance, params: any): Promise<any> {
    // Note: Theme switching via REST API requires additional plugins or custom endpoints
    // This is a limitation of the standard WordPress REST API
    throw new Error('Theme switching requires WordPress admin access or custom plugins');
  }

  private async customizeTheme(client: AxiosInstance, params: any): Promise<any> {
    try {
      // Use WordPress Customizer API if available
      const response = await client.post('customize', {
        settings: params.settings,
      });
      return response.data;
    } catch (error) {
      // Fallback to theme mod updates
      const promises = Object.entries(params.settings || {}).map(([key, value]) =>
        client.post('theme-mods', { [key]: value })
      );
      
      const results = await Promise.allSettled(promises);
      return { updated: results.filter(r => r.status === 'fulfilled').length };
    }
  }

  private async installPlugin(client: AxiosInstance, params: any): Promise<any> {
    try {
      // Plugin installation via REST API requires elevated permissions
      // This typically needs to be done through wp-admin or custom endpoints
      const response = await client.post('plugins', {
        slug: params.slug,
        status: 'active',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Plugin installation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async activatePlugin(client: AxiosInstance, params: any): Promise<any> {
    try {
      const response = await client.post(`plugins/${params.plugin}`, {
        status: 'active',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Plugin activation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async updateContent(client: AxiosInstance, params: any): Promise<any> {
    try {
      const { type, id, data } = params;
      
      if (id) {
        // Update existing content
        const response = await client.post(`${type}/${id}`, data);
        return response.data;
      } else {
        // Create new content
        const response = await client.post(type, data);
        return response.data;
      }
    } catch (error) {
      throw new Error(`Content update failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async updateSettings(client: AxiosInstance, params: any): Promise<any> {
    try {
      const response = await client.post('settings', params.settings);
      return response.data;
    } catch (error) {
      throw new Error(`Settings update failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Helper methods for specific WordPress operations
  async getPosts(site: WordPressSite & { decryptedPassword: string }, limit: number = 10): Promise<any[]> {
    const client = this.createClient(site);
    const response = await client.get(`posts?per_page=${limit}`);
    return response.data;
  }

  async getPlugins(site: WordPressSite & { decryptedPassword: string }): Promise<any[]> {
    const client = this.createClient(site);
    const response = await client.get('plugins');
    return response.data;
  }

  async getThemes(site: WordPressSite & { decryptedPassword: string }): Promise<any[]> {
    const client = this.createClient(site);
    const response = await client.get('themes');
    return response.data;
  }
}
