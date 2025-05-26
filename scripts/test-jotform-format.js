const axios = require('axios');

// Production webhook URL
const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

async function testJotformFormat() {
  try {
    console.log('🔍 Testing with exact JotForm webhook format...');
    console.log(`URL: ${WEBHOOK_URL}`);
    
    // Format exactly like JotForm webhook would send
    // This format is based on JotForm's documentation and actual webhook examples
    const jotformPayload = {
      formID: "241078261192858",
      submissionID: "5996855970279087222", // Use a real-looking submission ID
      formTitle: "Stadium 24 Youth Alive QLD",
      ip: "101.181.110.57",
      "3": {
        name: "My Products",
        type: "products",
        answer: {
          "0": "{\"id\":\"1008\"}",
          "1": "{\"available_stock\":\"undefined\",\"description\":\"*Price is only valid until 17th August 4pm. Price will increase for tickets purchased at the door.\",\"disabled\":\"show\",\"fitImageToCanvas\":\"Yes\",\"hasExpandedOption\":\"\",\"hasSpecialPricing\":\"\",\"images\":[],\"isLowStockAlertEnabled\":\"Yes\",\"isStockControlEnabled\":\"Yes\",\"lowStockValue\":\"100\",\"name\":\"General Admission\",\"options\":[{\"type\":\"quantity\",\"name\":\"Quantity\",\"defaultQuantity\":\"1\",\"specialPricing\":false,\"expanded\":false,\"selected\":\"1\"}],\"order\":\"1\",\"paymentUUID\":\"018eeeb2699572c0acbce8704483f88f7bc8\",\"pid\":\"1008\",\"price\":5,\"required\":\"1\",\"selected\":\"1\",\"quantity\":1,\"item_id\":4,\"currency\":\"AUD\",\"gateway\":\"stripe\",\"paymentType\":\"product\"}",
          "paymentArray": "{\"product\":[\"General Admission (Amount: 5.00 AUD, Quantity: 1)\"],\"currency\":\"AUD\",\"total\":\"5.00\",\"stripeData\":{\"customerID\":\"cus_Qg2Gw8hnFKh2D0\",\"chargeID\":false,\"card\":false,\"plan\":false,\"setupFeeAmount\":false,\"setupFeeDesc\":false,\"subscriptionDelay\":false,\"paymentType\":\"product\",\"isCharged\":true},\"customerid\":\"cus_Qg2Gw8hnFKh2D0\",\"firstname\":\"Test\",\"lastname\":\"User\",\"nameonaccount\":\"\",\"email\":\"test@example.com\",\"transactionid\":\"pi_3PogCQB9A3DUo6yK18FeRTv4\",\"shortView\":{\"products\":[{\"title\":\"General Admission\"}]}}"
        },
        text: "My Products"
      },
      "4": {
        name: "Full Name",
        type: "control_fullname",
        answer: {
          first: "Test",
          last: "User"
        },
        text: "Full Name"
      },
      "5": {
        name: "Email",
        type: "control_email",
        answer: "test@example.com",
        text: "Email"
      },
      "7": {
        name: "Phone Number",
        type: "control_phone",
        answer: "0400123456",
        text: "Phone Number"
      },
      "10": {
        name: "Church",
        type: "control_textbox",
        answer: "Test Church",
        text: "Church"
      },
      "38": {
        name: "Invoice ID",
        type: "control_autoincrement",
        answer: "JF-" + Date.now(),
        text: "Invoice ID"
      },
      created_at: "2025-05-26 07:40:00",
      event_type: "form_submission"
    };
    
    console.log('\n📤 Sending JotForm format webhook payload...');
    
    // Set verbose error handling
    try {
      const response = await axios.post(WEBHOOK_URL, jotformPayload, {
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
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
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
testJotformFormat();
