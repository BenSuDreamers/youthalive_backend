require('dotenv').config();
const axios = require('axios');

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const STADIUM_25_FORM_ID = '251481969313867'; // Stadium 25 form ID

async function searchJotFormForInvoice() {
  try {
    console.log('🔍 Searching JotForm for invoice INV-000026...');
    console.log('Form ID:', STADIUM_25_FORM_ID);
    
    // Get all submissions from Stadium 25 form
    const response = await axios.get(`https://api.jotform.com/form/${STADIUM_25_FORM_ID}/submissions`, {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 1000, // Get more submissions
        orderby: 'created_at'
      }
    });
    
    const submissions = response.data.content;
    console.log(`✅ Found ${submissions.length} total submissions in JotForm`);
    
    // Search for submissions with invoice 000026 or INV-000026
    const matchingSubmissions = submissions.filter(submission => {
      const answers = submission.answers || {};
      
      // Check field 11 (invoice field in Stadium 25 form)
      const invoiceField = answers['11'] && answers['11'].answer;
      if (!invoiceField) return false;
      
      // Check various formats
      return invoiceField.includes('000026') || 
             invoiceField.includes('INV-000026') ||
             invoiceField === '# INV-000026';
    });
    
    console.log(`\nFound ${matchingSubmissions.length} matching submissions:`);
    
    matchingSubmissions.forEach((submission, index) => {
      console.log(`\n--- Submission ${index + 1} ---`);
      console.log(`ID: ${submission.id}`);
      console.log(`Created: ${submission.created_at}`);
      console.log(`Status: ${submission.status}`);
      
      const answers = submission.answers || {};
      const nameAnswer = answers['3'] && answers['3'].answer;
      const firstName = nameAnswer && nameAnswer.first ? nameAnswer.first : '';
      const lastName = nameAnswer && nameAnswer.last ? nameAnswer.last : '';
      
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`Email: ${answers['4'] && answers['4'].answer ? answers['4'].answer : 'N/A'}`);
      console.log(`Invoice: ${answers['11'] && answers['11'].answer ? answers['11'].answer : 'N/A'}`);
      console.log(`Event Date: ${answers['19'] && answers['19'].answer ? answers['19'].answer : 'N/A'}`);
      console.log(`Phone: ${answers['16'] && answers['16'].answer ? answers['16'].answer : 'N/A'}`);
      console.log(`Church: ${answers['23'] && answers['23'].answer ? answers['23'].answer : 'N/A'}`);
      
      // Check payment info
      if (answers['9'] && answers['9'].answer && answers['9'].answer.paymentArray) {
        try {
          const payment = JSON.parse(answers['9'].answer.paymentArray);
          console.log(`Payment Total: ${payment.total} ${payment.currency}`);
        } catch (e) {
          console.log('Payment: Could not parse payment data');
        }
      }
    });
    
    if (matchingSubmissions.length === 0) {
      console.log('\n❌ No submissions found with invoice 000026 in JotForm');
      console.log('This suggests the ticket may not have been properly submitted to JotForm');
    } else {
      console.log('\n✅ Found matching submission(s) in JotForm!');
      console.log('This suggests the issue is with database sync, not the original submission');
    }
    
  } catch (error) {
    console.error('❌ Error searching JotForm:', error.message);
    if (error.response && error.response.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

searchJotFormForInvoice();
