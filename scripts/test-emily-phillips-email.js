const axios = require('axios');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_FORM_ID = '251481969313867';

const EMILY_EMAIL = 'emily.phillips@student.ecc.sa.edu.au';
const TEST_EMAIL = 'johnson.bijin.99@gmail.com'; // Test destination

console.log('🔧 Emily Phillips Email Test - QR Code Verification');
console.log('===================================================');
console.log(`📋 Original recipient: ${EMILY_EMAIL}`);
console.log(`📧 Test destination: ${TEST_EMAIL}`);
console.log('This will send Emily\'s exact confirmation email to your address for verification');

async function testEmilyPhillipsEmail() {
  try {
    console.log('\n🔄 STEP 1: Fetch Emily Phillips\' submission data');
    
    // Get Emily's submission data
    const response = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}/submissions`, {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 1000,
        orderby: 'created_at',
        direction: 'DESC'
      },
      timeout: 30000
    });
    
    const submissions = response.data.content || [];
    console.log(`✅ Retrieved ${submissions.length} submissions`);
    
    // Find Emily's submission
    let emilySubmission = null;
    
    for (const submission of submissions) {
      const answers = submission.answers || {};
      
      // Check field 4 for email
      if (answers['4'] && answers['4'].answer) {
        const email = String(answers['4'].answer).toLowerCase().trim();
        if (email === EMILY_EMAIL.toLowerCase()) {
          emilySubmission = {
            submission,
            answers
          };
          break;
        }
      }
    }
    
    if (!emilySubmission) {
      throw new Error(`Emily Phillips submission not found for ${EMILY_EMAIL}`);
    }
    
    console.log('✅ Found Emily Phillips\' submission');
    console.log(`   Submission ID: ${emilySubmission.submission.id}`);
    
    console.log('\n🔄 STEP 2: Extract submission data');
    
    const { answers } = emilySubmission;
    
    // Extract name (field 3)
    let name = 'Emily Phillips';
    if (answers['3']) {
      const nameAnswer = answers['3'].answer;
      if (typeof nameAnswer === 'object') {
        name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
      } else {
        name = String(nameAnswer);
      }
    }
    
    // Extract email (field 4)
    const originalEmail = answers['4'].answer;
    
    // Extract invoice (field 11)
    let invoiceNo = 'TEST-EMILY-001';
    if (answers['11']) {
      invoiceNo = String(answers['11'].answer);
      // Remove "# INV-" prefix if present
      invoiceNo = invoiceNo.replace(/^#\s*INV-/, '');
    }
    
    // Extract day selection (field 19)
    let chooseYour = 'Saturday';
    if (answers['19']) {
      const dayAnswer = String(answers['19'].answer).toLowerCase();
      if (dayAnswer.includes('friday')) {
        chooseYour = 'Friday';
      } else if (dayAnswer.includes('saturday')) {
        chooseYour = 'Saturday';
      }
    }
    
    console.log('📊 Extracted data:');
    console.log(`   👤 Name: ${name}`);
    console.log(`   📧 Original Email: ${originalEmail}`);
    console.log(`   🎫 Invoice: ${invoiceNo}`);
    console.log(`   📅 Day: ${chooseYour}`);
    
    console.log('\n🔄 STEP 3: Generate QR code');
    
    const qrDataUrl = await generateQrCode(invoiceNo);
    console.log('✅ QR code generated successfully');
    console.log(`   📋 QR data length: ${qrDataUrl.length} characters`);
    console.log(`   📋 Invoice encoded: ${invoiceNo}`);
    
    console.log('\n🔄 STEP 4: Prepare test email');
    
    const emailData = {
      to: TEST_EMAIL, // Send to your email for testing
      name: name,
      eventTitle: 'Stadium 25',
      eventDate: chooseYour === 'Friday' ? 'Friday August 8 2025' : 'Saturday August 9 2025',
      invoiceNo: invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: chooseYour
    };
    
    console.log('📧 Email configuration:');
    console.log(`   📧 To: ${emailData.to} (TEST ADDRESS)`);
    console.log(`   👤 Name: ${emailData.name}`);
    console.log(`   📅 Event Date: ${emailData.eventDate}`);
    console.log(`   🎫 Invoice: ${emailData.invoiceNo}`);
    console.log(`   🌙 Day Choice: ${emailData.chooseYour}`);
    
    console.log('\n🔄 STEP 5: Send test email using updated QR service');
    
    await emailService.sendTicketEmail(emailData);
    
    console.log('✅ Test email sent successfully!');
    
    console.log('\n🎉 EMILY PHILLIPS EMAIL TEST COMPLETE!');
    console.log('=====================================');
    console.log(`📧 Check your inbox: ${TEST_EMAIL}`);
    console.log('🔍 What to verify:');
    console.log('   ✅ QR code displays properly (not blank box)');
    console.log('   ✅ Invoice number matches: ' + invoiceNo);
    console.log('   ✅ Day selection is correct: ' + chooseYour);
    console.log('   ✅ Name displays as: ' + name);
    console.log('   ✅ Fallback instructions are visible');
    console.log('   ✅ Downloadable QR attachment present');
    
    console.log('\n📋 ORIGINAL SUBMISSION DETAILS:');
    console.log('==============================');
    console.log(`   Submission ID: ${emilySubmission.submission.id}`);
    console.log(`   Original Email: ${originalEmail}`);
    console.log(`   Submitted: ${new Date(parseInt(emilySubmission.submission.created_at) * 1000).toLocaleString()}`);
    
    console.log('\n💡 NEXT STEPS:');
    console.log('===============');
    console.log('1. Check the test email in your inbox');
    console.log('2. Verify QR code displays and scans correctly');
    console.log('3. If everything looks good, you can safely resend to Emily');
    console.log(`4. To resend to Emily, change TEST_EMAIL to: ${EMILY_EMAIL}`);
    
  } catch (error) {
    console.error('\n❌ Test email failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testEmilyPhillipsEmail()
    .then(() => {
      console.log('\n✅ Emily Phillips email test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmilyPhillipsEmail };
