const axios = require('axios');

// URLs to check
const LOCAL_URL = 'http://localhost:3000/api';
const PROD_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com/api';

async function checkServerStatus() {
  console.log('🔍 Checking server status...');
  
  // Check local server
  try {
    console.log(`Checking local server at ${LOCAL_URL}...`);
    const localResponse = await axios.get(LOCAL_URL, { timeout: 5000 });
    console.log(`✅ Local server status: ${localResponse.status} - ${JSON.stringify(localResponse.data)}`);
  } catch (error) {
    console.error(`❌ Local server error: ${error.message}`);
  }
  
  // Check production server
  try {
    console.log(`\nChecking production server at ${PROD_URL}...`);
    const prodResponse = await axios.get(PROD_URL, { timeout: 10000 });
    console.log(`✅ Production server status: ${prodResponse.status} - ${JSON.stringify(prodResponse.data)}`);
  } catch (error) {
    console.error(`❌ Production server error: ${error.message}`);
  }
}

checkServerStatus();
