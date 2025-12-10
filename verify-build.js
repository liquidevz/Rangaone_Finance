const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '.next', 'server', 'app');

const criticalPages = [
  'page.html',
  'login/page.html',
  'dashboard.html'
];

console.log('🔍 Verifying build optimization...\n');

let allPassed = true;

criticalPages.forEach(page => {
  const pagePath = path.join(buildDir, page);
  const exists = fs.existsSync(pagePath);
  
  if (exists) {
    const stats = fs.statSync(pagePath);
    console.log(`✅ ${page} - Pre-rendered (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${page} - Not pre-rendered`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ All critical pages are optimized!');
  console.log('\nNext steps:');
  console.log('1. Deploy to VPS: npm start');
  console.log('2. Monitor performance metrics');
  console.log('3. Check cache headers in production');
} else {
  console.log('⚠️  Some pages are not optimized');
  console.log('\nTroubleshooting:');
  console.log('1. Check for dynamic data in page components');
  console.log('2. Review build logs for errors');
  console.log('3. Ensure export const dynamic = "force-static" is set');
}

console.log('='.repeat(50) + '\n');
