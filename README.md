# TenantCart

TenantCart is a multi-tenant ecommerce platform for merchants to create a store,
manage products and orders, and publish a public storefront. It also includes an
admin tenant-review workflow and an AI-powered merchant analytics assistant.

## Features

- Merchant account registration, email verification, login, logout, and password recovery
- Optional store creation with tenant review and admin approval controls
- Product CRUD, image uploads, stock tracking, and merchant order management
- Public storefronts and guest checkout
- Owner-only storefront preview before public approval
- AI analytics for revenue trends and top products, isolated to the signed-in tenant
- Admin tenant listing, review, approval, rejection, suspension, and re-evaluation

## Project structure

```text
backEnd/   Express, MongoDB, Mongoose, authentication, commerce APIs
frontEnd/  React merchant dashboard, public storefront, and admin UI
```

## Prerequisites

- Node.js 18 or later
- npm
- A MongoDB database
- SMTP credentials for account email verification and password recovery

## Local setup

Install dependencies for both applications:

```bash
cd backEnd && npm install
cd ../frontEnd && npm install
```

Create `backEnd/.env` with the required configuration. Never commit real values.

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
```

Start the backend:

```bash
cd backEnd
npm start
```

Start the frontend in a second terminal:

```bash
cd frontEnd
npm start
```

Open `http://localhost:3000`. The frontend calls the backend at
`http://localhost:8080/api/v1` by default. Set `REACT_APP_API_BASE_URL` in
`frontEnd/.env` to use another API address.

## AI analytics setup

The merchant dashboard exposes the assistant at `/dashboard/analytics`. Configure
at least one provider key in `backEnd/.env`:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-flash-latest

# Optional fallback when Gemini is unavailable or rate-limited
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

Gemini is tried first and Groq is used as a fallback. The assistant reads only the
authenticated tenant's `paid`, `shipped`, and `delivered` orders. It supports:

- Revenue grouped by day, week, or month, including optional date ranges
- Top products ranked by quantity or revenue

## Testing and production build

```bash
cd backEnd && npm test
cd ../frontEnd && npm run build
```

## Current scope

This project is an MVP. Payment onboarding and payment processing, phone/OTP
verification, storefront templates, customer management, discounts, shipping and
policy settings, billing, and CMS tools are not implemented yet. Their dashboard
entries are intentionally marked as coming soon.