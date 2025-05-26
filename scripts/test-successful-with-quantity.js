const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

async function testSuccessfulWithQuantity() {
  try {
    console.log('🔍 Testing successful format with quantity...');
    
    // Based on the successful format from our previous test
    const payload = {
      formID: "241078261192858",
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        q5_email: "quantity@example.com",
        q38_invoiceId: "QTY-" + Date.now(),
        // Add quantity information in the format we're implementing
        "3": {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 5.00 AUD, Quantity: 5)"],
            currency: "AUD",
            total: "25.00"
          })
        }
      })
    };
    
    console.log('\n📤 Sending payload with quantity...');
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
        console.log('\n🔍 Checking created ticket details...');
        
        // Now let's try to get the ticket details to verify quantity was saved
        // We'd need to have authentication for this, so we'll skip it for now
        console.log('✅ Ticket created with ID:', response.data.ticketId);
        console.log('Note: To verify quantity was saved, check the ticket in the database or test the QR scanning in the frontend.');
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
testSuccessfulWithQuantity();
