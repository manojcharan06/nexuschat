# NexusChat - Architectural Decision Records (ADR)

This document records key technical architectural decisions made for NexusChat, documenting rationale, trade-offs, pros, and cons.

---

### Decision 1: Use JWT (Access Token + Refresh Token) instead of Stateful Express Sessions
- **Reason**: Stateless authentication allows independent scaling of HTTP and Socket servers without requiring centralized session store lookups on every single request.
- **Trade-offs**:
  - **Pros**: Horizontal scalability, zero database lookups for valid access tokens, clean decoupling of server nodes.
  - **Cons**: Cannot immediately revoke access tokens before their 15-minute expiration unless a token blacklist is added to Redis.

### Decision 2: Store Refresh Tokens in HttpOnly SameSite Cookies instead of LocalStorage
- **Reason**: Protects long-lived session keys from Cross-Site Scripting (XSS) attacks by preventing client-side JavaScript access.
- **Trade-offs**:
  - **Pros**: High immunity against token theft via XSS vulnerabilities.
  - **Cons**: Requires strict CORS origin and credential settings (`credentials: true`) between client and server domains.

### Decision 3: Use MongoDB (Document Store) instead of PostgreSQL (Relational DB) for Chat Storage
- **Reason**: Chat messages are semi-structured JSON objects that benefit from document embedding (read receipts, attachments) and flexible schema evolution.
- **Trade-offs**:
  - **Pros**: High write throughput, native JSON mapping in JavaScript, simple document nesting for attachments and read status arrays.
  - **Cons**: Lacks relational ACID transactional multi-table joins (requires careful index optimization).

### Decision 4: Use Socket.IO instead of Native WebSockets
- **Reason**: Socket.IO provides built-in fallback mechanisms (HTTP long polling), auto-reconnection with backoff, room abstractions, and client-server acknowledgements out of the box.
- **Trade-offs**:
  - **Pros**: Saves hundreds of hours of custom protocol management; built-in heartbeats, reconnection, and room support.
  - **Cons**: Slight protocol overhead compared to bare-bones WebSocket frames.

### Decision 5: Client-Generated Temporary IDs (`tempId`) for Optimistic UI Updates
- **Reason**: Enables instant UI feedback when sending messages without waiting for backend database insertion and round-trip network response.
- **Trade-offs**:
  - **Pros**: Instant UI reaction, zero-perceived latency for message rendering.
  - **Cons**: Requires complex client-side mapping to swap `tempId` with real database `_id` upon server acknowledgement.

### Decision 6: Debounced Typing Indicators (300ms window / 3000ms timeout)
- **Reason**: Emitting socket events on every single keypress floods network bandwidth and degrades server performance under heavy typing.
- **Trade-offs**:
  - **Pros**: Reduces typing socket event traffic by up to 90%.
  - **Cons**: Microscopic delay (~300ms) before typing state changes are emitted to peers.

### Decision 7: Cursor-Based Pagination (`before=<messageId>`) over Offset-Based Pagination (`skip=30`)
- **Reason**: Offset pagination (`SKIP N LIMIT M`) degrades performance in large message collections and causes duplicate/missing items when new messages arrive while scrolling history.
- **Trade-offs**:
  - **Pros**: Constant-time query performance ($O(1)$ index scan), robust against dynamic data insertions.
  - **Cons**: Cannot jump directly to arbitrary page numbers (e.g., "Page 4"), only sequential scroll navigation.

### Decision 8: Controller-Service-Repository Backend Code Pattern
- **Reason**: Strict separation of concerns keeps route controllers thin, isolates business logic inside services, and encapsulates database access within Mongoose model repositories.
- **Trade-offs**:
  - **Pros**: High testability, clean code organization, seamless refactoring path.
  - **Cons**: Requires boilerplate file structures for smaller helper functions.

### Decision 9: Zustand for Client React State Management over Redux Toolkit
- **Reason**: Zustand has a tiny bundle footprint (~1.1kB), minimal boilerplate, supports un-opinionated store slices, and eliminates unnecessary re-renders.
- **Trade-offs**:
  - **Pros**: Ultra-fast developer setup, lightweight bundle size, easy store subscription outside React components.
  - **Cons**: Less formal middleware ecosystem compared to Redux DevTools suite.

