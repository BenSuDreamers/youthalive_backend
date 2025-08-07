const axios = require('axios');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_FORM_ID = '251481969313867'; // Stadium 25 form ID

// You can modify this array with the email addresses that need resending
const EMAIL_BATCH = [
  'crlytm@internode.on.net',
  'annabellelock1@gmail.com',
  'jenna.pw17@gmail.com',
  'kyle.perera@student.ecc.sa.edu.au',
  'ehin.akhi@gmail.com',
  'chloevelasco604@gmail.com',
  'kandhedwards@gmail.com',
  'miraboan@gmail.com',
  'biancawhitty8@gmail.com',
  'angelapike@internode.on.net',
  'alanadrogemuller@gmail.com',
  'flippy404@gmail.com',
  'jozzee@hotmail.com',
  'biancacoe@hotmail.com',
  'amandaosborne76@yahoo.com',
  'zaliea.white@icloud.com',
  'patels@cedarcollege.sa.edu.au',
  'beeline22@hotmail.com',
  'Ridhima.Priya@outlook.com',
  'cazmturner@gmail.com',
  'tientia89@gmail.com',
  'mnanayakkara09@gmail.com',
  'kim@kleoschurch.com',
  'sarah_harris1001@hotmail.com',
  'kaycamchels@hotmail.com',
  'docmart@iinet.net.au',
  'laenasian@gmail.com',
  'gregandlize@gmail.com',
  'christianshaw73@gmail.com',
  'nataliebradysims@gmail.com',
  'kimberleymilne1@icloud.com',
  'jethroryan77@outlook.com.au',
  'korawoods@icloud.com',
  'tim.bron@outlook.com',
  'djyohe85@gmail.com',
  'thomas.stephen2009@gmail.com',
  'cecilianuam67@gmail.com',
  'ANNAPSALTIS@yahoo.com.au',
  'amelia@ahrens.id.au',
  'jadee23899@gmail.com',
  'danielle.bailey@outlook.com',
  'beauwhaln@gmail.com',
  'ehiakhi824@gmail.com',
  'gnvaneck@iinet.net.au',
  'callanjarrett6@gmail.com',
  'larahh20002@gmail.com',
  'mathilda.paine@icloud.com',
  'alice@ballfamily.tv',
  'rosaliestrav@gmail.com',
  'emily.phillips@student.ecc.sa.edu.au'
];

console.log('🔧 Stadium 25 - Batch Email Resend Service');
console.log('==========================================');
console.log(`📧 Processing ${EMAIL_BATCH.length} email addresses`);
console.log('This will fetch JotForm data and resend confirmation emails with updated QR service');

