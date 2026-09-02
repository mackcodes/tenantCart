import { GoogleGenerativeAI } from '@google/generative-ai';

const generateTemplateWithAI = async (description, category) => {
  const prompt = `
You are a store theme designer. Based on this description, generate a template configuration for an e-commerce store.

Store description: "${description}"

Category: ${category || 'general'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "layout": "grid" | "list" | "featured-first" | "masonry",

  "colors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "background": "#hexcolor",
    "text": "#hexcolor",
    "accent": "#hexcolor"
  },

  "fonts": {
    "heading": "Google Font name",
    "body": "Google Font name"
  },

  "components": {
    "showBanner": true/false,
    "showCategories": true/false,
    "showFeaturedProducts": true/false,
    "showNewsletter": true/false,
    "productCardStyle": "simple" | "card" | "minimal" | "bordered",
    "headerStyle": "centered" | "left-aligned" | "overlay"
  }
}

Choose colors, fonts, and layout that match the store's vibe. For example:

- Fashion boutique → elegant fonts, minimal colors (black/white), card-style products
- Tech gadgets → modern fonts, bold accent colors, grid layout
- Organic/natural products → earthy colors, clean fonts, list or masonry layout
`;

  try {
    const genAI = new GoogleGenerativeAI({
      key: process.env.GEMINI_API_KEY,
    });

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    // Remove markdown code blocks if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const config = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      !config.layout ||
      !config.colors ||
      !config.fonts ||
      !config.components
    ) {
      throw new Error('AI response missing required fields');
    }

    return config;
  } catch (error) {
    console.error(
      'AI template generation failed:',
      error.message
    );

    // Fallback
    return getFallbackTemplate(category);
  }
};

const getFallbackTemplate = (category) => {
  const fallbacks = {
    minimal: {
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

    bold: {
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

    elegant: {
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
  };

  return fallbacks[category] || fallbacks.minimal;
};

export {
  generateTemplateWithAI,
};