const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugJotformFields() {
  try {
    // Check Stadium 25 form
    const formId = '251481969313867';
    console.log(`\n🔍 Debugging form ${formId}...`);
    
    // Get form details
    const formResponse = await axios.get(
      `https://api.jotform.com/form/${formId}`,
      { params: { apiKey: process.env.JOTFORM_API_KEY } }
    );
    
    console.log('\n📋 Form Questions:');
    if (formResponse.data.content?.questions) {
      Object.entries(formResponse.data.content.questions).forEach(([id, question]) => {
        console.log(`  Field ${id}: ${question.text} (${question.type})`);
      });
    }
    
    // Get a few sample submissions
    const submissionsResponse = await axios.get(
      `https://api.jotform.com/form/${formId}/submissions`,
      {
        params: { apiKey: process.env.JOTFORM_API_KEY, limit: 3 },
        timeout: 30000
      }
    );
    
    const submissions = submissionsResponse.data.content || [];
    console.log(`\n📝 Sample submissions (${submissions.length}):`);
    
    submissions.forEach((submission, index) => {
      console.log(`\n  Submission ${index + 1} (ID: ${submission.id}):`);
      Object.entries(submission.answers || {}).forEach(([fieldId, field]) => {
        console.log(`    Field ${fieldId}: ${JSON.stringify(field.answer)} (${typeof field.answer})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

console.log('🔍 Starting Jotform field debugging...');
debugJotformFields();
