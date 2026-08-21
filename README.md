# NexusChat — Real-Time Messaging Platform

NexusChat is an enterprise-grade, production-quality real-time messaging platform built using the **MERN** stack (**MongoDB, Express.js, React/Next.js 15, Node.js**) and **Socket.IO**. Designed with modern software architecture patterns, NexusChat delivers zero-latency 1-on-1 messaging, persistent history storage, online presence tracking, dual-token JWT security, and responsive UI/UX.

---

## 🚀 Key Features

- 🔐 **Enterprise Authentication**: Dual-token JWT architecture (Short-lived Access Token in memory + 7-day HttpOnly Refresh Cookie) with automatic silent refresh.
- 👤 **User Profiles & CDN Avatars**: Profile status bio updates and hybrid Cloudinary CDN avatar uploads with Base64 fallback.
- 💬 **One-to-One Real-Time Chat**: Bidirectional instant messaging over Socket.IO with optimistic client rendering (`tempId`) and server acknowledgements.
- ⚡ **Real-Time Presence Engine**: Live online/offline status detection, `lastSeen` timestamps, and dynamic connection health status indicators.
- 📦 **MongoDB Persistence**: Messages and conversation metadata are persisted in MongoDB before Socket event emission, ensuring high data durability.
- 🛡️ **Dual-Layer Duplicate Prevention**: Client `tempId` matching and server ObjectId deduplication prevent duplicate rendering across network retries.
- 📱 **Responsive Mobile UX**: 100% responsive 2-column workspace for desktop/tablet and view-slider navigation with back button support for mobile viewports.
- 🔔 **Accessible Toast System**: Lightweight native toast provider for non-intrusive error, success, and socket status notifications.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router with Turbopack)
- **Language**: JavaScript (ES6+ Modules)
- **Styling**: Vanilla Tailwind CSS v3
- **State Management**: Zustand v4
- **Icons**: Lucide React
- **Real-Time Client**: Socket.IO Client v4

### Backend
- **Runtime**: Node.js v22
- **Framework**: Express.js v4
- **Database**: MongoDB v6 + Mongoose ORM v8
- **Real-Time Engine**: Socket.IO Server v4
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) + Bcrypt.js
- **Logging**: Winston Logger

---

## 🏛️ System Architecture

```
                               ┌───────────────────────────┐
                               │     Next.js 15 Client     │
                               │  (Zustand + Socket.IO)    │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
             HTTP / REST APIs                               Socket.IO WSS
         (Auth, Profile, History)                        (Real-time Messaging)
                       │                                           │
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │     Express API Routes    │               │  Socket.IO Event Engine   │
         │ (JWT & Validation Guards) │               │ (presence.js, chat.js)    │
         └─────────────┬─────────────┘               └─────────────┬─────────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                   Mongoose ORM Queries
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │      MongoDB Database     │
                               │  (users, conversations,   │
                               │        messages)          │
                               └───────────────────────────┘
```

---

## 📋 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nexuschat
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Client (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 💻 Quick Start & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/manojcharan06/nexuschat.git
cd nexuschat
```

### 2. Configure Backend Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
*Backend will start listening at `http://localhost:5000`.*

### 3. Configure Frontend Client
```bash
cd ../client
cp .env.example .env.local
npm install
npm run dev
```
*Frontend application will start at `http://localhost:3000`.*

---

## 🧪 Testing

Comprehensive test cases, manual QA steps, and production build instructions are documented in [`docs/TESTING.md`](docs/TESTING.md).

To run the Next.js production build check:
```bash
cd client
npm run build
```

---

## 📸 Screenshots

*(UI Mockups & Screenshots available in `docs/UI_PLAN.md`)*

---

## 🗺️ Future Roadmap

- 📷 **Phase 7+ Media Pipeline**: Image attachment uploads with inline thumbnail previews.
- 👥 **Group Conversations**: Multi-user group chats, group admin controls, and member management.
- ✔️✔️ **Read Receipts**: Typing indicators and message delivery/read status checkmarks.
