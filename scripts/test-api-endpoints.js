const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Production API URL
const API_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api';

// Test the events endpoint and webhook
async function testApi() {
  try {
    console.log('🔍 Testing API endpoints...');

    // Test 1: Get events (this should work if the API is accessible)
    console.log('\n📋 Test 1: Get events');
    try {
      const eventsResponse = await axios.get(`${API_URL}/events`, {
        timeout: 10000
      });
      console.log(`✅ Events API status: ${eventsResponse.status}`);
      console.log(`✅ Events count: ${eventsResponse.data.count}`);
      
      // Only show the first event for brevity
      if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
        console.log('First event:', JSON.stringify(eventsResponse.data.data[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Events API error:', 
        error.response?.data || error.message);
    }

    // Test 2: Check API info (should work if API is accessible)
    console.log('\n📋 Test 2: Check API info');
    try {
      const infoResponse = await axios.get(`${API_URL}`, {
        timeout: 10000
      });
      console.log(`✅ API info status: ${infoResponse.status}`);
      console.log(`✅ API info: ${JSON.stringify(infoResponse.data, null, 2)}`);
    } catch (error) {
      console.error('❌ API info error:', 
        error.response?.data || error.message);
    }

    // Test 3: Send a simplified webhook payload
    console.log('\n📋 Test 3: Send simplified webhook payload');
    const simplePayload = {
      formID: "241078261192858",
      submissionID: "test-simple-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q4_fullName: {
          first: "Test",
          last: "User"
        },
        q5_email: "test@example.com",
        q38_invoiceId: "INV-TEST-SIMPLE-" + Date.now()
      })
    };
    
    console.log('Simple payload:', JSON.stringify(simplePayload, null, 2));
    
    try {
      const webhookResponse = await axios.post(`${API_URL}/webhooks/jotform`, simplePayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      console.log(`✅ Simple webhook status: ${webhookResponse.status}`);
      console.log(`✅ Simple webhook response: ${JSON.stringify(webhookResponse.data, null, 2)}`);
    } catch (error) {
      console.error('❌ Simple webhook error:', 
        error.response?.data || error.message);
      
      // Log more details if available
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        console.error('Error data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testApi();
