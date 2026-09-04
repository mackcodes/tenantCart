# TenantCart — Project Status

_Last updated: 2026-09-05_

## Backend (`backEnd/`) — stable, all routes tested and working

| Route file | Endpoints | Status |
|---|---|---|
| `authRoutes.js` | register-account, register-store, login, logout, me, forgot/reset-password, verify-email/:token, resend-verification | ✅ Full auth + email verification implemented |
| `adminTenantRoutes.js` | list, review, approve, reject, suspend, request-information, re-evaluate | ✅ Full admin approval workflow |
| `productRoutes.js` | CRUD + image upload | ✅ Working |
| `orderRoutes.js` | guest checkout, merchant list/detail/status update | ✅ Working, stock reservation/rollback and shipping method/amount included |
| `storefrontRoutes.js` | public store/product view + owner-only preview (`/preview/mine`) | ✅ Working, now returns tenant shipping/address for checkout |
| `paymentRoutes.js` | Razorpay order init, payment verification, merchant payment settings | ⚠️ Working end-to-end, but production readiness (webhooks, refunds, reconciliation) is unaddressed |
| `templateRoutes.js` | list templates, generate AI template, apply template | ✅ Working, five prebuilt templates + AI generation via OpenRouter/Groq |
| `tenantRoutes.js` | account settings, data export, tenant deletion | ✅ Working |
| `shippingRoutes.js` | get/update shipping settings (flat rate, free-shipping threshold, local pickup, estimated delivery) | ✅ New — implemented this session |
| `aiAnalyticsRoutes.js` | ask | ✅ Gemini function calling with Groq fallback, tenant-scoped revenue and top-product analytics |

### Implemented since last update (2026-08-31 → 2026-09-05)
- Storefront template library: five prebuilt templates with idempotent seeding, AI-generated templates (OpenRouter + Groq fallback, session limits), apply-to-storefront flow, "Already applied" state persisted on tenant branding.
- Account settings: tenant data export and owner-confirmed tenant deletion.
- Shipping: `Tenant.shipping` schema (flat rate, free-shipping threshold, local pickup toggle, estimated delivery text), `Order.shippingMethod`/`shippingAmount`, `shippingController.js` + `shippingRoutes.js`, checkout server-side shipping-cost calculation (delivery vs. pickup), mounted in `app.js`.

### Still stubbed / incomplete by original design
- `razorpayService.js` — initialization and verification work, but no webhook handling, refund flow, or reconciliation.
- No phone/OTP verification exists.
- No customer model/controller (guest checkout stores customer details inline on the order, no dedicated customer entity).
- No discount/coupon model.
- No store policy (refund/privacy/terms/shipping/cancellation) storage.
- No CMS for homepage content, banners, blog, FAQs.
- No multi-market (currency/tax/language/region) support.
- No subscription/billing model.
- Tenant membership/audit-log backend routes exist but have no frontend screens (view members, invite, change roles, remove, view audit history).

## Frontend (`frontEnd/`) — builds cleanly

### Fully working pages
Landing, Login, Admin Login (`/admin/login`), Register Account, Register Store (decoupled — optional, not forced), Forgot/Reset Password, Verify Email, Resend Verification, Dashboard (home + "Create your store" CTA), Merchant Products, Merchant Orders (now shows shipping method/cost per order), Merchant Analytics, Templates (browse/generate/preview/apply, applied-state button), Payment Settings, Account Settings (export + deletion), Admin Tenants list + review, Public Storefront + Checkout (session-cart based, now with delivery-vs-pickup selection and shipping cost), Store Preview (owner-only, bypasses approval gate), **Shipping Settings (new)**.

### Still `ComingSoon` placeholders
No backend support exists yet for: Customers, Growth, Discounts, Content, Markets, Store policies, Billing, Profile, Help. (Templates, Payment settings, and Shipping settings have all moved out of this list since the last update.)

### Recent flow change
Registration no longer forces store creation. New users land on `/dashboard` and create a store whenever they want, via a button on the dashboard or in the header.

## Testing status
- Backend: 8 tests passing (`backEnd/tests/`).
- Frontend: only one test file is actually discovered and run by the CRA test runner — `src/pages/AccountSettings.test.js` (3 tests passing). `frontEnd/tests/App.test.js` lives outside `src/` and is not picked up by default CRA config.
- Frontend production build: passing.
- No coverage yet for: login/verification edge cases, email resend failures, template listing/applied-state, payment settings, product workflows, order workflows, tenant authorization boundaries, storefront/checkout behavior, or the new shipping settings/checkout flow.

## Known gaps / next candidates
1. Tenant team management UI (members list, invite, roles, audit log) — backend already exists, frontend does not.
2. Store policies (refund/privacy/terms/cancellation) — no model, no storefront/checkout display.
3. Customer management — no model, no list/search/detail/order-history UI.
4. Discounts/coupons — no model, no checkout validation.
5. Billing and plans — no subscription model or billing screen.
6. Payment production-readiness — webhook strategy, refunds, reconciliation.
7. Expand automated test coverage (frontend especially).

## Working branch note
The shipping feature above (backend model/controller/routes + frontend settings page + checkout integration) is currently on `feature/shipping-and-checkout` and **not yet merged into `main`**.
