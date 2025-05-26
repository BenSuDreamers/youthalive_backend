const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

async function testWebhookDiagnostic() {
  try {
    console.log('🔍 Running webhook diagnostic test...');
    console.log(`URL: ${WEBHOOK_URL}`);
    
    // Simple payload that should be easier to process
    const basicPayload = {
      formID: "241078261192858",
      submissionID: "diagnostic-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q4_fullName: {
          first: "John",
          last: "Doe"
        },
        q5_email: "john.doe@example.com",
        q38_invoiceId: "DIAG-" + Date.now(),
        // Include a simple product field
        "3": {
          "paymentArray": JSON.stringify({
            "product": ["General Admission (Amount: 5.00 AUD, Quantity: 1)"],
            "currency": "AUD",
            "total": "5.00"
          })
        }
      })
    };
    
    console.log('\n📤 Sending diagnostic webhook payload...');
    console.log('Payload:', JSON.stringify(basicPayload, null, 2));
    
    // Set verbose error handling
    try {
      const response = await axios.post(WEBHOOK_URL, basicPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });
      
      console.log(`✅ Response status: ${response.status}`);
      console.log(`✅ Response data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.error('❌ Error details:');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Status: ${error.response.status}`);
        console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        console.error(`Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
        console.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the diagnostic
testWebhookDiagnostic();
