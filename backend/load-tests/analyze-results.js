#!/usr/bin/env node

/**
 * Load Test Results Analyzer
 * Analyzes Artillery JSON output and validates against success criteria
 */

const fs = require('fs');
const path = require('path');

// Success criteria from Requirements 6.3
const SUCCESS_CRITERIA = {
  p95ResponseTime: 500, // ms
  errorRate: 1, // percentage
  minSuccessRate: 99 // percentage
};

function analyzeReport(reportPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analyzing: ${path.basename(reportPath)}`);
  console.log('='.repeat(60));

  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const aggregate = data.aggregate;

  // Extract metrics
  const metrics = {
    requestsCompleted: aggregate.counters['http.requests'] || 0,
    requestsFailed: aggregate.counters['http.request_errors'] || 0,
    scenariosCompleted: aggregate.counters['vusers.completed'] || 0,
    scenariosFailed: aggregate.counters['vusers.failed'] || 0,
    
    // Response times (in milliseconds)
    responseTimeMin: aggregate.summaries['http.response_time']?.min || 0,
    responseTimeMax: aggregate.summaries['http.response_time']?.max || 0,
    responseTimeMedian: aggregate.summaries['http.response_time']?.median || 0,
    responseTimeP95: aggregate.summaries['http.response_time']?.p95 || 0,
    responseTimeP99: aggregate.summaries['http.response_time']?.p99 || 0,
    
    // HTTP status codes
    statusCodes: aggregate.counters
  };

  // Calculate derived metrics
  const totalRequests = metrics.requestsCompleted + metrics.requestsFailed;
  const errorRate = totalRequests > 0 
    ? (metrics.requestsFailed / totalRequests) * 100 
    : 0;
  
  const totalScenarios = metrics.scenariosCompleted + metrics.scenariosFailed;
  const successRate = totalScenarios > 0
    ? (metrics.scenariosCompleted / totalScenarios) * 100
    : 0;

  // Display results
  console.log('\n📊 Request Metrics:');
  console.log(`  Total Requests:     ${totalRequests.toLocaleString()}`);
  console.log(`  Completed:          ${metrics.requestsCompleted.toLocaleString()}`);
  console.log(`  Failed:             ${metrics.requestsFailed.toLocaleString()}`);
  console.log(`  Error Rate:         ${errorRate.toFixed(2)}%`);

  console.log('\n⏱️  Response Times (ms):');
  console.log(`  Min:                ${metrics.responseTimeMin.toFixed(2)}`);
  console.log(`  Median:             ${metrics.responseTimeMedian.toFixed(2)}`);
  console.log(`  Max:                ${metrics.responseTimeMax.toFixed(2)}`);
  console.log(`  95th Percentile:    ${metrics.responseTimeP95.toFixed(2)}`);
  console.log(`  99th Percentile:    ${metrics.responseTimeP99.toFixed(2)}`);

  console.log('\n🎯 Scenario Metrics:');
  console.log(`  Total Scenarios:    ${totalScenarios.toLocaleString()}`);
  console.log(`  Completed:          ${metrics.scenariosCompleted.toLocaleString()}`);
  console.log(`  Failed:             ${metrics.scenariosFailed.toLocaleString()}`);
  console.log(`  Success Rate:       ${successRate.toFixed(2)}%`);

  // HTTP Status Codes
  console.log('\n📈 HTTP Status Codes:');
  Object.keys(metrics.statusCodes)
    .filter(key => key.startsWith('http.codes.'))
    .sort()
    .forEach(key => {
      const code = key.replace('http.codes.', '');
      const count = metrics.statusCodes[key];
      console.log(`  ${code}:                ${count.toLocaleString()}`);
    });

  // Validate against success criteria
  console.log('\n✅ Success Criteria Validation:');
  
  const p95Pass = metrics.responseTimeP95 < SUCCESS_CRITERIA.p95ResponseTime;
  console.log(`  P95 Response Time:  ${p95Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Expected: < ${SUCCESS_CRITERIA.p95ResponseTime}ms`);
  console.log(`    Actual:   ${metrics.responseTimeP95.toFixed(2)}ms`);

  const errorRatePass = errorRate < SUCCESS_CRITERIA.errorRate;
  console.log(`  Error Rate:         ${errorRatePass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Expected: < ${SUCCESS_CRITERIA.errorRate}%`);
  console.log(`    Actual:   ${errorRate.toFixed(2)}%`);

  const successRatePass = successRate >= SUCCESS_CRITERIA.minSuccessRate;
  console.log(`  Success Rate:       ${successRatePass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Expected: >= ${SUCCESS_CRITERIA.minSuccessRate}%`);
  console.log(`    Actual:   ${successRate.toFixed(2)}%`);

  const allPass = p95Pass && errorRatePass && successRatePass;
  console.log(`\n${allPass ? '✅ ALL CRITERIA PASSED' : '❌ SOME CRITERIA FAILED'}`);

  return {
    passed: allPass,
    metrics: {
      ...metrics,
      errorRate,
      successRate
    }
  };
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node analyze-results.js <report.json> [report2.json ...]');
    console.log('\nOr analyze all reports in reports directory:');
    console.log('  node analyze-results.js reports/*.json');
    process.exit(1);
  }

  let allPassed = true;
  const results = [];

  args.forEach(reportPath => {
    if (!fs.existsSync(reportPath)) {
      console.error(`\n❌ File not found: ${reportPath}`);
      return;
    }

    try {
      const result = analyzeReport(reportPath);
      results.push({
        file: reportPath,
        ...result
      });
      
      if (!result.passed) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`\n❌ Error analyzing ${reportPath}:`, error.message);
      allPassed = false;
    }
  });

  // Summary
  if (results.length > 1) {
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Reports: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.passed).length}`);
    console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  }

  process.exit(allPassed ? 0 : 1);
}

module.exports = { analyzeReport, SUCCESS_CRITERIA };
