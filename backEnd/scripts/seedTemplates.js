import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Template from '../models/Template.js';

dotenv.config();

const templates = [
  {
    name: 'minimal-store',
    displayName: 'Minimal Store',
    description: 'Clean, simple layout focused on products',
    category: 'minimal',

    config: {
      layout: 'grid',

      colors: {
        primary: '#000000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#333333',
        accent: '#007bff',
      },

      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },

      components: {
        showBanner: false,
        showCategories: true,
        showFeaturedProducts: true,
        showNewsletter: false,
        productCardStyle: 'simple',
        headerStyle: 'centered',
      },
    },
  },

  {
    name: 'bold-brand',
    displayName: 'Bold Brand',
    description: 'Vibrant colors and large imagery',
    category: 'bold',

    config: {
      layout: 'featured-first',

      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        background: '#f7f7f7',
        text: '#2d3436',
        accent: '#ff6b6b',
      },

      fonts: {
        heading: 'Poppins',
        body: 'Open Sans',
      },

      components: {
        showBanner: true,
        showCategories: true,
        showFeaturedProducts: true,
        showNewsletter: false,
        productCardStyle: 'card',
        headerStyle: 'overlay',
      },
    },
  },

  {
    name: 'elegant-boutique',
    displayName: 'Elegant Boutique',
    description: 'Sophisticated design for fashion and lifestyle',
    category: 'elegant',

    config: {
      layout: 'list',

      colors: {
        primary: '#2d3436',
        secondary: '#b2bec3',
        background: '#fafafa',
        text: '#2d3436',
        accent: '#d4a5a5',
      },

      fonts: {
        heading: 'Playfair Display',
        body: 'Lato',
      },

      components: {
        showBanner: true,
        showCategories: false,
        showFeaturedProducts: true,
        showNewsletter: true,
        productCardStyle: 'minimal',
        headerStyle: 'left-aligned',
      },
    },
  },

  {
    name: 'playful-shop',
    displayName: 'Playful Shop',
    description: 'Fun, colorful design for kids or creative products',
    category: 'playful',

    config: {
      layout: 'masonry',

      colors: {
        primary: '#ff9f43',
        secondary: '#54a0ff',
        background: '#fef9e7',
        text: '#2d3436',
        accent: '#ff6b6b',
      },

      fonts: {
        heading: 'Fredoka One',
        body: 'Nunito',
      },

      components: {
        showBanner: true,
        showCategories: true,
        showFeaturedProducts: true,
        showNewsletter: false,
        productCardStyle: 'bordered',
        headerStyle: 'centered',
      },
    },
  },

  {
    name: 'corporate-hub',
    displayName: 'Corporate Hub',
    description: 'Professional design for B2B or services',
    category: 'corporate',

    config: {
      layout: 'grid',

      colors: {
        primary: '#2c3e50',
        secondary: '#34495e',
        background: '#ecf0f1',
        text: '#2c3e50',
        accent: '#3498db',
      },

      fonts: {
        heading: 'Roboto',
        body: 'Open Sans',
      },

      components: {
        showBanner: false,
        showCategories: true,
        showFeaturedProducts: true,
        showNewsletter: true,
        productCardStyle: 'card',
        headerStyle: 'left-aligned',
      },
    },
  },
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DATABASE,
    });

    console.log('MongoDB connected');

    await Template.deleteMany({});
    console.log('Existing templates deleted');

    await Template.insertMany(templates);
    console.log('✅ Templates seeded successfully');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedTemplates();