const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Configuration from .env
const MONGODB_URI = process.env.MONGODB_URI;
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_EVENT_ID = new ObjectId('6839054d129ea83345fee040');
const STADIUM_25_FORM_ID = '251481969313867';

console.log('🚀 Stadium 25 Quantity Update Script (Database → JotForm)');
console.log('========================================================');

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
        
        // Extract quantity from product descriptions like "Early Bird General Admission (Amount: 8.00 AUD, Quantity: 2)"
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

// Function to find JotForm submission by email
async function findSubmissionByEmail(email) {
  try {
    console.log(`    🔍 Looking up JotForm submission for: ${email}`);
    
    // Get all submissions for the form
    const response = await jotformAPI.get(`/form/${STADIUM_25_FORM_ID}/submissions`);
    const submissions = response.data.content;
    
    // Find submission with matching email
    for (const submission of submissions) {
      const answers = submission.answers;
      
      // Check field 4 for email (based on Stadium 25 form structure)
      if (answers['4'] && answers['4'].answer) {
        const submissionEmail = answers['4'].answer.toLowerCase().trim();
        
        if (submissionEmail === email.toLowerCase().trim()) {
          console.log(`    ✅ Found matching submission: ${submission.id}`);
          return { submission, answers };
        }
      }
    }
    
    console.log(`    ❌ No matching submission found for ${email}`);
    return null;
    
  } catch (error) {
    console.log(`    ❌ Error looking up submission for ${email}: ${error.message}`);
    return null;
  }
}

async function updateStadium25Quantities() {
  let mongoClient;
  
  try {
    // Connect to MongoDB
    console.log('\n📊 STEP 1: Connecting to MongoDB');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Get all Stadium 25 tickets
    console.log('\n🎫 STEP 2: Finding Stadium 25 tickets');
    const tickets = await db.collection('tickets').find({
      event: STADIUM_25_EVENT_ID
    }).toArray();
    
    console.log(`✅ Found ${tickets.length} Stadium 25 tickets to process`);
    
    // Track statistics
    let processedCount = 0;
    let updatedCount = 0;
    let noChangeCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    console.log('\n🔄 STEP 3: Processing each ticket');
    
    // Process each ticket
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      console.log(`\n📧 [${i + 1}/${tickets.length}] Processing: ${ticket.email}`);
      console.log(`  Current quantity: ${ticket.quantity}`);
      
      try {
        // Find JotForm submission for this email
        const submissionData = await findSubmissionByEmail(ticket.email);
        
        if (!submissionData) {
          console.log(`  ❌ No JotForm submission found`);
          notFoundCount++;
          continue;
        }
        
        // Parse quantity from submission
        const correctQuantity = parseQuantityFromSubmission(submissionData.answers);
        
        // Check if update is needed
        if (ticket.quantity === correctQuantity) {
          console.log(`  ✅ Quantity already correct (${correctQuantity})`);
          noChangeCount++;
        } else {
          // Update the ticket
          const updateResult = await db.collection('tickets').updateOne(
            { _id: ticket._id },
            { 
              $set: { 
                quantity: correctQuantity,
                updatedAt: new Date(),
                quantityFixedAt: new Date(),
                jotformSubmissionId: submissionData.submission.id
              } 
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`  ✅ Updated: ${ticket.quantity} → ${correctQuantity}`);
            updatedCount++;
          } else {
            console.log(`  ❌ Failed to update database`);
            errorCount++;
          }
        }
        
        processedCount++;
        
        // Add small delay to avoid overwhelming JotForm API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`  ❌ Error processing ticket: ${error.message}`);
        errorCount++;
      }
    }
    
    // Final summary
    console.log('\n🎉 PROCESSING COMPLETE');
    console.log('=====================');
    console.log(`📊 Total tickets: ${tickets.length}`);
    console.log(`✅ Successfully processed: ${processedCount}`);
    console.log(`🔄 Updated quantities: ${updatedCount}`);
    console.log(`📊 No change needed: ${noChangeCount}`);
    console.log(`❌ No submission found: ${notFoundCount}`);
    console.log(`💥 Errors: ${errorCount}`);
    
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
    
    // Check Emma Hale specifically
    const emmaTicket = await db.collection('tickets').findOne({ 
      email: 'emailemmahale@gmail.com',
      event: STADIUM_25_EVENT_ID
    });
    
    if (emmaTicket) {
      console.log(`\n🎯 Emma Hale's final quantity: ${emmaTicket.quantity}`);
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
  updateStadium25Quantities()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateStadium25Quantities };
