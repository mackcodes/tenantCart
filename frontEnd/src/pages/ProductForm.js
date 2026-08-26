import {
  useEffect,
  useState,
} from "react";

import {
  createProduct,
  getProductById,
  uploadProductImage,
  updateProduct,
} from "../services/productService.js";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  category: "general",
  imageUrl: "",
  isActive: true,
};

const ProductForm = ({
  productId,
  onSaved,
  onCancel,
}) => {
  const isEditing = Boolean(productId);

  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    loading,
    setLoading,
  ] = useState(isEditing);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    imageSource,
    setImageSource,
  ] = useState("url");

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getProductById(productId);

        const product = data.product;

        setForm({
          name: product.name || "",
          description:
            product.description || "",
          price:
            product.price?.toString() || "",
          compareAtPrice:
            product.compareAtPrice === null ||
            product.compareAtPrice === undefined
              ? ""
              : product.compareAtPrice.toString(),
          stock:
            product.stock?.toString() || "",
          category:
            product.category || "general",
          imageUrl:
            product.imageUrl ||
            product.images?.[0] ||
            "",
          isActive:
            product.isActive !== false,
        });

        setImageSource(
          product.images?.[0]?.startsWith("http")
            ? "upload"
            : "url"
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Product name is required";
    }

    if (!form.description.trim()) {
      return "Product description is required";
    }

    if (
      form.price === "" ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      return "Enter a valid price";
    }

    if (
      form.stock === "" ||
      Number.isNaN(Number(form.stock)) ||
      Number(form.stock) < 0 ||
      !Number.isInteger(Number(form.stock))
    ) {
      return "Stock must be a whole number";
    }

    if (
      form.compareAtPrice !== "" &&
      (
        Number.isNaN(
          Number(form.compareAtPrice)
        ) ||
        Number(form.compareAtPrice) < 0
      )
    ) {
      return "Enter a valid comparison price";
    }

    return "";
  };

  const handleImageUpload = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image files must be 5 MB or smaller.");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");

      const data = await uploadProductImage(file);

      setForm((currentForm) => ({
        ...currentForm,
        imageUrl: data.imageUrl,
      }));

    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to upload that image."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const productData = {
        name: form.name.trim(),
        description:
          form.description.trim(),
        price: Number(form.price),
        compareAtPrice:
          form.compareAtPrice === ""
            ? null
            : Number(form.compareAtPrice),
        stock: Number(form.stock),
        category:
          form.category.trim().toLowerCase() ||
          "general",
        images: form.imageUrl.trim()
          ? [form.imageUrl.trim()]
          : [],
        isActive: form.isActive,
      };

      if (isEditing) {
        await updateProduct(
          productId,
          productData
        );

        setSuccess(
          "Product updated successfully"
        );
      } else {
        await createProduct(
          productData
        );

        setSuccess(
          "Product created successfully"
        );

        setForm(emptyForm);
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p>Loading product...</p>
    );
  }

  return (
    <form
      className="product-form"
      onSubmit={handleSubmit}
    >
      <div className="product-form__header">
        <div>
          <p className="eyebrow">
            {isEditing
              ? "Edit inventory"
              : "New inventory"}
          </p>

          <h2>
            {isEditing
              ? "Edit product"
              : "Add product"}
          </h2>
        </div>

        {onCancel && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p
          className="form-message form-message--error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="form-message form-message--success"
          role="status"
        >
          {success}
        </p>
      )}

      <div className="form-grid">
        <label className="form-field form-field--wide">
          <span>Product name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Classic Cotton T-Shirt"
            maxLength={120}
            required
          />
        </label>

        <label className="form-field form-field--wide">
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your product..."
            maxLength={3000}
            rows={5}
            required
          />
        </label>

        <label className="form-field">
          <span>Price</span>
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="799"
            required
          />
        </label>

        <label className="form-field">
          <span>Compare-at price</span>
          <input
            name="compareAtPrice"
            type="number"
            value={form.compareAtPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="999"
          />
        </label>

        <label className="form-field">
          <span>Stock quantity</span>
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            min="0"
            step="1"
            placeholder="25"
            required
          />
        </label>

        <label className="form-field">
          <span>Category</span>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="clothing"
          />
        </label>

        <fieldset className="image-source form-field--wide">
          <legend>Product image</legend>

          <div className="image-source__options">
            <label>
              <input
                type="radio"
                name="imageSource"
                value="url"
                checked={imageSource === "url"}
                onChange={() => setImageSource("url")}
              />
              Paste image URL
            </label>

            <label>
              <input
                type="radio"
                name="imageSource"
                value="upload"
                checked={imageSource === "upload"}
                onChange={() => setImageSource("upload")}
              />
              Upload image
            </label>
          </div>

          {imageSource === "url" ? (
            <input
              name="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/product.jpg"
            />
          ) : (
            <label className="image-source__upload">
              <span>Choose an image (maximum 5 MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />

              {uploadingImage && (
                <small>Uploading image...</small>
              )}
            </label>
          )}

          {form.imageUrl && (
            <img
              className="image-source__preview"
              src={form.imageUrl}
              alt="Product preview"
            />
          )}
        </fieldset>

        <label className="checkbox-field form-field--wide">
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
          />
          <span>
            Show this product in the storefront
          </span>
        </label>
      </div>

      <div className="product-form__actions">
        <button
          type="submit"
          className="button button--primary"
          disabled={saving || uploadingImage}
        >
          {saving
            ? "Saving..."
            : isEditing
              ? "Update product"
              : "Create product"}
        </button>

        {onCancel && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
