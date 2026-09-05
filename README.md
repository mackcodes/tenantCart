# TenantCart

TenantCart is a multi-tenant ecommerce platform where merchants create and manage
their own online stores. Each tenant has isolated products, orders, customers,
settings, payment credentials, and storefront content.

## Roles and tenancy

TenantCart separates platform access, store management, and shopper access.

| Term | Meaning | Typical access |
|---|---|---|
| **Tenant** | One isolated store or business in TenantCart. It is the main data boundary for products, orders, customers, settings, content, and payment credentials. | Data is available only to authorized members of that tenant. |
| **User** | A platform account represented by the `User` model. Users authenticate to the merchant dashboard and may belong to one or more tenants through memberships. | Dashboard access determined by the user's tenant memberships and roles. |
| **Merchant** | A user who manages a tenant's store. In the application, this is commonly a `User` with a merchant account and an active tenant membership. | Store configuration, products, orders, customers, and other permitted merchant tools. |
| **Owner** | The primary manager of a tenant. The owner can manage store settings and tenant membership, subject to platform rules. | Full store-management access, including team and sensitive settings. |
| **Admin / Manager / Staff** | Tenant membership roles for team members. Permissions are enforced by backend middleware, not only by hiding frontend controls. | Access varies by role; owner/admin actions are more privileged than manager/staff actions. |
| **Platform admin** | A TenantCart administrator with platform-level privileges. This is separate from a store merchant and can review, approve, suspend, or re-evaluate tenants. | Cross-tenant administrative workflows only where explicitly authorized. |
| **Customer** | A shopper account scoped to one tenant. Customer authentication uses a separate session from merchant authentication, and the same email can have separate accounts at different stores. | Own profile and orders for that store only. No dashboard or access to another tenant. |
| **Guest shopper** | An unauthenticated visitor who browses a public storefront and checks out without creating an account. | Public storefront and guest checkout; no persistent account order history. |

### Tenant isolation rule

The tenant, not a client-supplied tenant ID, is the authorization boundary. Private
backend requests resolve the active tenant through authenticated membership and
role checks. Customer tokens also contain a tenant identity and are checked
against the storefront slug on every protected customer request. A session from
Store A must never expose Store B's data.

## Features

- Merchant registration, login, logout, email verification, and password recovery
- Store creation, slug-based storefront URLs, and admin approval workflow
- Tenant membership, roles, audit logs, and team management
- Product CRUD, image uploads, stock tracking, and order management
- Public storefronts, guest checkout, shipping methods, discounts, policies, banners, and FAQs
- Optional per-store customer accounts and customer order history
- Store preview for owners before public approval
- Razorpay payment setup, order creation, payment verification, and webhook signature utilities
- Markets settings for currency, language, and timezone
- Growth, analytics, customer, billing, profile, and help-center dashboard pages
- AI analytics with tenant-scoped revenue and top-product queries

## Technology

- Frontend: React, React Router, Create React App
- Backend: Node.js, Express, Mongoose, MongoDB
- Authentication: HTTP-only cookies, JWT, bcrypt
- Email: Nodemailer with SMTP
- Payments: Razorpay
- AI analytics: Google Gemini with optional Groq fallback

## Project structure

```text
tenant-cart/
├── backEnd/
│   ├── app.js                    # Express middleware and route mounting
│   ├── server.js                 # HTTP server entry point
│   ├── package.json
│   ├── config/                   # Database and cookie configuration
│   ├── controllers/              # HTTP request handlers
│   ├── middlewares/              # Auth, tenant, upload, and validation guards
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # API route definitions
│   ├── services/                 # Auth, payments, products, orders, and AI logic
│   ├── scripts/                  # Migrations and seed scripts
│   ├── tests/                    # Node test runner suites
│   ├── uploads/                  # Local product uploads
│   └── .env                      # Local backend secrets, never commit
├── frontEnd/
│   ├── public/                   # Static public assets and index.html
│   ├── src/
│   │   ├── components/           # Shared dashboard and UI components
│   │   ├── context/              # Merchant and customer auth state
│   │   ├── pages/                # Dashboard, auth, storefront, and checkout pages
│   │   ├── services/             # Frontend API clients
│   │   ├── styles/               # Shared dashboard and checkout styles
│   │   ├── App.js                # React Router route definitions
│   │   └── index.js              # Frontend entry point
│   ├── package.json
│   └── .env                      # Local frontend environment overrides
├── AGENTS.md                     # Repository development guidelines
├── MULTI_TENANCY.md              # Tenant isolation rules
├── PROJECT_STATUS.md             # Project status notes
└── README.md
```

