import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.js";

const DashboardHeader = ({
  mobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const {
    user,
    logout,
    tenants,
    switchTenant,
  } = useAuth();

  const navigate = useNavigate();

  const displayName =
    user?.name || "Account user";

  const storeName =
    user?.tenant && typeof user.tenant === "object"
      ? user.tenant.storeName ||
        user.tenant.name ||
        ""
      : "";

  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      navigate("/login", {
        replace: true,
      });
    }
  };

  const handleTenantChange = async (event) => {
    try {
      await switchTenant(event.target.value);
      navigate("/dashboard");
    } catch (error) {
      // The active tenant remains unchanged if the server rejects the switch.
    }
  };

  const mobileStoreAction = !isAdmin && (user?.tenant ? (
    <Link to="/store-preview" className="mobile-menu__action" onClick={onToggleMobileMenu}>
      View store
    </Link>
  ) : (
    <Link to="/register-store" className="mobile-menu__action" onClick={onToggleMobileMenu}>
      Create store
    </Link>
  ));

  return (
    <header className="dashboard-header">
      <Link
        to={isAdmin ? "/dashboard/admin/tenants" : "/dashboard"}
        className="mobile-dashboard-logo"
      >
        Tenant<span>Cart</span>
      </Link>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu"}
        aria-expanded={mobileMenuOpen}
        onClick={onToggleMobileMenu}
      >
        <span aria-hidden="true">{mobileMenuOpen ? "×" : "☰"}</span>
      </button>

      {storeName && !isAdmin && (
        <p className="dashboard-header-store-name">
          {storeName}
        </p>
      )}

      <div className="dashboard-header-actions">
        {!isAdmin && tenants.length > 1 && (
          <label className="header-tenant-switcher">
            <span className="sr-only">Current store</span>
            <select
              value={user?.tenant?._id || ""}
              onChange={handleTenantChange}
              aria-label="Switch store"
            >
              {tenants.map(({ tenant }) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.storeName}
                </option>
              ))}
            </select>
          </label>
        )}

        {!isAdmin && (user?.tenant ? (
          <Link
            to="/store-preview"
            className="header-store-link"
          >
            ◉ View store
          </Link>
        ) : (
          <Link
            to="/register-store"
            className="header-store-link"
          >
            + Create store
          </Link>
        ))}

        <div className="profile-menu-wrapper">
          <button
            type="button"
            className="profile-trigger"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-controls="profile-menu"
            onClick={() =>
              setProfileOpen(
                (isOpen) => !isOpen
              )
            }
          >
            <span className="profile-avatar">
              {initials}
            </span>

            <span className="profile-name">
              {displayName}
            </span>

            <span aria-hidden="true">
              ▾
            </span>
          </button>

          {profileOpen && (
            <div
              id="profile-menu"
              className="profile-menu"
              role="menu"
            >
              <div className="profile-menu__identity">
                <strong>
                  {displayName}
                </strong>

                <small>
                  {user?.email ||
                    "Store account"}
                </small>
              </div>

              {!isAdmin && (
                <>
                  <Link
                    to="/dashboard/profile"
                    className="profile-menu__item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/dashboard/settings/account"
                    className="profile-menu__item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Account settings
                  </Link>

                  <div className="profile-menu__divider" />
                </>
              )}

              <button
                type="button"
                className="profile-menu__item profile-menu__logout"
                role="menuitem"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && !isAdmin && (
        <div className="mobile-menu">
          {tenants.length > 1 && (
            <label className="mobile-menu__tenant-switcher">
              <span>Current store</span>
              <select
                value={user?.tenant?._id || ""}
                onChange={handleTenantChange}
                aria-label="Switch store"
              >
                {tenants.map(({ tenant }) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.storeName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mobileStoreAction}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