### Decision 10: Cloudinary CDN for Image & Media Storage instead of Local Disk Storage
- **Reason**: Storing media files on server disk breaks stateless server principles and fails when scaling to multiple instances or serverless deployments.
- **Trade-offs**:
  - **Pros**: Offloads bandwidth, automatic image optimization/compression, global CDN distribution.
  - **Cons**: Reliance on third-party SaaS API limits and API key configuration.

### Decision 11: Soft Deletion (`isDeleted: true`) for Chat Messages
- **Reason**: Preserves message thread integrity, audit history, and sequence continuity without breaking references in conversation metadata.
- **Trade-offs**:
  - **Pros**: Easy message recovery if needed, maintains thread continuity ("This message was deleted").
  - **Cons**: Database disk storage is retained for deleted items until a hard purge task runs.

### Decision 12: Socket Authentication at Connection Handshake Level
- **Reason**: Rejecting unauthenticated socket connections during the handshake phase prevents unauthorized users from occupying server socket connections.
- **Trade-offs**:
  - **Pros**: High security, prevents unauthorized socket connection spamming.
  - **Cons**: Requires re-authenticating the socket if the Access JWT expires during long idle sessions.

### Decision 13: Dedicated `conversations` Collection separate from `messages` Collection
- **Reason**: Querying conversations requires summary metadata (last message, participant list, unread count) without fetching thousands of message rows.
- **Trade-offs**:
  - **Pros**: Fast conversation sidebar list rendering ($O(1)$ scan per conversation).
  - **Cons**: Requires dual-writes (updating `Message` collection and updating `Conversation.lastMessage` reference).

### Decision 14: Use `bcrypt` with Salt Factor 10 for Password Hashing
- **Reason**: Industry standard adaptive cryptographic hashing algorithm that balances computation cost with brute-force protection.
- **Trade-offs**:
  - **Pros**: Proven resistance against rainbow table and ASIC hardware attacks.
  - **Cons**: Password verification takes ~60-100ms of CPU time per login request.

### Decision 15: Standardized API Error Response Payload Structure
- **Reason**: Uniform error format (`{ success: false, error: { code, message, details } }`) simplifies client-side HTTP error handling across all views.
- **Trade-offs**:
  - **Pros**: Consistent error parsing in Axios interceptors and global UI toasts.
  - **Cons**: Requires custom `ApiError` class wrapper around standard Express error handlers.

### Decision 16: Express-Validator for DTO Payload Validation Middleware
- **Reason**: Decouples input validation logic from controller handlers, ensuring sanitized data hits business services.
- **Trade-offs**:
  - **Pros**: Prevents invalid data types, XSS strings, or missing required fields from reaching database logic.
  - **Cons**: Requires writing explicit validation chains for every HTTP route.

### Decision 17: Vite for Frontend React Tooling over Create React App (CRA)
- **Reason**: Vite utilizes native ES modules during development for instant server boot times and extremely fast HMR (Hot Module Replacement).
- **Trade-offs**:
  - **Pros**: Rapid dev build speed, optimized Rollup production output.
  - **Cons**: Standard environment variables require `VITE_` prefix instead of `REACT_APP_`.

### Decision 18: Unread Message Tracking using Per-User Read Status Arrays
- **Reason**: Direct arrays (`readBy: [userId]`) inside message documents allow straightforward atomic queries for unread calculations.
- **Trade-offs**:
  - **Pros**: Accurate real-time status updates per message bubble.
  - **Cons**: Document size grows slightly with high participant counts in group chats.

### Decision 19: Winston & Morgan for Structured JSON Server Logging
- **Reason**: Plain `console.log` statements are non-standard, lack severity timestamps, and cannot be parsed by log aggregator tools.
- **Trade-offs**:
  - **Pros**: Structured JSON log outputs with error stack traces, log levels (info, warn, error), and file rotation.
  - **Cons**: Requires initial log configuration setup.

### Decision 20: React Query (TanStack Query) for Async REST State Management
- **Reason**: Eliminates repetitive `useEffect` data fetching code, provides automatic background revalidation, response caching, and query deduplication.
- **Trade-offs**:
  - **Pros**: Clean code abstractions, built-in caching, pagination support.
  - **Cons**: Learning curve around query key management and cache invalidation invalidations.

