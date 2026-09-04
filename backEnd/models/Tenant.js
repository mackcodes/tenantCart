import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      enum: [
        "fashion",
        "electronics",
        "food",
        "beauty",
        "home",
        "services",
        "other",
      ],
      default: "other",
    },

    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    businessPhone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      line1: {
        type: String,
        trim: true,
        default: "",
      },

      line2: {
        type: String,
        trim: true,
        default: "",
      },

      city: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "",
      },

      postalCode: {
        type: String,
        trim: true,
        default: "",
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    branding: {
      logoUrl: {
        type: String,
        default: "",
      },

      primaryColor: {
        type: String,
        default: "#4F46E5",
      },

      templateId: {
        type: String,
        default: "default",
      },

      template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Template",
        default: null,
      },

      customConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    razorpay: {
      keyId: {
        type: String,
        default: null,
      },

      keySecret: {
        type: String,
        default: null,
      },

      onboarded: {
        type: Boolean,
        default: false,
      },
    },

    emailVerified: {
  type: Boolean,
  default: false,
},

phoneVerified: {
  type: Boolean,
  default: false,
},

status: {
  type: String,
  enum: [
    "pending_verification",
    "pending_review",
    "approved",
    "rejected",
    "suspended",
  ],
  default: "pending_verification",
  index: true,
},

verification: {
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  riskLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  checks: {
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    requiredFieldsComplete: {
      type: Boolean,
      default: false,
    },
    slugAvailable: {
      type: Boolean,
      default: true,
    },
    paymentOnboardingComplete: {
      type: Boolean,
      default: false,
    },
  },

  failedChecks: {
    type: [String],
    default: [],
  },

  reviewedAt: {
    type: Date,
    default: null,
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  rejectionReason: {
    type: String,
    default: "",
    trim: true,
    maxlength: 1000,
  },
},
  },
  {
    timestamps: true,
  }
);

// The current product supports one owned store per merchant. Memberships allow
// additional users to work in a tenant without becoming its owner.
tenantSchema.index({ owner: 1 }, { unique: true });

export default mongoose.model("Tenant", tenantSchema);
