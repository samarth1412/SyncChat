import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(`Connected to database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
};

export default connectDB;
