# ShopMart — Multi-Category Marketplace

A full-stack e-commerce storefront built with Next.js, inspired by Daraz/Amazon/Othoba: browse by category, view products, add to cart, check out with Cash on Delivery, and manage everything from an admin panel.

## Tech Stack

- **Next.js 14** (App Router, TypeScript) — frontend + backend API routes in one codebase
- **Node's built-in `node:sqlite`** for the database — zero-config, no external services needed
- **NextAuth** (credentials) for customer login/register
- **Zustand** for cart state (persisted in the browser)
- **Tailwind CSS** for styling

> **Node.js 22.5+ required.** This project uses Node's built-in SQLite module, which needs Node 22.5 or newer. Run `node -v` to check.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database is already seeded with 6 categories and ~36 sample products, so it's ready to browse immediately.

**Demo accounts** (shown on the login page too):
- Admin: `admin@shopmart.test` / `admin123`
- Customer: `demo@shopmart.test` / `demo1234`

To wipe and re-seed the database at any point:
```bash
npm run seed
```

## What's included

- **Homepage** — hero banner, category grid, deals, search
- **Category browsing** with sorting (price, rating, newest)
- **Product detail pages** with related products
- **Cart** (persisted locally) and **checkout** (Cash on Delivery or card placeholder)
- **Customer accounts** — register, login, order history
- **Admin panel** at `/admin` — add/delete products, view orders and revenue (visit while logged in as the admin account)

## Project Structure

```
src/
  app/            -> pages and API routes (App Router)
  components/     -> UI components (Header, ProductCard, etc.)
  lib/
    db.ts         -> all database logic (this is the file to look at first)
    auth.ts       -> NextAuth configuration
    cart-store.ts -> client-side cart state
scripts/seed.ts   -> sample data
data/shop.db      -> the SQLite database file
```

## Customizing

- **Currency**: shown as Taka (BDT symbol) — change in `src/lib/utils.ts` (`formatPrice`)
- **Branding/colors**: edit `tailwind.config.ts` (the `ink`/`marigold`/`spice` palette) and the "ShopMart" name in `Header.tsx` / `Footer.tsx`
- **Payment methods**: checkout currently supports Cash on Delivery and a card placeholder. To take real payments, integrate a gateway (SSLCommerz and bKash are the most common for Bangladesh; Stripe if you need international cards) inside `src/app/api/checkout/route.ts`
- **Adding products**: easiest via the admin panel UI, or extend `scripts/seed.ts`

## Deployment notes

This runs great on any Node.js host with a persistent filesystem (a VPS, Railway, Render, Docker, etc. — `npm run build && npm run start`).

If you deploy to a **serverless** platform like Vercel, be aware the filesystem is ephemeral there, so SQLite writes won't reliably persist between requests. For that kind of deployment, you'd want to swap the database for a hosted one (e.g., PostgreSQL via Prisma or Drizzle). The whole data layer is isolated in `src/lib/db.ts`, so that migration is a contained piece of work — happy to help with it when you're ready to go live.

## Notes

- Product images are placeholder photos (picsum.photos) — replace with your real product photography before launch.
- Passwords are hashed with bcrypt; the SQLite file itself isn't encrypted, so don't commit `data/shop.db` with real customer data to a public repo.
