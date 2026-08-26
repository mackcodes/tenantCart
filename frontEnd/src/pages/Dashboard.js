import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";

const setupItems = [
  {
    id: "template",
    title: "Choose a template",
    description:
      "Pick a layout and visual style for your storefront.",
    action: "Choose template",
    path: "/dashboard/templates",
    status: "Not started",
  },
  {
    id: "products",
    title: "Add your first product",
    description:
      "Create products with prices, stock, and images.",
    action: "Add product",
    path: "/dashboard/products",
    status: "In progress",
  },
  {
    id: "payments",
    title: "Set up payment methods",
    description:
      "Choose how customers can pay at checkout.",
    action: "Set up payments",
    path: "/dashboard/settings/payments",
    status: "Not started",
  },
  {
    id: "shipping",
    title: "Configure shipping",
    description:
      "Add delivery regions and shipping rules.",
    action: "Configure shipping",
    path: "/dashboard/settings/shipping",
    status: "Not started",
  },
  {
    id: "policies",
    title: "Add store policies",
    description:
      "Set refund, privacy, and terms pages.",
    action: "Add policies",
    path: "/dashboard/settings/policies",
    status: "Not started",
  },
  {
    id: "preview",
    title: "Preview your storefront",
    description:
      "See how your store looks to customers.",
    action: "Preview store",
    path: "/store-preview",
    status: "Available",
  },
];

const Dashboard = () => {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();
  const hasStore = Boolean(user?.tenant);

  const filteredSetupItems =
    useMemo(() => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      if (!normalizedSearch) {
        return setupItems;
      }

      return setupItems.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.description
            .toLowerCase()
            .includes(normalizedSearch)
      );
    }, [searchTerm]);

  const handleSearchKeyDown = (
    event
  ) => {
    if (
      event.key !== "Enter" ||
      !searchTerm.trim()
    ) {
      return;
    }

    const firstMatch =
      filteredSetupItems[0];

    if (firstMatch) {
      navigate(firstMatch.path);
    }
  };

  return (
    <DashboardLayout>
      <main className="dashboard-home">
        {!hasStore && (
          <section className="tenant-card">
            <div className="tenant-card__header">
              <h3>You haven't created a store yet</h3>
            </div>

            <p>
              Set up your store whenever you're ready — products, orders,
              and the rest of the dashboard will be waiting for you.
            </p>

            <Link
              to="/register-store"
              className="button button--primary"
            >
              Create your store
            </Link>
          </section>
        )}

        <section className="dashboard-command-section">
          <label
            htmlFor="dashboard-search"
            className="dashboard-search-label"
          >
            Search your store setup
          </label>

          <div className="dashboard-command-bar">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              id="dashboard-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search templates, payments, products..."
            />

            <kbd>Enter</kbd>
          </div>

          {searchTerm && (
            <div className="dashboard-command-results">
              {filteredSetupItems.length ===
              0 ? (
                <p>
                  No matching setup option.
                </p>
              ) : (
                filteredSetupItems.map(
                  (item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="dashboard-command-result"
                    >
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.description}
                      </small>
                    </Link>
                  )
                )
              )}
            </div>
          )}
        </section>

        <section className="setup-section">
          <div className="setup-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Getting started
              </p>

              <h2>
                Complete your store setup
              </h2>
            </div>

            <span>
              1 of 6 complete
            </span>
          </div>

          <div className="setup-grid">
            {filteredSetupItems.map(
              (item, index) => (
                <article
                  key={item.id}
                  className="setup-card"
                >
                  <div className="setup-card-top">
                    <span>
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                    <small>
                      {item.status}
                    </small>
                  </div>

                  <h3>{item.title}</h3>

                  <p>
                    {item.description}
                  </p>

                  <Link
                    to={item.path}
                    className="setup-card-link"
                  >
                    {item.action}

                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                </article>
              )
            )}
          </div>
        </section>

        <section className="dashboard-tip">
          <div>
            <p className="dashboard-eyebrow">
              Recommended next step
            </p>

            <h2>
              Choose a template before
              customizing your storefront.
            </h2>

            <p>
              Your products and store content
              will appear inside the selected
              template.
            </p>
          </div>

          <Link
            to="/dashboard/templates"
            className="dashboard-button dashboard-button--light"
          >
            Explore templates
          </Link>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