## Prerequisites

- Node.js 18 or later
- npm
- MongoDB database, local or hosted
- SMTP account or provider for verification and password-reset emails
- Razorpay account for online payments
- AI provider key if using merchant analytics

## Local setup

Install dependencies independently for both applications:

```bash
cd backEnd
npm install

cd ../frontEnd
npm install
```

### Backend environment

Create `backEnd/.env`. Use real secrets only in local untracked files or a
production secret manager. Never place backend secrets in the React app.

```env
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:3000

MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=tenantcart
JWT_SECRET=replace_with_a_long_random_secret

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_smtp_app_password

# Optional AI analytics providers
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-flash-latest
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b

# Razorpay webhook signature secret configured in Razorpay Dashboard
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Required backend values are `MONGO_URI`, `MONGO_DATABASE`, `JWT_SECRET`,
`CLIENT_URL`, and the email settings used by the authentication flows. AI and
Razorpay webhook variables are required only when those features are enabled.

### Frontend environment

The frontend defaults to `http://localhost:8080/api/v1`. To override it, create
`frontEnd/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
```

For production, replace it with the HTTPS backend URL:

```env
REACT_APP_API_BASE_URL=https://api.example.com/api/v1
```

Only variables prefixed with `REACT_APP_` are exposed to the browser. Do not put
MongoDB credentials, JWT secrets, SMTP passwords, Razorpay Key Secrets, or AI
provider keys in `frontEnd/.env`.

### Start locally

Run the backend in one terminal:

```bash
cd backEnd
npm start
```

Run the frontend in a second terminal:

```bash
cd frontEnd
npm start
```

Open `http://localhost:3000`. The backend health endpoint is available at
`http://localhost:8080/api/v1/health`.

## Razorpay setup

Razorpay credentials are configured per store, not as one shared frontend value.
Each merchant should:

1. Create or activate a Razorpay account and complete the required KYC.
2. Open **Dashboard > Settings > Payments** in TenantCart.
3. Generate Test Mode keys for development or Live Mode keys for production.
4. Create a Razorpay webhook and copy its webhook secret.
5. Enter the Razorpay **Key ID**, **Key Secret**, and **Webhook Secret** in the
	payment settings form.
6. Save the credentials and test a checkout payment.
7. Configure the Razorpay webhook endpoint against the production backend.

The Key ID may be returned to the browser for the Razorpay checkout widget. The
Key Secret must remain on the backend because it is used to create Razorpay
orders and verify payment signatures. Never commit either credential.

Typical production webhook URL:

```text
https://api.example.com/api/v1/payments/razorpay/webhook
```

The webhook secret is stored per tenant when the merchant connects Razorpay.
The backend never returns it to the browser. Keep Test Mode and Live Mode
credentials separate.

### Manual production integration checklist

The following steps must be completed manually in the Razorpay Dashboard and
your deployment provider. They cannot be completed by the React application.

#### Merchant Razorpay account

For each merchant store:

1. Sign in to the merchant's Razorpay Dashboard.
2. Complete Razorpay account activation and KYC.
3. Switch to **Live Mode**.
4. Open **Settings → API Keys** and generate Live Mode keys.
5. Copy the Live **Key ID** and **Key Secret**.
6. In TenantCart, open **Dashboard → Settings → Payments**.
7. Paste both values and the webhook secret, then select **Save & Connect**.
8. Confirm that the merchant's checkout uses the correct account.

The Key Secret must never be pasted into frontend source code, committed to Git,
or added to `frontEnd/.env`. It is stored and used by the backend only.

#### Production webhook

