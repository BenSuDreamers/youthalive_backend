const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models (using the built JavaScript files)
const { Event } = require('../build/models/event.model');
const { User } = require('../build/models/user.model');
const { Ticket } = require('../build/models/ticket.model');

async function importJotformSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all events from our database
    const events = await Event.find({});
    console.log(`📋 Found ${events.length} events in database`);

    for (const event of events) {
      console.log(`\n🎫 Processing event: ${event.title} (Form ID: ${event.formId})`);
      
      try {
        // Fetch submissions from Jotform
        const response = await axios.get(
          `https://api.jotform.com/form/${event.formId}/submissions`,
          {
            params: { apiKey: process.env.JOTFORM_API_KEY, limit: 1000 },
            timeout: 30000
          }
        );

        const submissions = response.data.content || [];
        console.log(`   📝 Found ${submissions.length} submissions for this event`);

        let importedCount = 0;
        let skippedCount = 0;

        for (const submission of submissions) {
          try {
            const answers = submission.answers || {};            // Extract field data based on form type
            let name = '';
            let email = '';
            let phone = '';
            let church = '';
            let invoiceId = submission.id;
            
            if (event.formId === '251197541475866') {
              // Stadium Registration Form field mapping
              const nameValue = answers['3']?.answer || '';
              if (typeof nameValue === 'object') {
                if (nameValue.first || nameValue.last) {
                  name = `${nameValue.first || ''} ${nameValue.last || ''}`.trim();
                } else {
                  name = nameValue.value || nameValue.name || '';
                }
              } else {
                name = nameValue.toString().trim();
              }
              
              email = answers['4']?.answer || '';
              phone = answers['16']?.answer || '';
              church = answers['12']?.answer || '';
              invoiceId = answers['11']?.answer || submission.id;
              
            } else if (event.formId === '241078261192858') {
              // Stadium 24 form field mapping
              const nameValue = answers['4']?.answer || '';
              if (typeof nameValue === 'object') {
                if (nameValue.first || nameValue.last) {
                  name = `${nameValue.first || ''} ${nameValue.last || ''}`.trim();
                } else {
                  name = nameValue.value || nameValue.name || '';
                }
              } else {
                name = nameValue.toString().trim();
              }
              
              email = answers['5']?.answer || '';
              phone = answers['7']?.answer || '';
              church = answers['10']?.answer || '';
              
              // Extract invoice number and clean it
              let invoiceValue = answers['38']?.answer || submission.id;
              if (typeof invoiceValue === 'string' && invoiceValue.startsWith('# INV-')) {
                invoiceValue = invoiceValue.replace('# INV-', '');
              }
              invoiceId = invoiceValue;
              
            } else {
              // Generic form handling - try common field patterns
              const nameValue = answers['3']?.answer || answers['4']?.answer || '';
              if (typeof nameValue === 'object') {
                if (nameValue.first || nameValue.last) {
                  name = `${nameValue.first || ''} ${nameValue.last || ''}`.trim();
                } else {
                  name = nameValue.value || nameValue.name || '';
                }
              } else {
                name = nameValue.toString().trim();
              }
              
              email = answers['4']?.answer || answers['5']?.answer || '';
              phone = answers['7']?.answer || answers['16']?.answer || '';
              church = answers['10']?.answer || answers['12']?.answer || '';
              invoiceId = answers['11']?.answer || answers['38']?.answer || submission.id;
            }if (!name || !email) {
              console.log(`   ⚠️  Skipping submission ${submission.id} - missing name or email`);
              skippedCount++;
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              console.log(`   ⚠️  Skipping submission ${submission.id} - invalid email format: ${email}`);
              skippedCount++;
              continue;
            }

            // Check if ticket already exists
            const existingTicket = await Ticket.findOne({ 
              invoiceNo: invoiceId.toString() 
            });

            if (existingTicket) {
              skippedCount++;
              continue;
            }            // Create or find user
            let user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
              const hashedPassword = await bcrypt.hash('temppass123', 10);
              user = new User({
                email: email.toLowerCase(),
                passwordHash: hashedPassword,
                createdAt: new Date(submission.created_at)
              });
              await user.save();
            }

            // Create ticket
            const ticket = new Ticket({
              invoiceNo: invoiceId.toString(),
              user: user._id,
              event: event._id,
              name: name,
              email: email.toLowerCase(),
              phone: phone || '',
              church: church || '',
              checkedIn: false,
              createdAt: new Date(submission.created_at)
            });

            await ticket.save();
            importedCount++;

            if (importedCount % 50 === 0) {
              console.log(`   📊 Imported ${importedCount} tickets so far...`);
            }

          } catch (submissionError) {
            console.error(`   ❌ Error processing submission ${submission.id}:`, submissionError.message);
            skippedCount++;
          }
        }

        console.log(`   ✅ Event complete: ${importedCount} imported, ${skippedCount} skipped`);

      } catch (eventError) {
        console.error(`❌ Error processing event ${event.title}:`, eventError.message);
      }
    }

    // Final summary
    const totalTickets = await Ticket.countDocuments();
    console.log(`\n🎉 Import complete! Total tickets in database: ${totalTickets}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the import
console.log('🚀 Starting Jotform submissions import...');
importJotformSubmissions();
