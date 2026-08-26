import api from "./api";

export const getStorefront = (slug) => {
  return api(`/storefront/${slug}`);
};

export const getMyStorefrontPreview = () => {
  return api("/storefront/preview/mine");
};

export const getPublicProduct = (slug, productSlug) => {
  return api(`/storefront/${slug}/products/${productSlug}`);
};
