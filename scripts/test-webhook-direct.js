const axios = require('axios');

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook endpoint...');
      // Simulate a Jotform webhook payload
    const webhookPayload = {
      formID: '251442125173852',
      submissionID: 'test-submission-' + Date.now(),
      rawRequest: JSON.stringify({
        form_id: '251442125173852',
        submission_id: 'test-submission-' + Date.now(),
        pretty: JSON.stringify({
          '3': 'John Test',
          '4': 'john.test@example.com',
          '16': '0412345678',
          '12': 'Test Church',
          '11': 'TEST-001'
        })
      })
    };
      console.log('📤 Sending webhook payload:', JSON.stringify(webhookPayload, null, 2));
      const response = await axios.post('https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform', webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
  }
}

testWebhook();
