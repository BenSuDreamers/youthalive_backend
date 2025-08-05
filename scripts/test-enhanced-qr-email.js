const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🚀 Stadium 25 Enhanced QR Code Email Test');
console.log('==========================================');
console.log('Testing improved email template with multiple QR code methods');

async function testEnhancedQREmail() {
  try {
    console.log('\n🔄 STEP 1: Generate QR Code');
    const invoiceNo = 'ENHANCED-QR-TEST';
    const qrDataUrl = await generateQrCode(invoiceNo);
    console.log(`✅ QR code generated for: ${invoiceNo}`);

    console.log('\n🔄 STEP 2: Send enhanced email');
    
    const emailData = {
      to: 'johnson.bijin.99@gmail.com',
      name: 'Enhanced Test User',
      eventTitle: 'Stadium 25',
      eventDate: 'Saturday August 9 2025',
      invoiceNo: invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: 'Saturday'
    };
    
    console.log('📧 Sending enhanced email with multiple QR methods...');
    await emailService.sendTicketEmail(emailData);
    console.log('✅ Enhanced email sent successfully!');

    console.log('\n🎉 ENHANCED QR EMAIL SENT!');
    console.log('==========================');
    console.log(`📧 Check your email for invoice: "${invoiceNo}"`);
    
    console.log('\n✨ NEW FEATURES IN THIS EMAIL:');
    console.log('==============================');
    console.log('✅ Primary QR code with improved styling (CID embedded)');
    console.log('✅ Fallback instructions if QR not visible');
    console.log('✅ Alternative QR code (Base64 inline) in expandable section');
    console.log('✅ Downloadable QR code attachment (stadium25-ticket-qr.png)');
    console.log('✅ Better visual design with borders and backgrounds');
    
    console.log('\n🎯 WHAT TO CHECK:');
    console.log('=================');
    console.log('1. ✅ Is the main QR code visible in the styled box?');
    console.log('2. ✅ Is there a fallback message with instructions?');
    console.log('3. ✅ Is there an "Alternative QR Code" expandable section?');
    console.log('4. ✅ Is there a downloadable attachment "stadium25-ticket-qr.png"?');
    console.log('5. ✅ Does the QR code scan to: "ENHANCED-QR-TEST"?');

    console.log('\n🔧 MULTIPLE FALLBACK METHODS:');
    console.log('=============================');
    console.log('Method 1: CID embedded image (main QR)');
    console.log('Method 2: Base64 inline image (alternative section)');  
    console.log('Method 3: Downloadable attachment (backup file)');
    console.log('Method 4: Clear instructions for troubleshooting');
    
    console.log('\n💡 THIS SHOULD SOLVE THE QR ISSUE:');
    console.log('==================================');
    console.log('Even if email clients block embedded images,');
    console.log('users will have multiple ways to access their QR code!');
    
  } catch (error) {
    console.error('\n❌ ENHANCED QR TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testEnhancedQREmail()
    .then(() => {
      console.log('\n✅ Enhanced QR code email test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Enhanced QR test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedQREmail };
