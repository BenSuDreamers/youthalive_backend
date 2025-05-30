const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Set to your local or production webhook URL
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/jotform';
// const WEBHOOK_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';

// Test data simulating a Stadium 25 submission
const testSubmissionData = {
  formTitle: 'Stadium 25 Registration',
  formID: '242558675342871',
  rawRequest: {
    "slug": "submit/242558675342871/",
    "q1_name[first]": "Test",
    "q1_name[last]": "User",
    "q2_email": "test@example.com",
    "q3_mobileNumber": "0412345678",
    "q4_chooseYour": "Friday", // This is likely the field we need - "Choose your night"
    "q5_iAgree": "Yes",
    "event_id": "stadium-25",
    "event_title": "Stadium 25"
  },
  pretty: JSON.stringify({
    "id": "submission_" + Date.now(),
    "form_id": "242558675342871",
    "ip": "127.0.0.1",
    "created_at": new Date().toISOString(),
    "status": "ACTIVE",
    "new": "1",
    "flag": "0",
    "notes": "",
    "updated_at": new Date().toISOString(),
    "answers": {
      "1": {
        "name": "name",
        "order": "1",
        "text": "Name",
        "type": "control_fullname",
        "answer": {
          "first": "Test",
          "last": "User"
        }
      },
      "2": {
        "name": "email",
        "order": "2",
        "text": "Email",
        "type": "control_email",
        "answer": "test@example.com"
      },
      "3": {
        "name": "mobileNumber",
        "order": "3",
        "text": "Mobile Number",
        "type": "control_phone",
        "answer": "0412345678"
      },
      "4": {
        "name": "chooseYour",
        "order": "4",
        "text": "Choose your night",
        "type": "control_radio",
        "answer": "Friday"
      },
      "5": {
        "name": "iAgree",
        "order": "5",
        "text": "I agree to the terms",
        "type": "control_checkbox",
        "answer": "Yes"
      }
    }
  }, null, 2)
};

async function sendTestWebhook() {
  try {
    console.log(`Sending test webhook to ${WEBHOOK_URL}...`);
    console.log('Test data:', testSubmissionData);
    
    const response = await axios.post(WEBHOOK_URL, testSubmissionData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Save the response to a file for inspection
    const outputFile = path.join(__dirname, 'stadium25-webhook-response.json');
    fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
    console.log(`Response saved to ${outputFile}`);
    
    // Also save our test request data for reference
    const requestFile = path.join(__dirname, 'stadium25-webhook-request.json');
    fs.writeFileSync(requestFile, JSON.stringify(testSubmissionData, null, 2));
    console.log(`Request saved to ${requestFile}`);
    
    return response.data;
  } catch (error) {
    console.error('Error sending webhook:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // Save error response
      const errorFile = path.join(__dirname, 'stadium25-webhook-error.json');
      fs.writeFileSync(errorFile, JSON.stringify({
        status: error.response.status,
        data: error.response.data,
        message: error.message
      }, null, 2));
      console.log(`Error details saved to ${errorFile}`);
    }
    throw error;
  }
}

// Run the test
sendTestWebhook()
  .then(() => console.log('Test completed successfully'))
  .catch(() => console.log('Test failed'));

// Extra utility to dump and inspect the data format
console.log('\nField name we are looking for:');
console.log('Raw request field: q4_chooseYour');
console.log('Pretty format field path: answers.4.name = "chooseYour"');
console.log('Text label: "Choose your night"');
console.log('Value: "Friday" (would be either "Friday" or "Saturday")');
