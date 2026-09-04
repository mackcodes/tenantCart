import { useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import {
  addTenantMember,
  getTenantAuditLogs,
  getTenantMembers,
  updateTenantMember,
} from "../services/tenantService.js";

const assignableRoles = ["admin", "manager", "staff"];

const DashboardTeam = () => {
  const { user, tenants } = useAuth();
  const currentTenant = user?.tenant;
  const currentMembership = tenants.find(
    ({ tenant }) => String(tenant?._id) === String(currentTenant?._id)
  );
  const canManageMembers = ["owner", "admin"].includes(currentMembership?.role);

  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviting, setInviting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [membersData, logsData] = await Promise.all([
        getTenantMembers(),
        getTenantAuditLogs(),
      ]);
      setMembers(membersData.members || []);
      setLogs(logsData.logs || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load team data.");
    } finally {
      setLoading(false);
    }
  };

  const currentTenantId = currentTenant?._id;

  useEffect(() => {
    if (currentTenantId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentTenantId]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setInviting(true);

    try {
      await addTenantMember(inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      setInviteRole("staff");
      setNotice("Team member added.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to add team member.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setError("");
    setNotice("");
    setUpdatingUserId(userId);

    try {
      await updateTenantMember(userId, { role });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to update member role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setError("");
    setNotice("");
    setUpdatingUserId(userId);
    const nextStatus = currentStatus === "active" ? "suspended" : "active";

    try {
      await updateTenantMember(userId, { status: nextStatus });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to update member status.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Team</h1>
            <p className="page-heading__description">
              Manage who has access to this store and review recent activity.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before managing your team.</p>
          </section>
        ) : loading ? (
          <section className="settings-panel">
            <p>Loading team...</p>
          </section>
        ) : (
          <>
            {canManageMembers && (
              <section className="settings-panel">
                <h2>Invite a team member</h2>
                <p>
                  The person must already have a TenantCart account before
                  they can be added.
                </p>
                <form onSubmit={handleInvite} className="settings-danger-form">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                  >
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="button button--secondary"
                    disabled={inviting}
                  >
                    {inviting ? "Adding..." : "Add member"}
                  </button>
                </form>
              </section>
            )}

            <section className="settings-panel">
              <h2>Members</h2>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    {canManageMembers && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isOwnerRow = member.role === "owner";
                    const isUpdating = updatingUserId === member.user?._id;

                    return (
                      <tr key={member._id}>
                        <td>{member.user?.name}</td>
                        <td>{member.user?.email}</td>
                        <td>
                          {canManageMembers && !isOwnerRow ? (
                            <select
                              value={member.role}
                              disabled={isUpdating}
                              onChange={(event) =>
                                handleRoleChange(
                                  member.user?._id,
                                  event.target.value
                                )
                              }
                            >
                              {assignableRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            member.role
                          )}
                        </td>
                        <td>{member.status}</td>
                        {canManageMembers && (
                          <td>
                            {!isOwnerRow && (
                              <button
                                type="button"
                                className="button button--secondary"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleStatusToggle(
                                    member.user?._id,
                                    member.status
                                  )
                                }
                              >
                                {member.status === "active"
                                  ? "Suspend"
                                  : "Reactivate"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="settings-panel">
              <h2>Audit log</h2>
              <ul className="settings-audit-log">
                {logs.length === 0 && <li>No activity recorded yet.</li>}
                {logs.map((log) => (
                  <li key={log._id}>
                    <strong>{log.actor?.name || "Unknown"}</strong>{" "}
                    {log.action} · {new Date(log.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {notice && <p className="settings-notice">{notice}</p>}
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </DashboardLayout>
  );
};

export default DashboardTeam;