### Decision 21: Compound Indexing (`{ conversationId: 1, createdAt: -1 }`) on Messages
- **Reason**: Most database queries request the most recent messages belonging to a single conversation. A compound index serves this directly.
- **Trade-offs**:
  - **Pros**: Dramatically faster query execution times (<5ms scan).
  - **Cons**: Slight index memory footprint on disk and write overhead on message insertion.

### Decision 22: Custom Socket Room Architecture (`user_<userId>` and `conv_<conversationId>`)
- **Reason**: Organizes socket broadcast channels into logical user rooms and conversation rooms to target event emissions efficiently.
- **Trade-offs**:
  - **Pros**: Precise event targeting without broadcasting to all connected sockets.
  - **Cons**: Requires strict room join/leave lifecycle management on client navigation.

### Decision 23: Next.js 15 App Router & Express.js Hybrid Separation
- **Reason**: Keeping the Next.js 15 frontend in `client/` and the Express + Socket.IO server in `server/` guarantees complete decoupled client-server scalability, allowing independent server deployment to WebSocket-tuned infrastructure.
- **Trade-offs**:
  - **Pros**: Independent scaling, clean separation of concern, no Node serverless socket connection timeouts.
  - **Cons**: Requires handling cross-origin HTTP credentials (CORS with credentials).

### Decision 24: Express-Validator DTO Middleware for Input Sanitization
- **Reason**: Validates input structure (email pattern, password strength, username alphanumeric checks) before requests reach controller business logic.
- **Trade-offs**:
  - **Pros**: Prevents invalid data types or malformed payloads from touching the database layer.
  - **Cons**: Adds small validation execution overhead per request.

### Decision 25: Client Axios 401 Refresh Interceptor with Queueing
- **Reason**: When an Access Token expires, Axios intercepts the 401 error, transparently calls `/api/v1/auth/refresh`, updates the Zustand auth state, and retries the original request without disrupting the user.
- **Trade-offs**:
  - **Pros**: Seamless user experience without forcing user re-logins every 15 minutes.
  - **Cons**: Requires retry guard logic (`originalRequest._retry`) to prevent infinite loop loops if the refresh cookie is invalid.

### Decision 26: Multer MemoryStorage & Hybrid Cloudinary CDN Fallback
- **Reason**: Processing image buffers in-memory using Multer `memoryStorage()` allows streaming image streams to Cloudinary CDN without relying on persistent local disk storage. If Cloudinary API keys are omitted during development, a base64 Data URI fallback ensures image previews function out-of-the-box locally.
- **Trade-offs**:
  - **Pros**: Stateless server design, compatible with production CDN deployments and local dev environments.
  - **Cons**: Memory usage scales with concurrent file uploads (mitigated by strict 5MB file size caps).

### Decision 27: Socket.IO Handshake Authentication & User Room Mapping
- **Reason**: Authenticating WebSocket connections during the handshake phase via `socket.handshake.auth.token` prevents unauthorized users from opening socket connections. Auto-joining each authenticated socket to `user_<userId>` allows targeting individual user instances for real-time presence and message broadcasts.
- **Trade-offs**:
  - **Pros**: Strong security boundary, eliminates unauthenticated socket connections, enables targeted room event emission.
  - **Cons**: Requires active client token refresh if access tokens expire during long idle socket connections.

### Decision 28: React 18 / Next.js Strict Mode Singleton Socket Lifecycle Management
- **Reason**: In React 18 / Next.js Strict Mode, components mount, unmount, and re-mount during initial rendering. If an effect cleanup function executes `socket.disconnect()` while a WebSocket is in `CONNECTING` state, the browser engine throws `WebSocket is closed before the connection is established.` Atomic Zustand state access (`useSocketStore.getState()`) and conditional unmount cleanup (`if (!isAuthenticated)`) prevent in-flight connection aborts while maintaining strict socket cleanup on user logout.
- **Trade-offs**:
  - **Pros**: Eliminates browser WebSocket connection abort warnings, prevents duplicate socket connections, maintains clean disconnection on logout.
  - **Cons**: Requires careful Zustand store selector usage to prevent effect re-triggering.

