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
        let skippedCount = 0;        for (const submission of submissions) {
          try {
            const answers = submission.answers || {};

            // Extract field data - handle different field types
            let name = answers['3']?.answer || '';
            let email = answers['4']?.answer || '';
            let phone = answers['16']?.answer || '';
            let church = answers['12']?.answer || '';
            let invoiceId = answers['11']?.answer || submission.id;

            // Handle cases where fields might be objects/arrays
            if (typeof name === 'object' && name.first && name.last) {
              name = `${name.first} ${name.last}`;
            } else if (typeof name === 'object') {
              name = String(name.answer || name.value || '');
            }

            if (typeof email === 'object') {
              email = String(email.answer || email.value || email.text || '');
            }

            if (typeof phone === 'object') {
              phone = String(phone.answer || phone.value || '');
            }

            if (typeof church === 'object') {
              church = String(church.answer || church.value || '');
            }

            if (typeof invoiceId === 'object') {
              invoiceId = String(invoiceId.answer || invoiceId.value || submission.id);
            }

            // Convert to strings and validate
            name = String(name).trim();
            email = String(email).toLowerCase().trim();
            phone = String(phone).trim();
            church = String(church).trim();
            invoiceId = String(invoiceId).trim();

            if (!name || !email || !email.includes('@')) {
              console.log(`   ⚠️  Skipping submission ${submission.id} - missing/invalid name or email`);
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
            }

            // Create or find user
            let user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
              const hashedPassword = await bcrypt.hash('temppass123', 10);
              user = new User({
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name,
                church: church || '',
                phone: phone || ''
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
