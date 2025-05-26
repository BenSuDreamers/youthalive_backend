const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const LOCAL_URL = 'http://localhost:3000/api/webhooks/jotform';
const PROD_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

// Choose which URL to use (local or production)
const WEBHOOK_URL = PROD_URL; // Always use production for webhook testing

async function testWebhookWithTicketQuantity() {
  try {
    console.log(`🚀 Testing JotForm webhook with ticket quantity data`);
    console.log(`URL: ${WEBHOOK_URL}`);
    
    // Stadium 24 form style payload with quantity
    const multiTicketPayload = {
      formID: "241078261192858",  // Stadium 24 form
      submissionID: "test-" + Date.now(),
      rawRequest: JSON.stringify({
        formID: "241078261192858",
        "3": {
          "paymentArray": JSON.stringify({
            "product": ["General Admission (Amount: 5.00 AUD, Quantity: 15)"],
            "currency": "AUD",
            "total": "75.00",
            "stripeData": {
              "customerID": "cus_Qe4vUaXB4SzfKT",
              "transactionid": "pi_3PobymB9A3DUo6yK1Mb0OW6c"
            }
          })
        },
        "q4_fullName": {
          "first": "Martyn",
          "last": "Manuel"
        },
        "q5_email": "test@harvestaustralia.org",
        "q7_phone": "0423456789",
        "q10_church": "Harvest Church",
        "q38_invoiceId": "INV-TESTQTY-" + Date.now()
      })
    };
    
    console.log('\n📤 Sending test webhook with multiple tickets...');
    console.log('Payload:', JSON.stringify(multiTicketPayload, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, multiTicketPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response data: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Error testing webhook:', 
      error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Run the test
testWebhookWithTicketQuantity();
