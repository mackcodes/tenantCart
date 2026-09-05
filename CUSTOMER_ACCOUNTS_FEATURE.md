# Feature: Per-Store Customer Accounts

## Goal
Let shoppers optionally register/login on an individual store's storefront
(e.g. `shopname.tenantcart.com` or `/store/:slug`) so they can view their own
order history at that store. This is scoped to the store only — a customer
account gives no access to the TenantCart platform, merchant dashboard, or
any other tenant's data. Guest checkout must keep working unauthenticated.

## Status
Not started. Design/estimate only (see conversation notes below).

## Why this is separate from merchant auth
- Merchant/admin auth (`User` model) grants access to the TenantCart
  dashboard and is platform-wide.
- Customer auth must be strictly tenant-scoped: the same email can have a
  distinct account per store, and a session/token issued for one tenant must
  never be valid against another tenant's storefront.

## Proposed approach
1. Extend the existing `Customer` model (already tenant-scoped via
   `{tenant, email}` unique index) with `passwordHash`, `emailVerified`,
   verification/reset tokens — mirrors fields already on `User.js`.
2. Add shopper-only auth routes/controller, scoped by store slug, e.g.
   `POST /api/v1/storefront/:slug/auth/register`, `/login`, `/logout`,
   `/verify-email`, `/forgot-password`, `/reset-password` — adapted from
   `authController.js` / `authRoutes.js`.
3. Add a `protectCustomer` middleware (separate cookie name/JWT claims from
   the merchant `tenantcart_token` cookie) that verifies the customer belongs
   to the tenant referenced in the request, mirroring `requireTenant`'s
   isolation guarantees.
4. Add optional `customer: ObjectId` ref on `Order` (currently only stores
   `customerEmail` as a string), set when checkout is done while
   authenticated.
5. Add a customer-facing `GET /store/:slug/my-orders` endpoint filtered by
   `{tenant, customer: req.customer._id}`.
6. Frontend: signup/login UI scoped to the storefront, plus an order-history
   page. Checkout must keep supporting the guest path unchanged.

## Effort estimate
Moderate — most of the backend session/hashing/email patterns already exist
and can be adapted from merchant auth. The main new work and risk areas are:
- Keeping the customer session cookie/JWT completely separate from the
  merchant session so they can't be confused on the same domain.
- Enforcing tenant isolation on customer tokens (a token for Store A must
  never work against Store B) — the same class of bug called out in
  `MULTI_TENANCY.md` for merchant data.
- Frontend UX decisions (modal during checkout vs. dedicated account area).
- Keeping guest checkout fully functional as the default, unauthenticated path.

Simpler alternative considered (not chosen yet): guest order lookup by
email + order number, or an emailed magic link per order — no
password/session infrastructure required, but no persistent "my account"
experience.
