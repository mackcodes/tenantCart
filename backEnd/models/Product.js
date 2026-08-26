import mongoose from "mongoose";

const productSchema =
  new mongoose.Schema(
    {
      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120,
      },

      slug: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      compareAtPrice: {
        type: Number,
        min: 0,
        default: null,
      },

      stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      category: {
        type: String,
        trim: true,
        default: "General",
      },

      images: {
        type: [String],
        default: [],
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

productSchema.index(
  {
    tenantId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;