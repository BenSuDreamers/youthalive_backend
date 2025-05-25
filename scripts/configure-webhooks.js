const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function configureWebhook() {
  const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
  const BACKEND_URL = process.env.BACKEND_URL || 'https://your-app.herokuapp.com';
  
  if (!JOTFORM_API_KEY) {
    console.error('❌ JOTFORM_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🔧 Configuring Jotform webhooks...');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  
  try {
    // Get all forms
    const response = await axios.get('https://api.jotform.com/user/forms', {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 100
      }
    });

    const forms = response.data.content || [];
    console.log(`📋 Found ${forms.length} forms`);

    // Configure webhook for each form
    for (const form of forms) {
      const formId = form.id;
      const formTitle = form.title;
      
      console.log(`\n🎫 Configuring webhook for: ${formTitle} (ID: ${formId})`);
      
      try {
        // Set webhook URL
        const webhookUrl = `${BACKEND_URL}/api/webhooks/jotform`;
        
        await axios.post(`https://api.jotform.com/form/${formId}/webhooks`, {
          webhookURL: webhookUrl
        }, {
          params: {
            apiKey: JOTFORM_API_KEY
          }
        });
        
        console.log(`✅ Webhook configured: ${webhookUrl}`);
        
        // Verify webhook was set
        const webhooksResponse = await axios.get(`https://api.jotform.com/form/${formId}/webhooks`, {
          params: {
            apiKey: JOTFORM_API_KEY
          }
        });
        
        const webhooks = webhooksResponse.data.content || {};
        const webhookUrls = Object.values(webhooks);
        
        if (webhookUrls.some(url => url === webhookUrl)) {
          console.log(`✅ Webhook verified for form: ${formTitle}`);
        } else {
          console.log(`⚠️  Webhook not found for form: ${formTitle}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to configure webhook for ${formTitle}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 Webhook configuration complete!');
    console.log(`\n📋 Summary:`);
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   Webhook endpoint: ${BACKEND_URL}/api/webhooks/jotform`);
    console.log(`   Forms processed: ${forms.length}`);
    
  } catch (error) {
    console.error('❌ Failed to configure webhooks:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Run the configuration
configureWebhook().catch(console.error);
