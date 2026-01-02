interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

class WebVitalsMonitor {
  private metrics: Map<string, number> = new Map();
  private readonly thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  reportMetric(metric: Metric): void {
    this.metrics.set(metric.name, metric.value);

    if (process.env.NODE_ENV === 'development') {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: Metric): void {
    // Log to console in production for monitoring
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  // Monitor long tasks (> 50ms)
  observeLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // Monitor memory usage
  observeMemory(): void {
    if (typeof window === 'undefined') return;

    const performance = window.performance as any;
    if (performance.memory) {
      setInterval(() => {
        const used = performance.memory.usedJSHeapSize / 1048576;
        const total = performance.memory.totalJSHeapSize / 1048576;
        const limit = performance.memory.jsHeapSizeLimit / 1048576;

        if (used / limit > 0.9) {
          console.warn(`⚠️ High memory usage: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB`);
        }
      }, 30000); // Check every 30s
    }
  }
}

export const webVitalsMonitor = new WebVitalsMonitor();

// Initialize monitoring
if (typeof window !== 'undefined') {
  webVitalsMonitor.observeLongTasks();
  webVitalsMonitor.observeMemory();
}

export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    webVitalsMonitor.reportMetric({
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'good',
      delta: metric.delta || 0,
      id: metric.id,
    });
  }
}
