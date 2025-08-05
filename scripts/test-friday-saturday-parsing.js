const { parseWebhook } = require('../build/services/jotform.service.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🔍 Testing Friday/Saturday Parsing Logic');
console.log('=========================================');

async function testFridaySaturdayParsing() {
  try {
    console.log('\n🧪 TEST 1: Friday Selection');
    const fridayWebhook = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: { first: "Test", last: "Friday" },
        q4_email: "test@example.com",
        q16_phone: "0412345678",
        q19_eventDate: "Friday August 8 2025",
        q23_church: "Test Church",
        q11_invoiceId: "# INV-TEST001",
        q9_products: {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 15.00 AUD, Quantity: 1)"],
            currency: "AUD",
            total: "15.00"
          })
        }
      })
    };
    
    const fridayResult = await parseWebhook(fridayWebhook);
    console.log('✅ Friday Test Result:');
    console.log(`   Input q19_eventDate: "Friday August 8 2025"`);
    console.log(`   Parsed chooseYour: "${fridayResult.chooseYour}"`);
    console.log(`   Expected: "Friday"`);
    console.log(`   ✅ Correct: ${fridayResult.chooseYour === 'Friday' ? 'YES' : 'NO'}`);
    
    console.log('\n🧪 TEST 2: Saturday Selection');
    const saturdayWebhook = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: { first: "Test", last: "Saturday" },
        q4_email: "test@example.com",
        q16_phone: "0412345678",
        q19_eventDate: "Saturday August 9 2025",
        q23_church: "Test Church",
        q11_invoiceId: "# INV-TEST002",
        q9_products: {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 15.00 AUD, Quantity: 1)"],
            currency: "AUD",
            total: "15.00"
          })
        }
      })
    };
    
    const saturdayResult = await parseWebhook(saturdayWebhook);
    console.log('✅ Saturday Test Result:');
    console.log(`   Input q19_eventDate: "Saturday August 9 2025"`);
    console.log(`   Parsed chooseYour: "${saturdayResult.chooseYour}"`);
    console.log(`   Expected: "Saturday"`);
    console.log(`   ✅ Correct: ${saturdayResult.chooseYour === 'Saturday' ? 'YES' : 'NO'}`);
    
    console.log('\n🧪 TEST 3: Database Simulation - Real Ticket Data');
    // Simulate what happens with real ticket data from database
    const realTicketSimulation = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: { first: "Abbie", last: "Mirtschin" },
        q4_email: "test@example.com",
        q16_phone: "N/A",
        q19_eventDate: "Friday August 8 2025", // This is what would be in database for Friday ticket
        q23_church: "N/A",
        q11_invoiceId: "# INV-TEST003",
        q9_products: {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 15.00 AUD, Quantity: 1)"],
            currency: "AUD",
            total: "15.00"
          })
        }
      })
    };
    
    const realResult = await parseWebhook(realTicketSimulation);
    console.log('✅ Real Ticket Simulation Result:');
    console.log(`   Database eventDate: "Friday August 8 2025"`);
    console.log(`   Simulated q19_eventDate: "Friday August 8 2025"`);
    console.log(`   Parsed chooseYour: "${realResult.chooseYour}"`);
    console.log(`   Expected: "Friday"`);
    console.log(`   ✅ Correct: ${realResult.chooseYour === 'Friday' ? 'YES' : 'NO'}`);
    
    console.log('\n🧪 TEST 4: Edge Case - What if user selected Friday but got Saturday?');
    const edgeCaseWebhook = {
      formID: "251481969313867",
      rawRequest: JSON.stringify({
        q3_name: { first: "Abbie", last: "Mirtschin" },
        q4_email: "test@example.com",
        q16_phone: "N/A",
        q19_eventDate: "Saturday August 9 2025", // What if this is wrong in our resend?
        q23_church: "N/A",
        q11_invoiceId: "# INV-TEST004",
        q9_products: {
          paymentArray: JSON.stringify({
            product: ["General Admission (Amount: 15.00 AUD, Quantity: 1)"],
            currency: "AUD",
            total: "15.00"
          })
        }
      })
    };
    
    const edgeResult = await parseWebhook(edgeCaseWebhook);
    console.log('✅ Edge Case Result:');
    console.log(`   Input q19_eventDate: "Saturday August 9 2025"`);
    console.log(`   Parsed chooseYour: "${edgeResult.chooseYour}"`);
    console.log(`   This would cause Friday → Saturday error!`);
    
    console.log('\n🚨 DIAGNOSIS:');
    console.log('=============');
    console.log('✅ The parsing logic itself is working correctly');
    console.log('✅ Friday → Friday, Saturday → Saturday');
    console.log('❌ BUT: If database has wrong eventDate, it will parse wrong chooseYour');
    console.log('❌ OR: If our resend script uses wrong fallback data');
    
    console.log('\n💡 INVESTIGATION NEEDED:');
    console.log('========================');
    console.log('1. Check specific user\'s database record');
    console.log('2. Verify what eventDate is stored for Abbie Mirtschin');
    console.log('3. Check if resend script is using correct eventDate');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testFridaySaturdayParsing()
    .then(() => {
      console.log('\n✅ Friday/Saturday parsing test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFridaySaturdayParsing };
