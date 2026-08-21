# NexusChat - Project Plan

## 1. Goal
NexusChat is designed to be an enterprise-grade, real-time messaging platform built on the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO. The primary objective is to deliver a high-throughput, low-latency (<100ms message delivery), secure, and visually captivating chat experience supporting direct messaging, group communication, presence detection, live typing indicators, and media sharing.

## 2. Problem Statement
Modern communication apps often suffer from:
1. **State Desynchronization**: Messages shown out of order or failing to update across multiple open sessions.
2. **High Latency & Connection Failures**: Poor socket connection lifecycle management and improper reconnect strategies under erratic network conditions.
3. **Insecure Authentication & Storage**: Storing sensitive session tokens insecurely in `localStorage` or transferring unvalidated media blobs.
4. **Poor Scalability**: Tightly coupled backend architectures that crumble when scaling to handle thousands of concurrent WebSocket connections.
5. **Cluttered UI & UX Delays**: Blocking user interactions while waiting for backend HTTP responses instead of utilizing optimistic UI updates.

NexusChat solves these challenges through clean separation of concerns, stateless JWT authentication with secure HttpOnly refresh cookies, event-driven real-time socket architecture, indexed database queries, and optimistic React state management.

---

## 3. User Stories

### Epic 1: Authentication & Identity Management
- **US-1.1**: As a new user, I want to create an account with a unique username, email, and secure password so that I can access NexusChat.
- **US-1.2**: As a registered user, I want to log in using my credentials and remain securely authenticated without having to re-log on every page refresh.
- **US-1.3**: As an authenticated user, I want to upload a custom avatar and set a status message to express my profile identity.
- **US-1.4**: As an authenticated user, I want to log out safely, terminating my active session tokens and disconnecting my socket.

### Epic 2: Real-Time Messaging & Direct Conversations
- **US-2.1**: As a user, I want to search for other registered users by username/email and start a direct conversation.
- **US-2.2**: As a user, I want to send text messages to an active contact in real time with instant visual delivery feedback.
- **US-2.3**: As a user, I want to view historical message logs with smooth cursor-based infinite scrolling.
- **US-2.4**: As a message sender, I want to see visual indicators when my message is sent, delivered, and read (seen status).

### Epic 3: Presence & Typing Indicators
- **US-3.1**: As a user, I want to see live online/offline status indicators for my contacts.
- **US-3.2**: As a user, I want to see a live typing indicator when the contact in my active chat is composing a message.

### Epic 4: Media & Rich Content Sharing
- **US-4.1**: As a user, I want to send image attachments within a chat conversation and preview them inline before sending.
- **US-4.2**: As a user, I want to click on shared images to view them in full resolution.

---

## 4. Functional Requirements (FR)

| ID | Category | Requirement Description | Priority |
|---|---|---|---|
| **FR-01** | Auth | User registration with input validation (email format, password strength). | High |
| **FR-02** | Auth | Authentication using JWT (Access token in-memory, Refresh token in HttpOnly cookie). | High |
| **FR-03** | Auth | Session recovery via `/api/auth/refresh` on application initialization. | High |
| **FR-04** | User | User search with debounced text query matching `username` or `email`. | Medium |
| **FR-05** | User | Profile updates (avatar upload, display name, bio status). | Medium |
| **FR-06** | Messaging | Send/receive direct text messages in real time over Socket.IO. | High |
| **FR-07** | Messaging | Message persistence in MongoDB with timestamp and delivery state. | High |
| **FR-08** | Messaging | Cursor-based message history retrieval (`limit=30`, `before=<messageId>`). | High |
| **FR-09** | Receipts | Read receipts (`seen`) triggered when a chat window is active and visible. | High |
| **FR-10** | Presence | Real-time presence detection emitting `user:online` and `user:offline` events. | High |
| **FR-11** | Indicators | Debounced real-time typing indicators (`typing:start` & `typing:stop`). | Medium |
| **FR-12** | Media | Image upload via multipart/form-data to Cloudinary / storage backend returning URL. | High |
| **FR-13** | Media | Image message rendering with responsive loading skeletons. | Medium |
| **FR-14** | Unread | Unread message counter per conversation updated dynamically on incoming messages. | High |

---

## 5. Non-Functional Requirements (NFR)

### Performance & Latency
- **NFR-P1**: Socket event latency for message transmission must be <100ms under standard network conditions.
- **NFR-P2**: HTTP API response time for non-media requests must be <200ms for p95 requests.
- **NFR-P3**: Database queries must utilize compound indexes to prevent full collection scans.

### Security
- **NFR-S1**: Passwords must be hashed using `bcrypt` with a minimum salt factor of 10.
- **NFR-S2**: JWT Refresh tokens must be stored in `HttpOnly`, `SameSite=Strict`, `Secure` HTTP cookies.
- **NFR-S3**: All incoming WebSocket connections must authenticate via standard handshake JWT verification.
- **NFR-S4**: Input sanitization must be enforced on all API endpoints to prevent XSS and NoSQL Injection.

### Availability & Reliability
- **NFR-A1**: Reconnection logic must implement exponential backoff with jitter on socket dropouts.
- **NFR-A2**: System state must recover cleanly without duplicate message delivery upon socket reconnect.

### Scalability & Maintainability
- **NFR-M1**: Backend code structure must strictly adhere to the Controller-Service-Repository architecture.
- **NFR-M2**: Codebase must be organized modularly to enable future migration of Socket server to dedicated node clusters.

---

## 6. Development Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          NEXUSCHAT DEVELOPMENT PHASES                            │
└─────────────────────────────────────────────────────────────────────────────────┘
  Phase 1: Architecture & Design Documentation (CURRENT)
  ├── System specs, database schema, API contracts, ADRs, socket event definitions.
  
  Phase 2: Backend Core & Authentication Engine
  ├── Express server setup, MongoDB schemas, JWT auth engine, DTO validation middleware.
  
  Phase 3: Real-Time Socket.IO Server Setup
  ├── Socket handshake auth, connection manager, room join logic, event dispatchers.
  
  Phase 4: Frontend Base Setup & Design System
  ├── Vite React client, Zustand state stores, Tailwind/CSS variables, HTTP client interceptors.
  
  Phase 5: Messaging & Real-Time Sync Integration
  ├── Chat UI components, message history pagination, socket hooks, optimistic message updates.
  
  Phase 6: Presence, Typing Indicators & Media Storage
  ├── Online status pipeline, typing debounce engine, image upload service integration.
  
  Phase 7: Testing, Optimization & Deployment Readiness
  ├── Integration tests, index optimization, load test socket scaling, security audit.
```
