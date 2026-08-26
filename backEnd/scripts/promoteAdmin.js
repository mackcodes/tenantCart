// CLI-only admin bootstrap: run `node scripts/promoteAdmin.js <email>`.
// Intentionally not exposed over HTTP — promoting arbitrary users to admin
// through an API endpoint would be a privilege-escalation vulnerability.
import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/promoteAdmin.js <email>");
  process.exit(1);
}
await mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DATABASE || undefined,
});

const user = await User.findOneAndUpdate(
  { email: email.trim().toLowerCase() },
  { $set: { role: "admin" } },
  { new: true }
);

if (!user) {
  console.error(`No user found with email "${email}"`);
  process.exit(1);
}

console.log(`${user.email} is now an admin`);

await mongoose.disconnect();
