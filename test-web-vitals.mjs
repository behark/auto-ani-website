#!/usr/bin/env node
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3002';
const OUTPUT_PATH = './lighthouse-report';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

async function runLighthouse(url, opts = {}, config = null) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });
  opts.port = chrome.port;

  try {
    // Run lighthouse tests for both mobile and desktop
    console.log('\n📱 Running Mobile Tests...\n');
    const mobileResults = await lighthouse(url, {
      ...opts,
      emulatedFormFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4
      }
    }, config);

    console.log('\n💻 Running Desktop Tests...\n');
    const desktopResults = await lighthouse(url, {
      ...opts,
      emulatedFormFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1
      }
    }, config);

    await chrome.kill();

    return { mobile: mobileResults, desktop: desktopResults };
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

function formatMetric(value, name) {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${value.toFixed(0)}ms`;
}

function getStatus(value, thresholds) {
  if (value <= thresholds.good) return '✅ GOOD';
  if (value <= thresholds.poor) return '⚠️  NEEDS IMPROVEMENT';
  return '❌ POOR';
}

// Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  TBT: { good: 200, poor: 600 }, // Total Blocking Time (similar to INP)
  TTI: { good: 3800, poor: 7300 }, // Time to Interactive
  SI: { good: 3400, poor: 5800 }, // Speed Index
  TTFB: { good: 800, poor: 1800 }
};

async function main() {
  try {
    console.log('🚀 Starting Web Vitals Performance Test');
    console.log('=====================================\n');
    console.log(`Testing URL: ${URL}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    const results = await runLighthouse(URL);

    // Process and display results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================\n');

    // Your baseline metrics for comparison
    const baseline = {
      mobile: {
        CLS: 0.972,
        TTFB_cached: 254,
        TTFB_cold: 19478,
        LCP_cached: 2736,
        FCP_cached: 2188
      },
      desktop: {
        CLS: 0.00015
      }
    };

    // Extract metrics for both mobile and desktop
    ['mobile', 'desktop'].forEach(device => {
      const lhr = results[device].lhr;
      const metrics = lhr.audits;

      console.log(`\n${device === 'mobile' ? '📱' : '💻'} ${device.toUpperCase()} RESULTS:`);
      console.log('─'.repeat(50));

      // Core Web Vitals
      const cls = parseFloat(metrics['cumulative-layout-shift'].numericValue);
      const lcp = metrics['largest-contentful-paint'].numericValue;
      const fcp = metrics['first-contentful-paint'].numericValue;
      const tbt = metrics['total-blocking-time'].numericValue;
      const tti = metrics['interactive'].numericValue;
      const si = metrics['speed-index'].numericValue;
      const ttfb = metrics['server-response-time']?.numericValue || 0;

      // Performance Score
      const perfScore = Math.round(lhr.categories.performance.score * 100);

      console.log(`\nPerformance Score: ${perfScore}/100 ${perfScore >= 90 ? '🎉' : perfScore >= 50 ? '⚠️' : '❌'}`);
      console.log('\nCore Web Vitals:');
      console.log('─'.repeat(30));

      // CLS with comparison
      const clsStatus = getStatus(cls, THRESHOLDS.CLS);
      console.log(`CLS: ${cls.toFixed(3)} ${clsStatus}`);
      if (device === 'mobile' && baseline.mobile.CLS) {
        const improvement = ((baseline.mobile.CLS - cls) / baseline.mobile.CLS * 100).toFixed(1);
        console.log(`  └─ Before: ${baseline.mobile.CLS} → After: ${cls.toFixed(3)} (${improvement}% improvement)`);
      }

      // LCP
      const lcpStatus = getStatus(lcp, THRESHOLDS.LCP);
      console.log(`\nLCP: ${formatMetric(lcp, 'LCP')} ${lcpStatus}`);
      if (device === 'mobile' && baseline.mobile.LCP_cached) {
        console.log(`  └─ Baseline (cached): ${baseline.mobile.LCP_cached}ms`);
      }

      // TBT (proxy for INP)
      const tbtStatus = getStatus(tbt, THRESHOLDS.TBT);
      console.log(`\nTBT (Total Blocking Time): ${formatMetric(tbt, 'TBT')} ${tbtStatus}`);

      console.log('\nOther Metrics:');
      console.log('─'.repeat(30));

      // FCP
      const fcpStatus = getStatus(fcp, THRESHOLDS.FCP);
      console.log(`FCP: ${formatMetric(fcp, 'FCP')} ${fcpStatus}`);
      if (device === 'mobile' && baseline.mobile.FCP_cached) {
        console.log(`  └─ Baseline (cached): ${baseline.mobile.FCP_cached}ms`);
      }

      // TTFB
      const ttfbStatus = getStatus(ttfb, THRESHOLDS.TTFB);
      console.log(`\nTTFB: ${formatMetric(ttfb, 'TTFB')} ${ttfbStatus}`);

      // TTI
      const ttiStatus = getStatus(tti, THRESHOLDS.TTI);
      console.log(`\nTTI (Time to Interactive): ${formatMetric(tti, 'TTI')} ${ttiStatus}`);

      // Speed Index
      const siStatus = getStatus(si, THRESHOLDS.SI);
      console.log(`\nSpeed Index: ${formatMetric(si, 'SI')} ${siStatus}`);

      // Save detailed report
      const reportPath = path.join(OUTPUT_PATH, `${device}-${timestamp}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(lhr, null, 2));

      // Save HTML report
      const htmlPath = path.join(OUTPUT_PATH, `${device}-${timestamp}.html`);
      fs.writeFileSync(htmlPath, results[device].report);

      console.log(`\n📁 Full report saved to: ${reportPath}`);
      console.log(`📄 HTML report saved to: ${htmlPath}`);
    });

    console.log('\n\n🎯 ISSUE RESOLUTION STATUS');
    console.log('============================\n');
    console.log('| Issue         | Before            | After          | Status                      |');
    console.log('|---------------|-------------------|----------------|------------------------------|');

    const mobileCLS = parseFloat(results.mobile.lhr.audits['cumulative-layout-shift'].numericValue);
    const desktopCLS = parseFloat(results.desktop.lhr.audits['cumulative-layout-shift'].numericValue);
    const mobileTTFB = results.mobile.lhr.audits['server-response-time']?.numericValue || 0;
    const mobileLCP = results.mobile.lhr.audits['largest-contentful-paint'].numericValue;
    const mobileFCP = results.mobile.lhr.audits['first-contentful-paint'].numericValue;

    // CLS Mobile
    const clsMobileFixed = mobileCLS < 0.1;
    console.log(`| CLS (Mobile)  | 0.972 (POOR) ❌   | ${mobileCLS.toFixed(3)} ${getStatus(mobileCLS, THRESHOLDS.CLS).padEnd(14)} | ${clsMobileFixed ? '✅ FIXED!' : '❌ Not fixed'} ${' '.repeat(19 - (clsMobileFixed ? 8 : 11))}|`);

    // CLS Desktop
    console.log(`| CLS (Desktop) | 0.00015 (GOOD) ✅ | ${desktopCLS.toFixed(5)} ${getStatus(desktopCLS, THRESHOLDS.CLS).padEnd(14)} | ✅ Still good ${' '.repeat(15)}|`);

    // TTFB
    const ttfbStatus = mobileTTFB <= THRESHOLDS.TTFB.good ? '✅ Good' : mobileTTFB <= THRESHOLDS.TTFB.poor ? '⚠️  Needs improvement' : '❌ Poor';
    console.log(`| TTFB          | 254ms/19,478ms    | ${formatMetric(mobileTTFB, 'TTFB').padEnd(15)} | ${ttfbStatus} ${' '.repeat(29 - ttfbStatus.length)}|`);

    // LCP
    const lcpStatus = mobileLCP <= THRESHOLDS.LCP.good ? '✅ Good' : mobileLCP <= THRESHOLDS.LCP.poor ? '⚠️  Needs improvement' : '❌ Poor';
    console.log(`| LCP (Mobile)  | 2,736ms ⚠️        | ${formatMetric(mobileLCP, 'LCP').padEnd(15)} | ${lcpStatus} ${' '.repeat(29 - lcpStatus.length)}|`);

    // FCP
    const fcpStatus = mobileFCP <= THRESHOLDS.FCP.good ? '✅ Good' : mobileFCP <= THRESHOLDS.FCP.poor ? '⚠️  Needs improvement' : '❌ Poor';
    console.log(`| FCP (Mobile)  | 2,188ms ⚠️        | ${formatMetric(mobileFCP, 'FCP').padEnd(15)} | ${fcpStatus} ${' '.repeat(29 - fcpStatus.length)}|`);

    console.log('\n');

    // Final summary
    if (mobileCLS < 0.1) {
      console.log('🎉 SUCCESS: The CLS issue on mobile has been fixed!');
      console.log(`   The aspect-ratio fix reduced CLS from 0.972 to ${mobileCLS.toFixed(3)}`);
      console.log(`   This is a ${((0.972 - mobileCLS) / 0.972 * 100).toFixed(1)}% improvement!`);
    } else {
      console.log('⚠️  The CLS issue on mobile still needs attention.');
      console.log(`   Current CLS: ${mobileCLS.toFixed(3)} (target: < 0.1)`);
    }

  } catch (error) {
    console.error('Error running Lighthouse:', error);
    process.exit(1);
  }
}

// Run the test
main();