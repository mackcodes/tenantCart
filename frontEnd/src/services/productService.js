import api from "./api";

export const createProduct = (
  productData
) => {
  return api("/products", {
    method: "POST",
    body: productData,
  });
};

export const uploadProductImage = (file) => {
  const formData = new FormData();

  formData.append("image", file);

  return api("/products/upload", {
    method: "POST",
    body: formData,
  });
};

export const getMerchantProducts = () => {
  return api("/products");
};

export const getProductById = (
  productId
) => {
  return api(`/products/${productId}`);
};

export const updateProduct = (
  productId,
  productData
) => {
  return api(`/products/${productId}`, {
    method: "PATCH",
    body: productData,
  });
};

export const deleteProduct = (
  productId
) => {
  return api(`/products/${productId}`, {
    method: "DELETE",
  });
};
