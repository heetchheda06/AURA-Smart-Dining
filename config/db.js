const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aura');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Database connection error: ${error.message}`);
    console.warn(`⚠️ Server operating in offline/demo mode.`);
  }
};

module.exports = connectDB;
