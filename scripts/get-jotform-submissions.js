const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const FORM_ID = '241078261192858'; // Stadium 24 form

async function getRecentSubmissions() {
  try {
    console.log(`🔍 Fetching recent submissions for form ${FORM_ID}...`);
    
    const response = await axios.get(`https://api.jotform.com/form/${FORM_ID}/submissions`, {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 3,
        orderby: 'created_at',
        direction: 'DESC'
      },
      timeout: 30000
    });
    
    const submissions = response.data.content || [];
    console.log(`✅ Retrieved ${submissions.length} submissions`);
    
    if (submissions.length === 0) {
      console.log('No submissions found');
      return;
    }
    
    // Print details of the most recent submission
    const latestSubmission = submissions[0];
    console.log('\n📋 Latest Submission Details:');
    console.log('===============================');
    console.log(`Submission ID: ${latestSubmission.id}`);
    console.log(`Created: ${new Date(parseInt(latestSubmission.created_at) * 1000).toLocaleString()}`);
    
    // Extract form answers
    const answers = latestSubmission.answers || {};
    
    // Find the product field (usually field #3)
    console.log('\n🎫 Product Field (3):');
    console.log('===============================');
    if (answers['3']) {
      const productField = answers['3'].answer;
      console.log('Raw product data:', JSON.stringify(productField, null, 2));
      
      // Parse payment array if it exists
      if (productField && productField.paymentArray) {
        try {
          const paymentData = JSON.parse(productField.paymentArray);
          console.log('\nParsed payment data:', JSON.stringify(paymentData, null, 2));
          
          // Extract quantity from product string
          if (paymentData.product && paymentData.product.length > 0) {
            const productString = paymentData.product[0];
            console.log('\nProduct string:', productString);
            
            const quantityMatch = productString.match(/Quantity:\s*(\d+)/);
            if (quantityMatch) {
              console.log(`\n✅ Detected quantity: ${quantityMatch[1]}`);
            } else {
              console.log('\n❌ No quantity found in product string');
            }
          }
        } catch (error) {
          console.error('Error parsing payment array:', error.message);
        }
      } else {
        console.log('No payment array found in product field');
      }
    } else {
      console.log('Product field not found in submission');
    }
    
    // Print other important fields
    console.log('\n📝 Other Important Fields:');
    console.log('===============================');
    
    // Email (field 5)
    if (answers['5']) {
      console.log(`Email: ${answers['5'].answer}`);
    }
    
    // Name (field 4)
    if (answers['4']) {
      const nameAnswer = answers['4'].answer;
      let name = '';
      if (typeof nameAnswer === 'object') {
        name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
      } else {
        name = String(nameAnswer);
      }
      console.log(`Name: ${name}`);
    }
    
    // Invoice ID (field 38)
    if (answers['38']) {
      console.log(`Invoice ID: ${answers['38'].answer}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

// Run the function
getRecentSubmissions();
