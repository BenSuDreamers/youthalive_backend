const { parseWebhook } = require('../build/services/jotform.service.js');

console.log('🧪 Testing Stadium 25 Webhook Parsing with chooseYour Field');
console.log('===========================================================');

// Test data based on actual Stadium 25 form structure
const testWebhookData = {
  formID: '251481969313867',
  rawRequest: JSON.stringify({
    q3_name: { first: 'Test', last: 'User' },
    q4_email: 'test@example.com',
    q16_phone: '0412345678',
    q19_eventDate: 'Friday August 8 2025', // This is the key field!
    q23_church: 'XS Youth',
    q11_invoiceId: '# INV-000123',
    q9_products: {
      paymentArray: JSON.stringify({
        product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
        currency: 'AUD',
        total: '15.00'
      })
    }
  })
};

console.log('\n📝 Test Input:');
console.log('Form ID:', testWebhookData.formID);
console.log('Event Date Field (q19):', 'Friday August 8 2025');

try {
  console.log('\n🔄 Parsing webhook...');
  const result = parseWebhook(testWebhookData);
  
  console.log('\n✅ Parsing Results:');
  console.log('- Email:', result.email);
  console.log('- Name:', result.name);
  console.log('- Phone:', result.phone);
  console.log('- Church:', result.church);
  console.log('- Invoice:', result.invoiceNo);
  console.log('- Quantity:', result.quantity);
  console.log('- Choose Your Night:', result.chooseYour); // This should now work!
  
  if (result.chooseYour) {
    console.log('\n🎉 SUCCESS: chooseYour field is now being parsed correctly!');
  } else {
    console.log('\n⚠️  WARNING: chooseYour field is still not being parsed');
  }
  
} catch (error) {
  console.error('\n❌ Parsing failed:', error.message);
  console.error(error.stack);
}

// Test with Saturday as well
console.log('\n\n🧪 Testing Saturday Selection');
console.log('=============================');

const saturdayTestData = {
  ...testWebhookData,
  rawRequest: JSON.stringify({
    q3_name: { first: 'Test', last: 'User' },
    q4_email: 'test@example.com',
    q16_phone: '0412345678',
    q19_eventDate: 'Saturday August 9 2025', // Saturday test
    q23_church: 'XS Youth',
    q11_invoiceId: '# INV-000124',
    q9_products: {
      paymentArray: JSON.stringify({
        product: ['General Admission (Amount: 15.00 AUD, Quantity: 1)'],
        currency: 'AUD',
        total: '15.00'
      })
    }
  })
};

try {
  const saturdayResult = parseWebhook(saturdayTestData);
  console.log('\n✅ Saturday Test Results:');
  console.log('- Choose Your Night:', saturdayResult.chooseYour);
  
  if (saturdayResult.chooseYour === 'Saturday') {
    console.log('🎉 SUCCESS: Saturday detection working correctly!');
  } else {
    console.log('⚠️  WARNING: Saturday detection not working properly');
  }
  
} catch (error) {
  console.error('\n❌ Saturday test failed:', error.message);
}

console.log('\n📋 Summary:');
console.log('- The parseWebhook function should now extract the chooseYour field');
console.log('- This field will be passed to the email template');
console.log('- The email template will show the correct date (Friday/Saturday)');
console.log('- QR codes should appear in all new Stadium 25 emails');
