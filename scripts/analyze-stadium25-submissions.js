const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_FORM_ID = '251481969313867';

console.log('🔍 Stadium 25 Form Analysis');
console.log('===========================');
console.log('Analyzing recent submissions to understand field structure');

async function analyzeSubmissions() {
  try {
    console.log('\n📊 Fetching recent Stadium 25 submissions...');
    
    const response = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}/submissions`, {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 20,
        orderby: 'created_at',
        direction: 'DESC'
      },
      timeout: 30000
    });
    
    const submissions = response.data.content || [];
    console.log(`✅ Retrieved ${submissions.length} recent submissions`);
    
    if (submissions.length === 0) {
      console.log('❌ No submissions found in Stadium 25 form');
      return;
    }
    
    console.log('\n📋 FIELD STRUCTURE ANALYSIS');
    console.log('===========================');
    
    // Analyze first few submissions to understand field structure
    for (let i = 0; i < Math.min(3, submissions.length); i++) {
      const submission = submissions[i];
      const answers = submission.answers || {};
      
      console.log(`\n📝 Submission ${i + 1} (ID: ${submission.id})`);
      console.log(`   Created: ${new Date(parseInt(submission.created_at) * 1000).toLocaleString()}`);
      console.log('   Fields:');
      
      const fieldKeys = Object.keys(answers).sort((a, b) => parseInt(a) - parseInt(b));
      
      for (const fieldId of fieldKeys) {
        const answer = answers[fieldId];
        if (answer && answer.answer) {
          let answerText = answer.answer;
          
          // Handle object answers (like name fields)
          if (typeof answerText === 'object') {
            answerText = JSON.stringify(answerText);
          } else {
            answerText = String(answerText);
          }
          
          // Truncate long answers
          if (answerText.length > 100) {
            answerText = answerText.substring(0, 100) + '...';
          }
          
          console.log(`      Field ${fieldId}: ${answerText}`);
          
          // Flag potential email fields
          if (answerText.includes('@') && answerText.includes('.')) {
            console.log(`         ^^^^^ EMAIL FIELD DETECTED ^^^^^`);
          }
          
          // Flag potential name fields
          if (typeof answer.answer === 'object' && (answer.answer.first || answer.answer.last)) {
            console.log(`         ^^^^^ NAME FIELD DETECTED ^^^^^`);
          }
          
          // Flag potential day selection fields
          if (answerText.toLowerCase().includes('friday') || answerText.toLowerCase().includes('saturday')) {
            console.log(`         ^^^^^ DAY SELECTION FIELD DETECTED ^^^^^`);
          }
          
          // Flag potential invoice fields
          if (answerText.match(/^\d{6}$/) || answerText.toLowerCase().includes('invoice')) {
            console.log(`         ^^^^^ POTENTIAL INVOICE FIELD ^^^^^`);
          }
        }
      }
    }
    
    console.log('\n📧 EMAIL ADDRESS ANALYSIS');
    console.log('=========================');
    
    const emailCounts = {};
    const emailFields = new Set();
    
    for (const submission of submissions) {
      const answers = submission.answers || {};
      
      for (const fieldId of Object.keys(answers)) {
        const answer = answers[fieldId];
        if (answer && answer.answer) {
          const answerText = String(answer.answer).toLowerCase();
          
          if (answerText.includes('@') && answerText.includes('.')) {
            emailFields.add(fieldId);
            emailCounts[answerText] = (emailCounts[answerText] || 0) + 1;
          }
        }
      }
    }
    
    console.log(`📊 Email fields detected: ${Array.from(emailFields).join(', ')}`);
    console.log(`📊 Unique email addresses found: ${Object.keys(emailCounts).length}`);
    
    if (Object.keys(emailCounts).length > 0) {
      console.log('\n📋 Email addresses in recent submissions:');
      const sortedEmails = Object.entries(emailCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
      sortedEmails.forEach(([email, count], i) => {
        console.log(`   ${i + 1}. ${email} (${count} submission${count > 1 ? 's' : ''})`);
        
        // Check if this is close to our target emails
        const targets = ['johnson.bijin.99@gmail.com', 'benjamin@youthalivesa.org'];
        for (const target of targets) {
          if (email.includes(target.split('@')[0]) || target.includes(email.split('@')[0])) {
            console.log(`      🎯 POTENTIAL MATCH for ${target}`);
          }
        }
      });
    }
    
    console.log('\n💡 SUMMARY & RECOMMENDATIONS');
    console.log('============================');
    console.log(`✅ Stadium 25 form has ${submissions.length} recent submissions`);
    console.log(`✅ Email fields detected in field(s): ${Array.from(emailFields).join(', ')}`);
    
    if (emailFields.size === 0) {
      console.log('❌ No email fields detected - check form structure');
    } else {
      console.log('✅ Email extraction should work with the detected fields');
    }
    
    const targets = ['johnson.bijin.99@gmail.com', 'benjamin@youthalivesa.org'];
    const foundTargets = Object.keys(emailCounts).filter(email => targets.includes(email));
    
    if (foundTargets.length > 0) {
      console.log(`🎯 Target emails found: ${foundTargets.join(', ')}`);
    } else {
      console.log('❌ Target emails not found in recent submissions');
      console.log('💡 Either:');
      console.log('   1. These emails have not submitted recently');
      console.log('   2. They submitted with different email addresses');
      console.log('   3. They submitted to a different form');
    }
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

// Run the analysis
if (require.main === module) {
  analyzeSubmissions()
    .then(() => {
      console.log('\n✅ Analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeSubmissions };
