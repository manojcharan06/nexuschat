# NexusChat - System Architecture Specification

## 1. Overall System Architecture

NexusChat follows a modular MERN architecture designed around event-driven real-time socket communication and RESTful micro-services.

```
                               ┌────────────────────────────────────────┐
                               │           REACT SPA CLIENT             │
                               │  (Vite + Zustand + React Query + IO)   │
                               └──────────────────┬─────────────────────┘
                                                  │
                        ┌─────────────────────────┴────────────────────────┐
                        │                                                  │
            HTTPS REST Requests                                 WSS Socket.IO Events
          (Auth, Upload, Users)                               (Messages, Presence, Typing)
                        │                                                  │
                        ▼                                                  ▼
         ┌─────────────────────────────┐                    ┌─────────────────────────────┐
         │     EXPRESS REST SERVER     │                    │      SOCKET.IO SERVER       │
         │  (Auth, Controllers, DTOs)  │                    │   (Connection/Event Engine) │
         └──────────────┬──────────────┘                    └──────────────┬──────────────┘
                        │                                                  │
                        └─────────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                                ┌───────────────────────────────────┐
                                │        MONGODB DATABASE           │
                                │ (Users, Conversations, Messages)  │
                                └───────────────────────────────────┘
```

---

## 2. Layered Component Breakdown

### 2.1 Frontend Architecture (Client)
- **Framework**: React 18+ powered by Vite for instant HMR and optimized asset bundling.
- **State Management**:
  - **Zustand**: Client-side application state (Active user profile, current conversation selection, UI modal toggles, socket connection status).
  - **React Query (TanStack Query)**: Server state fetching, caching, and cache invalidation for user search and conversation list.
- **Real-Time Client Hook**: Custom React custom hook `useSocket` managing connection lifecycles, event registration, and state dispatching.
- **Styling**: Vanilla CSS Modules / TailwindCSS with modular design system tokens for typography, dark theme colors, and glassmorphism cards.

### 2.2 Backend Architecture (Server)
- **Runtime**: Node.js v18 LTS with Express.js framework using ES Modules (`import/export`).
- **Pattern**: Clean Architecture / Controller-Service-Repository Pattern:
  - **Routes Layer**: Endpoint mapping & middleware binding.
  - **Middleware Layer**: JWT authentication, rate limiting, DTO validation (`express-validator`), global error handler.
  - **Controllers Layer**: HTTP request/response orchestration, status codes.
  - **Services Layer**: Core business logic (password verification, token generation, message status calculation).
  - **Repositories / Models Layer**: Mongoose schemas interacting with MongoDB.

### 2.3 Database Architecture (MongoDB)
- **Database Engine**: MongoDB 6.0 document database.
- **Data Access**: Mongoose ORM enforcing field typing, schema hooks, and validation rules.
- **Indexing Strategy**: Single and compound index coverage for high-frequency queries (`conversationId + createdAt`, `email`, `username`).

---

## 3. Socket.IO Lifecycle & Topology

```
   CLIENT                                 SERVER                                DATABASE
     │                                      │                                      │
     │───── Socket Connection Handshake ───>│                                      │
     │      (with auth token in headers)    │                                      │
     │                                      │── Verify JWT & Auth Socket ─────────>│
     │                                      │<─ Return User Identity ──────────────│
     │<──── Emits 'connection:success' ─────│                                      │
     │                                      │── Set User.isOnline = true ─────────>│
     │                                      │── Broadcast 'user:presence_changed' ─>│
     │                                      │                                      │
     │───── Emits 'conversation:join' ─────>│                                      │
     │      ({ conversationId })            │── Join Socket Room (conversationId) ─│
     │                                      │                                      │
     │───── Emits 'message:send' ──────────>│                                      │
     │      ({ conversationId, text })      │── Save Message Document ────────────>│
     │                                      │<─ Return Saved Message Document ─────│
     │<──── Ack Callback ('message:sent') ──│                                      │
     │                                      │── Emit 'message:received' ──────────>│
     │                                      │   (to conversation socket room)      │
```

---

## 4. Authentication Architecture & Flow

NexusChat employs a **Dual-Token Stateless Authentication Strategy**:

1. **Access Token**:
   - Short lifespan: 15 Minutes.
   - Formatted as standard JWT signed with RSA-256 or HS256 secret.
   - Kept in-memory on client (React Zustand store) to shield against XSS attacks.
   - Transmitted in HTTP requests via `Authorization: Bearer <token>` header.

2. **Refresh Token**:
   - Long lifespan: 7 Days.
   - Stored in MongoDB `User` record / refresh token list.
   - Transmitted to client exclusively in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
   - Used only at endpoint `/api/auth/refresh` to issue a new Access Token.

---

## 5. Repository Directory Structure

```
nexuschat/
├── docs/                             # Architecture & Planning Documentation
│   ├── PROJECT_PLAN.md
│   ├── SRS.md
│   ├── ARCHITECTURE.md
│   ├── FLOW.md
│   ├── DECISIONS.md
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   ├── SOCKET_EVENTS.md
│   ├── UI_PLAN.md
│   └── ROADMAP.md
│
├── server/                           # Node.js + Express + Socket.IO Backend
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js                 # App Entry Point (HTTP + Socket Initialization)
│   │   ├── config/                   # Configs (DB, Environment variables, Cloudinary)
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/              # HTTP Request Controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── conversation.controller.js
│   │   │   └── message.controller.js
│   │   ├── services/                 # Business Logic Layer
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── message.service.js
│   │   │   └── socket.service.js
│   │   ├── models/                   # Mongoose Schemas
│   │   │   ├── User.model.js
│   │   │   ├── Conversation.model.js
│   │   │   └── Message.model.js
│   │   ├── middlewares/              # Express Middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── sockets/                  # Socket.IO Event Handlers & Handshake Auth
│   │   │   ├── socket.auth.js
│   │   │   ├── chat.handler.js
│   │   │   └── presence.handler.js
│   │   └── utils/                    # Helper Functions & Constants
│   │       ├── jwt.util.js
│   │       ├── logger.util.js
│   │       └── apiError.util.js
│   └── tests/                        # Server Unit & Integration Tests
│
└── client/                           # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx                  # React Entry Point
    │   ├── App.jsx                   # Router & Global Layout Provider
    │   ├── api/                      # Axios Instance & REST API Methods
    │   │   ├── axiosInstance.js
    │   │   ├── auth.api.js
    │   │   └── chat.api.js
    │   ├── components/               # UI Component Hierarchy
    │   │   ├── auth/                 # LoginForm, RegisterForm
    │   │   ├── chat/                 # ChatArea, MessageBubble, TypingIndicator
    │   │   ├── sidebar/              # Sidebar, ConversationItem, UserSearch
    │   │   └── common/               # Avatar, Modal, Loader, StatusBadge
    │   ├── context/ / store/         # Zustand State Stores
    │   │   ├── useAuthStore.js
    │   │   ├── useChatStore.js
    │   │   └── useSocketStore.js
    │   ├── hooks/                    # Custom React Hooks
    │   │   ├── useSocket.js
    │   │   └── useChatScroll.js
    │   ├── styles/                   # Modern Styling & CSS Variables
    │   │   └── index.css
    │   └── utils/                    # Date formatters, Validators
    │       └── date.util.js
```
