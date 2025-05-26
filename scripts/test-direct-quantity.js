const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

async function testDirectQuantity() {
  try {
    console.log('🔍 Testing with direct quantity in the payload...');
    
    // Use a format that directly includes quantity instead of parsing it from a string
    const payload = {
      formID: "241078261192858",
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q5_email: "direct.quantity@example.com",
        q38_invoiceId: "DIR-QTY-" + Date.now(),
        // Include quantity directly in the submission
        quantity: 10,
        productDetails: "Direct Quantity Test",
        totalAmount: 50.00
      })
    };
    
    console.log('\n📤 Sending payload with direct quantity...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });
      
      console.log(`✅ Response status: ${response.status}`);
      console.log(`✅ Response data: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.data && response.data.ticketId) {
        console.log('\n🔍 Ticket created with ID:', response.data.ticketId);
        console.log('Remember to check this ticket using verify-ticket-quantity.js');
      }
    } catch (error) {
      console.error('❌ Error details:');
      
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error message:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testDirectQuantity();
