const axios = require('axios');

// Test payload that simulates what Jotform would send
const testPayload = {
  formID: "251197541475866", // Your Stadium Registration Form ID
  submissionID: "test_" + Date.now(),
  formTitle: "Stadium Registration Form",
  submission_id: "test_" + Date.now(),
  created_at: new Date().toISOString(),
  answers: {
    "3": {
      "name": "fullName",
      "answer": "John Doe",
      "text": "Name"
    },
    "4": {
      "name": "email", 
      "answer": "john.doe@example.com",
      "text": "E-mail"
    },
    "16": {
      "name": "phone",
      "answer": "0412345678", 
      "text": "Phone Number"
    },
    "12": {
      "name": "youthGroup",
      "answer": "Youth Alive SA",
      "text": "Which youth group are you coming with?"
    },
    "11": {
      "name": "invoiceId",
      "answer": "INV-" + Date.now(),
      "text": "Invoice ID"
    }
  },
  // Alternative format that Jotform might use
  rawRequest: {
    "q3_fullName": "John Doe",
    "q4_email": "john.doe@example.com", 
    "q16_phone": "0412345678",
    "q12_textbox": "Youth Alive SA",
    "q11_autoincrement": "INV-" + Date.now()
  }
};

async function testWebhook() {
  console.log('🧪 Testing Youth Alive Webhook Endpoint');
  console.log('======================================');
  
  try {
    console.log('📤 Sending test payload to webhook...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(
      'http://localhost:3000/api/webhooks/jotform',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'JotForm-Webhook-Test'
        },
        timeout: 10000
      }
    );

    console.log('\n✅ Webhook test successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if ticket was created
    if (response.data.success && response.data.ticketId) {
      console.log('\n🎫 Ticket created successfully!');
      console.log('Ticket ID:', response.data.ticketId);
      console.log('');
      console.log('📧 Check if confirmation email was sent to:', testPayload.answers["4"].answer);
      console.log('🎯 QR code should be generated for invoice:', testPayload.answers["11"].answer);
    }
    
  } catch (error) {
    console.error('\n❌ Webhook test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('\n💡 Make sure your backend server is running on http://localhost:3000');
      } else if (error.response.status === 500) {
        console.error('\n💡 Check backend logs for detailed error information');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused - make sure backend server is running');
      console.error('   Run: cd C:\\YouthAlive\\backend && npm start');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testMultipleFormats() {
  console.log('\n🔄 Testing Multiple Webhook Formats');
  console.log('===================================');
  
  // Test format 1: Direct field access
  const format1 = {
    formID: "251197541475866",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "0423456789",
    church: "Hillsong Youth",
    invoiceId: "INV-FORMAT1-" + Date.now()
  };
  
  // Test format 2: Jotform's common format
  const format2 = {
    formID: "251197541475866",
    submissionID: "format2_" + Date.now(),
    rawRequest: {
      "q3_fullName": "Bob Johnson",
      "q4_email": "bob.johnson@example.com",
      "q16_phone": "0434567890", 
      "q12_textbox": "C3 Youth",
      "q11_autoincrement": "INV-FORMAT2-" + Date.now()
    }
  };
  
  const formats = [
    { name: 'Direct Field Format', payload: format1 },
    { name: 'Jotform Raw Request Format', payload: format2 }
  ];
  
  for (const format of formats) {
    console.log(`\n📋 Testing: ${format.name}`);
    console.log('-'.repeat(40));
    
    try {
      const response = await axios.post(
        'http://localhost:3000/api/webhooks/jotform',
        format.payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      
      console.log(`✅ ${format.name}: SUCCESS`);
      console.log(`   Ticket ID: ${response.data.ticketId || 'N/A'}`);
      
    } catch (error) {
      console.log(`❌ ${format.name}: FAILED`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Main execution
async function runTests() {
  console.log('🚀 Youth Alive Webhook Integration Test');
  console.log('========================================');
  console.log('Testing webhook endpoint: http://localhost:3000/api/webhooks/jotform');
  console.log('');
  
  await testWebhook();
  await testMultipleFormats();
  
  console.log('\n📋 Next Steps:');
  console.log('=============');
  console.log('1. ✅ Set up webhook in Jotform UI (manual setup required)');
  console.log('2. 🧪 Test with real form submission');
  console.log('3. 📧 Verify email delivery');
  console.log('4. 📱 Test QR code scanning');
  console.log('5. 🔄 Update webhook URL for production deployment');
}

runTests();
