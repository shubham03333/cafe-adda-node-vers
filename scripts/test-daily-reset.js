// Test script for daily sales reset functionality

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Import the database connection test
async function getTestConnection() {
  const { testMySQLConnection } = await import('./test-mysql-connection.js');
  return testMySQLConnection;
}

// Import the reset function
async function getResetFunction() {
  const { resetDailySales } = await import('./daily-sales-reset.js');
  return resetDailySales;
}

async function testDailyReset() {
  console.log('🧪 Testing Daily Sales Reset Functionality...');
  
  const testConnection = await getTestConnection();
  const resetDailySales = await getResetFunction();
  
  // First test the connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Database connection failed');
    return;
  }

  try {
    console.log('🔧 Testing timezone utilities...');
    const { getTodayISTDateString, getYesterdayISTDateString, formatISTDateTime } = await import('../src/lib/timezone.ts');
    
    const today = getTodayISTDateString();
    const yesterday = getYesterdayISTDateString();
    const currentTime = formatISTDateTime(new Date());
    
    console.log(`📅 Today (IST): ${today}`);
    console.log(`📅 Yesterday (IST): ${yesterday}`);
    console.log(`⏰ Current time (IST): ${currentTime}`);
    
    // Test the reset function
    console.log('\n🔧 Testing reset function...');
    await resetDailySales();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('💡 To schedule this to run daily at 12 AM IST:');
    console.log('   - On Linux: Add to crontab: 0 0 * * * cd /path/to/project && node scripts/daily-sales-reset.js');
    console.log('   - On Windows: Use Task Scheduler');
    console.log('   - On Vercel: Use Vercel Cron Jobs or external scheduler');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testDailyReset().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testDailyReset };
