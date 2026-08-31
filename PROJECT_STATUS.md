# TenantCart — Project Status

_Last updated: 2026-08-31_

## Backend (`backEnd/`) — stable, all routes tested and working

| Route file | Endpoints | Status |
|---|---|---|
| `authRoutes.js` | register-account, register-store, login, logout, me, forgot/reset-password, verify-email/:token, resend-verification | ✅ Full auth + email verification implemented |
| `adminTenantRoutes.js` | list, review, approve, reject, suspend, request-information, re-evaluate | ✅ Full admin approval workflow |
| `productRoutes.js` | CRUD + image upload | ✅ Working |
| `orderRoutes.js` | guest checkout, merchant list/detail/status update | ✅ Working, stock reservation/rollback included |
| `storefrontRoutes.js` | public store/product view + owner-only preview (`/preview/mine`) | ✅ Working |
| `aiAnalyticsRoutes.js` | ask | ✅ Gemini function calling with Groq fallback, tenant-scoped revenue and top-product analytics |

### Fixed this session
- Server-crashing default-import bug (`protect` middleware) in `orderRoutes.js` / `adminTenantRoutes.js`.
- `aiAnalyticsRoutes.js` was never mounted in `app.js` — fixed.
- Dead/duplicate `status` field in the `Tenant` schema.
- Fake `slugAvailable` check in `evaluateTenant` (was hardcoded `true`) — now a real DB lookup.
- No way to re-run automated tenant approval after creation — added `PATCH /admin/tenants/:id/re-evaluate`.
- No email verification flow existed at all — implemented registration email, `verify-email/:token`, `resend-verification`, with tenant sync + automatic re-evaluation on verify.
- `typeof null === "object"` crash in `DashboardHeader.js` once storeless users could reach the dashboard.
- Mongo connection had no `dbName`, silently defaulting to the `test` database — fixed to use `MONGO_DATABASE`.
- Added `scripts/promoteAdmin.js` — CLI-only admin bootstrap (deliberately not an HTTP endpoint, to avoid privilege escalation).
- Added `/admin/login` dedicated admin entry point (not linked from merchant login, admins navigate directly).

### Still stubbed by original design
- `razorpayService.js` — payment onboarding, not implemented.
- No phone/OTP verification exists.

## Frontend (`frontEnd/`) — builds cleanly

### Fully working pages
Landing, Login, Admin Login (`/admin/login`), Register Account, Register Store (now decoupled — optional, not forced), Forgot/Reset Password, Verify Email, Dashboard (home + "Create your store" CTA), Merchant Products, Merchant Orders, Admin Tenants list + review, Public Storefront + Checkout (session-cart based), Store Preview (owner-only, bypasses approval gate).

### Still `ComingSoon` placeholders
No backend support exists yet for: Templates, Customers, Growth, Discounts, Content, Markets, Payment/Shipping/Store-policy settings, Billing, Account, Profile, Help.

### Recent flow change
Registration no longer forces store creation. New users land on `/dashboard` and create a store whenever they want, via a button on the dashboard or in the header.

## Known gaps / next candidates
1. Payment onboarding (Razorpay) — stub, blocks full automated tenant approval.
2. Phone verification — no OTP provider chosen yet.
3. Remaining `ComingSoon` sections have no backend models/controllers at all (customers, discounts, CMS content, shipping/policy settings) — need backend work first.
