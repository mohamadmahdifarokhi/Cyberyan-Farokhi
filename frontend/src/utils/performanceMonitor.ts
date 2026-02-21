import { logger } from './logger';

interface PerformanceMetrics {
  componentRenderTime?: number;
  apiCallDuration?: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
}
interface TimerEntry {
  startTime: number;
  label: string;
}

class PerformanceMonitor {
  private timers: Map<string, TimerEntry> = new Map();

  private enabled: boolean = true;

  constructor() {
    if (typeof process !== 'undefined' && process.env) {
      this.enabled = process.env.LOG_PERFORMANCE !== 'false';
    }
  }

  startTimer(label: string): void {
    if (!this.enabled) return;
    const startTime = this.getTime();

    this.timers.set(label, { startTime, label });
  }

  endTimer(label: string): number {
    if (!this.enabled) return 0;
    const timer = this.timers.get(label);

    if (!timer) {
      logger.warn(`[Performance] Timer "${label}" not found`);

      return 0;
    }
    const endTime = this.getTime();
    const duration = endTime - timer.startTime;

    this.timers.delete(label);

    return duration;
  }

  private getTime(): number {
    try {
      if (typeof performance !== 'undefined' && performance.now) {
        return performance.now();
      }
    } catch {}

    return Date.now();
  }

  private getMemoryUsage(): { used: number; total: number } | null {
    try {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;

        return {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        };
      }
    } catch {}

    return null;
  }

  logMetrics(metrics: PerformanceMetrics): void {
    if (!this.enabled) return;
    const memoryUsage = this.getMemoryUsage();
    const fullMetrics = {
      ...metrics,
      memoryUsage: metrics.memoryUsage || memoryUsage,
    };

    logger.info('[Performance] Metrics', fullMetrics);
  }

  logSlowRender(componentName: string, renderTime: number): void {
    if (!this.enabled) return;
    const threshold = 100;

    if (renderTime > threshold) {
      logger.warn(`[Performance] Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`, {
        componentName,
        renderTime: `${renderTime.toFixed(2)}ms`,
      });
    }
  }

  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.enabled) {
      renderFn();

      return;
    }
    const startTime = this.getTime();

    renderFn();
    const endTime = this.getTime();
    const duration = endTime - startTime;

    this.logSlowRender(componentName, duration);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default PerformanceMonitor;
