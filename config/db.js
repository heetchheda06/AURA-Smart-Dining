const mongoose = require('mongoose');
require('dotenv').config();
const { autoSeedIfEmpty } = require('../seed/seeder');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aura';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed database if empty
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`⚠️ Database connection error: ${error.message}`);
    console.warn(`⚠️ Server operating in offline/demo mode.`);
  }
};

module.exports = connectDB;
