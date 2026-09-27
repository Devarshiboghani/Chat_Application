const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected successfully`);
  } catch (error) {
    console.error(`MongoDB connection failed: Database unreachable. Error:`, error.message);
    process.exit(1);
  }
};

module.exports = connectDB;