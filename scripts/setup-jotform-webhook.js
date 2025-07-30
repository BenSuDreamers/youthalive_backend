const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

class JotformWebhookSetup {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.jotform.com';
  }

  async setupWebhook(formId, webhookUrl) {
    try {
      console.log(`Setting up webhook for form ${formId}...`);
      
      // First, check if webhook already exists
      const existingWebhooks = await this.getWebhooks(formId);
        // Check if webhook URL already exists
      const webhookExists = Array.isArray(existingWebhooks) && existingWebhooks.some(webhook => 
        webhook.webhookURL === webhookUrl
      );
      
      if (webhookExists) {
        console.log(`✅ Webhook already exists for form ${formId}`);
        return { status: 'exists', formId };
      }

      // Add new webhook
      const response = await axios.post(
        `${this.baseUrl}/form/${formId}/webhooks`,
        `webhookURL=${encodeURIComponent(webhookUrl)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          params: {
            apiKey: this.apiKey
          }
        }
      );

      console.log(`✅ Webhook setup successful for form ${formId}`);
      return { status: 'created', formId, data: response.data };
      
    } catch (error) {
      console.error(`❌ Error setting up webhook for form ${formId}:`, error.response?.data || error.message);
      return { status: 'error', formId, error: error.response?.data || error.message };
    }
  }

  async getWebhooks(formId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/form/${formId}/webhooks`,
        {
          params: {
            apiKey: this.apiKey
          }
        }
      );
      return response.data.content || [];
    } catch (error) {
      console.log(`No existing webhooks found for form ${formId}`);
      return [];
    }
  }

  async getFormFields(formId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/form/${formId}/questions`,
        {
          params: {
            apiKey: this.apiKey
          }
        }
      );
      return response.data.content || {};
    } catch (error) {
      console.error(`Error getting form fields for ${formId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async listForms() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/forms`,
        {
          params: {
            apiKey: this.apiKey,
            limit: 100 // Get more forms
          }
        }
      );
      return response.data.content || [];
    } catch (error) {
      console.error('Error listing forms:', error.response?.data || error.message);
      throw error;
    }
  }

  async analyzeForm(formId) {
    try {
      const fields = await this.getFormFields(formId);
      
      console.log(`\n📋 Form ${formId} Field Analysis:`);
      console.log('=====================================');
      
      const fieldMapping = {};
      
      Object.keys(fields).forEach(key => {
        const field = fields[key];
        const fieldInfo = {
          id: key,
          name: field.name || 'unnamed',
          type: field.type,
          text: field.text || 'No label',
          required: field.required === 'Yes'
        };
        
        console.log(`Field ${key}: ${fieldInfo.text} (${fieldInfo.type}) ${fieldInfo.required ? '[Required]' : ''}`);
        
        // Try to map to expected fields
        const text = fieldInfo.text.toLowerCase();
        const name = fieldInfo.name.toLowerCase();
        
        if (text.includes('name') || name.includes('name')) {
          fieldMapping.fullName = key;
        } else if (text.includes('email') || name.includes('email')) {
          fieldMapping.email = key;
        } else if (text.includes('phone') || name.includes('phone')) {
          fieldMapping.phone = key;
        } else if (text.includes('church') || text.includes('organization') || name.includes('church')) {
          fieldMapping.church = key;
        }
      });
      
      console.log('\n🔗 Suggested Field Mapping:');
      console.log('============================');
      console.log(JSON.stringify(fieldMapping, null, 2));
      
      return { fields, fieldMapping };
      
    } catch (error) {
      console.error(`Error analyzing form ${formId}:`, error.message);
      throw error;
    }
  }
}

async function setupYouthAliveWebhooks() {
  const apiKey = process.env.JOTFORM_API_KEY;
  const webhookUrl = process.env.FRONTEND_URL ? 
    process.env.FRONTEND_URL.replace('5001', '3000') + '/api/webhooks/jotform' :
    'http://localhost:3000/api/webhooks/jotform';
  
  if (!apiKey) {
    console.error('❌ JOTFORM_API_KEY not found in environment variables');
    console.log('Please check your .env file in the backend directory');
    process.exit(1);
  }

  console.log('🚀 Starting Jotform Webhook Setup');
  console.log('==================================');
  console.log(`API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log('');

  const jotform = new JotformWebhookSetup(apiKey);

  try {
    // List all forms to find event registration forms
    console.log('📋 Fetching your Jotform forms...');
    const forms = await jotform.listForms();
    
    if (forms.length === 0) {
      console.log('❌ No forms found in your Jotform account');
      return;
    }

    console.log('\n📝 Your Jotform Forms:');
    console.log('=======================');
    forms.forEach((form, index) => {
      console.log(`${index + 1}. ${form.title} (ID: ${form.id})`);
      console.log(`   Created: ${new Date(form.created_at).toLocaleDateString()}`);
      console.log(`   Status: ${form.status}`);
      console.log(`   URL: ${form.url}`);
      console.log('');
    });

    // Look for forms that might be event registration forms
    const eventForms = forms.filter(form => {
      const title = form.title.toLowerCase();
      return title.includes('event') || 
             title.includes('registration') || 
             title.includes('signup') ||
             title.includes('youth') ||
             title.includes('alive');
    });

    if (eventForms.length > 0) {
      console.log('🎯 Potential Event Registration Forms Found:');
      console.log('=============================================');
      
      for (const form of eventForms) {
        console.log(`\n📋 Analyzing form: ${form.title} (${form.id})`);
        
        try {
          const analysis = await jotform.analyzeForm(form.id);
          
          // Setup webhook for this form
          const result = await jotform.setupWebhook(form.id, webhookUrl);
          
          if (result.status === 'created' || result.status === 'exists') {
            console.log(`✅ Webhook configured for "${form.title}"`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to analyze/setup form ${form.id}:`, error.message);
        }
      }
    } else {
      console.log('🔍 No obvious event registration forms found.');
      console.log('You may need to manually specify form IDs or rename your forms.');
      console.log('\nTo setup webhooks for specific forms, you can:');
      console.log('1. Update form titles to include "event" or "registration"');
      console.log('2. Or manually specify form IDs in the FORM_IDS environment variable');
    }

    // Check for manual form IDs in environment
    const manualFormIds = process.env.FORM_IDS?.split(',').map(id => id.trim()).filter(id => id);
    
    if (manualFormIds && manualFormIds.length > 0) {
      console.log('\n🎯 Setting up webhooks for manually specified forms:');
      console.log('====================================================');
      
      for (const formId of manualFormIds) {
        try {
          console.log(`\n📋 Processing form ID: ${formId}`);
          await jotform.analyzeForm(formId);
          const result = await jotform.setupWebhook(formId, webhookUrl);
          
          if (result.status === 'created' || result.status === 'exists') {
            console.log(`✅ Webhook configured for form ${formId}`);
          }
        } catch (error) {
          console.error(`❌ Failed to setup form ${formId}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Webhook setup completed!');
    console.log('============================');
    console.log('Next steps:');
    console.log('1. Test form submissions to verify webhook is working');
    console.log('2. Check your backend logs at http://localhost:3000');
    console.log('3. Monitor the webhook endpoint for incoming data');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the setup
setupYouthAliveWebhooks();
