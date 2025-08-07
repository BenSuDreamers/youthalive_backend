const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;

console.log('🔍 JotForm Form Discovery Script');
console.log('=================================');
console.log('Searching for Stadium 25 form and checking recent submissions');

async function discoverStadiumForms() {
  try {
    console.log('\n📊 STEP 1: Get all forms from JotForm account');
    
    const formsResponse = await axios.get('https://api.jotform.com/user/forms', {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 50,
        orderby: 'created_at',
        direction: 'DESC'
      },
      timeout: 30000
    });
    
    const forms = formsResponse.data.content || [];
    console.log(`✅ Found ${forms.length} forms in account`);
    
    // Look for Stadium forms
    const stadiumForms = forms.filter(form => 
      form.title && (
        form.title.toLowerCase().includes('stadium') || 
        form.title.toLowerCase().includes('25') ||
        form.title.toLowerCase().includes('youth alive')
      )
    );
    
    console.log('\n🏟️ Stadium/Youth Alive related forms:');
    stadiumForms.forEach((form, i) => {
      console.log(`   ${i + 1}. ${form.title} (ID: ${form.id})`);
      console.log(`      Status: ${form.status}`);
      console.log(`      Created: ${new Date(parseInt(form.created_at) * 1000).toLocaleString()}`);
      console.log(`      URL: ${form.url}`);
      console.log('');
    });
    
    console.log('\n📊 STEP 2: Check recent submissions in each Stadium form');
    
    for (const form of stadiumForms) {
      console.log(`\n🔍 Checking form: ${form.title} (${form.id})`);
      
      try {
        const submissionsResponse = await axios.get(`https://api.jotform.com/form/${form.id}/submissions`, {
          params: {
            apiKey: JOTFORM_API_KEY,
            limit: 10,
            orderby: 'created_at',
            direction: 'DESC'
          },
          timeout: 30000
        });
        
        const submissions = submissionsResponse.data.content || [];
        console.log(`   • Recent submissions: ${submissions.length}`);
        
        if (submissions.length > 0) {
          console.log(`   • Latest submission: ${new Date(parseInt(submissions[0].created_at) * 1000).toLocaleString()}`);
          
          // Check if our target emails are in recent submissions
          const targetEmails = ['johnson.bijin.99@gmail.com', 'benjamin@youthalivesa.org'];
          
          for (const submission of submissions.slice(0, 10)) {
            const answers = submission.answers || {};
            
            // Check for email in various fields
            let foundEmail = '';
            for (const fieldId of Object.keys(answers)) {
              const answer = answers[fieldId];
              if (answer && answer.answer) {
                const answerText = String(answer.answer).toLowerCase();
                if (answerText.includes('@') && answerText.includes('.')) {
                  if (targetEmails.includes(answerText)) {
                    foundEmail = answerText;
                    break;
                  }
                }
              }
            }
            
            if (foundEmail) {
              console.log(`   🎯 FOUND TARGET EMAIL: ${foundEmail}`);
              console.log(`      Submission ID: ${submission.id}`);
              console.log(`      Date: ${new Date(parseInt(submission.created_at) * 1000).toLocaleString()}`);
              
              // Show all fields for debugging
              console.log('      Form fields:');
              for (const fieldId of Object.keys(answers)) {
                const answer = answers[fieldId];
                if (answer && answer.answer) {
                  console.log(`         Field ${fieldId}: ${JSON.stringify(answer.answer)}`);
                }
              }
            }
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking submissions: ${error.message}`);
      }
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    if (stadiumForms.length > 0) {
      console.log('✅ Found Stadium-related forms in account');
      console.log('📋 Check which form has the most recent submissions');
      console.log('🎯 Look for target emails in the submission details above');
    } else {
      console.log('❌ No Stadium forms found');
      console.log('💡 Check if form titles have changed or try different search terms');
    }
    
  } catch (error) {
    console.error('\n❌ Form discovery failed:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

// Run the discovery
if (require.main === module) {
  discoverStadiumForms()
    .then(() => {
      console.log('\n✅ Form discovery completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Discovery failed:', error);
      process.exit(1);
    });
}

module.exports = { discoverStadiumForms };
