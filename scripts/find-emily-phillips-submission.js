const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_FORM_ID = '251481969313867'; // Stadium 25 form ID

const TARGET_EMAIL = 'emily.phillips@student.ecc.sa.edu.au';

console.log('🔍 Stadium 25 - Emily Phillips Submission Search');
console.log('================================================');
console.log(`Searching for: ${TARGET_EMAIL}`);

async function findEmilyPhillipsSubmission() {
  try {
    console.log('\n🔄 STEP 1: Confirming Stadium 25 form');
    
    const formResponse = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}`, {
      params: {
        apiKey: JOTFORM_API_KEY
      },
      timeout: 30000
    });
    
    console.log(`✅ Form confirmed: ${formResponse.data.content.title}`);
    console.log(`   Form ID: ${STADIUM_25_FORM_ID}`);
    
    console.log('\n🔄 STEP 2: Searching ALL submissions for Emily Phillips');
    
    let allSubmissions = [];
    let offset = 0;
    const limit = 1000;
    let hasMoreSubmissions = true;
    let batchCount = 0;
    
    // Search through all submissions
    while (hasMoreSubmissions) {
      batchCount++;
      console.log(`   📦 Batch ${batchCount}: Fetching submissions (offset: ${offset})...`);
      
      const response = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}/submissions`, {
        params: {
          apiKey: JOTFORM_API_KEY,
          limit: limit,
          offset: offset,
          orderby: 'created_at',
          direction: 'DESC'
        },
        timeout: 30000
      });
      
      const submissions = response.data.content || [];
      allSubmissions = allSubmissions.concat(submissions);
      
      console.log(`   ✅ Retrieved ${submissions.length} submissions in batch ${batchCount}`);
      
      // Check if we've reached the end
      if (submissions.length < limit) {
        hasMoreSubmissions = false;
      } else {
        offset += limit;
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Search Summary:`);
    console.log(`   • Total submissions scanned: ${allSubmissions.length}`);
    console.log(`   • Batches processed: ${batchCount}`);
    
    console.log('\n🔍 STEP 3: Analyzing submissions for Emily Phillips');
    
    let foundSubmissions = [];
    
    for (const submission of allSubmissions) {
      const answers = submission.answers || {};
      
      // Check all fields for the target email
      for (const fieldId of Object.keys(answers)) {
        const answer = answers[fieldId];
        if (answer && answer.answer) {
          const answerText = String(answer.answer).toLowerCase().trim();
          
          if (answerText === TARGET_EMAIL.toLowerCase()) {
            foundSubmissions.push({
              submission,
              emailFieldId: fieldId,
              answers
            });
            break;
          }
        }
      }
    }
    
    console.log(`\n📧 Search Results for ${TARGET_EMAIL}:`);
    console.log('===============================================');
    
    if (foundSubmissions.length === 0) {
      console.log('❌ No submissions found for this email address');
      console.log('\n🔍 Possible reasons:');
      console.log('   • Email address not submitted to Stadium 25 form');
      console.log('   • Different spelling/formatting of email');
      console.log('   • Submission might be in a different form');
      
      console.log('\n💡 Let me check for similar email patterns...');
      
      // Search for similar emails
      const emailPrefix = TARGET_EMAIL.split('@')[0]; // emily.phillips
      const emailDomain = TARGET_EMAIL.split('@')[1]; // student.ecc.sa.edu.au
      
      console.log(`   Searching for emails containing: "${emailPrefix}" or "${emailDomain}"`);
      
      let similarEmails = [];
      
      for (const submission of allSubmissions) {
        const answers = submission.answers || {};
        
        for (const fieldId of Object.keys(answers)) {
          const answer = answers[fieldId];
          if (answer && answer.answer) {
            const answerText = String(answer.answer).toLowerCase();
            
            if (answerText.includes('@') && 
                (answerText.includes(emailPrefix.toLowerCase()) || 
                 answerText.includes('emily') || 
                 answerText.includes('phillips') ||
                 answerText.includes('ecc.sa.edu.au'))) {
              similarEmails.push({
                email: answerText,
                submissionId: submission.id,
                fieldId: fieldId
              });
            }
          }
        }
      }
      
      if (similarEmails.length > 0) {
        console.log(`\n📧 Found ${similarEmails.length} similar email(s):`);
        similarEmails.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.email} (Field ${item.fieldId}, Submission ${item.submissionId})`);
        });
      } else {
        console.log('\n❌ No similar emails found either');
      }
      
    } else {
      console.log(`✅ Found ${foundSubmissions.length} submission(s) for ${TARGET_EMAIL}:`);
      
      foundSubmissions.forEach((item, index) => {
        const { submission, emailFieldId, answers } = item;
        
        console.log(`\n📋 SUBMISSION ${index + 1}:`);
        console.log('==================');
        console.log(`   Submission ID: ${submission.id}`);
        console.log(`   Created: ${new Date(parseInt(submission.created_at) * 1000).toLocaleString()}`);
        console.log(`   Email found in field: ${emailFieldId}`);
        
        // Extract key information
        console.log('\n   📊 EXTRACTED DATA:');
        
        // Name (usually field 3)
        if (answers['3']) {
          const nameAnswer = answers['3'].answer;
          let name = '';
          if (typeof nameAnswer === 'object') {
            name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
          } else {
            name = String(nameAnswer);
          }
          console.log(`   👤 Name: ${name}`);
        }
        
        // Email (field where we found it)
        console.log(`   📧 Email: ${answers[emailFieldId].answer}`);
        
        // Invoice (field 11)
        if (answers['11']) {
          console.log(`   🎫 Invoice: ${answers['11'].answer}`);
        }
        
        // Day selection (field 19)
        if (answers['19']) {
          console.log(`   📅 Day Selection: ${answers['19'].answer}`);
        }
        
        // Church/Youth Ministry (field 23)
        if (answers['23']) {
          console.log(`   ⛪ Church/Ministry: ${answers['23'].answer}`);
        }
        
        console.log('\n   🔍 ALL FORM FIELDS:');
        Object.keys(answers).forEach(fieldId => {
          const answer = answers[fieldId];
          if (answer && answer.answer) {
            let displayValue = answer.answer;
            if (typeof displayValue === 'object') {
              displayValue = JSON.stringify(displayValue);
            }
            console.log(`      Field ${fieldId}: ${displayValue}`);
          }
        });
      });
    }
    
  } catch (error) {
    console.error('\n❌ Search failed:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Run the search
if (require.main === module) {
  findEmilyPhillipsSubmission()
    .then(() => {
      console.log('\n✅ Emily Phillips submission search completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Search failed:', error);
      process.exit(1);
    });
}

module.exports = { findEmilyPhillipsSubmission };
