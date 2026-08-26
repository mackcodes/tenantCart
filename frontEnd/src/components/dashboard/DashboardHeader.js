import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.js";

const DashboardHeader = () => {
  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const {
    user,
    logout,
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

  return (
    <header className="dashboard-header">
      <Link
        to="/dashboard"
        className="mobile-dashboard-logo"
      >
        Tenant<span>Cart</span>
      </Link>

      {storeName && (
        <p className="dashboard-header-store-name">
          {storeName}
        </p>
      )}

      <div className="dashboard-header-actions">
        {user?.tenant ? (
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
        )}

        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          ♧
        </button>

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

              <Link
                to="/dashboard/profile"
                className="profile-menu__item"
                role="menuitem"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                Profile
              </Link>

              <Link
                to="/dashboard/settings/billing"
                className="profile-menu__item"
                role="menuitem"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                Billing and plan
              </Link>

              <Link
                to="/dashboard/settings/account"
                className="profile-menu__item"
                role="menuitem"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                Account settings
              </Link>

              <Link
                to="/help"
                className="profile-menu__item"
                role="menuitem"
                onClick={() =>
                  setProfileOpen(false)
                }
              >
                Help center
              </Link>

              <div className="profile-menu__divider" />

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
    </header>
  );
};

export default DashboardHeader;
