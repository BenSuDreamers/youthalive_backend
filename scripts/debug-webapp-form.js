const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugWebAppForm() {
  try {
    const formId = '251442125173852'; // WebApp test form
    
    console.log('🔍 Debugging WebApp test form structure...');
    console.log(`Form ID: ${formId}`);
    console.log('');
    
    // Get form structure
    const formResponse = await axios.get(`https://api.jotform.com/form/${formId}`, {
      params: { apiKey: process.env.JOTFORM_API_KEY }
    });
    
    console.log('📋 Form Details:');
    console.log(`Title: ${formResponse.data.content.title}`);
    console.log(`Status: ${formResponse.data.content.status}`);
    console.log(`Created: ${new Date(formResponse.data.content.created_at).toLocaleDateString()}`);
    console.log('');
    
    // Get form questions/fields
    const questionsResponse = await axios.get(`https://api.jotform.com/form/${formId}/questions`, {
      params: { apiKey: process.env.JOTFORM_API_KEY }
    });
    
    const questions = questionsResponse.data.content || {};
    console.log('📝 Form Fields:');
    console.log('===============');
    
    Object.entries(questions).forEach(([id, question]) => {
      console.log(`Field ${id}: ${question.text || 'No label'} (${question.type})`);
      if (question.name) console.log(`   Name: ${question.name}`);
      console.log('');
    });
    
    // Get recent submissions to see the data format
    const submissionsResponse = await axios.get(`https://api.jotform.com/form/${formId}/submissions`, {
      params: { 
        apiKey: process.env.JOTFORM_API_KEY, 
        limit: 3,
        orderby: 'created_at',
        direction: 'DESC'
      }
    });
    
    const submissions = submissionsResponse.data.content || [];
    console.log(`📥 Recent Submissions (${submissions.length}):`);
    console.log('==========================================');
    
    submissions.forEach((submission, index) => {
      console.log(`\nSubmission ${index + 1} (ID: ${submission.id}):`);
      console.log(`Created: ${new Date(submission.created_at).toLocaleString()}`);
      console.log('Answers:');
      
      Object.entries(submission.answers || {}).forEach(([fieldId, field]) => {
        console.log(`  Field ${fieldId}: ${JSON.stringify(field.answer)} (${typeof field.answer})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugWebAppForm();
