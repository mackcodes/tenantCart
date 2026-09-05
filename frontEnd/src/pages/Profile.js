import { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import { updateProfile } from "../services/authService.js";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmNewPassword = confirmNewPassword;
      }

      await updateProfile(payload);
      if (refreshUser) await refreshUser();
      setNotice("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Profile</h1>
            <p className="page-heading__description">
              Manage your personal details and account credentials.
            </p>
          </div>
        </section>

        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        {notice && <p className="form-message form-message--success" role="status">{notice}</p>}

        <section className="settings-panel">
          <form onSubmit={handleSubmit}>
            <div className="form-field" style={{ marginBottom: "16px" }}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
              />
              <small style={{ color: "#68756d", marginTop: "4px", display: "block" }}>
                Email address cannot be changed.
              </small>
            </div>

            <div className="form-field" style={{ marginBottom: "24px" }}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

            <h2>Change Password</h2>
            <p style={{ color: "#68756d", marginBottom: "16px" }}>
              Leave blank if you do not want to change your password.
            </p>

            <div className="form-field" style={{ marginBottom: "16px" }}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-field" style={{ marginBottom: "16px" }}>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-field" style={{ marginBottom: "24px" }}>
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default Profile;
