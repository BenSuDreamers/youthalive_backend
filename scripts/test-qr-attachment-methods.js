const { generateQrCode } = require('../build/services/qr.service.js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🔧 Stadium 25 QR Code Email Fix Test');
console.log('====================================');
console.log('Testing different QR code attachment methods to ensure visibility');

async function testQRCodeAttachmentMethods() {
  try {
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('\n🔄 STEP 1: Generate QR Code');
    const invoiceNo = 'TEST-QR-001';
    const qrDataUrl = await generateQrCode(invoiceNo);
    console.log(`✅ QR code generated for: ${invoiceNo}`);
    console.log(`📋 QR size: ${qrDataUrl.length} characters`);

    // Convert to buffer
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    console.log(`📋 QR buffer size: ${qrBuffer.length} bytes`);

    console.log('\n🔄 STEP 2: Testing Multiple QR Attachment Methods');
    
    // Method 1: CID embedded image (current method)
    console.log('\n📧 Method 1: CID Embedded Image (Current)');
    const emailHtml1 = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0a1551; text-align: center;">Stadium 25 - Method 1 (CID)</h2>
        <p>Hi Test User,</p>
        <p>Your QR code for Stadium 25:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd;">
        </div>
        <p>Invoice: ${invoiceNo}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Youth Alive SA" <${process.env.EMAIL_USER}>`,
      to: 'johnson.bijin.99@gmail.com',
      subject: 'Stadium 25 QR Test - Method 1 (CID)',
      html: emailHtml1,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'qrcode'
        }
      ]
    });
    console.log('✅ Method 1 email sent');

    // Wait between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Method 2: Base64 inline image
    console.log('\n📧 Method 2: Base64 Inline Image');
    const emailHtml2 = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0a1551; text-align: center;">Stadium 25 - Method 2 (Base64)</h2>
        <p>Hi Test User,</p>
        <p>Your QR code for Stadium 25:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd;">
        </div>
        <p>Invoice: ${invoiceNo}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Youth Alive SA" <${process.env.EMAIL_USER}>`,
      to: 'johnson.bijin.99@gmail.com',
      subject: 'Stadium 25 QR Test - Method 2 (Base64)',
      html: emailHtml2
    });
    console.log('✅ Method 2 email sent');

    // Wait between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Method 3: Both CID and Base64 (fallback)
    console.log('\n📧 Method 3: Hybrid (CID + Base64 fallback)');
    const emailHtml3 = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0a1551; text-align: center;">Stadium 25 - Method 3 (Hybrid)</h2>
        <p>Hi Test User,</p>
        <p>Your QR code for Stadium 25:</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd;">
          <br><br>
          <small>If QR code above is not visible, try this version:</small><br>
          <img src="${qrDataUrl}" alt="QR Code Fallback" style="width: 150px; height: 150px; border: 1px solid #ddd;">
        </div>
        <p>Invoice: ${invoiceNo}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Youth Alive SA" <${process.env.EMAIL_USER}>`,
      to: 'johnson.bijin.99@gmail.com',
      subject: 'Stadium 25 QR Test - Method 3 (Hybrid)',
      html: emailHtml3,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'qrcode'
        }
      ]
    });
    console.log('✅ Method 3 email sent');

    // Wait between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Method 4: Standard attachment (no inline)
    console.log('\n📧 Method 4: Standard Attachment');
    const emailHtml4 = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0a1551; text-align: center;">Stadium 25 - Method 4 (Attachment)</h2>
        <p>Hi Test User,</p>
        <p>Your QR code for Stadium 25 is attached to this email as "stadium25-qr.png"</p>
        <p>Please download and show at check-in.</p>
        <p>Invoice: ${invoiceNo}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Youth Alive SA" <${process.env.EMAIL_USER}>`,
      to: 'johnson.bijin.99@gmail.com',
      subject: 'Stadium 25 QR Test - Method 4 (Attachment)',
      html: emailHtml4,
      attachments: [
        {
          filename: 'stadium25-qr.png',
          content: qrBuffer,
          contentType: 'image/png'
        }
      ]
    });
    console.log('✅ Method 4 email sent');

    console.log('\n🎉 ALL QR CODE TEST EMAILS SENT!');
    console.log('=================================');
    console.log('📧 You should receive 4 test emails:');
    console.log('   1. Method 1: CID embedded (current method)');
    console.log('   2. Method 2: Base64 inline');
    console.log('   3. Method 3: Hybrid (both methods)');
    console.log('   4. Method 4: File attachment');
    
    console.log('\n🔍 PLEASE CHECK WHICH METHOD SHOWS QR CODES:');
    console.log('============================================');
    console.log('Look for visible QR codes in each email and report back:');
    console.log('✅ Method 1 (CID): QR visible? [YES/NO]');
    console.log('✅ Method 2 (Base64): QR visible? [YES/NO]');
    console.log('✅ Method 3 (Hybrid): QR visible? [YES/NO]');
    console.log('✅ Method 4 (Attachment): File attached? [YES/NO]');
    
    console.log('\n💡 DIAGNOSIS:');
    console.log('=============');
    console.log('If Method 1 (current) shows no QR but others do,');
    console.log('we need to update the email service to use the working method.');
    
  } catch (error) {
    console.error('\n❌ QR CODE TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testQRCodeAttachmentMethods()
    .then(() => {
      console.log('\n✅ QR code attachment test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 QR code test failed:', error);
      process.exit(1);
    });
}

module.exports = { testQRCodeAttachmentMethods };
