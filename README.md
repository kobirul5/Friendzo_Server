# Friendzo Backend: Scalable Social API

A robust, high-performance Node.js/Express API designed for the Friendzo ecosystem. It powers everything from real-time chats to complex financial transactions and geospatial discovery.

---

## 🛠️ Core Stack

- **Framework**: Express.js with TypeScript.
- **ORM**: [Prisma](https://www.prisma.io/) optimized for **MongoDB**.
- **Real-time**: [Socket.io](https://socket.io/) for bidirectional communication.
- **Auth**: JWT (Access/Refresh Tokens) and Bcrypt (Hashing).
- **Storage**: Bi-provider support for **Cloudinary** (Images) and **DigitalOcean Spaces** (Large Files).
- **Payments**: [Stripe](https://stripe.com/) for secure subscription and coin purchases.

---

## 📂 Core Modules & Features

### 1. **User Identity & Security**
- **RBAC**: Multi-level roles (USER, ADMIN, SUPER_ADMIN).
- **Verification**: Support for ID verification and Biometric Face matching.
- **FCM**: Firebase Cloud Messaging integrated for cross-platform notifications.
- **Privacy**: Blocking and reporting mechanisms for user safety.

### 2. **Social Mechanics**
- **Memories & Events**: Full CRUD with geospatial location support (Lat/Lng).
- **Interactions**: Nested Comments and Like systems with self-referential relations.
- **Follow System**: Bi-directional friend/follow management with status tracking.

### 3. **Messaging Engine**
- **Room Management**: Dynamic creation of private chat rooms based on sender/receiver IDs.
- **Real-time History**: Immediate persistence of messages and image sharing in chats.

### 4. **Platform Monetization**
- **Virtual Economy**: Manage Coin amounts, Gift Cards (Essential, Exclusive, Majestic), and Gift purchases.
- **Subscription Engine**: Dynamic subscription plans with tier-based features (AI tokens, Boosts, Priority Likes).
- **Payment Processing**: Comprehensive tracking of transactions (Pending, Completed, Refunded).

---

## 📡 API Reference Overview

| Action | Route | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/login` | POST | Secure user authentication |
| **Profile** | `/api/v1/users/update-profile-image` | PUT | **Individual** Image update for efficient uploads |
| **Memory** | `/api/v1/memories` | GET/POST | Create or retrieve social posts |
| **Gift** | `/api/v1/gifts/send` | POST | Trigger virtual gift sending with real-time effects |
| **Coins** | `/api/v1/coins/purchase` | POST | Buy virtual currency via Stripe |

---

## 🚀 Getting Started

1. `bun install`
2. Configure `.env` with:
   - `DATABASE_URL`, `JWT_ACCESS_SECRET`, `STRIPE_SECRET_KEY`, `CLOUDINARY_*`, `DO_SPACE_*`.
3. `bun prisma generate`
4. `bun run dev`

---

## 🔗 Project Links
- [Frontend Documentation](../Friendzo/README.md)
- [Project Architecture Chart](../README.md)

---

## 📜 License
Private & Proprietary.
