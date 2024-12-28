import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const Mongo_uri = process.env.MONGO_URI;
    const connection = await mongoose.connect(Mongo_uri);
    console.log(
      `Database connected successfully to the host : ${connection.connection.host}`
    );
  } catch (err) {
    console.log(`Failed to connect to the database : ${err}`);
    process.exit(1);
  }
};
