import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import Tenant from "../models/Tenant.js";
import TenantMembership from "../models/TenantMembership.js";

dotenv.config();

const migrateTenantMemberships = async () => {
  await connectDB();

  await Tenant.createIndexes();
  await TenantMembership.createIndexes();

  const tenants = await Tenant.find({})
    .select("_id owner")
    .lean();

  if (tenants.length === 0) {
    console.log("No tenants found; no memberships created.");
    return;
  }

  const operations = tenants.map((tenant) => ({
    updateOne: {
      filter: {
        tenant: tenant._id,
        user: tenant.owner,
      },
      update: {
        $setOnInsert: {
          role: "owner",
          status: "active",
        },
      },
      upsert: true,
    },
  }));

  const result = await TenantMembership.bulkWrite(operations, {
    ordered: false,
  });

  console.log(
    `Tenant memberships complete: ${result.upsertedCount || 0} created, ${result.matchedCount || 0} already existed.`
  );
};

migrateTenantMemberships()
  .catch((error) => {
    console.error("Tenant membership migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
