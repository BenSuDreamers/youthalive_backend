const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse product details from JotForm's "My Products" field
const parseProductDetails = (productField) => {
  let quantity = 1;
  let productDetails = '';
  let totalAmount = 0;

  try {
    if (productField && typeof productField === 'object') {
      // Check if it has paymentArray (typical format for Stadium 24 form)
      if (productField.paymentArray) {
        const paymentData = JSON.parse(productField.paymentArray);
        
        if (paymentData.product && Array.isArray(paymentData.product)) {
          // Extract quantity from product string like "General Admission (Amount: 5.00 AUD, Quantity: 15)"
          const productString = paymentData.product[0] || '';
          const quantityMatch = productString.match(/Quantity:\s*(\d+)/);
          if (quantityMatch) {
            quantity = parseInt(quantityMatch[1], 10) || 1;
          }
          
          productDetails = productString;
        }
        
        if (paymentData.total) {
          totalAmount = parseFloat(paymentData.total) || 0;
        }
      }
      
      // Check if it has the direct product data format
      if (productField['1']) {
        const productData = JSON.parse(productField['1']);
        if (productData.quantity) {
          quantity = parseInt(productData.quantity, 10) || 1;
        }
        if (productData.name) {
          productDetails = `${productData.name} (Quantity: ${quantity})`;
        }
        if (productData.price) {
          totalAmount = productData.price * quantity;
        }
      }
    } else if (typeof productField === 'string') {
      // Handle string format like "General Admission (Amount: 5.00 AUD, Quantity: 15)"
      const quantityMatch = productField.match(/Quantity:\s*(\d+)/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1], 10) || 1;
      }
      
      const amountMatch = productField.match(/Amount:\s*([\d.]+)/);
      if (amountMatch) {
        const unitPrice = parseFloat(amountMatch[1]) || 0;
        totalAmount = unitPrice * quantity;
      }
      
      productDetails = productField;
    }
  } catch (error) {
    console.error('Error parsing product details', error);
  }

  return { quantity, productDetails, totalAmount };
};

async function debugJotformProducts() {
  try {
    // Check Stadium 24 form with ticket data
    const formId = '241078261192858';
    console.log(`\n🔍 Debugging "My Products" field in form ${formId}...`);
    
    // Get form details
    const formResponse = await axios.get(
      `https://api.jotform.com/form/${formId}/questions`,
      { params: { apiKey: process.env.JOTFORM_API_KEY } }
    );
    
    const questions = formResponse.data.content || {};
    console.log('\n📋 Product field identification:');
    console.log('===============================');
      // Find the product field (usually field #3)
    let productFieldId = '3';  // Hard-code it since we know it's field 3
    console.log(`Using product field: ${productFieldId}`);
    
    // Get a few sample submissions
    const submissionsResponse = await axios.get(
      `https://api.jotform.com/form/${formId}/submissions`,
      {
        params: { 
          apiKey: process.env.JOTFORM_API_KEY, 
          limit: 5,
          orderby: 'created_at',
          direction: 'DESC'
        },
        timeout: 30000
      }
    );
    
    const submissions = submissionsResponse.data.content || [];
    console.log(`\n📝 Sample product data from submissions (${submissions.length}):`);
    console.log('=================================================');
    
    submissions.forEach((submission, index) => {
      const productField = submission.answers[productFieldId]?.answer;
      
      console.log(`\n  Submission ${index + 1} (ID: ${submission.id}):`);
      console.log(`  Raw product data: ${JSON.stringify(productField)}`);
      
      // Parse the product data
      const parsedProduct = parseProductDetails(productField);
      console.log(`  Parsed product data:`);
      console.log(`    Quantity: ${parsedProduct.quantity}`);
      console.log(`    Product Details: ${parsedProduct.productDetails}`);
      console.log(`    Total Amount: ${parsedProduct.totalAmount}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the script
console.log('🔍 Starting JotForm Product Fields Debugging...');
debugJotformProducts();
