const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listForms() {
  try {
    const response = await axios.get('https://api.jotform.com/user/forms', {
      params: { 
        apiKey: process.env.JOTFORM_API_KEY, 
        limit: 50 
      }
    });
    
    const forms = response.data.content || [];
    console.log('📋 All Jotform Forms:');
    console.log('====================');
    
    forms.forEach((form, index) => {
      console.log(`${index + 1}. ${form.title}`);
      console.log(`   ID: ${form.id}`);
      console.log(`   Status: ${form.status}`);
      console.log(`   Created: ${new Date(form.created_at).toLocaleDateString()}`);
      console.log(`   URL: ${form.url}`);
      console.log('');
    });
    
    // Look for webapp test form specifically
    const webappForm = forms.find(form => 
      form.title.toLowerCase().includes('webapp') || 
      form.title.toLowerCase().includes('test')
    );
    
    if (webappForm) {
      console.log('🎯 Found WebApp/Test Form:');
      console.log('==========================');
      console.log(`Title: ${webappForm.title}`);
      console.log(`ID: ${webappForm.id}`);
      console.log(`Status: ${webappForm.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

listForms();
