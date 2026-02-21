export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}
const COLORS = {
  DEBUG: '\x1b[36m',
  INFO: '\x1b[32m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
  RESET: '\x1b[0m',
};

interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  silentMode: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      level: this.getDefaultLogLevel(),
      enableColors: this.supportsColor(),
      silentMode: this.getSilentMode(),
    };
  }

  private getDefaultLogLevel(): LogLevel {
    if (typeof process !== 'undefined' && process.env) {
      const envLevel = process.env.LOG_LEVEL?.toUpperCase();

      if (envLevel && envLevel in LogLevel) {
        return LogLevel[envLevel as keyof typeof LogLevel];
      }
      if (process.env.ENABLE_DEBUG_LOGS === 'true') {
        return LogLevel.DEBUG;
      }
    }

    return LogLevel.INFO;
  }

  private getSilentMode(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.SILENT_MODE === 'true';
    }

    return false;
  }

  private supportsColor(): boolean {
    if (typeof process !== 'undefined' && process.stdout) {
      return process.stdout.isTTY || false;
    }

    return false;
  }

  private getTimestamp(): string {
    try {
      return new Date().toISOString();
    } catch {
      return new Date(Date.now()).toISOString();
    }
  }

  private formatMessage(
    level: keyof typeof LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): string {
    const timestamp = this.getTimestamp();
    const levelStr = level.toUpperCase();
    const colorCode = this.config.enableColors ? COLORS[level] : '';
    const resetCode = this.config.enableColors ? COLORS.RESET : '';
    let formatted = `[${timestamp}] ${colorCode}[${levelStr}]${resetCode} ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    if (error) {
      formatted += `\n${error.stack || error.message}`;
    }

    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.silentMode) {
      return level === LogLevel.ERROR;
    }

    return level >= this.config.level;
  }

  private output(level: keyof typeof LogLevel, formatted: string): void {
    try {
      switch (level) {
        case 'ERROR':
          console.error(formatted);
          break;
        case 'WARN':
          console.warn(formatted);
          break;
        case 'DEBUG':
        case 'INFO':
        default:
          console.log(formatted);
          break;
      }
    } catch {
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(formatted + '\n');
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage('DEBUG', message, context);

      this.output('DEBUG', formatted);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage('INFO', message, context);

      this.output('INFO', formatted);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage('WARN', message, context);

      this.output('WARN', formatted);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage('ERROR', message, context, error);

      this.output('ERROR', formatted);
    }
  }

  setLevel(level: keyof typeof LogLevel): void {
    if (level in LogLevel) {
      this.config.level = LogLevel[level];
    } else {
      this.config.level = LogLevel.INFO;
    }
  }

  getLevel(): keyof typeof LogLevel {
    return LogLevel[this.config.level] as keyof typeof LogLevel;
  }

  setColorEnabled(enabled: boolean): void {
    this.config.enableColors = enabled;
  }

  setSilentMode(enabled: boolean): void {
    this.config.silentMode = enabled;
  }

  reloadConfig(): void {
    this.config.level = this.getDefaultLogLevel();
    this.config.silentMode = this.getSilentMode();
  }
}

export const logger = new Logger();
export default Logger;
