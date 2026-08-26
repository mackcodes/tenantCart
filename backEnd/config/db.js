import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DATABASE || undefined,
  });

  console.log("MongoDB connected");
};

export default connectDB;