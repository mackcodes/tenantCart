import mongoose from "mongoose";

const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "processed", "ignored", "failed"],
      default: "processing",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "RazorpayWebhookEvent",
  razorpayWebhookEventSchema
);
