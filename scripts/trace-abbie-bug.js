const { MongoClient, ObjectId } = require('mongodb');
const { parseWebhook } = require('../build/services/jotform.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');

console.log('🚨 CRITICAL: Tracing Abbie Mirtschin Friday → Saturday Bug');
console.log('========================================================');
console.log('Following the exact path her data takes through our system');

async function traceAbbieMirtschinBug() {
  let mongoClient;
  
  try {
    console.log('\n📊 STEP 1: Get Abbie\'s actual database record');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Get Abbie's record
    const abbieTicket = await db.collection('tickets').findOne({
      event: STADIUM_25_EVENT_ID,
      email: 'crackinabbs23@outlook.com'
    });
    
    if (!abbieTicket) {
      console.log('❌ Abbie\'s ticket not found!');
      return;
    }
    
    console.log('\n🎫 ABBIE\'S DATABASE RECORD:');
    console.log('===========================');
    console.log(`Email: ${abbieTicket.email}`);
    console.log(`Name: ${abbieTicket.name}`);
    console.log(`Invoice: ${abbieTicket.invoiceNo}`);
    console.log(`eventDate: "${abbieTicket.eventDate}"`);
    console.log(`chooseYour: "${abbieTicket.chooseYour || 'NOT SET'}"`);
    console.log(`createdAt: ${abbieTicket.createdAt}`);
    
    console.log('\n🔄 STEP 2: Simulate our resend script processing her record');
    console.log('============================================================');
    
    // This is EXACTLY what our resend script does
    const simulatedWebhookData = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: {
          first: abbieTicket.name?.split(' ')[0] || 'Unknown',
          last: abbieTicket.name?.split(' ').slice(1).join(' ') || ''
        },
        q4_email: abbieTicket.email,
        q16_phone: abbieTicket.phone || "N/A",
        q19_eventDate: abbieTicket.eventDate || abbieTicket.chooseYour || "Friday August 8 2025", // This line is critical!
        q23_church: abbieTicket.church || "N/A",
        q11_invoiceId: `# INV-${abbieTicket.invoiceNo}`,
        q9_products: {
          paymentArray: JSON.stringify({
            product: [`General Admission (Amount: ${abbieTicket.totalAmount || 15}.00 AUD, Quantity: ${abbieTicket.quantity || 1})`],
            currency: "AUD",
            total: `${abbieTicket.totalAmount || 15}.00`
          })
        }
      })
    };
    
    console.log('\n📦 SIMULATED WEBHOOK DATA FOR ABBIE:');
    console.log('====================================');
    console.log(`q19_eventDate value: "${abbieTicket.eventDate || abbieTicket.chooseYour || "Friday August 8 2025"}"`);
    console.log(`Expected result: Should parse to "Friday"`);
    
    console.log('\n🔄 STEP 3: Parse using our webhook service');
    console.log('==========================================');
    
    const parsedData = await parseWebhook(simulatedWebhookData);
    
    console.log('\n✅ PARSED RESULT FOR ABBIE:');
    console.log('===========================');
    console.log(`chooseYour: "${parsedData.chooseYour}"`);
    console.log(`Expected: "Friday"`);
    console.log(`Actual: "${parsedData.chooseYour}"`);
    console.log(`✅ Matches Expected: ${parsedData.chooseYour === 'Friday' ? 'YES' : 'NO'}`);
    
    console.log('\n🔄 STEP 4: Email data preparation');
    console.log('=================================');
    
    const emailData = {
      to: parsedData.email,
      name: parsedData.name,
      eventTitle: 'Stadium 25',
      eventDate: parsedData.chooseYour === 'Saturday' ? 'Saturday August 9 2025' : 'Friday August 8 2025',
      invoiceNo: parsedData.invoiceNo,
      chooseYour: parsedData.chooseYour || 'Friday'
    };
    
    console.log('\n📧 EMAIL DATA FOR ABBIE:');
    console.log('========================');
    console.log(`chooseYour: "${emailData.chooseYour}"`);
    console.log(`eventDate: "${emailData.eventDate}"`);
    console.log(`Expected: "Friday August 8 2025"`);
    console.log(`Actual: "${emailData.eventDate}"`);
    console.log(`✅ Correct Date: ${emailData.eventDate === 'Friday August 8 2025' ? 'YES' : 'NO'}`);
    
    console.log('\n🚨 BUG ANALYSIS:');
    console.log('================');
    
    if (parsedData.chooseYour === 'Friday' && emailData.eventDate === 'Friday August 8 2025') {
      console.log('✅ SYSTEM IS WORKING CORRECTLY FOR ABBIE');
      console.log('✅ Database: Friday → Parsed: Friday → Email: Friday');
      console.log('');
      console.log('🤔 POSSIBLE EXPLANATIONS:');
      console.log('=========================');
      console.log('1. ❓ Abbie received email from OLD system (before our fix)');
      console.log('2. ❓ There was a different ticket/invoice that got Saturday');
      console.log('3. ❓ Database was updated after the incorrect email was sent');
      console.log('4. ❓ Email caching/delay caused old email to be sent');
    } else {
      console.log('❌ SYSTEM BUG CONFIRMED');
      console.log(`❌ Expected Friday but got ${parsedData.chooseYour}`);
    }
    
    // Check if there are any other tickets for this email
    console.log('\n🔍 STEP 5: Check for multiple tickets for same email');
    console.log('===================================================');
    
    const allTicketsForAbbie = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID,
      email: 'crackinabbs23@outlook.com'
    }).toArray();
    
    console.log(`Found ${allTicketsForAbbie.length} tickets for crackinabbs23@outlook.com:`);
    allTicketsForAbbie.forEach((ticket, i) => {
      console.log(`${i + 1}. Invoice: ${ticket.invoiceNo} | eventDate: "${ticket.eventDate}" | createdAt: ${ticket.createdAt}`);
    });
    
    console.log('\n💡 NEXT STEPS:');
    console.log('===============');
    console.log('1. Check if there are recent emails sent to Abbie');
    console.log('2. Verify when the complaint was received vs when fix was deployed');
    console.log('3. Check email logs for what was actually sent');
    
  } catch (error) {
    console.error('\n💥 Tracing failed:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the trace
if (require.main === module) {
  traceAbbieMirtschinBug()
    .then(() => {
      console.log('\n✅ Abbie Mirtschin bug trace completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Trace failed:', error);
      process.exit(1);
    });
}

module.exports = { traceAbbieMirtschinBug };
