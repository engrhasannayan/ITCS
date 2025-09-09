// server/db/mongoose.js
import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.error('❌ MONGODB_URI missing. Add it to server/.env');
    process.exit(1);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ MongoDB connected');
}
