# Next Step — Approach

_Created: 2026-09-05_

## Chosen next step
Item #1 from `PROJECT_STATUS.md` "Known gaps / next candidates": **Tenant team management UI** — members list, invite by email, change role, suspend/reactivate, and view the audit log. Backend already fully supports this (`tenantRoutes.js` + `tenantController.js` + `TenantMembership`/`TenantAuditLog` models); only the frontend is missing. This was chosen over other gaps (store policies, customers, discounts, billing) because it requires no new backend model/migration and closes the largest existing frontend/backend gap.

## Scope
- New frontend page: team members list + invite form + role/status controls + audit log panel.
- New route: `/dashboard/settings/team`, added to sidebar under "Settings".
- New service functions in `tenantService.js` wrapping the existing endpoints:
  - `GET /tenants/current/members`
  - `POST /tenants/current/members`
  - `PATCH /tenants/current/members/:userId`
  - `GET /tenants/current/audit-logs`
- No backend changes — endpoints, validation, and audit logging already exist and are covered by existing patterns (`requireTenantRole("owner", "admin")`).
- Access control in the UI: use the existing `tenants` array from `AuthContext` (each entry has `{ tenant, role }`) to determine the current user's membership role, mirroring the pattern already used in `AccountSettings.js`. Only "owner"/"admin" see invite/edit controls; other roles see a read-only member list.
- Do not allow changing/removing the owner row (backend already rejects this — UI should just disable those controls for the owner row).

## Out of scope (deliberately not doing now)
- Store policies, customer management, discounts, billing — separate gap-analysis items, larger (need new models).
- Email notifications for invites (backend addTenantMember does not send email currently) — not adding, out of scope for this step.
- Removing a member entirely (hard delete) — backend only supports `active`/`suspended` status, so UI will offer "Suspend"/"Reactivate" rather than delete.

## Implementation plan
1. Add `getTenantMembers`, `addTenantMember`, `updateTenantMember`, `getTenantAuditLogs` to `frontEnd/src/services/tenantService.js`.
2. Create `frontEnd/src/pages/DashboardTeam.js`:
   - Loads members + audit logs on mount.
   - Invite form (email + role select: admin/manager/staff).
   - Members table with role select + suspend/reactivate button per row (disabled for owner row, disabled if not owner/admin).
   - Audit log list (recent 100 entries) showing actor, action, timestamp.
   - Uses same page structure/classes as `AccountSettings.js` (`page-heading`, `settings-panel`, `button button--secondary`, etc.) for visual consistency.
3. Register route `/dashboard/settings/team` in `App.js` (protected, wrapped in `DashboardLayout`).
4. Add "Team" link to the Settings section of `DashboardSidebar.js`.
5. Manually verify: build passes, page renders for owner (full controls) and non-owner/non-admin (read-only), invite/role/status calls hit the right endpoints.
6. Run backend test suite (`cd backEnd && npm test`) and frontend build (`cd frontEnd && npm run build`) to confirm nothing broke.
7. Update `PROJECT_STATUS.md` and this file's status once done.

## Definition of done
- Team page reachable from sidebar, functional against the existing backend.
- Frontend builds cleanly.
- Backend test suite still passes (no backend changes expected, so this is a regression check).
- `PROJECT_STATUS.md` updated to move "Tenant team management UI" out of gaps and into implemented features.
- This file updated with a "Result" section summarizing what changed and any follow-ups.

## Result
Implemented as planned, no backend changes were required.

- Added `getTenantMembers`, `addTenantMember`, `updateTenantMember`, `getTenantAuditLogs` to `frontEnd/src/services/tenantService.js`.
- Added `frontEnd/src/pages/DashboardTeam.js`: invite form (owner/admin only), members table with role select + suspend/reactivate, audit log list.
- Added matching CSS (`settings-table`, `settings-audit-log`, `settings-danger-form select`) to `frontEnd/src/styles/dashboard.css`.
- Registered route `/dashboard/settings/team` in `App.js` and added a "Team" link to `DashboardSidebar.js`.
- Verified: `cd backEnd && npm test` — 8/8 passing. `cd frontEnd && npm run build` — compiles successfully.
- `PROJECT_STATUS.md` updated to reflect the new feature and to drop it from the gaps list.

### Follow-ups (addressed in this session)
- Added `frontEnd/src/pages/DashboardTeam.test.js` (4 tests: load members/audit log, invite, suspend, read-only view for non-owner/admin roles) — `npm test` now runs 2 suites / 7 tests, all passing.
- Invite flow now sends an email notification: `tenantController.js` sends a "you've been added" email via the existing `sendEmail` util when `addTenantMember` succeeds (non-blocking — failures are logged, not thrown, matching the pattern used for verification emails).
- This work is still on `feature/shipping-and-checkout`, same branch as the unmerged shipping feature — not merged into `main`.

