const { parseWebhook } = require('../build/services/jotform.service');

// Test with real Jotform payload structure from the logs
const testPayload = {
  action: "",
  webhookURL: "https://youthalive-backend-873403ae276a.herokuapp.com/api/webhooks/jotform",
  username: "Benjamin_benjamin_SuBenjamin",
  formID: "251442125173852",
  type: "WEB",
  formTitle: "WebApp test form",
  submissionID: "6240369081428987368",
  rawRequest: JSON.stringify({
    "q3_ltstronggtnameltstronggt": {"first": "Bijin", "last": "Johnson"},
    "q4_email4": "johnson.bijin.99@gmail.com",
    "q16_ltstronggtphoneNumberltstronggt": "0466575735",
    "q12_ltstronggtwhichYouth": "Dreamers Youth Test 4",
    "q11_invoiceId": "# INV-000011"
  }),
  pretty: "<strong>Name</strong>:Bijin Johnson, <strong>E-mail</strong>:johnson.bijin.99@gmail.com, <strong>Phone Number</strong>:0466575735, <strong>Which youth group are you coming with?</strong>:Dreamers Youth Test 4, Invoice ID:# INV-000011",
  ip: "175.35.67.241"
};

try {
  console.log('Testing parseWebhook with real payload...');
  const result = parseWebhook(testPayload);
  console.log('Parsed result:', result);
  
  // Check if all required fields are present
  if (result.email && result.name && result.invoiceNo) {
    console.log('✅ SUCCESS: All required fields parsed correctly');
  } else {
    console.log('❌ FAILED: Missing required fields');
    console.log('Missing:', {
      email: !result.email,
      name: !result.name,
      invoiceNo: !result.invoiceNo
    });
  }
} catch (error) {
  console.error('Error testing parseWebhook:', error);
}
