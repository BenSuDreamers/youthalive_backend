const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connection URI
const MONGODB_URI = process.env.MONGODB_URI;

// Ticket model schema (simplified version matching our database schema)
const ticketSchema = new mongoose.Schema({
  invoiceNo: String,
  checkedIn: Boolean,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  name: String,
  email: String,
  phone: String,
  church: String,
  youthMinistry: String,
  quantity: Number,
  productDetails: String,
  totalAmount: Number,
  checkInTime: Date,
  createdAt: Date,
  updatedAt: Date
});

// Create the Ticket model
const Ticket = mongoose.model('Ticket', ticketSchema);

async function verifyTicket(ticketId) {
  try {
    console.log(`🔍 Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`\n🔍 Searching for ticket with ID: ${ticketId}`);
    const ticket = await Ticket.findById(ticketId).lean();

    if (!ticket) {
      console.error(`❌ Ticket with ID ${ticketId} not found`);
      return;
    }

    console.log('✅ Ticket found!');
    console.log('\n📋 Ticket Details:');
    console.log('===============================');
    console.log(`Invoice No: ${ticket.invoiceNo}`);
    console.log(`Email: ${ticket.email}`);
    console.log(`Name: ${ticket.name || 'Not set'}`);
    console.log(`Phone: ${ticket.phone || 'Not set'}`);
    console.log(`Church: ${ticket.church || 'Not set'}`);
    
    // Highlight the quantity information
    console.log('\n🎫 Quantity Information:');
    console.log('===============================');
    console.log(`Quantity: ${ticket.quantity || 1}`);
    console.log(`Product Details: ${ticket.productDetails || 'Not set'}`);
    console.log(`Total Amount: $${ticket.totalAmount || 0}`);
    
    console.log('\n📅 Timestamps:');
    console.log('===============================');
    console.log(`Created: ${ticket.createdAt}`);
    console.log(`Updated: ${ticket.updatedAt}`);
    console.log(`Checked In: ${ticket.checkedIn ? 'Yes' : 'No'}`);
    if (ticket.checkInTime) {
      console.log(`Check-in Time: ${ticket.checkInTime}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Get ticket ID from command line arguments or use the last successful test
const ticketId = process.argv[2] || '68341b22b393520302df6f55';

// Run the verification
verifyTicket(ticketId);
