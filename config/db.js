const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_ATLAS_URI = 'mongodb+srv://askheet_db_user:1ieq0ING4v9yJfvZ@cluster0.bujwan6.mongodb.net/aura?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
    console.log(`📡 Connecting to MongoDB database...`);
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed database if empty
    const { autoSeedIfEmpty } = require('../seed/seeder');
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`⚠️ Database connection warning: ${error.message}`);
    console.warn(`⚠️ App operating with active fail-safe fallback.`);
  }
};

module.exports = connectDB;
