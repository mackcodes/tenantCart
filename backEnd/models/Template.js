import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  displayName: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    trim: true,
  },

  thumbnail: {
    type: String,
    default: '/templates/default-thumbnail.png',
  },

  category: {
    type: String,
    enum: ['minimal', 'bold', 'elegant', 'playful', 'corporate', 'custom'],
    default: 'minimal',
  },

  isPremium: {
    type: Boolean,
    default: false,
  },

  isAIGenerated: {
    type: Boolean,
    default: false,
  },

  config: {
    layout: {
      type: String,
      enum: ['grid', 'list', 'featured-first', 'masonry'],
      default: 'grid',
    },

    colors: {
      primary: {
        type: String,
        default: '#000000',
      },
      secondary: {
        type: String,
        default: '#666666',
      },
      background: {
        type: String,
        default: '#ffffff',
      },
      text: {
        type: String,
        default: '#333333',
      },
      accent: {
        type: String,
        default: '#007bff',
      },
    },

    fonts: {
      heading: {
        type: String,
        default: 'Inter',
      },
      body: {
        type: String,
        default: 'Inter',
      },
    },

    components: {
      showBanner: {
        type: Boolean,
        default: true,
      },
      showCategories: {
        type: Boolean,
        default: true,
      },
      showFeaturedProducts: {
        type: Boolean,
        default: true,
      },

      productCardStyle: {
        type: String,
        enum: ['simple', 'card', 'minimal', 'bordered'],
        default: 'card',
      },

      headerStyle: {
        type: String,
        enum: ['centered', 'left-aligned', 'overlay'],
        default: 'centered',
      },
    },
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Template = mongoose.model('Template', templateSchema);

export default Template;