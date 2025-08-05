const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('📧 Stadium 25 Test Emails - 4 Separate Bookings for Bijin Johnson');
console.log('===================================================================');

// Real booking data based on database records for johnson.bijin.99@gmail.com
const realBookings = [
  {
    invoiceNo: '000029',
    name: 'Bijin Johnson',
    chooseYour: 'Friday',
    bookingNumber: 1
  },
  {
    invoiceNo: '000027', 
    name: 'Bijin Johnson',
    chooseYour: 'Friday',
    bookingNumber: 2
  },
  {
    invoiceNo: '000026',
    name: 'Bijin Johnson', 
    chooseYour: 'Saturday',
    bookingNumber: 3
  },
  {
    invoiceNo: '000025',
    name: 'Bijin Johnson',
    chooseYour: 'Saturday', 
    bookingNumber: 4
  }
];

async function sendTestEmailsForBijin() {
  console.log(`\n🎫 Sending ${realBookings.length} separate test emails for Bijin Johnson's bookings...`);
  console.log('Each booking represents a separate ticket and requires its own QR code.\n');
  
  const results = [];
  
  for (let i = 0; i < realBookings.length; i++) {
    const booking = realBookings[i];
    
    try {
      console.log(`\n📧 [${i + 1}/${realBookings.length}] Processing Booking #${booking.bookingNumber}`);
      console.log('=========================================');
      
      console.log('� Generating QR code...');
      const qrDataUrl = await generateQrCode(booking.invoiceNo);
      console.log(`✅ QR code generated for invoice ${booking.invoiceNo}`);
      
      console.log('📧 Preparing email data...');
      const emailData = {
        to: 'johnson.bijin.99@gmail.com',
        name: booking.name,
        eventTitle: 'Stadium 25',
        eventDate: booking.chooseYour === 'Friday' ? 'Friday August 8 2025' : 'Saturday August 9 2025',
        invoiceNo: booking.invoiceNo,
        qrDataUrl: qrDataUrl,
        chooseYour: booking.chooseYour
      };
      
      console.log(`📋 Email Details:`);
      console.log(`   To: ${emailData.to}`);
      console.log(`   Name: ${emailData.name}`);
      console.log(`   Invoice: ${emailData.invoiceNo}`);
      console.log(`   Night: ${emailData.chooseYour} (${emailData.eventDate})`);
      console.log(`   QR Code: Generated ✅`);
      
      console.log('📤 Sending email...');
      await emailService.sendTicketEmail(emailData);
      console.log(`✅ Email sent successfully for booking #${booking.bookingNumber}!`);
      
      results.push({
        booking: booking.bookingNumber,
        invoice: booking.invoiceNo,
        night: booking.chooseYour,
        status: 'success'
      });
      
      // Wait 1 second between emails to avoid overwhelming the email service
      if (i < realBookings.length - 1) {
        console.log('⏳ Waiting 1 second before next email...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to send email for booking #${booking.bookingNumber}:`, error.message);
      results.push({
        booking: booking.bookingNumber,
        invoice: booking.invoiceNo,
        night: booking.chooseYour,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n🎉 ALL TEST EMAILS COMPLETED!');
  console.log('==============================');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successful: ${successful.length}/${realBookings.length}`);
  console.log(`❌ Failed: ${failed.length}/${realBookings.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully sent emails for:');
    successful.forEach(r => {
      console.log(`   - Booking #${r.booking}: Invoice ${r.invoice} (${r.night})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to send emails for:');
    failed.forEach(r => {
      console.log(`   - Booking #${r.booking}: Invoice ${r.invoice} (${r.night}) - ${r.error}`);
    });
  }
  
  console.log('\n🔍 WHAT TO CHECK IN YOUR EMAILS:');
  console.log('=================================');
  console.log('You should receive 4 separate emails, each with:');
  console.log('1. ✅ Unique QR codes that scan to different invoice numbers:');
  console.log('   - Email 1: QR should scan to "000029"');
  console.log('   - Email 2: QR should scan to "000027"'); 
  console.log('   - Email 3: QR should scan to "000026"');
  console.log('   - Email 4: QR should scan to "000025"');
  console.log('2. ✅ Correct Friday/Saturday dates based on booking');
  console.log('3. ✅ All QR codes should be visible and scannable');
  console.log('4. ✅ Professional formatting with Youth Alive branding');
  
  return results;
}

// Run the test
async function runAllTests() {
  try {
    const results = await sendTestEmailsForBijin();
    
    console.log('\n� SUMMARY:');
    console.log('============');
    console.log('✅ 4 separate test emails sent to johnson.bijin.99@gmail.com');
    console.log('✅ Each email has a unique QR code for a different booking');
    console.log('✅ Mix of Friday and Saturday selections tested');
    console.log('✅ Using real invoice numbers from the database');
    
    const successful = results.filter(r => r.status === 'success');
    if (successful.length === realBookings.length) {
      console.log('\n🎉 ALL TESTS PASSED! Ready for batch resend.');
    } else {
      console.log(`\n⚠️  ${successful.length}/${realBookings.length} tests passed. Check failed emails.`);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run the test
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✅ Test email sending completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test email sending failed:', error);
      process.exit(1);
    });
}

module.exports = { sendTestEmailsForBijin };