### Decision 29: MongoDB Database Persistence Prior to Socket Event Emission
- **Reason**: Persisting messages to MongoDB first guarantees durability, auditability, and consistent state recovery upon page refresh. Emitting socket events only after a successful database write ensures that recipients never receive ephemeral socket messages that fail to store in persistent storage.
- **Trade-offs**:
  - **Pros**: High data integrity, guaranteed persistence, absolute single source of truth.
  - **Cons**: Minor database IO latency (~5-15ms) prior to real-time socket emission (mitigated by MongoDB compound indexing).

### Decision 30: Client TempId Matching & Dual-Layer Duplicate Prevention
- **Reason**: To deliver zero-perceived latency, the client generates a temporary message (`tempId`) and renders it immediately in the UI. When the server acknowledges the write via socket callback, the client swaps `tempId` with the confirmed MongoDB `_id`. Incoming socket broadcasts check both `tempId` and `_id` against the Zustand store log, ensuring senders and recipients never render duplicate bubbles.
- **Trade-offs**:
  - **Pros**: Instant UI feedback, 100% immunity against duplicate message rendering during network retries or room broadcasts.
  - **Cons**: Requires state store replace-matching logic (`confirmOptimisticMessage`).

### Decision 31: Lightweight Toast Context & Mobile Viewport Navigation Architecture
- **Reason**: Heavy external toast libraries introduce unnecessary bundle overhead. A native React `ToastContext` provider provides accessible, auto-dismissing toast notifications (`role="alert"`) across login, register, profile, and socket events. For mobile UX (`< 768px`), view state toggles between Sidebar (100% width) and Chat View (100% width) with a dedicated header Back button, preventing horizontal layout overflow on small viewports.
- **Trade-offs**:
  - **Pros**: Zero third-party bundle bloat, 100% mobile-friendly UX, accessible keyboard focus rings (`focus-visible:ring-indigo-500`).
  - **Cons**: Requires state-driven view toggles on mobile screens.

### Decision 32: Production Build Optimization & Security Audit Hardening
- **Reason**: Preparing NexusChat for production deployment requires strict environment isolation (`.env.example` templates omitting secrets), static page pre-rendering via Next.js 15 Turbopack compilation (`npm run build`), password exclusion in all Mongoose User queries (`select: '-password'`), and Axios 401 interceptor loop guards on silent token refresh.
- **Trade-offs**:
  - **Pros**: Zero committed secrets, 100% clean production bundle build, hardened API endpoints, complete QA documentation (`docs/TESTING.md` & `README.md`).
  - **Cons**: Requires manual environment variable setup per target host.

### Decision 33: Production Cookie, Host Binding & Multi-Cloud Deployment Architecture
- **Reason**: For decoupled multi-cloud deployments (Vercel frontend + Render/Railway backend over HTTPS), cross-site HttpOnly cookies require `sameSite: 'none'` and `secure: true` in production while defaulting to `lax` and `secure: false` in local development. Binding Express to `0.0.0.0:${PORT}` guarantees compatibility with container PaaS hosts, and root `/health` endpoints allow PaaS load balancers to perform automated liveness checks.
- **Trade-offs**:
  - **Pros**: Zero cross-origin authentication failures over HTTPS, native cloud container compatibility, automated PaaS liveness checks.
  - **Cons**: Requires SSL/TLS certificates on production domains for `SameSite=None` cookies.









---

## Phase Implementation & Architectural Interview Notes

### Phase 1 Interview Notes: Core Infrastructure Setup

- **Question**: Why separate `client/` and `server/` into two distinct Node applications instead of using Next.js API Routes?
  - **Architect Rationale**: Next.js API routes run on serverless/edge environments where persistent WebSocket (Socket.IO) stateful connections are unreliable or expensive to maintain. A standalone Express.js server provides long-lived HTTP and WebSocket connections with total control over Mongoose connection pools and event handling.
- **Question**: How does the Express backend handle configuration parsing across environments?
  - **Architect Rationale**: `server/src/config/env.js` centralizes environment variable loading via `dotenv`, providing fallback defaults for local development (`PORT=5000`, `MONGODB_URI=mongodb://127.0.0.1:27017/nexuschat`) while guaranteeing type safety across services.
- **Question**: What error handling strategy is enforced across backend routes?
  - **Architect Rationale**: Operational errors inherit from a custom `ApiError` class with predefined status codes and error codes (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`). Unhandled runtime exceptions are safely caught by `error.middleware.js` and logged as structured JSON via Winston without exposing sensitive internal stack traces to the client.

