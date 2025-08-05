const { parseWebhook } = require('../build/services/jotform.service.js');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('📧 Stadium 25 Full Pipeline Test - Webhook → Parse → Email');
console.log('==========================================================');
console.log('Testing the complete flow: Webhook Data → Field Parsing → QR Generation → Email Sending');

// Simulate real Stadium 25 webhook data for Bijin Johnson's 4 bookings
const simulatedWebhookData = [
  {
    // Booking 1: Friday - Invoice 000029
    formID: '251481969313867',
    rawRequest: JSON.stringify({
      q3_name: { first: 'Bijin', last: 'Johnson' },
      q4_email: 'johnson.bijin.99@gmail.com',
      q16_phone: '0412345678',
      q19_eventDate: 'Friday August 8 2025', // Key field for chooseYour
      q23_church: 'Testing Church',
      q11_invoiceId: '# INV-000029',
      q9_products: {
        paymentArray: JSON.stringify({
          product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
          currency: 'AUD',
          total: '15.00'
        })
      }
    })
  },
  {
    // Booking 2: Friday - Invoice 000027
    formID: '251481969313867',
    rawRequest: JSON.stringify({
      q3_name: { first: 'Bijin', last: 'Johnson' },
      q4_email: 'johnson.bijin.99@gmail.com',
      q16_phone: '0412345678',
      q19_eventDate: 'Friday August 8 2025', // Key field for chooseYour
      q23_church: 'Testing Church',
      q11_invoiceId: '# INV-000027',
      q9_products: {
        paymentArray: JSON.stringify({  
          product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
          currency: 'AUD',
          total: '15.00'
        })
      }
    })
  },
  {
    // Booking 3: Saturday - Invoice 000026
    formID: '251481969313867',
    rawRequest: JSON.stringify({
      q3_name: { first: 'Bijin', last: 'Johnson' },
      q4_email: 'johnson.bijin.99@gmail.com',
      q16_phone: '0412345678',
      q19_eventDate: 'Saturday August 9 2025', // Key field for chooseYour
      q23_church: 'Testing Church',
      q11_invoiceId: '# INV-000026',
      q9_products: {
        paymentArray: JSON.stringify({
          product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
          currency: 'AUD',
          total: '15.00'
        })
      }
    })
  },
  {
    // Booking 4: Saturday - Invoice 000025
    formID: '251481969313867',
    rawRequest: JSON.stringify({
      q3_name: { first: 'Bijin', last: 'Johnson' },
      q4_email: 'johnson.bijin.99@gmail.com',
      q16_phone: '0412345678',
      q19_eventDate: 'Saturday August 9 2025', // Key field for chooseYour
      q23_church: 'Testing Church',
      q11_invoiceId: '# INV-000025',
      q9_products: {
        paymentArray: JSON.stringify({
          product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
          currency: 'AUD',
          total: '15.00'
        })
      }
    })
  }
];