async function batchResendEmails() {
  try {
    if (EMAIL_BATCH.length === 0) {
      console.log('\n⚠️ No email addresses provided in EMAIL_BATCH array');
      console.log('Please add email addresses to the EMAIL_BATCH array and run again.');
      return;
    }

    console.log('\n🔄 STEP 1: Fetch all Stadium 25 submissions');
    
    // Get all submissions from Stadium 25 form
    let allSubmissions = [];
    let offset = 0;
    const limit = 1000;
    let hasMoreSubmissions = true;
    let batchCount = 0;
    
    while (hasMoreSubmissions) {
      batchCount++;
      console.log(`   📦 Batch ${batchCount}: Fetching submissions (offset: ${offset})...`);
      
      const response = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}/submissions`, {
        params: {
          apiKey: JOTFORM_API_KEY,
          limit: limit,
          offset: offset,
          orderby: 'created_at',
          direction: 'DESC'
        },
        timeout: 30000
      });
      
      const submissions = response.data.content || [];
      allSubmissions = allSubmissions.concat(submissions);
      
      console.log(`   ✅ Retrieved ${submissions.length} submissions in batch ${batchCount}`);
      
      if (submissions.length < limit) {
        hasMoreSubmissions = false;
      } else {
        offset += limit;
      }
      
      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Total submissions retrieved: ${allSubmissions.length}`);
    
    console.log('\n🔄 STEP 2: Process each email address');
    
    const results = {
      successful: [],
      failed: [],
      notFound: []
    };
    
    for (let i = 0; i < EMAIL_BATCH.length; i++) {
      const emailAddress = EMAIL_BATCH[i].toLowerCase().trim();
      const emailNumber = i + 1;
      
      console.log(`\n📧 Processing email ${emailNumber}/${EMAIL_BATCH.length}: ${emailAddress}`);
      console.log('='.repeat(60));
      
      try {
        // Find ALL submissions for this email
        let foundSubmissions = [];
        
        for (const submission of allSubmissions) {
          const answers = submission.answers || {};
          
          // Check field 4 for email (Stadium 25 form structure)
          if (answers['4'] && answers['4'].answer) {
            const submissionEmail = String(answers['4'].answer).toLowerCase().trim();
            if (submissionEmail === emailAddress) {
              foundSubmissions.push({
                submission,
                answers
              });
            }
          }
        }
        
        if (foundSubmissions.length === 0) {
          console.log(`❌ No submissions found for ${emailAddress}`);
          results.notFound.push(emailAddress);
          continue;
        }
        
        console.log(`✅ Found ${foundSubmissions.length} submission(s) for ${emailAddress}`);
        
        // Process each submission for this email address
        for (let submissionIndex = 0; submissionIndex < foundSubmissions.length; submissionIndex++) {
          const { submission, answers } = foundSubmissions[submissionIndex];
          const ticketNumber = submissionIndex + 1;
          
          console.log(`\n   🎫 Processing ticket ${ticketNumber}/${foundSubmissions.length} - Submission ID: ${submission.id}`);
          
          // Extract name (field 3)
          let name = emailAddress.split('@')[0]; // Fallback to email prefix
          if (answers['3']) {
            const nameAnswer = answers['3'].answer;
            if (typeof nameAnswer === 'object') {
              name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
            } else {
              name = String(nameAnswer);
            }
          }
          
          // Extract invoice (field 11)
          let invoiceNo = `RESEND-${Date.now()}-${submissionIndex}`;
          if (answers['11']) {
            invoiceNo = String(answers['11'].answer);
            // Remove "# INV-" prefix if present
            invoiceNo = invoiceNo.replace(/^#\\s*INV-/, '');
          }
          
          // Extract day selection (field 19)
          let chooseYour = 'Saturday'; // Default
          if (answers['19']) {
            const dayAnswer = String(answers['19'].answer).toLowerCase();
            if (dayAnswer.includes('friday')) {
              chooseYour = 'Friday';
            } else if (dayAnswer.includes('saturday')) {
              chooseYour = 'Saturday';
            }
          }
          
          console.log(`      👤 Name: ${name}`);
          console.log(`      🎫 Invoice: ${invoiceNo}`);
          console.log(`      📅 Day: ${chooseYour}`);
          
          // Generate QR code
          console.log('      🔄 Generating QR code...');
          const qrDataUrl = await generateQrCode(invoiceNo);
          console.log('      ✅ QR code generated');
          
          // Prepare email data
          const emailData = {
            to: emailAddress,
            name: name,
            eventTitle: 'Stadium 25',
            eventDate: chooseYour === 'Friday' ? 'Friday August 8 2025' : 'Saturday August 9 2025',
            invoiceNo: invoiceNo,
            qrDataUrl: qrDataUrl,
            chooseYour: chooseYour
          };
          
          // Send email
          console.log('      📤 Sending confirmation email...');
          await emailService.sendTicketEmail(emailData);
          console.log('      ✅ Email sent successfully!');
          
          results.successful.push({
            email: emailAddress,
            name: name,
            invoice: invoiceNo,
            day: chooseYour,
            submissionId: submission.id,
            ticketNumber: ticketNumber
          });
          
          // Add delay between emails from the same person
          if (submissionIndex < foundSubmissions.length - 1) {
            console.log('      ⏱️ Waiting 1 second before next ticket...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Add delay between emails to be respectful
        if (i < EMAIL_BATCH.length - 1) {
          console.log('   ⏱️ Waiting 2 seconds before next email...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to process ${emailAddress}: ${error.message}`);
        results.failed.push({
          email: emailAddress,
          error: error.message
        });
      }
    }
    
    console.log('\n🎉 BATCH PROCESSING COMPLETE!');
    console.log('=============================');
    
    console.log(`\\n📊 RESULTS SUMMARY:`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   📭 Not Found: ${results.notFound.length}`);
    console.log(`   📧 Total Processed: ${EMAIL_BATCH.length}`);
    
    if (results.successful.length > 0) {
      console.log(`\\n✅ SUCCESSFULLY PROCESSED EMAILS:`);
      const emailGroups = {};
      
      // Group by email address
      results.successful.forEach((item) => {
        if (!emailGroups[item.email]) {
          emailGroups[item.email] = [];
        }
        emailGroups[item.email].push(item);
      });
      
      let itemIndex = 1;
      Object.keys(emailGroups).forEach((email) => {
        const tickets = emailGroups[email];
        if (tickets.length === 1) {
          console.log(`   ${itemIndex}. ${email} (${tickets[0].name}) - Invoice: ${tickets[0].invoice} - Day: ${tickets[0].day}`);
        } else {
          console.log(`   ${itemIndex}. ${email} (${tickets[0].name}) - ${tickets.length} tickets:`);
          tickets.forEach((ticket, i) => {
            console.log(`      Ticket ${i + 1}: Invoice ${ticket.invoice} - Day: ${ticket.day}`);
          });
        }
        itemIndex++;
      });
    }
    
    if (results.notFound.length > 0) {
      console.log(`\\n📭 EMAILS NOT FOUND IN STADIUM 25 SUBMISSIONS:`);
      results.notFound.forEach((email, i) => {
        console.log(`   ${i + 1}. ${email}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log(`\\n❌ FAILED TO PROCESS:`);
      results.failed.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.email} - Error: ${item.error}`);
      });
    }
    
    console.log('\\n💡 WHAT WAS SENT:');
    console.log('=================');
    console.log('✅ Updated QR code display (CID + Base64 fallback)');
    console.log('✅ Optimized QR generation (smaller file size)');
    console.log('✅ Enhanced fallback instructions');
    console.log('✅ Downloadable QR attachment backup');
    console.log('✅ Correct day selection from original submission');
    
  } catch (error) {
    console.error('\\n❌ Batch processing failed:', error.message);
    console.error('Full error:', error);
  }
}

// Function to add emails to the batch (for easy modification)
function addEmailsToBatch(emails) {
  EMAIL_BATCH.push(...emails);
  console.log(`Added ${emails.length} emails to batch. Total: ${EMAIL_BATCH.length}`);
}

// Run the batch processing
if (require.main === module) {
  batchResendEmails()
    .then(() => {
      console.log('\\n✅ Batch email resend completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Batch processing failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  batchResendEmails, 
  addEmailsToBatch,
  EMAIL_BATCH // Export for external modification
};
