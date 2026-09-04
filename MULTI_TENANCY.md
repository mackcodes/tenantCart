# Multi-tenancy: what changed and why

## Goal

TenantCart is a shared-application, shared-database multi-tenant system. A
tenant is the data and permission boundary for one merchant business. The
merchant-facing UI calls that boundary a **store**, because that is the product
the merchant is managing.

The important rule is: a signed-in person must be an active member of a tenant
before they can read or change that tenant's private data. A role such as
`merchant` alone is not sufficient permission.

## Terminology

| Term | Meaning |
| --- | --- |
| User | An account that can authenticate. |
| Tenant | An isolated business/workspace in the shared platform. |
| Store | The customer-facing name for a tenant. |
| Tenant membership | A user's scoped access to a tenant and its tenant role. |
| Platform role | Broad account role (`merchant`, `admin`, or legacy `user`). |

The current active tenant remains in `User.tenant` for compatibility with the
existing UI. It is not the authorization source: the server verifies a matching
active `TenantMembership` on every private tenant API request.

## Implemented protections

### Memberships and tenant roles

`TenantMembership` now links users and tenants with the roles `owner`,
`admin`, `manager`, and `staff`. It has a unique compound index on
`tenant + user`, preventing duplicate memberships.

- Store creation creates the owner membership.
- Existing tenant owners are upgraded lazily when they make a tenant request.
- `npm run migrate:tenant-memberships` materializes owner memberships for all
  existing tenants before or after deployment.
- Owners and tenant admins can add existing accounts as members, change their
  role/status, and list members.

### Verified active-tenant context

`requireTenant` resolves the active tenant from the user's active tenant or an
optional `X-Tenant-Id` header. It loads a membership for that exact user and
tenant, and attaches only the verified value to `req.tenantId`.

Every tenant-private route uses this value, including products, orders,
analytics, templates, payment settings, and storefront preview. A request for
another tenant without a membership receives `403`; it cannot use an object ID
alone to cross the boundary.

`requireTenantRole(...)` then applies tenant-level permissions. For example,
staff can view products/orders, managers can manage catalog/templates, and
only owners or tenant admins can manage payment settings and team members.

### Data scoping and public access

- Products use `tenantId`; product reads, updates, and deletes include it.
- Orders use `tenant`; merchant order reads and status changes include it.
- Tenant-specific AI templates now carry `tenant` and cannot be listed or
  applied by another tenant.
- Public storefront and checkout paths first resolve the approved tenant by
  slug, then query products under that tenant only.
- Product uploads are stored under `uploads/products/<tenantId>/` so files are
  organized by their owning tenant.

### Store creation consistency

Store creation now runs in a MongoDB transaction. It creates the tenant, owner
membership, and user's active tenant together. If one step fails, none of the
three records are committed. The tenant owner has a unique index, which
enforces the current one-owned-store-per-merchant rule.

MongoDB transactions require a replica set. MongoDB Atlas meets this
requirement; local development should use a single-node replica set rather
than a standalone `mongod`.

### Tenant switching and team APIs

The dashboard loads a user's active memberships and shows a store switcher
when more than one is available. Switching persists the active tenant on the
server, so existing API calls continue to work without relying on a
client-supplied tenant ID.

Available authenticated APIs:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/tenants/mine` | List active tenant memberships. |
| `PUT /api/v1/tenants/current` | Select an accessible active tenant. |
| `GET /api/v1/tenants/current/members` | List members (owner/admin). |
| `POST /api/v1/tenants/current/members` | Add/reactivate an existing account (owner/admin). |
| `PATCH /api/v1/tenants/current/members/:userId` | Change a non-owner member's role or status (owner/admin). |
| `GET /api/v1/tenants/current/export` | Download all tenant-owned data (owner). |
| `DELETE /api/v1/tenants/current` | Permanently delete a tenant; body must include its exact `confirmationSlug` (owner). |

### Checkout privacy

Guest payment initiation and verification now require a random checkout
capability token. Only its SHA-256 hash is stored in the order, and it is
returned once when the order is created. This prevents someone who learns an
order ID from initiating or verifying that order's payment. Payment verification
also returns only order ID and status, not the customer's order details.

### Audit trail

Tenant audit logs record tenant selection, member changes, product changes,
order-status changes, template changes, and payment-settings updates. Tenant
owners and admins can inspect the latest 100 records through
`GET /api/v1/tenants/current/audit-logs`.

## Rollout checklist

1. Deploy the code to an environment backed by a MongoDB replica set.
2. Run `cd backEnd && npm run migrate:tenant-memberships` once against the
   production database. It creates the membership/owner indexes and owner
   memberships.
3. Deploy the frontend and backend together because the checkout now passes a
   payment token to the payment APIs.
4. Test with two tenants: use Tenant A's product/order ID while authenticated
   to Tenant B and confirm the server returns `404` or `403`.
5. Define plan quotas and billing states to match the commercial product before
   enforcing them. Those are business rules, so they should be configured
   deliberately rather than guessed in code.

## Verification included

`backEnd/tests/tenantMiddleware.test.js` verifies that a user cannot select a
tenant without membership, that a verified membership becomes the request
tenant context, and that a staff member cannot perform manager-level actions.
The backend test suite and the frontend production build both pass after these
changes.
