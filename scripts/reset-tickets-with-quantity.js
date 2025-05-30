const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;

// Define schemas based on our models
const eventSchema = new mongoose.Schema({
  formId: String,
  title: String,
  startTime: Date,
  endTime: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  invoiceNo: String,
  checkedIn: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  name: String,
  email: String,
  phone: String,
  church: String,
  youthMinistry: String,
  quantity: { type: Number, min: 1, default: 1 },
  productDetails: String,
  totalAmount: Number,
  checkInTime: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Event = mongoose.model('Event', eventSchema);
const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

// Function to parse product details from JotForm's "My Products" field
const parseProductDetails = (productField) => {
  let quantity = 1;
  let productDetails = '';
  let totalAmount = 0;

  try {
    if (productField && typeof productField === 'object') {
      // Check if it has paymentArray (typical format for Stadium 24 form)
      if (productField.paymentArray) {
        console.log(`Found paymentArray: ${productField.paymentArray}`);
        try {
          const paymentData = JSON.parse(productField.paymentArray);
          
          if (paymentData.product && Array.isArray(paymentData.product)) {
            // Extract quantity from product string like "General Admission (Amount: 5.00 AUD, Quantity: 15)"
            const productString = paymentData.product[0] || '';
            console.log(`Product string: ${productString}`);
            
            const quantityMatch = productString.match(/Quantity:\s*(\d+)/);
            if (quantityMatch) {
              quantity = parseInt(quantityMatch[1], 10) || 1;
              console.log(`Extracted quantity: ${quantity}`);
            }
            
            productDetails = productString;
          }
          
          if (paymentData.total) {
            totalAmount = parseFloat(paymentData.total) || 0;
          }
        } catch (error) {
          console.error(`Error parsing paymentArray: ${error.message}`);
        }
      }
      
      // Check if it has the direct product data format
      if (productField['1']) {
        try {
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
        } catch (error) {
          console.error(`Error parsing product data: ${error.message}`);
        }
      }
    } else if (typeof productField === 'string') {
      // Handle string format
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
    console.error(`Error parsing product details: ${error.message}`);
  }

  return { quantity, productDetails, totalAmount };
};

// Function to extract submission data
const parseSubmission = (submission, formId) => {
  const answers = submission.answers || {};
  
  // Default values
  let email = '';
  let name = '';
  let invoiceNo = `INV-${Date.now()}`;
  let phone = '';
  let church = '';
  let quantity = 1;
  let productDetails = '';
  let totalAmount = 0;
  
  // Extract email (field 5 in Stadium 24 form)
  if (answers['5']) {
    email = answers['5'].answer;
  }
  
  // Extract name (field 4 in Stadium 24 form)
  if (answers['4']) {
    const nameAnswer = answers['4'].answer;
    if (typeof nameAnswer === 'object') {
      name = `${nameAnswer.first || ''} ${nameAnswer.last || ''}`.trim();
    } else {
      name = String(nameAnswer);
    }
  }
  
  // Extract invoice number (field 38 in Stadium 24 form)
  if (answers['38']) {
    invoiceNo = answers['38'].answer;
    // Clean invoice number (remove "# INV-" prefix if present)
    if (typeof invoiceNo === 'string') {
      if (invoiceNo.startsWith('# INV-')) {
        invoiceNo = invoiceNo.substring(6);
      } else if (invoiceNo.startsWith('# ')) {
        invoiceNo = invoiceNo.substring(2);
      } else if (invoiceNo.startsWith('INV-')) {
        invoiceNo = invoiceNo.substring(4);
      }
    }
  }
  
  // Extract phone number (field 7 in Stadium 24 form)
  if (answers['7']) {
    phone = answers['7'].answer;
  }
  
  // Extract church (field 10 in Stadium 24 form)
  if (answers['10']) {
    church = answers['10'].answer;
  }
  
  // Extract product details (field 3 in Stadium 24 form)
  if (answers['3']) {
    const productField = answers['3'].answer;
    const parsed = parseProductDetails(productField);
    quantity = parsed.quantity;
    productDetails = parsed.productDetails;
    totalAmount = parsed.totalAmount;
  }
  
  return {
    formId,
    email,
    name,
    invoiceNo,
    phone,
    church,
    quantity,
    productDetails,
    totalAmount,
    submissionId: submission.id,
    created_at: new Date(parseInt(submission.created_at) * 1000)
  };
};

// Main function to reset tickets
async function resetTickets() {
  try {
    console.log('🔄 Starting ticket reset process...');
    
    // Connect to MongoDB
    console.log(`🔌 Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Remove all existing tickets
    console.log('🗑️ Removing all existing tickets...');
    const deletionResult = await Ticket.deleteMany({});
    console.log(`✅ Deleted ${deletionResult.deletedCount} tickets`);
    
    // Step 2: Get all forms from JotForm
    console.log('📋 Getting all forms from JotForm...');
    const formsResponse = await axios.get('https://api.jotform.com/user/forms', {
      params: {
        apiKey: JOTFORM_API_KEY,
        limit: 100
      }
    });
    
    if (formsResponse.data.responseCode !== 200) {
      throw new Error(`JotForm API error: ${formsResponse.data.message}`);
    }
    
    const forms = formsResponse.data.content.filter(form => form.status === 'ENABLED');
    console.log(`✅ Found ${forms.length} active forms`);
    
    // Step 3: Process each form and its submissions
    for (const form of forms) {
      console.log(`\n📝 Processing form: ${form.title} (ID: ${form.id})`);
      
      // Ensure the event exists in our database
      let event = await Event.findOne({ formId: form.id });
      if (!event) {
        console.log(`Creating new event for form ${form.id}`);
        event = new Event({
          formId: form.id,
          title: form.title,
          startTime: new Date(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        await event.save();
      }
      
      // Get submissions for this form
      console.log(`Getting submissions for form ${form.id}...`);
      const submissionsResponse = await axios.get(`https://api.jotform.com/form/${form.id}/submissions`, {
        params: {
          apiKey: JOTFORM_API_KEY,
          limit: 1000
        }
      });
      
      if (submissionsResponse.data.responseCode !== 200) {
        console.error(`Error fetching submissions for form ${form.id}: ${submissionsResponse.data.message}`);
        continue;
      }
      
      const submissions = submissionsResponse.data.content;
      console.log(`✅ Found ${submissions.length} submissions for form ${form.id}`);
      
      // Process each submission
      for (const submission of submissions) {
        try {
          const submissionData = parseSubmission(submission, form.id);
          
          // Skip if email is missing
          if (!submissionData.email) {
            console.log(`⚠️ Skipping submission ${submission.id} - missing email`);
            continue;
          }
          
          // Find or create user
          let user = await User.findOne({ email: submissionData.email });
          if (!user) {
            console.log(`Creating new user for ${submissionData.email}`);
            // Create user with a random password
            const tempPassword = Math.random().toString(36).slice(-8);
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
            
            user = new User({
              email: submissionData.email,
              passwordHash: hashedPassword
            });
            await user.save();
          }
          
          // Create the ticket
          const ticket = new Ticket({
            invoiceNo: submissionData.invoiceNo,
            user: user._id,
            event: event._id,
            name: submissionData.name,
            email: submissionData.email,
            phone: submissionData.phone,
            church: submissionData.church,
            quantity: submissionData.quantity,
            productDetails: submissionData.productDetails,
            totalAmount: submissionData.totalAmount,
            createdAt: submissionData.created_at,
            updatedAt: submissionData.created_at
          });
          
          await ticket.save();
          console.log(`✅ Created ticket for ${submissionData.email} with quantity: ${submissionData.quantity}`);
        } catch (submissionError) {
          console.error(`❌ Error processing submission ${submission.id}: ${submissionError.message}`);
        }
      }
    }
    
    // Final stats
    const totalTickets = await Ticket.countDocuments();
    console.log(`\n🎉 Process completed! Created ${totalTickets} tickets with quantity information`);
    
    // Show some stats about tickets with quantity > 1
    const multipleTickets = await Ticket.countDocuments({ quantity: { $gt: 1 } });
    console.log(`📊 Tickets with quantity > 1: ${multipleTickets}`);
    
    if (multipleTickets > 0) {
      console.log('\n📋 Sample tickets with multiple quantity:');
      const samples = await Ticket.find({ quantity: { $gt: 1 } }).limit(5);
      samples.forEach((ticket, index) => {
        console.log(`\nTicket ${index + 1}:`);
        console.log(`Email: ${ticket.email}`);
        console.log(`Invoice: ${ticket.invoiceNo}`);
        console.log(`Quantity: ${ticket.quantity}`);
        console.log(`Product Details: ${ticket.productDetails}`);
        console.log(`Total Amount: ${ticket.totalAmount}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the reset process
resetTickets();
