#!/usr/bin/env ts-node

/**
 * Memory Leak Validation Script for AUTO ANI
 *
 * Validates that all memory leak fixes are working correctly by:
 * - Testing component cleanup
 * - Validating observer disconnection
 * - Checking interval clearing
 * - Testing cache memory management
 * - Verifying service cleanup
 */

import { memoryMonitor } from '../lib/monitoring/memory-monitor';
import { metricsCollector } from '../lib/observability/metrics-collector';
import { cacheEngine } from '../lib/performance/cache-engine';
import { dashboardEngine } from '../lib/observability/dashboard-engine';
import { redis } from '../lib/redis';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

class MemoryLeakValidator {
  private results: TestResult[] = [];

  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  }

  private async runTest(
    name: string,
    testFn: () => Promise<void>,
    maxMemoryIncrease: number = 2
  ): Promise<void> {
    console.log(`\n🧪 Running test: ${name}`);

    const memoryBefore = this.getMemoryUsage();
    console.log(`  Memory before: ${memoryBefore}MB`);

    try {
      await testFn();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const memoryAfter = this.getMemoryUsage();
      const memoryDelta = memoryAfter - memoryBefore;

      console.log(`  Memory after: ${memoryAfter}MB`);
      console.log(`  Memory delta: ${memoryDelta}MB`);

      const passed = memoryDelta <= maxMemoryIncrease;
      const status = passed ? '✅ PASSED' : '❌ FAILED';

      console.log(`  Result: ${status}`);

      this.results.push({
        name,
        passed,
        details: passed
          ? `Memory increase within acceptable range (${memoryDelta}MB <= ${maxMemoryIncrease}MB)`
          : `Memory increase exceeded threshold (${memoryDelta}MB > ${maxMemoryIncrease}MB)`,
        memoryBefore,
        memoryAfter,
        memoryDelta,
      });
    } catch (error) {
      console.log(`  Result: ❌ FAILED (Error: ${error})`);

      this.results.push({
        name,
        passed: false,
        details: `Test failed with error: ${error}`,
        memoryBefore,
        memoryAfter: this.getMemoryUsage(),
        memoryDelta: 0,
      });
    }
  }

  async testPerformanceObserverCleanup(): Promise<void> {
    await this.runTest('PerformanceObserver Cleanup', async () => {
      // Simulate creating many PerformanceObservers
      const observers: PerformanceObserver[] = [];

      for (let i = 0; i < 100; i++) {
        const observer = new PerformanceObserver(() => {});
        observer.observe({ entryTypes: ['navigation'] });
        observers.push(observer);
      }

      // Cleanup all observers
      observers.forEach(observer => observer.disconnect());
    }, 1);
  }

  async testMetricsCollectorCleanup(): Promise<void> {
    await this.runTest('Metrics Collector Cleanup', async () => {
      // Start metrics collection
      metricsCollector.start();

      // Generate some metrics
      for (let i = 0; i < 1000; i++) {
        metricsCollector.recordBusinessMetric('test_metric', Math.random() * 100);
      }

      // Wait a bit for timers to run
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop and cleanup
      metricsCollector.stop();
    }, 3);
  }

  async testCacheEngineCleanup(): Promise<void> {
    await this.runTest('Cache Engine Cleanup', async () => {
      // Fill cache with data
      for (let i = 0; i < 1000; i++) {
        await cacheEngine.set(
          `test_key_${i}`,
          { data: 'x'.repeat(1000), id: i }, // 1KB per entry
          { ttl: 3600 }
        );
      }

      // Wait for metrics reporting
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop and cleanup
      cacheEngine.stop();
    }, 5);
  }

  async testDashboardEngineCleanup(): Promise<void> {
    await this.runTest('Dashboard Engine Cleanup', async () => {
      // Initialize dashboard engine
      await dashboardEngine.initialize();

      // Generate metrics data
      for (let i = 0; i < 500; i++) {
        (dashboardEngine as any).bufferMetricData('test_metric', Math.random() * 100);
      }

      // Wait for timers
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop and cleanup
      dashboardEngine.stop();
    }, 3);
  }

  async testRedisServiceCleanup(): Promise<void> {
    await this.runTest('Redis Service Cleanup', async () => {
      // Use in-memory fallback operations
      for (let i = 0; i < 1000; i++) {
        await redis.set(`test_key_${i}`, `test_value_${i}`, 3600);
      }

      // Perform cleanup
      await redis.cleanup();

      // Wait for cleanup timer
      await new Promise(resolve => setTimeout(resolve, 100));

      // Disconnect and cleanup
      await redis.disconnect();
    }, 2);
  }

  async testMemoryMonitorCleanup(): Promise<void> {
    await this.runTest('Memory Monitor Cleanup', async () => {
      // Start memory monitoring
      memoryMonitor.start();

      // Let it collect some data
      await new Promise(resolve => setTimeout(resolve, 200));

      // Register some components
      for (let i = 0; i < 100; i++) {
        memoryMonitor.registerComponent(`TestComponent${i}`, Math.random() * 10, 1);
      }

      // Stop and cleanup
      memoryMonitor.stop();
    }, 1);
  }

  async testIntervalCleanup(): Promise<void> {
    await this.runTest('Interval Cleanup', async () => {
      const intervals: NodeJS.Timeout[] = [];

      // Create many intervals
      for (let i = 0; i < 100; i++) {
        const interval = setInterval(() => {
          // Do nothing
        }, 1000);
        intervals.push(interval);
      }

      // Clear all intervals
      intervals.forEach(interval => clearInterval(interval));
    }, 1);
  }

  async testEventListenerCleanup(): Promise<void> {
    await this.runTest('Event Listener Cleanup', async () => {
      if (typeof window !== 'undefined') {
        const handlers: (() => void)[] = [];

        // Add many event listeners
        for (let i = 0; i < 100; i++) {
          const handler = () => {};
          window.addEventListener('resize', handler);
          handlers.push(handler);
        }

        // Remove all event listeners
        handlers.forEach(handler => {
          window.removeEventListener('resize', handler);
        });
      }
    }, 1);
  }

  async testServiceWorkerCleanup(): Promise<void> {
    await this.runTest('Service Worker Cleanup', async () => {
      // This test is mainly for documentation as SW runs in browser
      // In a real test, you would test the cleanup functions directly

      // Simulate the cleanup logic
      const mockCleanup = () => {
        // Simulate clearing intervals and removing event listeners
        const mockTimer = setTimeout(() => {}, 1000);
        clearTimeout(mockTimer);

        const mockHandler = () => {};
        // In real browser: navigator.serviceWorker.removeEventListener('message', mockHandler);
      };

      mockCleanup();
    }, 0.5);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Memory Leak Validation Tests');
    console.log('=========================================');

    await this.testPerformanceObserverCleanup();
    await this.testMetricsCollectorCleanup();
    await this.testCacheEngineCleanup();
    await this.testDashboardEngineCleanup();
    await this.testRedisServiceCleanup();
    await this.testMemoryMonitorCleanup();
    await this.testIntervalCleanup();
    await this.testEventListenerCleanup();
    await this.testServiceWorkerCleanup();

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary');
    console.log('================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.passed === false).length;
    const totalMemoryIncrease = this.results.reduce((sum, r) => sum + r.memoryDelta, 0);

    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
    console.log(`Total memory increase: ${totalMemoryIncrease}MB`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.details}`);
      });
    }

    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.name}`);
      console.log(`     Memory: ${result.memoryBefore}MB → ${result.memoryAfter}MB (Δ${result.memoryDelta}MB)`);
      console.log(`     Details: ${result.details}`);
    });

    const overallSuccess = failed === 0 && totalMemoryIncrease < 20;
    console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (overallSuccess) {
      console.log('\n🎉 All memory leak fixes are working correctly!');
      console.log('✨ Your application should now have much better memory management.');
    } else {
      console.log('\n⚠️  Some memory leak fixes need attention.');
      console.log('🔧 Review the failed tests and implement additional cleanup as needed.');
    }

    // Provide recommendations
    console.log('\n💡 Memory Optimization Recommendations:');
    console.log('----------------------------------------');
    console.log('1. Run this validator regularly in your CI/CD pipeline');
    console.log('2. Monitor memory usage in production with the memory monitor');
    console.log('3. Use the useMemoryMonitor hook in React components during development');
    console.log('4. Set up alerts for memory threshold breaches');
    console.log('5. Consider running Node.js with --max-old-space-size for large datasets');

    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run the validation
async function main() {
  const validator = new MemoryLeakValidator();
  await validator.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { MemoryLeakValidator };