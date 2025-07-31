const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Configuration from .env
const MONGODB_URI = process.env.MONGODB_URI;
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');
const STADIUM_25_FORM_ID = '251481969313867';

console.log('🔄 Stadium 25 Database Replacement Script (JotForm → Database)');
console.log('==============================================================');

// JotForm API client
const jotformAPI = axios.create({
  baseURL: 'https://api.jotform.com',
  headers: { 'APIKEY': JOTFORM_API_KEY }
});

// Function to parse quantity from JotForm submission
function parseQuantityFromSubmission(answers) {
  let quantity = 1; // default
  
  // Stadium 25 form field 9 contains the products/quantity
  if (answers['9'] && answers['9'].answer) {
    console.log(`      Parsing products field...`);
    
    try {
      const productAnswer = answers['9'].answer;
      
      // The answer can be an object with numbered keys (0, 1, etc.) or a paymentArray
      let totalQuantity = 0;
      
      // Try to parse paymentArray first (most reliable)
      if (productAnswer.paymentArray) {
        const paymentData = JSON.parse(productAnswer.paymentArray);
        console.log(`      Payment data found: ${JSON.stringify(paymentData.product)}`);
        
        // Extract quantity from product descriptions like "Early Bird General Admission (Amount: 8.00 AUD, Quantity: 1)"
        if (paymentData.product && Array.isArray(paymentData.product)) {
          paymentData.product.forEach(productDesc => {
            const quantityMatch = productDesc.match(/Quantity:\s*(\d+)/i);
            if (quantityMatch) {
              totalQuantity += parseInt(quantityMatch[1], 10);
            }
          });
        }
      }
      
      // If paymentArray didn't work, try parsing individual product entries
      if (totalQuantity === 0) {
        Object.keys(productAnswer).forEach(key => {
          if (key !== 'paymentArray' && productAnswer[key]) {
            try {
              const productData = JSON.parse(productAnswer[key]);
              if (productData.quantity && !isNaN(productData.quantity)) {
                totalQuantity += parseInt(productData.quantity, 10);
                console.log(`      Found quantity ${productData.quantity} in product: ${productData.name}`);
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        });
      }
      
      if (totalQuantity > 0) {
        quantity = totalQuantity;
        console.log(`      ✅ Total quantity found: ${quantity}`);
      } else {
        console.log(`      ⚠️  No quantity found in products, defaulting to 1`);
      }
      
    } catch (error) {
      console.log(`      ❌ Error parsing products: ${error.message}, defaulting to 1`);
    }
  } else {
    console.log(`      ⚠️  No product field found (field 9), defaulting to 1`);
  }
  
  return quantity;
}

// Function to extract ticket data from JotForm submission
function extractTicketData(submission) {
  const answers = submission.answers || {};
  
  // Extract basic info
  const name = answers['3']?.answer ? 
    `${answers['3'].answer.first || ''} ${answers['3'].answer.last || ''}`.trim() : 
    'Unknown';
  
  const email = answers['4']?.answer?.toLowerCase().trim() || '';
  const phone = answers['16']?.answer || '';
  const church = answers['23']?.answer || '';
  const eventDate = answers['19']?.answer || '';
  
  // Extract just the 6-digit invoice number from JotForm format (e.g., "# INV-000213" -> "000213")
  let invoiceNumber = null;
  if (answers['11']?.answer) {
    const invoiceMatch = answers['11'].answer.match(/INV-(\d{6})/);
    if (invoiceMatch) {
      invoiceNumber = invoiceMatch[1]; // Just the 6-digit number
    }
  }
  
  // Parse quantity
  const quantity = parseQuantityFromSubmission(answers);
  
  // Extract payment info
  let paymentInfo = {};
  if (answers['9']?.answer?.paymentArray) {
    try {
      const paymentData = JSON.parse(answers['9'].answer.paymentArray);
      paymentInfo = {
        total: paymentData.total || '0',
        currency: paymentData.currency || 'AUD',
        transactionId: paymentData.transactionid || paymentData.squareData?.transactionId || null,
        paymentMethod: paymentData.paymentmethod || paymentData.squareData?.paymentMethod || 'Unknown'
      };
    } catch (e) {
      console.log(`      ⚠️  Could not parse payment data: ${e.message}`);
    }
  }
  
  return {
    name,
    email,
    phone,
    church,
    eventDate,
    quantity,
    event: STADIUM_25_EVENT_ID,
    formSubmissionId: submission.id,
    createdAt: new Date(submission.created_at),
    updatedAt: new Date(),
    status: 'confirmed',
    source: 'jotform',
    paymentInfo,
    invoiceNo: invoiceNumber, // Use actual JotForm-generated invoice number
    rawSubmission: submission // Store full submission for reference
  };
}

async function replaceStadium25WithJotform() {
  let mongoClient;
  
  try {
    // Connect to MongoDB
    console.log('\n📊 STEP 1: Connecting to MongoDB');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Get current Stadium 25 tickets count
    console.log('\n🗑️  STEP 2: Checking current Stadium 25 tickets');
    const currentCount = await db.collection('tickets').countDocuments({
      event: STADIUM_25_EVENT_ID
    });
    console.log(`📊 Found ${currentCount} existing Stadium 25 tickets`);
    
    // Delete existing Stadium 25 tickets
    if (currentCount > 0) {
      console.log('\n🗑️  STEP 3: Deleting existing Stadium 25 tickets');
      const deleteResult = await db.collection('tickets').deleteMany({
        event: STADIUM_25_EVENT_ID
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} tickets`);
    } else {
      console.log('\n⏭️  STEP 3: No existing tickets to delete');
    }
    
    // Fetch all JotForm submissions
    console.log('\n📥 STEP 4: Fetching JotForm submissions');
    const response = await jotformAPI.get(`/form/${STADIUM_25_FORM_ID}/submissions`, {
      params: { limit: 1000 }
    });
    
    const submissions = response.data.content || [];
    console.log(`✅ Found ${submissions.length} JotForm submissions`);
    
    // Process and insert each submission
    console.log('\n🔄 STEP 5: Processing JotForm submissions');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      try {
        console.log(`\n📧 [${i + 1}/${submissions.length}] Processing submission ${submission.id}`);
        
        // Extract ticket data
        const ticketData = extractTicketData(submission);
        
        if (!ticketData.email) {
          console.log(`  ⚠️  Skipping - no email found`);
          errorCount++;
          errors.push(`Submission ${submission.id}: No email found`);
          continue;
        }
        
        console.log(`  📧 Email: ${ticketData.email}`);
        console.log(`  👤 Name: ${ticketData.name}`);
        console.log(`  🎫 Quantity: ${ticketData.quantity}`);
        console.log(`  ⛪ Church: ${ticketData.church}`);
        console.log(`  💰 Payment: ${ticketData.paymentInfo.total} ${ticketData.paymentInfo.currency}`);
        console.log(`  🧾 Invoice: ${ticketData.invoiceNo || 'N/A'}`);
        
        // Insert ticket into database
        const insertResult = await db.collection('tickets').insertOne(ticketData);
        
        if (insertResult.insertedId) {
          console.log(`  ✅ Inserted ticket: ${insertResult.insertedId}`);
          successCount++;
        } else {
          console.log(`  ❌ Failed to insert ticket`);
          errorCount++;
          errors.push(`Submission ${submission.id}: Failed to insert`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error processing submission: ${error.message}`);
        errorCount++;
        errors.push(`Submission ${submission.id}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log('\n🎉 REPLACEMENT COMPLETE');
    console.log('======================');
    console.log(`📊 Total JotForm submissions: ${submissions.length}`);
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Show final quantity distribution
    console.log('\n📈 Final quantity distribution in database:');
    const quantityStats = await db.collection('tickets')
      .aggregate([
        { $match: { event: STADIUM_25_EVENT_ID } },
        { $group: { _id: '$quantity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
      .toArray();
    
    quantityStats.forEach(stat => {
      console.log(`   Quantity ${stat._id}: ${stat.count} tickets`);
    });
    
    // Show total tickets by email to check for duplicates
    console.log('\n📧 Email distribution (checking for duplicates):');
    const emailStats = await db.collection('tickets')
      .aggregate([
        { $match: { event: STADIUM_25_EVENT_ID } },
        { $group: { _id: '$email', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    
    if (emailStats.length > 0) {
      console.log('   ⚠️  Found duplicate emails:');
      emailStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} tickets (${stat.totalQuantity} total quantity)`);
      });
    } else {
      console.log('   ✅ No duplicate emails found');
    }
    
    // Final count verification
    const finalCount = await db.collection('tickets').countDocuments({
      event: STADIUM_25_EVENT_ID
    });
    console.log(`\n📊 Final Stadium 25 tickets in database: ${finalCount}`);
    
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
  replaceStadium25WithJotform()
    .then(() => {
      console.log('\n✅ Database replacement completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database replacement failed:', error);
      process.exit(1);
    });
}

module.exports = { replaceStadium25WithJotform };
