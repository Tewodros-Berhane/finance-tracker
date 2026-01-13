# Vantage

Vantage is a personal finance tracker built with Next.js (App Router). It helps you manage accounts, transactions, budgets, and goals while providing a clean, data-rich dashboard.

## Features

- Authentication with Better Auth (email/password).
- Dashboard with total balance, income/expense trends, cash flow, and category breakdown charts.
- Transactions ledger with filters, bulk selection, and quick add modal.
- Accounts overview with balances and net worth.
- Budgets with progress alerts and month-to-date spend tracking.
- Savings goals with contributions and progress analytics.
- Settings for base currency and exchange rate.
- Dark mode support and responsive layout with shadcn/ui.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma (PostgreSQL adapter) + Better Auth
- shadcn/ui + Tailwind CSS
- Recharts for charts
- React Hook Form + Zod for validation

## Architecture

- Server Components handle data fetching in page routes.
- Client Components power forms, charts, and interactive UI.
- Service layer (`lib/services`) contains read-only queries and aggregates.
- Server actions (`lib/actions`) handle mutations and cache revalidation.
- REST route handlers live in `app/api`.

## Base Currency & Conversion

- Transactions and accounts keep their original currency values.
- Aggregated views (dashboard totals, net worth, budgets, goals) convert to the Base Currency.
- Base Currency options: USD or BIRR (ETB).
- Exchange rate is stored as `usdToBirrRate` and applied across summary calculations.
- Budget and goal values are normalized to USD and converted on read.

## Project Structure (key paths)

```
app/
  (auth)/                 Auth pages (sign-in, sign-up)
  (dashboard)/            Main app shell + pages (dashboard, accounts, budgets, goals, categories, transactions, settings)
  api/                    Route handlers (accounts, categories, transactions, onboarding)
components/
  modules/                App layout modules (sidebar, breadcrumbs, etc.)
  ui/                     shadcn/ui components
lib/
  actions/                Server actions (mutations)
  services/               Service layer (read-only, cached queries)
  prisma.ts               Prisma singleton
  auth.ts                 Better Auth server config
prisma/
  schema.prisma           Database schema
```

## Environment Variables

These are the env vars used in code (define them in `.env`):

- `DATABASE_URL` (Prisma database connection string)
- `BETTER_AUTH_URL` (Better Auth base URL for the client)
- `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` (optional canonical base URL)

Refer to Better Auth docs for any provider-specific env variables you add.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` with your database and auth settings.
3. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start the dev server
- `npm run build` - Production build
- `npm run start` - Start the production server
- `npm run lint` - Lint

## Troubleshooting

- If Better Auth errors mention Prisma not initialized, run `npx prisma generate`.
- If you update the schema, run `npx prisma migrate dev` and `npx prisma generate`.

## License

Private project. No license specified.
