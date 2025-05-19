import mongoose from 'mongoose';
import config from './config';
import app from './app';

// MongoDB connection options
const mongooseOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
};

console.log(`Server starting in ${config.nodeEnv} mode...`);

// Connect to MongoDB
mongoose
  .connect(config.mongodb.uri, mongooseOptions)
  .then(() => {
    // Start Express server on successful connection
    app.listen(config.port, () => {
      console.log(`✅ Connected to MongoDB successfully!`);
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 API Documentation: http://localhost:${config.port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit with failure code
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});