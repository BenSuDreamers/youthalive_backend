const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');

console.log('🔍 Checking Specific User Database Records');
console.log('==========================================');
console.log('Looking for users who might have Friday → Saturday issue');

async function checkSpecificUserRecords() {
  let mongoClient;
  
  try {
    console.log('\n📊 STEP 1: Connecting to MongoDB');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Look for users with names similar to the complaint (Abbie, Mirtschin, etc.)
    console.log('\n🔍 STEP 2: Searching for potential complainants');
    
    const suspectNames = ['Abbie', 'Mirtschin', 'Friday'];
    const suspectEmails = ['abbie', 'mirtschin'];
    
    for (const name of suspectNames) {
      const tickets = await db.collection('tickets').find({
        event: STADIUM_25_EVENT_ID,
        $or: [
          { name: { $regex: name, $options: 'i' } },
          { email: { $regex: name, $options: 'i' } }
        ]
      }).toArray();
      
      if (tickets.length > 0) {
        console.log(`\n🎫 Found ${tickets.length} tickets matching "${name}":`);
        tickets.forEach((ticket, i) => {
          console.log(`   ${i + 1}. ${ticket.email} - ${ticket.name}`);
          console.log(`      Invoice: ${ticket.invoiceNo}`);
          console.log(`      eventDate: "${ticket.eventDate || 'NOT SET'}"`);
          console.log(`      chooseYour: "${ticket.chooseYour || 'NOT SET'}"`);
          console.log(`      createdAt: ${ticket.createdAt}`);
          console.log('');
        });
      }
    }
    
    // Check recent tickets to see what data patterns we have
    console.log('\n📊 STEP 3: Analyzing recent Stadium 25 ticket patterns');
    
    const recentTickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID
    }).sort({ createdAt: -1 }).limit(20).toArray();
    
    console.log(`\n📋 Last 20 Stadium 25 tickets analysis:`);
    console.log('=====================================');
    
    let fridayCount = 0;
    let saturdayCount = 0;
    let undefinedCount = 0;
    let problematicTickets = [];
    
    recentTickets.forEach((ticket, i) => {
      const eventDate = ticket.eventDate || '';
      const chooseYour = ticket.chooseYour || '';
      
      console.log(`${i + 1}. ${ticket.email} (${ticket.invoiceNo})`);
      console.log(`   eventDate: "${eventDate}"`);
      console.log(`   chooseYour: "${chooseYour}"`);
      
      // Count patterns
      if (eventDate.toLowerCase().includes('friday')) {
        fridayCount++;
        console.log(`   ✅ Friday - OK`);
      } else if (eventDate.toLowerCase().includes('saturday')) {
        saturdayCount++;
        console.log(`   ✅ Saturday - OK`);
      } else {
        undefinedCount++;
        console.log(`   ❌ No day specified - PROBLEMATIC`);
        problematicTickets.push({
          email: ticket.email,
          invoice: ticket.invoiceNo,
          eventDate: eventDate,
          chooseYour: chooseYour
        });
      }
      console.log('');
    });
    
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('====================');
    console.log(`✅ Friday tickets: ${fridayCount}`);
    console.log(`✅ Saturday tickets: ${saturdayCount}`);
    console.log(`❌ Undefined/problematic: ${undefinedCount}`);
    
    if (problematicTickets.length > 0) {
      console.log('\n🚨 PROBLEMATIC TICKETS IDENTIFIED:');
      console.log('==================================');
      problematicTickets.forEach((ticket, i) => {
        console.log(`${i + 1}. ${ticket.email} (${ticket.invoice})`);
        console.log(`   eventDate: "${ticket.eventDate}"`);
        console.log(`   chooseYour: "${ticket.chooseYour}"`);
        console.log(`   ❌ Would default to Friday in resend script!`);
      });
      
      console.log('\n💡 ROOT CAUSE IDENTIFIED:');
      console.log('=========================');
      console.log('✅ Some tickets in database have empty/missing eventDate');
      console.log('✅ Our resend script defaults to "Friday August 8 2025" for missing data');
      console.log('❌ BUT users may have actually selected Saturday!');
      console.log('❌ This explains the Friday → Saturday complaint!');
    }
    
    console.log('\n🔧 IMMEDIATE FIX NEEDED:');
    console.log('========================');
    console.log('1. Stop the current resend script (may send wrong dates)');
    console.log('2. Check original JotForm submissions for correct day selections');
    console.log('3. Update database with correct eventDate values');
    console.log('4. Then run corrected resend script');
    
  } catch (error) {
    console.error('\n💥 Database check failed:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the check
if (require.main === module) {
  checkSpecificUserRecords()
    .then(() => {
      console.log('\n✅ Database record check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkSpecificUserRecords };
