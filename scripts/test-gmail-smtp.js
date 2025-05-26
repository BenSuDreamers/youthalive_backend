const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

async function testGmailSMTP() {
  try {
    console.log('🧪 Testing Gmail SMTP configuration...');
    
    // These will be replaced with your actual Gmail credentials
    const gmailUser = process.env.GMAIL_USER || 'your-gmail-address@gmail.com';
    const gmailPassword = process.env.GMAIL_PASSWORD || 'your-gmail-app-password';
    const fromEmail = process.env.FROM_EMAIL || gmailUser;
    const fromName = process.env.FROM_NAME || 'Youth Alive SA';
    
    console.log(`📧 Using Gmail user: ${gmailUser}`);
    console.log(`📧 From email: ${fromEmail}`);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });
    
    // Verify connection
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
    
    // Generate a test QR code
    console.log('🎯 Generating test QR code...');
    const qrDataUrl = await QRCode.toDataURL('TEST-QR-CODE-' + Date.now());
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    console.log('✅ QR code generated!');
    
    // Send test email
    const testEmail = 'johnson.bijin.99@gmail.com'; // Your test email
    console.log(`📤 Sending test email to: ${testEmail}`);
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: testEmail,
      subject: '🧪 Youth Alive Gmail SMTP Test',
      html: `
        <h2>Gmail SMTP Test Successful!</h2>
        <p>This is a test email to verify that Gmail SMTP is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>QR code is attached to this email.</p>
        <p>If you received this email, Gmail SMTP is configured correctly! 🎉</p>
      `,
      text: 'Gmail SMTP test successful! QR code attached.',
      attachments: [
        {
          filename: 'test-qrcode.png',
          content: qrBuffer,
          contentType: 'image/png',
        },
      ],
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!', {
      messageId: result.messageId,
      response: result.response
    });
    
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication failed. Make sure to:');
      console.log('   1. Enable 2-factor authentication on your Gmail account');
      console.log('   2. Generate an App Password for this application');
      console.log('   3. Use the App Password instead of your regular password');
    }
  }
}

testGmailSMTP();
