const { parseWebhook } = require('../build/services/jotform.service.js');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🔍 Debug Live Stadium 25 Webhook Processing');
console.log('============================================');
console.log('This will test the exact same flow as a live webhook submission');

async function testLiveWebhookFlow() {
  try {
    // Simulate the exact webhook payload structure that JotForm sends
    console.log('\n🎯 STEP 1: Simulating Live JotForm Webhook Payload');
    const liveWebhookPayload = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: {
          first: "Test",
          last: "User"
        },
        q4_email: "johnson.bijin.99@gmail.com",
        q16_phone: "0412345678",
        q19_eventDate: "Saturday August 9 2025",
        q23_church: "Test Church",
        q11_invoiceId: "# INV-DEBUG001",
        q9_products: {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 15.00 AUD, Quantity: 1)"],
            currency: "AUD",
            total: "15.00"
          })
        }
      })
    };
    
    console.log('📦 Webhook payload created:', JSON.stringify(liveWebhookPayload, null, 2));
    
    console.log('\n🔄 STEP 2: Parsing webhook with parseWebhook function');
    const parsedData = await parseWebhook(liveWebhookPayload);
    console.log('✅ Parsed data:', JSON.stringify(parsedData, null, 2));
    
    console.log('\n🔄 STEP 3: Generating QR Code');
    const qrDataUrl = await generateQrCode(parsedData.invoiceNo);
    console.log(`✅ QR code generated. Length: ${qrDataUrl.length} characters`);
    console.log(`📋 QR data preview: ${qrDataUrl.substring(0, 50)}...`);
    
    // Check if QR is valid base64 PNG
    if (qrDataUrl.startsWith('data:image/png;base64,')) {
      console.log('✅ QR code format is correct (PNG base64)');
      
      // Test base64 decoding
      const base64Data = qrDataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      console.log(`✅ QR code buffer size: ${buffer.length} bytes`);
    } else {
      console.log('❌ QR code format is incorrect!');
    }
    
    console.log('\n🔄 STEP 4: Preparing Email Data');
    const emailData = {
      to: parsedData.email,
      name: parsedData.name,
      eventTitle: 'Stadium 25',
      eventDate: parsedData.chooseYour === 'Saturday' ? 'Saturday August 9 2025' : 'Friday August 8 2025',
      invoiceNo: parsedData.invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: parsedData.chooseYour
    };
    
    console.log('📧 Email data prepared:');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Name: ${emailData.name}`);
    console.log(`   Event Date: ${emailData.eventDate}`);
    console.log(`   Invoice: ${emailData.invoiceNo}`);
    console.log(`   Choose Your: ${emailData.chooseYour}`);
    console.log(`   QR Data URL Length: ${emailData.qrDataUrl.length}`);
    
    console.log('\n🔄 STEP 5: Sending Test Email');
    console.log('This will send an email using the exact same process as the live webhook...');
    
    await emailService.sendTicketEmail(emailData);
    
    console.log('✅ Email sent successfully!');
    
    console.log('\n🎉 LIVE WEBHOOK SIMULATION COMPLETE');
    console.log('===================================');
    console.log('✅ Webhook parsing: SUCCESS');
    console.log('✅ QR code generation: SUCCESS');
    console.log('✅ Email sending: SUCCESS');
    console.log('✅ chooseYour field: ' + parsedData.chooseYour);
    console.log('✅ Event date: ' + emailData.eventDate);
    
    console.log('\n🔍 CHECK YOUR EMAIL:');
    console.log('====================');
    console.log('You should receive an email with:');
    console.log('1. ✅ Correct date: "Saturday August 9 2025"');
    console.log('2. ✅ Visible QR code in the center of the email');
    console.log('3. ✅ QR code should scan to: "DEBUG001"');
    console.log('4. ✅ Professional Youth Alive formatting');
    
    console.log('\n⚠️  IF QR CODE IS MISSING:');
    console.log('==========================');
    console.log('The issue is likely:');
    console.log('1. Email client not displaying embedded images (cid: references)');
    console.log('2. Gmail/email provider blocking the attachment');
    console.log('3. QR code attachment not being created properly');
    
  } catch (error) {
    console.error('\n❌ LIVE WEBHOOK SIMULATION FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the debug test
if (require.main === module) {
  testLiveWebhookFlow()
    .then(() => {
      console.log('\n✅ Debug test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Debug test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLiveWebhookFlow };
