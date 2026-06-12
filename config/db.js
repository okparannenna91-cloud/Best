const mongoose = require('mongoose');

let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return;
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    dbConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host || conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Check that MongoDB Atlas IP whitelist includes Vercel IPs (add 0.0.0.0/0)');
    }
  }
};

module.exports = connectDB;
