const mongoose = require('mongoose');

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    }).then((m) => {
      console.log(`MongoDB connected: ${m.connection.host || m.connection.name}`);
      return m;
    }).catch((error) => {
      cached.promise = null;
      console.error(`MongoDB connection error: ${error.message}`);
      if (error.name === 'MongooseServerSelectionError') {
        console.error('Check that MongoDB Atlas IP whitelist includes Vercel IPs (add 0.0.0.0/0)');
      }
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.conn = null;
    throw new Error('MongoDB connection failed');
  }

  return cached.conn;
}

module.exports = connectDB;