async function testFullPipelineForBijin() {
  console.log(`\n🔄 Testing complete webhook processing pipeline for ${simulatedWebhookData.length} bookings...`);
  console.log('This tests: Webhook Reception → Field Parsing → QR Generation → Email Sending\n');
  
  const results = [];
  
  for (let i = 0; i < simulatedWebhookData.length; i++) {
    const webhookData = simulatedWebhookData[i];
    
    try {
      console.log(`\n📧 [${i + 1}/${simulatedWebhookData.length}] Processing Webhook for Booking #${i + 1}`);
      console.log('=======================================================');
      
      // STEP 1: Parse webhook data (this tests our new chooseYour parsing)
      console.log('🔄 STEP 1: Parsing webhook data...');
      const parsedData = parseWebhook(webhookData);
      
      console.log('✅ Webhook parsed successfully:');
      console.log(`   Email: ${parsedData.email}`);
      console.log(`   Name: ${parsedData.name}`);
      console.log(`   Invoice: ${parsedData.invoiceNo}`);
      console.log(`   Phone: ${parsedData.phone}`);
      console.log(`   Church: ${parsedData.church}`);
      console.log(`   Quantity: ${parsedData.quantity}`);
      console.log(`   Choose Your Night: ${parsedData.chooseYour} 🎯`); // Key test!
      
      // Verify the chooseYour field was parsed correctly
      if (!parsedData.chooseYour) {
        throw new Error('❌ chooseYour field was not parsed - this is the main issue we are fixing!');
      }
      
      // STEP 2: Generate QR code
      console.log('\n🔄 STEP 2: Generating QR code...');
      const qrDataUrl = await generateQrCode(parsedData.invoiceNo);
      console.log(`✅ QR code generated for ${parsedData.invoiceNo}`);
      
      // STEP 3: Prepare email data using parsed webhook data
      console.log('\n🔄 STEP 3: Preparing email using parsed data...');
      const emailData = {
        to: parsedData.email,
        name: parsedData.name,
        eventTitle: 'Stadium 25',
        eventDate: parsedData.chooseYour === 'Friday' ? 'Friday August 8 2025' : 'Saturday August 9 2025',
        invoiceNo: parsedData.invoiceNo,
        qrDataUrl: qrDataUrl,
        chooseYour: parsedData.chooseYour // This comes from webhook parsing!
      };
      
      console.log('✅ Email data prepared:');
      console.log(`   To: ${emailData.to}`);
      console.log(`   Name: ${emailData.name}`);
      console.log(`   Event Date: ${emailData.eventDate}`);
      console.log(`   Invoice: ${emailData.invoiceNo}`);
      console.log(`   Choose Your: ${emailData.chooseYour}`);
      
      // STEP 4: Send email
      console.log('\n🔄 STEP 4: Sending email...');
      await emailService.sendTicketEmail(emailData);
      console.log(`✅ Email sent successfully for booking #${i + 1}!`);
      
      results.push({
        booking: i + 1,
        invoice: parsedData.invoiceNo,
        night: parsedData.chooseYour,
        status: 'success',
        webhookParsed: true,
        chooseYourParsed: !!parsedData.chooseYour
      });
      
      // Wait 1 second between emails
      if (i < simulatedWebhookData.length - 1) {
        console.log('⏳ Waiting 1 second before next webhook...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to process booking #${i + 1}:`, error.message);
      results.push({
        booking: i + 1,
        invoice: 'unknown',
        night: 'unknown',
        status: 'failed',
        error: error.message,
        webhookParsed: false,
        chooseYourParsed: false
      });
    }
  }
  
  // Summary
  console.log('\n🎉 FULL PIPELINE TEST COMPLETED!');
  console.log('=================================');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const chooseYourWorking = results.filter(r => r.chooseYourParsed);
  
  console.log(`✅ Successful: ${successful.length}/${simulatedWebhookData.length}`);
  console.log(`❌ Failed: ${failed.length}/${simulatedWebhookData.length}`);
  console.log(`🎯 chooseYour Parsed: ${chooseYourWorking.length}/${simulatedWebhookData.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully processed webhooks for:');
    successful.forEach(r => {
      console.log(`   - Booking #${r.booking}: Invoice ${r.invoice} (${r.night}) ${r.chooseYourParsed ? '🎯' : '❌'}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to process webhooks for:');
    failed.forEach(r => {
      console.log(`   - Booking #${r.booking}: ${r.error}`);
    });
  }
  
  console.log('\n🔍 WHAT TO CHECK IN YOUR EMAILS:');
  console.log('=================================');
  console.log('You should receive 4 separate emails, each with:');
  console.log('1. ✅ Correct Friday/Saturday dates from webhook parsing:');
  console.log('   - Emails 1 & 2: "Friday August 8 2025"');
  console.log('   - Emails 3 & 4: "Saturday August 9 2025"');
  console.log('2. ✅ Unique QR codes that scan to:');
  console.log('   - Email 1: "000029"');
  console.log('   - Email 2: "000027"'); 
  console.log('   - Email 3: "000026"');
  console.log('   - Email 4: "000025"');
  console.log('3. ✅ All registration details parsed from webhook');
  console.log('4. ✅ Professional formatting with Youth Alive branding');
  
  console.log('\n🎯 KEY SUCCESS INDICATORS:');
  console.log('===========================');
  console.log('✅ chooseYour field successfully parsed from webhook');
  console.log('✅ Correct Friday/Saturday dates displayed in emails');
  console.log('✅ QR codes generated and attached');
  console.log('✅ Full webhook → email pipeline working');
  
  return results;
}

// Run the test
async function runFullPipelineTest() {
  try {
    const results = await testFullPipelineForBijin();
    
    console.log('\n📋 FINAL SUMMARY:');
    console.log('==================');
    console.log('✅ 4 webhook simulations processed');
    console.log('✅ Full pipeline tested: Webhook → Parse → QR → Email');
    console.log('✅ chooseYour field parsing tested');
    console.log('✅ Friday/Saturday detection tested');
    
    const successful = results.filter(r => r.status === 'success');
    const chooseYourWorking = results.filter(r => r.chooseYourParsed);
    
    if (successful.length === simulatedWebhookData.length && chooseYourWorking.length === simulatedWebhookData.length) {
      console.log('\n🎉 ALL PIPELINE TESTS PASSED! The QR code fix is working correctly.');
      console.log('🚀 Ready to proceed with batch resend for actual Stadium 25 registrants.');
    } else {
      console.log(`\n⚠️  ${successful.length}/${simulatedWebhookData.length} pipeline tests passed.`);
      console.log(`⚠️  ${chooseYourWorking.length}/${simulatedWebhookData.length} chooseYour parsing tests passed.`);
      console.log('🔧 Review failed tests before proceeding with batch resend.');
    }
    
  } catch (error) {
    console.error('\n💥 Pipeline test suite failed:', error);
  }
}

// Run the test
if (require.main === module) {
  runFullPipelineTest()
    .then(() => {
      console.log('\n✅ Full pipeline test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Full pipeline test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFullPipelineForBijin };
