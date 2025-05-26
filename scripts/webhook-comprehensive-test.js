const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  try {
    console.log('🔍 Running comprehensive webhook tests...');
    
    // Test 1: Basic test (just the minimum required fields)
    console.log('\n📋 Test 1: Basic fields only');
    const basicPayload = {
      formID: "241078261192858",
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q5_email: "basic@example.com",
        q38_invoiceId: "BASIC-" + Date.now()
      })
    };
    
    await testPayload(basicPayload, "Basic test");
    await delay(2000); // Short delay between tests
    
    // Test 2: Try a different field format for email
    console.log('\n📋 Test 2: Alternative email field');
    const altEmailPayload = {
      formID: "241078261192858",
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        email: "alt@example.com", // Direct email field
        q38_invoiceId: "ALT-" + Date.now()
      })
    };
    
    await testPayload(altEmailPayload, "Alternative email field");
    await delay(2000);
    
    // Test 3: Try the format from observed working submissions
    console.log('\n📋 Test 3: Format from successful submissions');
    const observedPayload = {
      formID: "241078261192858",
      formTitle: "Stadium 24 Youth Alive QLD",
      submissionID: "test-observed-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q4_fullName: {
          first: "Observed",
          last: "Test"
        },
        q5_email: "observed@example.com",
        q7_phone: "0412345678",
        q38_invoiceId: "OBS-" + Date.now()
      })
    };
    
    await testPayload(observedPayload, "Observed format");
    await delay(2000);
    
    // Test 4: Try without product data
    console.log('\n📋 Test 4: No product data');
    const noProductPayload = {
      formID: "241078261192858",
      submissionID: "test-noproduct-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q4_fullName: {
          first: "No",
          last: "Product"
        },
        q5_email: "noproduct@example.com",
        q38_invoiceId: "NOPROD-" + Date.now()
      })
    };
    
    await testPayload(noProductPayload, "No product data");
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

async function testPayload(payload, testName) {
  try {
    console.log(`📤 Sending ${testName} payload...`);
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000
    });
    
    console.log(`✅ ${testName} succeeded with status ${response.status}`);
    console.log(`✅ Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.error(`❌ ${testName} failed:`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run all tests
runTests();
