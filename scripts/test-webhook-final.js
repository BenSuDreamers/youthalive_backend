const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

async function testWebhookFinalFix() {
  try {
    console.log('🔍 Testing webhook with final format...');
    console.log(`URL: ${WEBHOOK_URL}`);
    
    // Format based on observed working webhooks and the parsing logic in jotform.service.ts
    const fixedPayload = {
      formID: "241078261192858",
      submissionID: "test-final-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        // Stadium 24 form format fields
        q4_fullName: {
          first: "Final",
          last: "Test"
        },
        q5_email: "final.test@example.com",
        q7_phone: "0412345678",
        q10_church: "Test Church",
        q38_invoiceId: "INV-FINAL-" + Date.now(),
        // Product field in the format we've seen in actual submissions
        "3": {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 5.00 AUD, Quantity: 3)"],
            currency: "AUD",
            total: "15.00",
            stripeData: {
              customerID: "cus_test",
              transactionid: "pi_test"
            }
          })
        }
      })
    };
    
    console.log('\n📤 Sending fixed webhook payload...');
    console.log('Payload:', JSON.stringify(fixedPayload, null, 2));
    
    try {
      const response = await axios.post(WEBHOOK_URL, fixedPayload, {
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
        
        // Log more detailed information for debugging
        if (error.response.data && error.response.data.received) {
          console.error('Server received these fields:');
          console.error(JSON.stringify(error.response.data.received, null, 2));
        }
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

// Run the test
testWebhookFinalFix();
