/**
 * Test MailerSend trial account restrictions
 * Since trial accounts can only send to administrator's email,
 * we need to identify what that email is.
 */

const axios = require('axios');

const BACKEND_URL = 'https://youthalive-backend-873403ae276a.herokuapp.com';

// Common admin emails to test
const testEmails = [
    'hello@youthalivesa.org',  // The from email
    'admin@youthalivesa.org',  // Possible admin
    'benjamin@youthalivesa.org',  // Based on MongoDB username
    'ben@youthalivesa.org',
    'youthalive@youthalivesa.org'
];

async function testEmailSending() {
    console.log('🧪 Testing MailerSend trial account email restrictions...\n');
    
    for (const email of testEmails) {
        console.log(`📧 Testing email to: ${email}`);
        
        const payload = {
            formID: "251442125173852",
            submissionID: `test-admin-${Date.now()}`,
            rawRequest: JSON.stringify({
                form_id: "251442125173852",
                submission_id: `test-admin-${Date.now()}`,
                pretty: JSON.stringify({
                    "3": "Test Admin User",
                    "4": email,  // Use the test email
                    "11": `ADMIN-TEST-${Date.now()}`,
                    "12": "Test Church",
                    "16": "0412345678"
                })
            })
        };
        
        try {
            const response = await axios.post(`${BACKEND_URL}/api/webhooks/jotform`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ Success! Email sent to: ${email}`);
            console.log(`Response:`, response.data);
            break; // If successful, we found the admin email
            
        } catch (error) {
            if (error.response) {
                console.log(`❌ Failed for ${email}: ${error.response.data.message || 'Unknown error'}`);
            } else {
                console.log(`❌ Network error for ${email}: ${error.message}`);
            }
        }
        
        console.log(''); // Empty line for readability
        
        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n📝 Note: If all emails failed, you may need to:');
    console.log('1. Verify the domain in your MailerSend account');
    console.log('2. Upgrade from trial account');
    console.log('3. Check what email was used to create the MailerSend account');
}

testEmailSending().catch(console.error);
