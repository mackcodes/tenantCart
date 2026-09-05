# TenantCart — Project Status

_Last updated: 2026-09-05 (customers, discounts, store policies, and content/FAQ CMS added)_

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
| `customerRoutes.js` | list/search customers, customer detail + order history | ✅ New — reads from a dedicated `Customer` entity, auto-upserted on checkout |
| `discountRoutes.js` | merchant CRUD for discount codes, public checkout validation | ✅ New — percentage/fixed discounts with min order amount, max uses, expiry |
| `policyRoutes.js` | get/update store policies (refund/shipping/cancellation/privacy/terms) | ✅ New |
| `contentRoutes.js` | get/update storefront banners and FAQs | ✅ New — blog/CMS explicitly out of scope |

### Implemented since last update (2026-08-31 → 2026-09-05)
- Storefront template library: five prebuilt templates with idempotent seeding, AI-generated templates (OpenRouter + Groq fallback, session limits), apply-to-storefront flow, "Already applied" state persisted on tenant branding.
- Account settings: tenant data export and owner-confirmed tenant deletion.
- Shipping: `Tenant.shipping` schema (flat rate, free-shipping threshold, local pickup toggle, estimated delivery text), `Order.shippingMethod`/`shippingAmount`, `shippingController.js` + `shippingRoutes.js`, checkout server-side shipping-cost calculation (delivery vs. pickup), mounted in `app.js`.

### Still stubbed / incomplete by original design
- `razorpayService.js` — initialization and verification work, but no webhook handling, refund flow, or reconciliation.
- No phone/OTP verification exists.
- No CMS blog (banners and FAQs are implemented; blog was explicitly descoped).
- No multi-market (currency/tax/language/region) support.
- No subscription/billing model.
- ~~Tenant membership/audit-log backend routes exist but have no frontend screens~~ — now implemented (see below).
- ~~No customer model/controller~~ — now implemented (see below).
- ~~No discount/coupon model~~ — now implemented (see below).
- ~~No store policy storage~~ — now implemented (see below).

## Frontend (`frontEnd/`) — builds cleanly

### Fully working pages
Landing, Login, Admin Login (`/admin/login`), Register Account, Register Store (decoupled — optional, not forced), Forgot/Reset Password, Verify Email, Resend Verification, Dashboard (home + "Create your store" CTA), Merchant Products, Merchant Orders (now shows shipping method/cost per order), Merchant Analytics, Templates (browse/generate/preview/apply, applied-state button), Payment Settings, Account Settings (export + deletion), Admin Tenants list + review, Public Storefront + Checkout (session-cart based, now with delivery-vs-pickup selection, shipping cost, discount codes, banners, and FAQs), Store Preview (owner-only, bypasses approval gate), Shipping Settings, Team management, **Store Policies, Customers, Discounts, Content (new)**.

### Still `ComingSoon` placeholders
Growth, Markets, Billing, Profile, Help. (Customers, Discounts, Content, and Store policies have all moved out of this list since the last update.)

### Recent flow change
Registration no longer forces store creation. New users land on `/dashboard` and create a store whenever they want, via a button on the dashboard or in the header.

### Implemented since last update (2026-09-05, this session)
Team management page (`/dashboard/settings/team`): lists tenant members (name/email/role/status), lets owners/admins invite existing users by email with an assigned role (admin/manager/staff), change a member's role, and suspend/reactivate members (owner row is protected in the UI, matching backend rules). Also renders the tenant audit log (last 100 entries). Invited members now receive an email notification (via the existing `sendEmail` util) when added to a tenant. No backend model changes were needed — this wires up the existing `tenantRoutes.js` member/audit-log endpoints plus one small controller addition (invite email). Added `tenantService.js` functions (`getTenantMembers`, `addTenantMember`, `updateTenantMember`, `getTenantAuditLogs`), new `DashboardTeam.js` page + test suite, sidebar link, and route registration.

### Implemented since last update (2026-09-05, second session — customers/discounts/policies/content)
- **Customers**: new `Customer` model (tenant + email unique), auto-upserted on every successful checkout (name/phone/last address/order count/lifetime spend). `/dashboard/customers` lists and searches customers by name/email; clicking a row loads that customer's order history inline.
- **Discounts**: new `Discount` model (percentage or fixed, min order amount, max uses, expiry, active flag), merchant CRUD at `/dashboard/discounts` (owner/admin only), and a public validate endpoint used by checkout. Checkout now has a discount-code field; applying a valid code recalculates the order total, and the backend re-validates and atomically consumes one use when the order is placed (guards against race conditions on the usage limit).
- **Store policies**: `Tenant.policies` (refund, shipping, cancellation, privacy, terms — free text), editable at `/dashboard/settings/policies` (owner/admin only), and rendered as an expandable footer on the public storefront when present.
- **Content (banners + FAQs)**: `Tenant.content` (banners: image/title/subtitle/link; FAQs: question/answer), editable at `/dashboard/content` (owner/admin only), and rendered on the public storefront (a horizontal banner strip near the top, FAQs as expandable entries near the bottom). Blog was explicitly out of scope for this pass.
- Backend: new `Customer`/`Discount` models, `customerController.js`/`discountController.js`/`policyController.js`/`contentController.js` + matching routes, all mounted in `app.js`. `orderController.js` now resolves/validates/consumes discounts and upserts the customer record as part of checkout. New `discountService.js` test suite (3 tests) covers invalid codes, minimum-order rejection, and percentage calculation.
- Frontend: new `customerService.js`/`discountService.js`/`policyService.js`/`contentService.js`, new pages `DashboardCustomers.js`, `Discounts.js`, `StorePolicies.js`, `DashboardContent.js`, wired into existing sidebar links and routes (replacing their `ComingSoon` placeholders). `Storefront.js` and `Checkout.js` updated to display/apply the new data.

## Testing status
- Backend: 11 tests passing (`backEnd/tests/`), including a new `discountService.test.js` suite.
- Frontend: 2 test suites / 7 tests passing under CRA's default discovery (`src/pages/AccountSettings.test.js`, `src/pages/DashboardTeam.test.js`). `frontEnd/tests/App.test.js` lives outside `src/` and is not picked up by default CRA config. No new frontend tests were added for the customers/discounts/policies/content pages this session — see gaps below.
- Frontend production build: passing.
- No coverage yet for: login/verification edge cases, email resend failures, template listing/applied-state, payment settings, product workflows, order workflows, tenant authorization boundaries, storefront/checkout behavior (including the new discount/banner/FAQ rendering), or the shipping settings/checkout flow.

## Known gaps / next candidates
1. Billing and plans — no subscription model or billing screen.
2. Payment production-readiness — webhook strategy, refunds, reconciliation.
3. Multi-market (currency/tax/language/region) support.
4. Blog/CMS beyond banners and FAQs (explicitly descoped this session).
5. Expand automated test coverage (frontend especially — the new customers/discounts/policies/content pages have no tests yet).

## Working branch note
The shipping and team-management work described above has been merged into `main` via PR #3 (was on `feature/shipping-and-checkout`). The customers/discounts/policies/content work in this update is on `feature/customer-discounts-policies-cms` and **not yet merged into `main`**.
