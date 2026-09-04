# Repository Guidelines

## Project Structure & Module Organization

TenantCart is split into two independently installed JavaScript applications:

- `frontEnd/` contains the React client. Place screens in `src/pages/`, shared UI in `src/components/`, API clients in `src/services/`, authentication state in `src/context/`, and CSS in `src/styles/` or alongside a page.
- `backEnd/` contains the Express API. Keep HTTP handlers in `controllers/`, endpoint definitions in `routes/`, business logic in `services/`, Mongoose schemas in `models/`, and request guards in `middlewares/`.
- `backEnd/tests/` and `frontEnd/tests/` hold automated tests. Operational scripts live in `backEnd/scripts/`.

Read `MULTI_TENANCY.md` before changing authenticated or store data flows. Tenant membership—not a client-supplied ID—is the authorization boundary.

## Build, Test, and Development Commands

Install dependencies separately in each package: `cd frontEnd && npm install` and `cd backEnd && npm install`.

- `cd frontEnd && npm start` starts the React development server.
- `cd frontEnd && npm run build` creates a production client build.
- `cd frontEnd && npm test -- --watchAll=false` runs frontend tests once.
- `cd backEnd && npm start` starts the API with nodemon (default port `8080`).
- `cd backEnd && npm test` runs the Node test suite.
- `cd backEnd && npm run migrate:tenant-memberships` performs the documented tenant-membership migration; run it only against the intended database.

## Coding Style & Naming Conventions

Use ES modules, semicolons, and double quotes in backend code; follow the nearby file’s formatting in React code. Use PascalCase for React components and Mongoose models (`DashboardLayout.js`, `TenantMembership.js`), camelCase for functions and services (`productService.js`), and descriptive route/controller pairs. Keep controllers thin and put reusable database or provider work in services. No formatter or linter is configured, so avoid unrelated formatting churn.

## Testing Guidelines

Add backend tests as `backEnd/tests/*.test.js` using `node:test` and `node:assert/strict`. Add frontend tests as `frontEnd/tests/*.test.js` using React Testing Library; assert user-visible behavior rather than implementation details. Exercise authorization and tenant scoping for private API changes, then run the relevant suite and frontend build before opening a PR.

## Commit & Pull Request Guidelines

History follows concise Conventional Commit-style prefixes, chiefly `feat:` and `fix:`. Use imperative summaries, for example `fix: scope orders to the active tenant`. Keep commits focused. PRs should explain user-facing and data-model changes, link the issue when available, list verification commands, and include screenshots for visible frontend changes. Call out migrations, environment variables, payment changes, and authorization implications explicitly.

## Security & Configuration

Keep credentials in untracked `backEnd/.env`; never commit API keys or real customer data. Configure `CLIENT_URL`, database settings, and optional AI provider keys there. Preserve server-side tenant verification for every private endpoint and do not trust an `X-Tenant-Id` header without membership validation.
