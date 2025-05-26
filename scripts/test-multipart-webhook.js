const FormData = require('form-data');
const axios = require('axios');

async function testMultipartWebhook() {
  try {
    // Create form data similar to what Jotform sends
    const form = new FormData();
    
    // Add form submission data
    form.append('submissionID', '5820765048205969134');
    form.append('formID', '251442125173852');
    form.append('ip', '72.14.191.244');
    form.append('q3_name[first]', 'John');
    form.append('q3_name[last]', 'Doe');
    form.append('q5_email', 'john.doe@example.com');
    form.append('q7_invoiceId', '# INV-000006');
    form.append('q9_youthGroup', 'Test Youth Group');
    form.append('q11_phoneNumber[full]', '+1234567890');
    
    console.log('Testing multipart webhook...');
    
    const response = await axios.post('https://youthalive-backend-873403ae276a.herokuapp.com/jotform', form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMultipartWebhook();
