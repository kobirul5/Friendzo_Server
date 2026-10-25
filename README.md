# Friendzo Backend

Friendzo Backend is the Express + TypeScript REST and WebSocket API that powers the Friendzo platform. It handles authentication, social feeds, real-time messaging, payments, media storage, administrative management, and automated background maintenance jobs.

## What this API does

- **Authentication & Security:** JWT-based access and refresh tokens, bcrypt password hashing, OTP verification, and secure password reset.
- **Social Core:** Memories (posts), community events, comments, likes, follow requests, and user profiles.
- **Real-Time Communication:** Native WebSocket server for direct messaging, unread counts, friend presence, and gift popup alerts.
- **Discovery Engine:** User discovery and matching based on shared interests and geographical proximity (Haversine formula).
- **Virtual Economy & Payments:** Stripe checkout integration for coins, gift cards, virtual gifts, and subscription packages.
- **Media Uploads:** Multi-storage media handling supporting Cloudinary and DigitalOcean Spaces.
- **Admin Suite:** Moderation tools for reporting and blocking users/posts, managing coin pricing, interest categories, and viewing revenue.
- **Automated Maintenance:** Background cron jobs for service keep-alive, daily subscription metric updates, and event date shifting.

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Database & ORM:** MongoDB via Prisma ORM
- **Real-Time WebSockets:** `ws` (native WebSocket server)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), Bcrypt
- **Payments:** Stripe API & Webhooks
- **Transactional Emails:** Brevo (Sendinblue) API via Axios
- **File & Media Storage:** Cloudinary, DigitalOcean Spaces (AWS S3 SDK)
- **Scheduled Tasks:** `node-cron`
- **Validation:** Zod

## Main Modules

Mounted under `/api/v1` in `src/app/routes/index.ts`:

- `auth` - Registration, login, token refresh, OTP verification, password reset
- `users` - User directory and user-level operations
- `memories` - Social memory/post CRUD and pagination
- `events` - Community events, attendances, and event likes
- `likes` - Likes on memories and posts
- `comment` - Commenting system
- `profile` - Profile retrieval and profile editing
- `follow` - Follow/unfollow, friend requests, and acceptance
- `chat` - Chat history and conversation records
- `discoverByInterest` & `find-by-interest` - Interest-based friend matching
- `gift-card`, `gift`, and `coins` - Virtual economy management
- `payment` - Stripe checkout sessions and payment records
- `dashboard` / `userInfo` - Admin dashboard metrics
- `posts` - Admin post moderation
- `report` & `block` - Safety, reporting, and user blocking
- `subscription` - Plans, boosts, and priority likes
- `file-uploads` - Media upload handlers

## Real-Time WebSocket Architecture

The server initializes a WebSocket server alongside the HTTP server in `src/server.ts` via `src/helpars/websocket.ts`.

Supported client events:
- `authenticate`: Validates client JWT token and marks user online.
- `message`: Sends a message to a recipient and persists it in MongoDB.
- `fetchChats`: Retrieves conversation history for a given recipient.
- `unReadMessages`: Returns unread message count and message list.
- `messageList`: Fetches all user conversation threads with the latest message.
- `allFriends`: Returns friend list sorted by online status.
- `giftPopup`: Delivers real-time gift notifications and marks them as seen.

## Background Jobs (Cron)

Scheduled in `src/cron/cron.ts` after database connection:

1. **Keep-Alive Ping (`*/10 * * * *`):** Pings `/api/v1/health` every 10 minutes to prevent cold starts on free-tier hosting (e.g. Render).
2. **Daily Decrement (`0 0 * * *`):** Decrements user `boosts` and `priorityLikes` by 1 at midnight.
3. **Daily Event Shift (`0 0 * * *`):** Shifts all existing event `startedAt` timestamps forward by 1 day to keep demo events active.

> **Note:** Cron jobs require a persistent, long-running Node process (e.g., Render, VPS, or PM2).

## Project Structure

- `src/app` - Express application setup, routes, global middlewares, and error handlers.
- `src/app/modules` - Domain-driven feature modules (controllers, services, routes).
- `src/config` - Centralized environment variable parsing and configuration.
- `src/cron` - Scheduled background cron tasks.
- `src/helpars` - Helpers including WebSocket handler, JWT manager, and storage uploaders.
- `src/shared` - Singleton Prisma client, Brevo mail sender, and API response utilities.
- `prisma` - `schema.prisma` definitions for MongoDB collections and indexes.

## Environment Variables

Create a `.env` file in the root of `Friendzo_Server/`:

```env
# Database & Runtime
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.mongodb.net/friendzo?retryWrites=true&w=majority"
NODE_ENV="development"
PORT=5000
SERVER_URL="http://localhost:5000/api/v1/health"
FRONTEND_URL="http://localhost:3000"

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# JWT Authentication
JWT_SECRET="your_jwt_secret"
EXPIRES_IN="365d"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"
REFRESH_TOKEN_EXPIRES_IN="365d"
RESET_PASS_TOKEN="your_reset_pass_token_secret"
RESET_PASS_TOKEN_EXPIRES_IN="5m"
RESET_PASS_LINK="http://localhost:3000/reset-password"

# Brevo Transactional Email Service
BREVO_API_KEY="your_brevo_api_key"
BREVO_EMAIL="your_verified_sender_email@domain.com"
BREVO_SENDER_NAME="Friendzo Support"

# Stripe Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# DigitalOcean Spaces (Media Storage)
DO_SPACE_ENDPOINT="https://<region>.digitaloceanspaces.com"
DO_SPACE_ORIGIN_ENDPOINT="https://<bucket>.<region>.digitaloceanspaces.com"
DO_SPACE_CDN_ENDPOINT="https://<bucket>.<region>.cdn.digitaloceanspaces.com"
DO_SPACE_ACCESS_KEY="your_do_space_access_key"
DO_SPACE_SECRET_KEY="your_do_space_secret_key"
DO_SPACE_BUCKET="your_bucket_name"

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## Scripts

```bash
# Start development server with hot-reload
bun run dev         # or: npm run dev

# Build TypeScript to JavaScript in dist/
bun run build       # or: npm run build

# Start compiled production server
bun run start       # or: npm start

# Generate Prisma client for MongoDB
bun prisma generate # or: npx prisma generate

# Scaffold a new backend module
bun run generate    # or: npm run generate
```

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file from the variables described above with valid MongoDB, JWT, and Brevo credentials.

3. **Generate Prisma Client:**
   ```bash
   bun prisma generate
   # or
   npx prisma generate
   ```

4. **Start the API:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   The API will listen on [http://localhost:5000/api/v1](http://localhost:5000/api/v1) and the health check is available at [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health).
