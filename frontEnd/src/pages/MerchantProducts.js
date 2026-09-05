import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteProduct,
  getMerchantProducts,
} from "../services/productService.js";
import { resolveAssetUrl } from "../services/api.js";

import ProductForm from "./ProductForm.js";

const formatCurrency = (
  amount
) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(amount);
};

const MerchantProducts = () => {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingProductId,
    setEditingProductId,
  ] = useState(null);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getMerchantProducts();

      setProducts(data.products || []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      return [
        product.name,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch)
        );
    });
  }, [products, searchTerm]);

  const openCreateForm = () => {
    setEditingProductId(null);
    setNotice("");
    setShowForm(true);
  };

  const openEditForm = (
    productId
  ) => {
    setEditingProductId(productId);
    setNotice("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingProductId(null);
    setShowForm(false);
  };

  const handleSaved = async () => {
    await loadProducts();
    closeForm();
    setNotice(
      "Product saved successfully"
    );
  };

  const handleDelete = async (
    product
  ) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await deleteProduct(product._id);
      await loadProducts();

      setNotice(
        "Product deleted successfully"
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to delete product"
      );
    }
  };

  return (
    <main className="merchant-products">
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            Merchant workspace
          </p>

          <h1>Products</h1>

          <p className="page-heading__description">
            Manage your catalog, pricing,
            availability, and stock.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={openCreateForm}
        >
          + Add product
        </button>
      </section>

      {error && (
        <p
          className="form-message form-message--error"
          role="alert"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          className="form-message form-message--success"
          role="status"
        >
          {notice}
        </p>
      )}

      {showForm && (
        <section className="form-panel">
          <ProductForm
            productId={editingProductId}
            onSaved={handleSaved}
            onCancel={closeForm}
          />
        </section>
      )}

      <section className="catalog-toolbar">
        <label className="search-field">
          <span className="sr-only">
            Search products
          </span>

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search products..."
          />
        </label>

        <span className="product-count">
          {filteredProducts.length} product
          {filteredProducts.length === 1
            ? ""
            : "s"}
        </span>
      </section>

      {loading ? (
        <div className="empty-state">
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h2>
            {products.length === 0
              ? "Your catalog is empty"
              : "No products found"}
          </h2>

          <p>
            {products.length === 0
              ? "Add your first product to begin building your store."
              : "Try a different search term."}
          </p>

          {products.length === 0 && (
            <button
              type="button"
              className="button button--primary"
              onClick={openCreateForm}
            >
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        {(
                          product.imageUrl ||
                          product.images?.[0]
                        ) ? (
                          <img
                            src={
                              resolveAssetUrl(
                                product.imageUrl ||
                                product.images?.[0]
                              )
                            }
                            alt=""
                            className="product-cell__image"
                          />
                        ) : (
                          <div
                            className="product-cell__placeholder"
                            aria-hidden="true"
                          >
                            {product.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div>
                          <strong>
                            {product.name}
                          </strong>

                          <small>
                            /{product.slug}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {product.category ||
                        "General"}
                    </td>

                    <td>
                      {formatCurrency(
                        product.price
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          product.stock === 0
                            ? "stock stock--empty"
                            : product.stock <= 5
                              ? "stock stock--low"
                              : "stock"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          product.isActive
                            ? "status status--active"
                            : "status status--inactive"
                        }
                      >
                        {product.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="button button--small button--ghost"
                          onClick={() =>
                            openEditForm(
                              product._id
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="button button--small button--danger"
                          onClick={() =>
                            handleDelete(
                              product
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default MerchantProducts;