In the Razorpay Dashboard, create a webhook with:

- URL: `https://api.example.com/api/v1/payments/razorpay/webhook`
- A strong webhook secret generated for the webhook
- Events: `payment.captured`, `payment.failed`, `order.paid`,
  `refund.created`, `refund.processed`, and `refund.failed`

For local development and legacy single-account setups, a fallback webhook
secret can be placed in the backend environment:

```env
RAZORPAY_WEBHOOK_SECRET=<production-webhook-secret>
```

In production, the tenant-specific webhook secret saved through the payment
settings UI is used. The environment fallback is not used for unknown tenant
events in production.

Redeploy or restart the backend after changing the environment. In the Razorpay
Dashboard, use **Test Webhook** or the webhook delivery log to confirm that the
endpoint returns HTTP `200` and that the corresponding order or refund status is
updated in TenantCart.

The backend verifies the `X-Razorpay-Signature` header using the raw request
body. Do not place `express.json()` before the webhook route or signature
verification will fail.

#### Production payment test

After connecting Live Mode credentials:

1. Create a small test order from the public storefront.
2. Complete payment using a real payment method approved for the account.
3. Confirm the Razorpay payment shows as captured.
4. Confirm the TenantCart order changes to `paid`.
5. Test a partial refund from the merchant order workflow.
6. Confirm the refund appears in Razorpay and TenantCart.
7. Test a full refund and confirm the order eventually becomes `refunded`.

Each independent Razorpay merchant account can use its own webhook secret. The
webhook handler resolves the tenant from the Razorpay order or payment ID before
validating the signature, so one merchant's webhook secret cannot validate
another merchant's event.

## Storefront URLs and production domains

Storefronts currently use path-based URLs:

```text
http://localhost:3000/store/urban-goods
https://tenantcart.example.com/store/urban-goods
```

The Markets page builds the full link from the current browser origin and the
tenant slug, so it automatically changes from localhost to the deployed domain.

When deploying the React app, configure the frontend host to rewrite unknown
frontend paths to `index.html`. This is required for browser refreshes on
`/store/:slug` and `/dashboard/*` routes. Keep `/api/*` requests routed to the
Express backend instead of the React fallback.

Example Netlify file at `frontEnd/public/_redirects`:

```text
/* /index.html 200
```

Example Nginx configuration:

```nginx
location /api/ {
	proxy_pass http://localhost:8080;
}

location / {
	try_files $uri $uri/ /index.html;
}
```

For a production deployment, also set backend `CLIENT_URL` to the frontend
origin, enable HTTPS, configure DNS, and verify cookies and CORS.

## Testing and builds

Run the backend tests:

```bash
cd backEnd
npm test
```

Run the frontend tests once:

```bash
cd frontEnd
npm test -- --watchAll=false
```

Create a production frontend build:

```bash
cd frontEnd
npm run build
```

Run the tenant-membership migration only against the intended database:

```bash
cd backEnd
npm run migrate:tenant-memberships
```

## Security and tenant isolation

- Tenant membership, not a client-supplied tenant ID, is the authorization boundary.
- Customer sessions use a separate cookie and include a tenant identity claim.
- Guest checkout remains available without customer authentication.
- Payment secrets and provider keys belong only in the backend environment.
- Do not commit `.env` files, uploads, credentials, or customer data.
- Review [MULTI_TENANCY.md](MULTI_TENANCY.md) before changing authenticated data flows.

## Production checklist

- Configure frontend and backend DNS records with HTTPS.
- Set production `CLIENT_URL` and `REACT_APP_API_BASE_URL`.
- Configure SPA fallback routing for React pages.
- Use a production MongoDB database and a new random `JWT_SECRET`.
- Configure SMTP, Razorpay Live Mode keys, and Razorpay webhooks.
- Confirm payment signature verification and order status updates.
- Test Store A and Store B tenant isolation.
- Test guest checkout and customer-account checkout.
- Run backend tests and the frontend production build.

The local deployment checklist is available in
`DOMAIN_DEPLOYMENT_CHECKLIST.md`; it is intentionally ignored by Git for
workspace-specific deployment notes.