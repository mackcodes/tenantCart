import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },

    failureReason: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["merchant", "webhook"],
      default: "merchant",
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    shippingAddress: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, default: "", trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: "India", trim: true },
    },

    shippingMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },

    shippingAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discountCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    paymentRef: {
      type: String,
      default: null,
    },

    refundId: {
      type: String,
      default: null,
    },

    refundedAmount: {
      type: Number,
      default: null,
    },

    refunds: {
      type: [refundSchema],
      default: [],
    },

    checkoutTokenHash: {
      type: String,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ tenant: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
