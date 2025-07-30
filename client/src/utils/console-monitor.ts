interface ConsoleError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: number;
  url?: string;
  stack?: string;
  level: 'error' | 'warn' | 'info';
}

class ClientConsoleMonitor {
  private errors: ConsoleError[] = [];
  private originalConsole: any = {};
  private isEnabled = false;
  private sendBuffer: ConsoleError[] = [];
  private sendTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      log: console.log.bind(console),
    };
  }

  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    
    // Override console methods
    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.captureError('error', args);
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.captureError('warn', args);
    };

    // Capture uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError('error', [event.message], {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError('error', [`Unhandled Promise Rejection: ${event.reason}`], {
        stack: event.reason?.stack,
      });
    });
  }

  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    
    // Restore original console methods
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
  }

  private captureError(level: 'error' | 'warn' | 'info', args: any[], details: Partial<ConsoleError> = {}) {
    const error: ConsoleError = {
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      level,
      timestamp: Date.now(),
      url: window.location.href,
      ...details,
    };

    this.errors.unshift(error);
    this.sendBuffer.push(error);
    
    // Limit stored errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(0, 100);
    }

    // Debounced sending to server
    this.debouncedSend();
  }

  private debouncedSend() {
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
    }

    this.sendTimeout = setTimeout(() => {
      this.sendErrorsToServer();
    }, 2000); // Send after 2 seconds of inactivity
  }

  private async sendErrorsToServer() {
    if (this.sendBuffer.length === 0) return;

    try {
      const response = await fetch('/api/console/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: this.sendBuffer,
        }),
      });

      if (response.ok) {
        this.sendBuffer = [];
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
      console.debug('Failed to send console errors to server:', error);
    }
  }

  getRecentErrors(count: number = 10): ConsoleError[] {
    return this.errors.slice(0, count);
  }

  clearErrors() {
    this.errors = [];
    this.sendBuffer = [];
  }

  async getAnalysis(): Promise<string> {
    try {
      const response = await fetch('/api/console/analysis', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      return 'Unable to analyze console errors at this time.';
    }
  }
}

// Global instance
export const consoleMonitor = new ClientConsoleMonitor();

// Auto-enable in development
if (import.meta.env.DEV) {
  consoleMonitor.enable();
}