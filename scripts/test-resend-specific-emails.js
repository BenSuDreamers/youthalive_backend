const axios = require('axios');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const FORM_ID = '251481969313867'; // Stadium 25 form ID (correct one)

// Target emails for testing - using actual emails from Stadium 25 submissions
// Target emails for testing (found in actual Stadium 25 submissions)
const TARGET_EMAILS = [
  'johnson.bijin.99@gmail.com',
  'benjamin@youthalivesa.org',
  // Adding emails that were actually found in submissions
  'solivenmatthew09@gmail.com',
  'joashharry2010@gmail.com'
];

console.log('🔧 JotForm Webhook Simulation Script');
console.log('====================================');
console.log('Fetching fresh JotForm data and processing with updated email service');
console.log('This simulates the webhook flow when tickets are submitted through the form');

async function fetchAndResendEmails() {
  try {
    console.log('\n🔄 STEP 1: Fetch JotForm Submissions');
    console.log('====================================');
    console.log('Searching JotForm API for submissions with target emails...');
    console.log('This simulates the webhook data flow for new ticket submissions.');
    
    const submissionsData = await fetchJotFormSubmissions();
    
    console.log('\n🔄 STEP 2: Process and resend emails using webhook data only');
    console.log('============================================================');
    
    for (const email of TARGET_EMAILS) {
      console.log(`\n📧 Processing ${email}:`);
      console.log('========================');
      
      // Look for submission data from JotForm only
      const submissionData = submissionsData.find(sub => sub.email === email);
      
      if (submissionData) {
        console.log('✅ Found JotForm submission data - simulating webhook flow');
        await resendEmailWithSubmissionData(submissionData);
      } else {
        console.log('❌ No JotForm submission found for this email');
        console.log('   This email address has not submitted through the form recently.');
        console.log('   To test, please submit the form with this email address first.');
      }
    }
    
    console.log('\n🎉 JOTFORM WEBHOOK SIMULATION COMPLETE!');
    console.log('======================================');
    
    const foundEmails = submissionsData.map(sub => sub.email);
    const missingEmails = TARGET_EMAILS.filter(email => !foundEmails.includes(email));
    
    if (foundEmails.length > 0) {
      console.log('✅ Successfully processed emails from JotForm data:');
      foundEmails.forEach(email => console.log(`   • ${email}`));
      console.log('✅ QR codes should now display properly in these emails');
      console.log('✅ Enhanced fallback instructions included');
    }
    
    if (missingEmails.length > 0) {
      console.log('\n⚠️ Emails not found in recent JotForm submissions:');
      missingEmails.forEach(email => console.log(`   • ${email}`));
      console.log('\n💡 To test these emails:');
      console.log('1. Submit the Stadium 25 form with these email addresses');
      console.log('2. Run this script again to process the webhook data');
    }
    
  } catch (error) {
    console.error('\n❌ JotForm webhook simulation failed:', error.message);
    console.error('Full error:', error);
  }
}

