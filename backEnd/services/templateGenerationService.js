import OpenAI from 'openai';
import Groq from 'groq-sdk';

const openrouterModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b';
const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const generateTemplateWithOpenRouter = async (description, category) => {
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

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://tenantcart.app',
      'X-Title': 'TenantCart',
    },
  });

  const response = await client.chat.completions.create({
    model: openrouterModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content || '';

  if (!text) {
    throw new Error('OpenRouter returned empty response');
  }

  // Parse JSON from response
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
};

const generateTemplateWithGroq = async (description, category) => {
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

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: groqModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content || '';

  if (!text) {
    throw new Error('Groq returned empty response');
  }

  // Parse JSON from response
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
};

const generateTemplateWithAI = async (description, category) => {
  // Try OpenRouter (Nemotron) first
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log('Attempting template generation with OpenRouter (Nemotron)...');
      return await generateTemplateWithOpenRouter(description, category);
    } catch (openrouterError) {
      console.warn(
        'OpenRouter template generation failed:',
        openrouterError.message
      );
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('Falling back to Groq for template generation...');
      return await generateTemplateWithGroq(description, category);
    } catch (groqError) {
      console.error('Groq template generation failed:', groqError.message);
    }
  }

  // Final fallback to static template
  console.error(
    'AI template generation failed: No providers configured. Using fallback template.'
  );
  return getFallbackTemplate(category);
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