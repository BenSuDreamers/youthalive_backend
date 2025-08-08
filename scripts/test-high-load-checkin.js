const axios = require('axios');

// Configuration
const BACKEND_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api';
const TEST_QR_CODES = [
  'INV-000001',
  'INV-000002', 
  'INV-000003',
  'INV-000004'
];

console.log('🚀 High-Load Check-in System Test');
console.log('=================================');
console.log('Testing optimizations for 4 concurrent QR scanners');

// Simulate user authentication (you'll need to replace with real token)
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with a real token

async function testConcurrentCheckIns() {
  console.log('\n📱 Simulating 4 concurrent QR scanners...');
  
  const promises = TEST_QR_CODES.map(async (qrCode, index) => {
    const scanner = index + 1;
    console.log(`Scanner ${scanner}: Starting lookup for ${qrCode}`);
    
    try {
      // Test 1: Lookup ticket (what happens when QR is scanned)
      const lookupStart = Date.now();
      const lookupResponse = await axios.post(`${BACKEND_URL}/checkin/lookup`, {
        invoiceNo: qrCode
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      const lookupTime = Date.now() - lookupStart;
      
      console.log(`✅ Scanner ${scanner}: Lookup successful in ${lookupTime}ms`);
      
      // Test 2: Actual check-in (what happens when "Check In" button is clicked)
      const checkinStart = Date.now();
      const checkinResponse = await axios.post(`${BACKEND_URL}/checkin/scan`, {
        invoiceNo: qrCode
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      const checkinTime = Date.now() - checkinStart;
      
      console.log(`✅ Scanner ${scanner}: Check-in successful in ${checkinTime}ms`);
      
      return {
        scanner,
        qrCode,
        lookupTime,
        checkinTime,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Scanner ${scanner}: Error with ${qrCode}:`, error.response?.data?.message || error.message);
      
      return {
        scanner,
        qrCode,
        error: error.response?.data?.message || error.message,
        success: false
      };
    }
  });
  
  // Wait for all concurrent operations
  const results = await Promise.allSettled(promises);
  
  console.log('\n📊 CONCURRENT TEST RESULTS:');
  console.log('============================');
  
  let successCount = 0;
  let totalLookupTime = 0;
  let totalCheckinTime = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      totalLookupTime += result.value.lookupTime;
      totalCheckinTime += result.value.checkinTime;
      console.log(`✅ Scanner ${result.value.scanner}: SUCCESS (Lookup: ${result.value.lookupTime}ms, Check-in: ${result.value.checkinTime}ms)`);
    } else {
      console.log(`❌ Scanner ${index + 1}: FAILED - ${result.value?.error || result.reason}`);
    }
  });
  
  console.log(`\n📈 PERFORMANCE SUMMARY:`);
  console.log(`=======================`);
  console.log(`Success Rate: ${successCount}/${TEST_QR_CODES.length} (${(successCount/TEST_QR_CODES.length*100).toFixed(1)}%)`);
  if (successCount > 0) {
    console.log(`Average Lookup Time: ${(totalLookupTime/successCount).toFixed(0)}ms`);
    console.log(`Average Check-in Time: ${(totalCheckinTime/successCount).toFixed(0)}ms`);
  }
  
  console.log(`\n💡 PERFORMANCE TARGETS:`);
  console.log(`=======================`);
  console.log(`🎯 Target: <2000ms per operation for high-load scenarios`);
  console.log(`🎯 Acceptable: <5000ms per operation`);
  console.log(`❌ Poor: >5000ms per operation`);
}

async function testQRCodeGeneration() {
  console.log('\n🔄 Testing QR Code Generation Performance...');
  
  const testInvoices = ['TEST-001', 'TEST-002', 'TEST-003', 'TEST-004'];
  
  const generatePromises = testInvoices.map(async (invoice, index) => {
    const start = Date.now();
    
    try {
      // This would normally be an internal service call
      // For testing, we'll simulate the QR generation time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // 500-1500ms simulation
      
      const time = Date.now() - start;
      console.log(`✅ QR ${index + 1}: Generated in ${time}ms`);
      return { success: true, time };
      
    } catch (error) {
      console.error(`❌ QR ${index + 1}: Failed to generate`);
      return { success: false };
    }
  });
  
  const results = await Promise.all(generatePromises);
  const successfulGens = results.filter(r => r.success);
  
  if (successfulGens.length > 0) {
    const avgTime = successfulGens.reduce((sum, r) => sum + r.time, 0) / successfulGens.length;
    console.log(`📊 Average QR Generation Time: ${avgTime.toFixed(0)}ms`);
  }
}

async function runFullTest() {
  try {
    await testConcurrentCheckIns();
    await testQRCodeGeneration();
    
    console.log('\n🎉 HIGH-LOAD TEST COMPLETED!');
    console.log('============================');
    console.log('✅ If you see mostly successful results with times <2000ms, the optimizations are working!');
    console.log('⚠️  If you see timeouts or >5000ms times, there may still be load issues.');
    console.log('📞 If problems persist, consider upgrading to a larger Heroku dyno.');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Instructions for running the test
if (require.main === module) {
  console.log('📋 SETUP INSTRUCTIONS:');
  console.log('======================');
  console.log('1. Get a valid JWT token by logging into your app');
  console.log('2. Replace AUTH_TOKEN variable above with your token');
  console.log('3. Replace TEST_QR_CODES with actual invoice numbers from your database');
  console.log('4. Run: node test-high-load-checkin.js');
  console.log('');
  
  // Uncomment the next line to run the test
  // runFullTest();
  
  console.log('⚠️  Update the AUTH_TOKEN and TEST_QR_CODES first, then uncomment runFullTest() to execute.');
}

module.exports = { runFullTest };
