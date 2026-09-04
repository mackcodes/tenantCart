import {
  NavLink,
  Link,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.js";

const sidebarSections = [
  {
    title: "Main",
    items: [
      {
        label: "Home",
        path: "/dashboard",
        icon: "⌂",
        end: true,
      },
      {
        label: "Orders",
        path: "/dashboard/orders",
        icon: "□",
      },
      {
        label: "Products",
        path: "/dashboard/products",
        icon: "◇",
      },
    ],
  },
  {
    title: "Manage",
    items: [
      {
        label: "Customers",
        path: "/dashboard/customers",
        icon: "♟",
      },
      {
        label: "Growth",
        path: "/dashboard/growth",
        icon: "⌁",
      },
      {
        label: "Discounts",
        path: "/dashboard/discounts",
        icon: "◇",
      },
      {
        label: "Content",
        path: "/dashboard/content",
        icon: "▤",
      },
      {
        label: "Markets",
        path: "/dashboard/markets",
        icon: "◈",
      },
      {
        label: "Analytics",
        path: "/dashboard/analytics",
        icon: "▥",
      },
    ],
  },
  {
    title: "Sales channels",
    items: [
      {
        label: "Online store",
        path: "/store-preview",
        icon: "□",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Templates",
        path: "/dashboard/templates",
        icon: "✦",
      },
      {
        label: "Payments",
        path: "/dashboard/settings/payments",
        icon: "₹",
      },
      {
        label: "Shipping",
        path: "/dashboard/settings/shipping",
        icon: "▰",
      },
      {
        label: "Store policies",
        path: "/dashboard/settings/policies",
        icon: "§",
      },
    ],
  },
];

const adminSidebarSection = {
  title: "Administration",
  items: [
    {
      label: "Tenant approvals",
      path: "/dashboard/admin/tenants",
      icon: "✓",
    },
  ],
};

const DashboardSidebar = () => {
  const { user } = useAuth();

  const sections =
    user?.role === "admin"
      ? [adminSidebarSection]
      : sidebarSections;

  return (
    <aside className="dashboard-sidebar">
      <Link
        to={user?.role === "admin" ? "/dashboard/admin/tenants" : "/dashboard"}
        className="dashboard-logo"
      >
        Tenant<span>Cart</span>
      </Link>

      <nav
        className="sidebar-navigation"
        aria-label="Dashboard navigation"
      >
        {sections.map(
          (section) => (
            <div
              key={section.title}
              className="sidebar-section"
            >
              <p className="sidebar-section-title">
                {section.title}
              </p>

              {section.items.map(
                (item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({
                      isActive,
                    }) =>
                      isActive
                        ? "sidebar-link sidebar-link--active"
                        : "sidebar-link"
                    }
                  >
                    <span
                      className="sidebar-link__icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                )
              )}
            </div>
          )
        )}
      </nav>

      {user?.role !== "admin" && (
        <div className="sidebar-footer">
          <Link
            to="/help"
            className="sidebar-link"
          >
            <span
              className="sidebar-link__icon"
              aria-hidden="true"
            >
              ?
            </span>

            Help center
          </Link>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;
