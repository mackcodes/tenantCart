const validLayouts = ["grid", "list", "featured-first", "masonry"];

export const getStorefrontTheme = (store) => {
  const config = store?.branding?.customConfig || {};
  const colors = config.colors || {};
  const fonts = config.fonts || {};

  return {
    components: config.components || {},
    layout: validLayouts.includes(config.layout) ? config.layout : "grid",
    productCardStyle: config.components?.productCardStyle || "card",
    style: {
      "--store-primary": colors.primary || "#24342d",
      "--store-secondary": colors.secondary || "#66736d",
      "--store-background": colors.background || "#f5f6f4",
      "--store-text": colors.text || "#24342d",
      "--store-accent": colors.accent || "#b4774b",
      "--store-heading-font": `${fonts.heading || "Georgia"}, Georgia, serif`,
      "--store-body-font": `${fonts.body || "system-ui"}, system-ui, sans-serif`,
    },
  };
};
