import { WebSocket } from 'ws';
import { storage } from '../storage';
import { GeminiService } from './gemini';

export interface ConsoleError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: Date;
  url?: string;
  stack?: string;
  level: 'error' | 'warn' | 'info';
}

export class ConsoleMonitor {
  private errors: ConsoleError[] = [];
  private maxErrors = 50; // Keep last 50 errors
  private analysisCache = new Map<string, string>();

  addError(error: ConsoleError) {
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  getRecentErrors(count: number = 10): ConsoleError[] {
    return this.errors.slice(0, count);
  }

  async analyzeErrors(userId: string, count: number = 5): Promise<string> {
    const recentErrors = this.getRecentErrors(count);
    
    if (recentErrors.length === 0) {
      return "No recent console errors detected. Your application is running smoothly!";
    }

    // Create cache key from error messages
    const cacheKey = recentErrors.map(e => e.message).join('|');
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      const geminiService = await GeminiService.createFromUserKey(userId, storage);
      const errorMessages = recentErrors.map(error => 
        `${error.level.toUpperCase()}: ${error.message}${error.source ? ` (${error.source}:${error.line}:${error.column})` : ''}${error.stack ? `\nStack: ${error.stack}` : ''}`
      );

      const analysis = await geminiService.analyzeConsoleErrors(errorMessages);
      
      // Cache the analysis for 5 minutes
      this.analysisCache.set(cacheKey, analysis);
      setTimeout(() => this.analysisCache.delete(cacheKey), 5 * 60 * 1000);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing console errors:', error);
      return "Unable to analyze console errors at the moment. Please check your AI service configuration.";
    }
  }

  clearErrors() {
    this.errors = [];
    this.analysisCache.clear();
  }

  getErrorsSummary(): { total: number; byLevel: Record<string, number>; recent: number } {
    const byLevel = this.errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = this.errors.filter(error => 
      Date.now() - error.timestamp.getTime() < 10 * 60 * 1000 // Last 10 minutes
    ).length;

    return {
      total: this.errors.length,
      byLevel,
      recent
    };
  }
}

// Global console monitor instance
export const consoleMonitor = new ConsoleMonitor();