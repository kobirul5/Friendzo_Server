# Friendzo Backend

Friendzo Backend is the Express + TypeScript API that powers the Friendzo platform. It handles authentication, social activity, messaging, payments, media uploads, admin tools, and scheduled maintenance jobs.

## What this API does

- Authenticates users with JWT access and refresh tokens.
- Stores social data in MongoDB through Prisma.
- Serves memories, events, likes, comments, follows, profiles, and discovery data.
- Supports chat, file uploads, and real-time communication.
- Handles coins, gift cards, gifts, payments, and subscription-related flows.
- Provides admin modules for moderation, users, posts, reports, interests, and pricing.
- Runs background cron jobs for platform maintenance.

## Tech Stack

- Express.js
- TypeScript
- Prisma ORM
- MongoDB
- Socket.io
- JWT authentication
- Bcrypt password hashing
- Stripe payments
- Cloudinary and DigitalOcean Spaces for file storage
- Nodemailer for email flows
- Firebase Admin for push notification support
- node-cron for scheduled jobs

## Main Modules

- `auth` - login, register, logout, password reset, OTP verification
- `users` - user identity and profile-related operations
- `memories` - social memory CRUD
- `events` - event CRUD, pagination, likes, and owner event views
- `likes` - social post or memory-like interactions
- `comment` - comment system
- `profile` - profile read/update flows
- `follow` - follow and request management
- `chat` - real-time chat transport and persistence
- `discoverByInterest` and `find-by-interest` - discovery and matching
- `gift-card`, `gift`, and `coins` - virtual economy features
- `payments` - payment creation and tracking
- `admin` - admin dashboards and moderation APIs
- `report` and `block` - safety and moderation tools
- `subscription` - plan and subscription management
- `file-uploads` - media upload helpers

## API Surface

The app router mounts every module under `/api/v1`.

Common examples:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/memories/paginated`
- `GET /api/v1/events/paginated`
- `PATCH /api/v1/events/:id`
- `POST /api/v1/events/:id/like`
- `GET /api/v1/profile`
- `GET /api/v1/chat`
- `POST /api/v1/payment`
- `GET /api/v1/admin/...`

## Background Jobs

The backend starts cron jobs from `src/server.ts` after the database connection is ready.

Current jobs in `src/cron/cron.ts`:

- Keep-alive ping every 10 minutes to prevent the server from sleeping on free-tier hosts.
- Daily decrement of `boosts` and `priorityLikes` on user records.
- Daily shift of every event `startedAt` value by 1 day.

Important note: these jobs rely on a long-running server process. They run naturally on hosts like Render, PM2, or any always-on Node runtime.

## Project Structure

- `src/app` - app bootstrap, routes, middlewares, and database setup
- `src/app/modules` - feature modules and business logic
- `src/config` - environment parsing and config values
- `src/cron` - scheduled jobs
- `src/helpars` - reusable helpers
- `src/shared` - shared utilities such as Prisma and response helpers
- `prisma` - Prisma schema and database configuration

## Environment Variables

Core app:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `SERVER_URL`

Authentication:

- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `RESET_PASS_TOKEN`
- `RESET_PASS_TOKEN_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`

Email:

- `EMAIL`
- `APP_PASS`


Payments:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

DigitalOcean Spaces:

- `DO_SPACE_ENDPOINT`
- `DO_SPACE_ORIGIN_ENDPOINT`
- `DO_SPACE_ACCESS_KEY`
- `DO_SPACE_SECRET_KEY`
- `DO_SPACE_BUCKET`

Cloudinary:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Frontend integration:

- `https://friendzo.vercel.app/`

## Scripts

- `bun run dev` - start the API in development mode
- `bun run build` - compile TypeScript to `dist`
- `bun run start` - run the compiled server from `dist/server.js`
- `bun prisma generate` - generate Prisma client

## Getting Started

1. Install dependencies.
2. Configure the `.env` file.
3. Run `bun prisma generate`.
4. Start the server with `bun run dev`.


