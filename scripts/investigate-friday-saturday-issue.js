const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');

console.log('🔍 Stadium 25 Friday/Saturday Issue Investigation');
console.log('===============================================');
console.log('Investigating the chooseYour field parsing issue');

async function investigateFridaySaturdayIssue() {
  let mongoClient;
  
  try {
    console.log('\n📊 STEP 1: Connecting to MongoDB');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Find tickets that might have this issue
    console.log('\n🎫 STEP 2: Finding Stadium 25 tickets with potential Friday/Saturday issues');
    
    const tickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`✅ Found ${tickets.length} recent Stadium 25 tickets`);
    
    console.log('\n📋 DETAILED TICKET ANALYSIS:');
    console.log('============================');
    
    for (let i = 0; i < Math.min(5, tickets.length); i++) {
      const ticket = tickets[i];
      console.log(`\n🎫 Ticket ${i + 1}:`);
      console.log(`   Email: ${ticket.email}`);
      console.log(`   Name: ${ticket.name}`);
      console.log(`   Invoice: ${ticket.invoiceNo}`);
      console.log(`   eventDate: "${ticket.eventDate || 'NOT SET'}"`);
      console.log(`   chooseYour: "${ticket.chooseYour || 'NOT SET'}"`);
      console.log(`   createdAt: ${ticket.createdAt}`);
      
      // Check all fields that might contain Friday/Saturday info
      console.log('   📋 All ticket fields:');
      Object.keys(ticket).forEach(key => {
        if (typeof ticket[key] === 'string' && 
            (ticket[key].toLowerCase().includes('friday') || 
             ticket[key].toLowerCase().includes('saturday'))) {
          console.log(`     ${key}: "${ticket[key]}" 🎯`);
        }
      });
    }
    
    // Search for specific patterns
    console.log('\n🔍 STEP 3: Searching for Friday/Saturday patterns');
    
    const fridayTickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID,
      $or: [
        { eventDate: /friday/i },
        { chooseYour: /friday/i },
        { eventDate: /Friday/i },
        { chooseYour: /Friday/i }
      ]
    }).toArray();
    
    const saturdayTickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID,
      $or: [
        { eventDate: /saturday/i },
        { chooseYour: /saturday/i },
        { eventDate: /Saturday/i },
        { chooseYour: /Saturday/i }
      ]
    }).toArray();
    
    console.log(`\n📊 Friday tickets found: ${fridayTickets.length}`);
    console.log(`📊 Saturday tickets found: ${saturdayTickets.length}`);
    
    if (fridayTickets.length > 0) {
      console.log('\n✅ Friday tickets sample:');
      fridayTickets.slice(0, 3).forEach((ticket, i) => {
        console.log(`   ${i + 1}. ${ticket.email} - eventDate: "${ticket.eventDate}" - chooseYour: "${ticket.chooseYour}"`);
      });
    }
    
    if (saturdayTickets.length > 0) {
      console.log('\n✅ Saturday tickets sample:');
      saturdayTickets.slice(0, 3).forEach((ticket, i) => {
        console.log(`   ${i + 1}. ${ticket.email} - eventDate: "${ticket.eventDate}" - chooseYour: "${ticket.chooseYour}"`);
      });
    }
    
    // Check for tickets with no Friday/Saturday data
    const undefinedTickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID,
      $and: [
        { $or: [{ eventDate: { $exists: false } }, { eventDate: null }, { eventDate: "" }] },
        { $or: [{ chooseYour: { $exists: false } }, { chooseYour: null }, { chooseYour: "" }] }
      ]
    }).toArray();
    
    console.log(`\n⚠️  Tickets with no Friday/Saturday data: ${undefinedTickets.length}`);
    
    if (undefinedTickets.length > 0) {
      console.log('\n❌ PROBLEMATIC TICKETS:');
      undefinedTickets.slice(0, 5).forEach((ticket, i) => {
        console.log(`   ${i + 1}. ${ticket.email} (${ticket.invoiceNo}) - Missing day selection data`);
      });
    }
    
    console.log('\n🚨 POTENTIAL ISSUE IDENTIFIED:');
    console.log('==============================');
    if (undefinedTickets.length > 0) {
      console.log('❌ Some tickets have no Friday/Saturday data in database');
      console.log('❌ Our resend script defaults to "Friday August 8 2025" for missing data');
      console.log('❌ But users may have actually selected Saturday!');
    }
    
    console.log('\n💡 SOLUTION NEEDED:');
    console.log('===================');
    console.log('1. Check original JotForm submissions to get correct day selections');
    console.log('2. Update database with correct eventDate/chooseYour values');  
    console.log('3. Or modify resend script to not assume Friday as default');
    
  } catch (error) {
    console.error('\n💥 Investigation failed:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the investigation
if (require.main === module) {
  investigateFridaySaturdayIssue()
    .then(() => {
      console.log('\n✅ Friday/Saturday investigation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Investigation failed:', error);
      process.exit(1);
    });
}

module.exports = { investigateFridaySaturdayIssue };
