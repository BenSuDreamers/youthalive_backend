import mongoose from 'mongoose';
import config from './config';
import app from './app';

// MongoDB connection options optimized for high-load scenarios
const mongooseOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 15000, // Increased timeout for high load
  socketTimeoutMS: 45000, // Socket timeout for long-running operations
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2, // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering for immediate errors
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads
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