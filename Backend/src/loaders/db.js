import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if(!mongoURI){
    throw new Error("MongoURI environment variable not set")
  }
  try {
    await mongoose.connect(mongoURI, {
      dbName: "vector_db",
      autoIndex: true,
    }); 
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); 
  }
};
