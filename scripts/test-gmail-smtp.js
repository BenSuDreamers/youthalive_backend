const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGmailSMTP() {
  try {
    console.log('🧪 Testing Gmail SMTP configuration...');
    
    // Get credentials from environment
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL;
    const fromName = process.env.FROM_NAME || 'Youth Alive SA';
    
    console.log(`📧 Using Gmail user: ${gmailUser}`);
    console.log(`📧 From email: ${fromEmail}`);
    console.log(`📧 Password length: ${gmailPassword ? gmailPassword.length : 'Not set'} characters`);
    
    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail credentials not found in environment variables');
    }    // Create transporter for Google Workspace (try multiple configurations)
    console.log('🔧 Trying multiple SMTP configurations...');
    
    const configs = [
      {
        name: 'Google Workspace SMTP',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: gmailUser,
            pass: gmailPassword,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail Service',
        config: {
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPassword,
          }
        }
      },
      {
        name: 'Google Workspace Alt',
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: gmailPassword,
          }
        }
      }
    ];
    
    let transporter = null;
    let workingConfig = null;
    
    for (const {name, config} of configs) {
      try {
        console.log(`� Testing ${name}...`);
        transporter = nodemailer.createTransport(config);
        await transporter.verify();
        console.log(`✅ ${name} works!`);
        workingConfig = name;
        break;
      } catch (error) {
        console.log(`❌ ${name} failed: ${error.message}`);
        continue;
      }
    }
    
    if (!transporter || !workingConfig) {
      throw new Error('All SMTP configurations failed. You likely need an App Password.');
    }
    
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
