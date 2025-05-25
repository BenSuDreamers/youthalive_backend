const axios = require('axios');

async function testProduction() {
  const BACKEND_URL = process.argv[2] || 'https://your-app.herokuapp.com';
  const FRONTEND_URL = process.argv[3] || 'https://your-app.vercel.app';
  
  console.log('🧪 Testing production deployment...');
  console.log(`🔗 Backend: ${BACKEND_URL}`);
  console.log(`🔗 Frontend: ${FRONTEND_URL}`);
  
  const tests = [];
  
  // Test 1: Backend Health Check
  console.log('\n1️⃣ Testing backend health...');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ Backend health check passed');
      tests.push({ name: 'Backend Health', status: 'PASS' });
    } else {
      console.log(`❌ Backend health check failed: ${response.status}`);
      tests.push({ name: 'Backend Health', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    tests.push({ name: 'Backend Health', status: 'FAIL' });
  }
  
  // Test 2: Events API
  console.log('\n2️⃣ Testing events API...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/events`, {
      timeout: 15000
    });
    
    if (response.status === 200) {
      console.log(`✅ Events API working - Found ${response.data.count || 0} events`);
      tests.push({ name: 'Events API', status: 'PASS' });
    } else {
      console.log(`❌ Events API failed: ${response.status}`);
      tests.push({ name: 'Events API', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`❌ Events API failed: ${error.message}`);
    tests.push({ name: 'Events API', status: 'FAIL' });
  }
  
  // Test 3: Frontend Accessibility
  console.log('\n3️⃣ Testing frontend accessibility...');
  try {
    const response = await axios.get(FRONTEND_URL, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.includes('Youth Alive')) {
      console.log('✅ Frontend is accessible');
      tests.push({ name: 'Frontend Access', status: 'PASS' });
    } else {
      console.log(`❌ Frontend test failed: ${response.status}`);
      tests.push({ name: 'Frontend Access', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    tests.push({ name: 'Frontend Access', status: 'FAIL' });
  }
  
  // Test 4: Webhook Endpoint
  console.log('\n4️⃣ Testing webhook endpoint...');
  try {
    const testPayload = {
      formID: '251442125173852',
      submissionID: `production-test-${Date.now()}`,
      rawRequest: JSON.stringify({
        form_id: '251442125173852',
        submission_id: `production-test-${Date.now()}`,
        pretty: JSON.stringify({
          '3': 'Production Test User',
          '4': 'test@example.com',
          '11': `TEST-PROD-${Date.now()}`,
          '12': 'Test Church',
          '16': '0412345678'
        })
      })
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/webhooks/jotform`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.status === 200) {
      console.log('✅ Webhook endpoint working');
      console.log(`   Created ticket ID: ${response.data.ticketId}`);
      tests.push({ name: 'Webhook Endpoint', status: 'PASS' });
    } else {
      console.log(`❌ Webhook test failed: ${response.status}`);
      tests.push({ name: 'Webhook Endpoint', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`❌ Webhook test failed: ${error.response?.data?.message || error.message}`);
    tests.push({ name: 'Webhook Endpoint', status: 'FAIL' });
  }
  
  // Test Summary
  console.log('\n📊 Test Summary:');
  console.log('┌─────────────────────┬──────────┐');
  console.log('│ Test                │ Status   │');
  console.log('├─────────────────────┼──────────┤');
  
  tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    const testName = test.name.padEnd(19);
    console.log(`│ ${testName} │ ${status}   │`);
  });
  
  console.log('└─────────────────────┴──────────┘');
  
  const passedTests = tests.filter(t => t.status === 'PASS').length;
  const totalTests = tests.length;
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your deployment is ready.');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please check the issues above.`);
  }
  
  console.log(`\n📋 URLs for reference:`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend API: ${BACKEND_URL}`);
  console.log(`   Webhook URL: ${BACKEND_URL}/api/webhooks/jotform`);
}

// Check if URLs were provided as arguments
if (process.argv.length < 4) {
  console.log('Usage: node test-production.js <backend-url> <frontend-url>');
  console.log('Example: node test-production.js https://youthalive-backend.herokuapp.com https://youthalive-frontend.vercel.app');
  process.exit(1);
}

testProduction().catch(console.error);
