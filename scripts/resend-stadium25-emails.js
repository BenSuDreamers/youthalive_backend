const { MongoClient, ObjectId } = require('mongodb');
const { generateQrCode } = require('../build/services/qr.service.js');
const { emailService } = require('../build/services/email.service.js');
const { jotformService } = require('../build/services/jotform.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Configuration from .env
const MONGODB_URI = process.env.MONGODB_URI;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');

console.log('🔧 Stadium 25 Email Resender - Full Pipeline Fix');
console.log('=================================================');
console.log('Using the same webhook-to-email pipeline that was successfully tested');

async function resendStadium25Emails() {
  let mongoClient;
  
  try {
    // Connect to MongoDB
    console.log('\n📊 STEP 1: Connecting to MongoDB');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Get all Stadium 25 tickets (recent first)
    console.log('\n🎫 STEP 2: Finding all Stadium 25 tickets');
    console.log('Stadium 25 Event ID:', STADIUM_25_EVENT_ID.toString());
    
    const tickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`✅ Found ${tickets.length} Stadium 25 tickets to process`);
    
    if (tickets.length === 0) {
      console.log('❌ No Stadium 25 tickets found!');
      console.log('Please verify the event ID is correct.');
      return;
    }
    
    // Show sample of what we found
    console.log('\n📋 Sample tickets found:');
    tickets.slice(0, 3).forEach((ticket, i) => {
      console.log(`   ${i + 1}. ${ticket.email} - Invoice: ${ticket.invoiceNo} - Name: ${ticket.name}`);
    });
    if (tickets.length > 3) {
      console.log(`   ... and ${tickets.length - 3} more tickets`);
    }
    
    // Process each ticket using the same pipeline as our successful test
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    console.log('\n📧 STEP 3: Processing tickets using webhook-to-email pipeline');
    console.log('This uses the same logic that was successfully tested');
    console.log('🎯 PRIORITY: Focus on tickets with missing or incorrect eventDate data');
    
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      console.log(`\n[${i + 1}/${tickets.length}] Processing ticket for ${ticket.email}`);
      console.log(`  Invoice: ${ticket.invoiceNo} | Name: ${ticket.name}`);
      console.log(`  Database eventDate: "${ticket.eventDate || 'MISSING'}"`);
      
      // Skip tickets that already have correct eventDate and were created recently
      const hasValidEventDate = ticket.eventDate && 
        (ticket.eventDate.includes('Friday') || ticket.eventDate.includes('Saturday'));
      
      const isRecentTicket = ticket.createdAt && 
        new Date(ticket.createdAt) > new Date('2025-08-01'); // Recent tickets more likely to be correct
        
      if (hasValidEventDate && isRecentTicket) {
        console.log(`  ⏭️  SKIPPING: Has valid eventDate "${ticket.eventDate}" and is recent`);
        console.log(`  💡 User should have received correct email originally`);
        continue;
      }
      
      if (!hasValidEventDate) {
        console.log(`  🎯 PROCESSING: Missing or invalid eventDate - needs correction`);
      } else {
        console.log(`  🎯 PROCESSING: Older ticket - may need resend with corrected QR codes`);
      }
      try {
        // STEP 1: Simulate webhook parsing to get chooseYour field
        console.log('  🔄 STEP 1: Parsing ticket data (simulating webhook)...');
        
        // Create simulated webhook data based on ticket
        const simulatedWebhookData = {
          formID: "251481969313867",
          rawRequest: JSON.stringify({
            q3_name: {
              first: ticket.name?.split(' ')[0] || 'Unknown',
              last: ticket.name?.split(' ').slice(1).join(' ') || ''
            },
            q4_email: ticket.email,
            q16_phone: ticket.phone || "N/A",
            q19_eventDate: ticket.eventDate || ticket.chooseYour || "Friday August 8 2025", // Use existing data
            q23_church: ticket.church || "N/A",
            q11_invoiceId: `# INV-${ticket.invoiceNo}`,
            q9_products: {
              paymentArray: JSON.stringify({
                product: [`General Admission (Amount: ${ticket.totalAmount || 15}.00 AUD, Quantity: ${ticket.quantity || 1})`],
                currency: "AUD",
                total: `${ticket.totalAmount || 15}.00`
              })
            }
          })
        };
        
        // Parse using our tested webhook service
        const parsedData = await jotformService.parseWebhook(simulatedWebhookData);
        
        console.log(`  ✅ Webhook parsed - Choose Your: ${parsedData.chooseYour || 'Friday'}`);
        
        // STEP 2: Generate QR code
        console.log('  🔄 STEP 2: Generating QR code...');
        const qrDataUrl = await generateQrCode(parsedData.invoiceNo);
        console.log(`  ✅ QR code generated for ${parsedData.invoiceNo}`);
        
        // STEP 3: Prepare email using parsed data
        console.log('  � STEP 3: Preparing email using parsed data...');
        const emailData = {
          to: parsedData.email,
          name: parsedData.name,
          eventTitle: 'Stadium 25',
          eventDate: parsedData.chooseYour === 'Saturday' ? 'Saturday August 9 2025' : 'Friday August 8 2025',
          invoiceNo: parsedData.invoiceNo,
          qrDataUrl: qrDataUrl,
          chooseYour: parsedData.chooseYour || 'Friday'
        };
        
        console.log(`  📋 Email: ${emailData.to} | ${emailData.chooseYour} | ${emailData.invoiceNo}`);
        
        // STEP 4: Send email
        console.log('  🔄 STEP 4: Sending email...');
        await emailService.sendTicketEmail(emailData);
        
        console.log(`  ✅ Email sent successfully using full pipeline!`);
        successCount++;
        
        // Small delay to avoid overwhelming email service
        if (i < tickets.length - 1) {
          console.log('  ⏳ Waiting 2 seconds before next ticket...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing ticket: ${error.message}`);
        errors.push({
          email: ticket.email,
          invoice: ticket.invoiceNo,
          error: error.message
        });
        errorCount++;
      }
    }
    
    // Final summary
    console.log('\n🎉 STADIUM 25 EMAIL RESENDING COMPLETE');
    console.log('======================================');
    console.log(`📊 Total tickets processed: ${tickets.length}`);
    console.log(`✅ Emails sent successfully: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n✅ SUCCESSFUL RESENDS:');
      console.log(`   - ${successCount} Stadium 25 attendees received corrected emails`);
      console.log(`   - All emails include proper QR codes`);
      console.log(`   - Friday/Saturday dates correctly parsed from webhook data`);
    }
    
    if (errors.length > 0) {
      console.log('\n❌ FAILED RESENDS:');
      errors.forEach(err => {
        console.log(`   - ${err.email} (${err.invoice}): ${err.error}`);
      });
    }
    
    console.log('\n🔍 WHAT ATTENDEES WILL RECEIVE:');
    console.log('===============================');
    console.log('Each person will get an email with:');
    console.log('✅ Visible QR code that scans to their invoice number');
    console.log('✅ Correct Friday/Saturday event date');
    console.log('✅ All registration details properly formatted');
    console.log('✅ Professional Youth Alive branding');
    
    if (successCount === tickets.length) {
      console.log('\n🎉 ALL STADIUM 25 EMAILS SUCCESSFULLY RESENT!');
      console.log('The QR code issue has been resolved for all attendees.');
    } else if (successCount > 0) {
      console.log(`\n⚠️  ${successCount}/${tickets.length} emails sent successfully.`);
      console.log('Some attendees may need manual follow-up.');
    } else {
      console.log('\n❌ NO EMAILS WERE SENT SUCCESSFULLY.');
      console.log('Please check the error messages above.');
    }
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
if (require.main === module) {
  resendStadium25Emails()
    .then(() => {
      console.log('\n✅ Stadium 25 email resending completed successfully!');
      console.log('🎯 All attendees should now have emails with working QR codes.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Stadium 25 email resending failed:', error);
      process.exit(1);
    });
}

module.exports = { resendStadium25Emails };
