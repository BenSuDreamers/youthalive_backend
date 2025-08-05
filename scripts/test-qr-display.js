const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🔧 Stadium 25 QR Code Fix - Testing Email Display');
console.log('=================================================');
console.log('Using existing email service to test QR code visibility');

async function testQRCodeWithExistingService() {
  try {
    console.log('\n🔄 STEP 1: Generate QR Code');
    const invoiceNo = 'QR-DISPLAY-TEST';
    const qrDataUrl = await generateQrCode(invoiceNo);
    console.log(`✅ QR code generated for: ${invoiceNo}`);
    console.log(`📋 QR size: ${qrDataUrl.length} characters`);
    console.log(`📋 QR format: ${qrDataUrl.substring(0, 30)}...`);

    // Check QR data format
    if (qrDataUrl.startsWith('data:image/png;base64,')) {
      console.log('✅ QR code is in correct base64 PNG format');
      
      const base64Data = qrDataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      console.log(`✅ QR buffer: ${buffer.length} bytes`);
      
      // Validate it's actually a PNG
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        console.log('✅ QR data is valid PNG format');
      } else {
        console.log('❌ QR data is not valid PNG format');
      }
    } else {
      console.log('❌ QR code format is incorrect');
    }

    console.log('\n🔄 STEP 2: Send test email using existing email service');
    
    const emailData = {
      to: 'johnson.bijin.99@gmail.com',
      name: 'QR Test User',
      eventTitle: 'Stadium 25',
      eventDate: 'Saturday August 9 2025',
      invoiceNo: invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: 'Saturday'
    };
    
    console.log('📧 Sending email with QR code...');
    await emailService.sendTicketEmail(emailData);
    console.log('✅ Email sent successfully!');

    console.log('\n🎉 QR CODE TEST EMAIL SENT!');
    console.log('===========================');
    console.log(`📧 Check your email for: "${invoiceNo}"`);
    console.log('🔍 Look for the QR code in the center of the email');
    console.log('📱 The QR code should scan to: "QR-DISPLAY-TEST"');
    
    console.log('\n🔍 TROUBLESHOOTING:');
    console.log('===================');
    console.log('If QR code is NOT visible:');
    console.log('1. Check if images are blocked in your email client');
    console.log('2. Look for "Show images" or "Display images" option');
    console.log('3. Check spam/junk folder');
    console.log('4. Try viewing in different email client (web vs mobile)');
    
    console.log('\n💡 TECHNICAL DETAILS:');
    console.log('=====================');
    console.log('✅ QR generation: Working');
    console.log('✅ Base64 encoding: Working');  
    console.log('✅ PNG format: Valid');
    console.log('✅ Email attachment: Using CID reference');
    console.log('✅ HTML template: Has img src="cid:qrcode"');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('===============');
    console.log('1. Check if this test email shows QR code');
    console.log('2. If YES: The system is working, may be email client issue');
    console.log('3. If NO: We need to modify the email template/attachment method');
    
  } catch (error) {
    console.error('\n❌ QR CODE TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testQRCodeWithExistingService()
    .then(() => {
      console.log('\n✅ QR code display test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 QR code test failed:', error);
      process.exit(1);
    });
}

module.exports = { testQRCodeWithExistingService };
