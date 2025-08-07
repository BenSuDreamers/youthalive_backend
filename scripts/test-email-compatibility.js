const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🔧 Email Client Compatibility Test');
console.log('===================================');
console.log('Testing QR code display across different methods');

async function testEmailCompatibility() {
  try {
    console.log('\n🔄 STEP 1: Generate smaller QR Code');
    const invoiceNo = 'COMPAT-TEST-001';
    const qrDataUrl = await generateQrCode(invoiceNo);
    
    const base64Data = qrDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`✅ QR code generated: ${invoiceNo}`);
    console.log(`📋 QR size: ${qrDataUrl.length} characters`);
    console.log(`📋 Buffer size: ${buffer.length} bytes`);
    console.log(`📋 Reduction: ${((1538 - buffer.length) / 1538 * 100).toFixed(1)}% smaller than before`);

    console.log('\n🔄 STEP 2: Send enhanced compatibility email');
    
    const emailData = {
      to: 'johnson.bijin.99@gmail.com',
      name: 'Compatibility Test User',
      eventTitle: 'Stadium 25',
      eventDate: 'Saturday August 9 2025',
      invoiceNo: invoiceNo,
      qrDataUrl: qrDataUrl,
      chooseYour: 'Saturday'
    };
    
    console.log('📧 Sending email with enhanced QR compatibility...');
    await emailService.sendTicketEmail(emailData);
    console.log('✅ Email sent successfully!');

    console.log('\n🎉 COMPATIBILITY TEST EMAIL SENT!');
    console.log('=================================');
    console.log(`📧 Check your email for: "${invoiceNo}"`);
    console.log('🔍 This email now includes:');
    console.log('   • CID embedded image (primary)');
    console.log('   • Hidden base64 fallback');
    console.log('   • Downloadable attachment backup');
    console.log('   • Enhanced troubleshooting instructions');
    
    console.log('\n📱 WHAT TO LOOK FOR:');
    console.log('=====================');
    console.log('✅ QR code should display prominently in the center');
    console.log('✅ Clear yellow fallback box with download instructions');
    console.log('✅ Attachment: "stadium25-ticket-qr.png" for download');
    console.log('✅ Better formatting and user guidance');
    
    console.log('\n🔧 TECHNICAL IMPROVEMENTS:');
    console.log('===========================');
    console.log('• Smaller QR code (200px vs 300px)');
    console.log('• Reduced margin and optimized quality');
    console.log('• Dual attachment method (CID + downloadable)');
    console.log('• Enhanced fallback instructions');
    console.log('• Better visual hierarchy in email');
    
    console.log('\n📋 IF STILL NOT WORKING:');
    console.log('=========================');
    console.log('The issue may be:');
    console.log('1. 📧 Email client security settings');
    console.log('2. 🔒 Corporate email filtering');
    console.log('3. 📱 Mobile email app restrictions');
    console.log('4. 🌐 Webmail image blocking');
    console.log('\nRecommend customers:');
    console.log('• Enable "Show Images" in email settings');
    console.log('• Use the downloadable attachment as backup');
    console.log('• Try different email client (mobile vs web)');
    
  } catch (error) {
    console.error('\n❌ Compatibility test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testEmailCompatibility()
    .then(() => {
      console.log('\n✅ Email compatibility test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Compatibility test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailCompatibility };
