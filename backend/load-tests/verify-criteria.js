#!/usr/bin/env node

/**
 * Load Test Success Criteria Verification
 * Validates that all success criteria from Requirements 6.3 are met
 */

const fs = require('fs');
const path = require('path');
const { analyzeReport, SUCCESS_CRITERIA } = require('./analyze-results');

console.log('='.repeat(70));
console.log('LOAD TEST SUCCESS CRITERIA VERIFICATION');
console.log('='.repeat(70));
console.log('\nRequirement 6.3 Success Criteria:');
console.log('  1. 95th percentile response time < 500ms');
console.log('  2. Error rate < 1%');
console.log('  3. No memory leaks');
console.log('  4. RabbitMQ queue depth manageable');
console.log('');

// Find all JSON reports in reports directory
const reportsDir = path.join(__dirname, 'reports');

if (!fs.existsSync(reportsDir)) {
  console.error('❌ Reports directory not found. Please run load tests first.');
  console.log('\nRun: ./run-all-tests.sh');
  process.exit(1);
}

const reportFiles = fs.readdirSync(reportsDir)
  .filter(file => file.endsWith('.json'))
  .map(file => path.join(reportsDir, file));

if (reportFiles.length === 0) {
  console.error('❌ No report files found. Please run load tests first.');
  console.log('\nRun: ./run-all-tests.sh');
  process.exit(1);
}

console.log(`Found ${reportFiles.length} report file(s) to analyze\n`);

// Analyze each report
const results = [];
let allCriteriaMet = true;

reportFiles.forEach(reportPath => {
  try {
    const result = analyzeReport(reportPath);
    results.push({
      file: path.basename(reportPath),
      ...result
    });
    
    if (!result.passed) {
      allCriteriaMet = false;
    }
  } catch (error) {
    console.error(`\n❌ Error analyzing ${path.basename(reportPath)}:`, error.message);
    allCriteriaMet = false;
  }
});

// Verify memory leaks (Criterion 3)
console.log('\n' + '='.repeat(70));
console.log('CRITERION 3: Memory Leak Verification');
console.log('='.repeat(70));
console.log('\n⚠️  Manual verification required:');
console.log('  1. Check Docker stats during test: docker stats backend');
console.log('  2. Memory should stabilize, not continuously grow');
console.log('  3. After test, memory should return to baseline');
console.log('\nTo verify:');
console.log('  - Run: docker stats backend --no-stream');
console.log('  - Check memory usage is reasonable (<500MB)');
console.log('  - Restart backend and verify memory resets');

const memoryLeakCheck = '⚠️  MANUAL CHECK REQUIRED';

// Verify RabbitMQ queue depth (Criterion 4)
console.log('\n' + '='.repeat(70));
console.log('CRITERION 4: RabbitMQ Queue Depth Verification');
console.log('='.repeat(70));
console.log('\n⚠️  Manual verification required:');
console.log('  1. Open RabbitMQ Management UI: http://localhost:15672');
console.log('  2. Login with guest/guest');
console.log('  3. Check Queues tab during/after test');
console.log('  4. Queue depth should not grow unbounded');
console.log('  5. Messages should be processed in reasonable time');
console.log('\nAcceptable queue depth:');
console.log('  - During test: <1000 messages');
console.log('  - After test: Should drain to 0');
console.log('  - Consumer lag: <5 seconds');

const queueDepthCheck = '⚠️  MANUAL CHECK REQUIRED';

// Final summary
console.log('\n' + '='.repeat(70));
console.log('FINAL VERIFICATION SUMMARY');
console.log('='.repeat(70));

console.log('\n✅ Automated Checks:');
results.forEach(result => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} - ${result.file}`);
});

console.log('\n⚠️  Manual Checks:');
console.log(`  ${memoryLeakCheck} - Memory leak verification`);
console.log(`  ${queueDepthCheck} - RabbitMQ queue depth verification`);

console.log('\n' + '='.repeat(70));

if (allCriteriaMet) {
  console.log('✅ ALL AUTOMATED CRITERIA PASSED');
  console.log('\n⚠️  Please complete manual verifications:');
  console.log('  1. Verify no memory leaks (see above)');
  console.log('  2. Verify RabbitMQ queue depth manageable (see above)');
  console.log('\nOnce manual checks pass, all success criteria are met! ✅');
  process.exit(0);
} else {
  console.log('❌ SOME AUTOMATED CRITERIA FAILED');
  console.log('\nPlease review the failures above and:');
  console.log('  1. Optimize the system');
  console.log('  2. Re-run load tests');
  console.log('  3. Verify criteria again');
  process.exit(1);
}
