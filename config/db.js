const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_ATLAS_URI = 'mongodb+srv://askheet_db_user:1ieq0ING4v9yJfvZ@cluster0.bujwan6.mongodb.net/aura?retryWrites=true&w=majority';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
  
  // Mongoose global settings — prevent buffering timeouts on cold start
  mongoose.set('bufferCommands', false);  // fail fast instead of buffering

  const options = {
    serverSelectionTimeoutMS: 30000,  // give Atlas 30s to respond (Render cold start)
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`📡 MongoDB connection attempt ${attempt}/${maxAttempts}...`);
      const conn = await mongoose.connect(uri, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Auto-seed database if empty
      try {
        const { autoSeedIfEmpty } = require('../seed/seeder');
        await autoSeedIfEmpty();
      } catch (seedErr) {
        console.warn('⚠️ Seeder warning:', seedErr.message);
      }

      return; // success — exit loop
    } catch (error) {
      console.warn(`⚠️ MongoDB attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxAttempts) {
        const delay = attempt * 3000; // 3s, 6s backoff
        console.log(`🔄 Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Orders will fail until DB is reachable.');
        // Re-enable buffering so Mongoose queues operations — they'll run when connection resumes
        mongoose.set('bufferCommands', true);
      }
    }
  }
};

module.exports = connectDB;
