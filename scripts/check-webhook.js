const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkWebhook() {
  try {
    const formId = '251442125173852'; // WebApp test form
    const webhookUrl = 'https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform';
    
    console.log('🔍 Checking webhook configuration for WebApp test form...');
    console.log(`Form ID: ${formId}`);
    console.log(`Expected webhook URL: ${webhookUrl}`);
    console.log('');
    
    // Check existing webhooks
    const response = await axios.get(`https://api.jotform.com/form/${formId}/webhooks`, {
      params: { apiKey: process.env.JOTFORM_API_KEY }
    });
    
    const webhooks = response.data.content || {};
    console.log('📋 Current webhooks:');
    console.log(JSON.stringify(webhooks, null, 2));
    
    if (Object.keys(webhooks).length === 0) {
      console.log('❌ No webhooks configured for this form!');
      console.log('');
      console.log('🛠️ Setting up webhook...');
      
      // Add webhook
      const setupResponse = await axios.post(`https://api.jotform.com/form/${formId}/webhooks`, 
        `webhookURL=${encodeURIComponent(webhookUrl)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          params: { apiKey: process.env.JOTFORM_API_KEY }
        }
      );
      
      console.log('✅ Webhook setup result:', setupResponse.data);
      
      // Verify setup
      const verifyResponse = await axios.get(`https://api.jotform.com/form/${formId}/webhooks`, {
        params: { apiKey: process.env.JOTFORM_API_KEY }
      });
      
      console.log('🔍 Verification - New webhooks:');
      console.log(JSON.stringify(verifyResponse.data.content, null, 2));
      
    } else {
      const webhookUrls = Object.values(webhooks);
      const isConfigured = webhookUrls.includes(webhookUrl);
      
      if (isConfigured) {
        console.log('✅ Webhook is properly configured!');
      } else {
        console.log('⚠️ Webhook URL mismatch!');
        console.log('Current webhooks:', webhookUrls);
        console.log('Expected:', webhookUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkWebhook();