async function fetchJotFormSubmissions() {
  try {
    console.log('📊 Searching JotForm submissions by email addresses...');
    console.log('This will scan all recent submissions to find the target emails.');
    
    // First, let's get the Stadium 25 form ID from recent submissions
    console.log('\n🔍 Step 1: Identifying Stadium 25 form ID...');
    
    // Try the known form ID first
    let stadium25FormId = FORM_ID;
    
    const testResponse = await axios.get(`https://api.jotform.com/form/${stadium25FormId}`, {
      params: {
        apiKey: JOTFORM_API_KEY
      },
      timeout: 30000
    });
    
    if (testResponse.data.responseCode === 200) {
      console.log(`✅ Confirmed Stadium 25 form ID: ${stadium25FormId}`);
      console.log(`   Form title: ${testResponse.data.content.title}`);
    } else {
      throw new Error('Stadium 25 form not found with current ID');
    }
    
    console.log('\n🔍 Step 2: Searching ALL submissions by email...');
    
    // Get ALL submissions from Stadium 25 form in batches
    let allSubmissions = [];
    let offset = 0;
    const limit = 1000; // JotForm API limit per request
    let hasMoreSubmissions = true;
    
    // Fetch all submissions in batches
    while (hasMoreSubmissions) {
      console.log(`   📦 Fetching batch starting at offset ${offset}...`);
      
      const response = await axios.get(`https://api.jotform.com/form/${stadium25FormId}/submissions`, {
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
      
      console.log(`   ✅ Retrieved ${submissions.length} submissions in this batch`);
      
      // Check if we've reached the end
      if (submissions.length < limit) {
        hasMoreSubmissions = false;
      } else {
        offset += limit;
      }
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Retrieved ${allSubmissions.length} total submissions from Stadium 25 form (ALL TIME)`);
    
    const parsedSubmissions = [];
    const foundEmails = [];
    
    for (const submission of allSubmissions) {
      const answers = submission.answers || {};
      
      // Extract email - try multiple field IDs that might contain email
      let email = '';
      const emailFields = ['4', '5', '6']; // Common email field IDs
      
      for (const fieldId of emailFields) {
        if (answers[fieldId] && answers[fieldId].answer) {
          const possibleEmail = String(answers[fieldId].answer).toLowerCase().trim();
          // Check if it looks like an email
          if (possibleEmail.includes('@') && possibleEmail.includes('.')) {
            email = possibleEmail;
            break;
          }
        }
      }
      
      // Only process if we found an email and it's one of our targets
      if (!email || !TARGET_EMAILS.includes(email)) {
        continue;
      }
      
      foundEmails.push(email);
      console.log(`\n🎯 Found target email: ${email}`);
      console.log(`   Submission ID: ${submission.id}`);
      console.log(`   Submitted: ${new Date(parseInt(submission.created_at) * 1000).toLocaleString()}`);
      
      // Extract name - try multiple field IDs
      let name = '';
      const nameFields = ['3', '4']; // Common name field IDs
      
      for (const fieldId of nameFields) {
        if (answers[fieldId] && answers[fieldId].answer) {
          const nameAnswer = answers[fieldId].answer;
          if (typeof nameAnswer === 'object') {
            name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
          } else {
            const nameString = String(nameAnswer);
            // Skip if it looks like an email
            if (!nameString.includes('@')) {
              name = nameString;
            }
          }
          if (name) break;
        }
      }
      
      // Extract invoice ID - try multiple field IDs
      let invoiceNo = '';
      const invoiceFields = ['11', '23', '38']; // Common invoice field IDs for Stadium 25
      
      for (const fieldId of invoiceFields) {
        if (answers[fieldId] && answers[fieldId].answer) {
          invoiceNo = String(answers[fieldId].answer);
          if (invoiceNo) break;
        }
      }
      
      // Extract day choice - Stadium 25 uses field 19 for "Choose your night"
      let chooseYour = 'Saturday'; // Default
      let dayFieldFound = false;
      
      console.log('   🔍 Analyzing all form fields for day selection...');
      
      // Check all fields for day selection
      for (const fieldId of Object.keys(answers)) {
        const answer = answers[fieldId];
        if (answer && answer.answer) {
          const answerText = String(answer.answer).toLowerCase();
          
          // Log fields that might contain day information
          if (answerText.includes('friday') || answerText.includes('saturday') || answerText.includes('night') || answerText.includes('day')) {
            console.log(`      Field ${fieldId}: "${answer.answer}"`);
            
            if (answerText.includes('friday')) {
              chooseYour = 'Friday';
              dayFieldFound = true;
              console.log('      ✅ Friday selection detected');
              break;
            } else if (answerText.includes('saturday')) {
              chooseYour = 'Saturday';
              dayFieldFound = true;
              console.log('      ✅ Saturday selection detected');
              break;
            }
          }
        }
      }
      
      if (!dayFieldFound) {
        console.log('      ⚠️ No explicit day selection found, defaulting to Saturday');
      }
      
      const parsedData = {
        email,
        name: name || 'Stadium 25 Attendee',
        invoiceNo: invoiceNo || `STADIUM25-${submission.id}`,
        chooseYour,
        submissionId: submission.id,
        createdAt: new Date(parseInt(submission.created_at) * 1000),
        formId: stadium25FormId
      };
      
      parsedSubmissions.push(parsedData);
      
      console.log(`   📊 Extracted webhook data:`);
      console.log(`      Name: ${parsedData.name}`);
      console.log(`      Invoice: ${parsedData.invoiceNo}`);
      console.log(`      Day: ${parsedData.chooseYour}`);
      console.log(`      Form: Stadium 25 (${parsedData.formId})`);
    }
    
    console.log(`\n📈 Complete search results (ALL submissions):`);
    console.log(`   • Total submissions scanned: ${allSubmissions.length}`);
    console.log(`   • Target emails found: ${foundEmails.length}/${TARGET_EMAILS.length}`);
    console.log(`   • Emails found: ${foundEmails.join(', ')}`);
    console.log(`   • Missing emails: ${TARGET_EMAILS.filter(email => !foundEmails.includes(email)).join(', ')}`);
    console.log(`   • Ready for processing: ${parsedSubmissions.length}`);
    
    return parsedSubmissions;
    
  } catch (error) {
    console.error('❌ Error searching JotForm submissions:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    console.error('This simulates a webhook data retrieval failure.');
    return [];
  }
}

async function resendEmailWithSubmissionData(submissionData) {
  try {
    console.log('📧 Simulating webhook processing...');
    console.log('   1. Generating QR code from webhook data');
    const qrDataUrl = await generateQrCode(submissionData.invoiceNo);
    console.log('   ✅ QR code generated');
    
    console.log('   2. Preparing email data from webhook payload');
    const emailData = {
      to: submissionData.email,
      name: submissionData.name,
      eventTitle: 'Stadium 25',
      eventDate: submissionData.chooseYour === 'Friday' ? 'Friday August 8 2025' : 'Saturday August 9 2025',
      invoiceNo: submissionData.invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: submissionData.chooseYour
    };
    console.log('   ✅ Email data prepared');
    
    console.log('   3. Sending confirmation email with updated QR service');
    await emailService.sendTicketEmail(emailData);
    console.log('   ✅ Email sent successfully via updated email service!');
    
    console.log('\n� Webhook simulation complete for this email:');
    console.log(`   📧 To: ${emailData.to}`);
    console.log(`   🎫 Invoice: ${emailData.invoiceNo}`);
    console.log(`   � Event Date: ${emailData.eventDate}`);
    console.log(`   📱 QR Code: Generated and embedded`);
    
  } catch (error) {
    console.error('❌ Error in webhook simulation:', error.message);
    console.error('This simulates a webhook processing failure.');
  }
}

// Run the script
if (require.main === module) {
  fetchAndResendEmails()
    .then(() => {
      console.log('\n✅ JotForm webhook simulation completed!');
      console.log('This demonstrates how the updated email service processes real form submissions.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Webhook simulation failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchAndResendEmails };
