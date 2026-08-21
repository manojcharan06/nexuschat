# NexusChat - Senior Architect Interview Notes

This document collects architectural rationale, technical trade-off analyses, and interview questions/answers documented after each phase of development.

---

## Phase 1: Core Infrastructure & Repository Setup

### Q1: Why separate `client/` and `server/` into two distinct Node applications instead of using Next.js API Routes?
- **Architect Answer**: Next.js API routes run on serverless/edge environments where persistent WebSocket (Socket.IO) stateful connections are unreliable or expensive to maintain. A standalone Express.js server provides long-lived HTTP and WebSocket connections with total control over Mongoose connection pools and event handling.

### Q2: How does the Express backend handle configuration parsing across environments?
- **Architect Answer**: `server/src/config/env.js` centralizes environment variable loading via `dotenv`, providing fallback defaults for local development (`PORT=5000`, `MONGODB_URI=mongodb://127.0.0.1:27017/nexuschat`) while guaranteeing type safety across services.

### Q3: What error handling strategy is enforced across backend routes?
- **Architect Answer**: Operational errors inherit from a custom `ApiError` class with predefined status codes and error codes (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`). Unhandled runtime exceptions are safely caught by `error.middleware.js` and logged as structured JSON via Winston without exposing sensitive internal stack traces to the client.

---

## Phase 2: Authentication Engine & Identity Management

### Q1: Why store the Refresh Token in an HttpOnly SameSite cookie instead of LocalStorage?
- **Architect Answer**: LocalStorage is accessible to any client-side JavaScript script executing on the origin. If an XSS vulnerability exists, malicious scripts can read the token and steal the session. `HttpOnly` cookies are unreadable by JavaScript (`document.cookie` cannot access them), providing strong protection against XSS-based token theft. Setting `SameSite=Strict` (or `Lax`) also protects against Cross-Site Request Forgery (CSRF).

### Q2: Why use a short-lived Access Token (15m) alongside a long-lived Refresh Token (7d)?
- **Architect Answer**: Short-lived Access Tokens minimize the impact of token exposure; if intercepted, an Access Token becomes invalid within 15 minutes. The Refresh Token allows the user to stay logged in seamlessly by requesting new Access Tokens in the background without needing to prompt the user for password credentials repeatedly.

### Q3: How does client session recovery (hydration) work when a user reloads the application?
- **Architect Answer**: When the Next.js application mounts, the client `AuthGuard` component invokes `checkAuth()`. This calls `POST /api/v1/auth/refresh`. Because cookies are automatically sent with `withCredentials: true`, the server validates the refresh cookie, returns a new Access Token and user profile object, and hydrates the Zustand `useAuthStore` state without forcing a manual login.

### Q4: How does password security work in the User model?
- **Architect Answer**: Passwords are hashed using `bcryptjs` with a salt factor of 10 (`saltRounds = 10`). The `passwordHash` field is marked with `select: false` in Mongoose, ensuring it is never returned in standard database queries or leaked in API responses unless explicitly requested for verification inside `loginUser`.

---

## Phase 3: User Profile & Avatar Upload System

### Q1: How does Multer handle image file buffer validation without saving files to server disk?
- **Architect Answer**: Multer is configured with `multer.memoryStorage()`, which buffers incoming multipart file streams directly into Node.js `Buffer` objects in memory (`file.buffer`). A custom `fileFilter` validates file MIME types (`image/jpeg`, `image/png`, `image/webp`) and enforces a 5MB limit (`limits: { fileSize: 5 * 1024 * 1024 }`), returning an operational `INVALID_FILE_TYPE` or `FILE_TOO_LARGE` `ApiError` before any buffer reaches storage handlers.

### Q2: How does the media service handle Cloudinary CDN integration with zero dev setup friction?
- **Architect Answer**: `server/src/services/upload.service.js` checks for `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_KEY` environment variables. If present, it streams the in-memory buffer via `cloudinary.uploader.upload_stream`. If credentials are not set during local offline development, it generates a Base64 Data URI (`data:image/png;base64,...`), allowing instant avatar previews and UI profile updates without breaking local dev setups.

### Q3: How are profile updates synchronized across React UI components?
- **Architect Answer**: When `PATCH /api/v1/users/profile` or `POST /api/v1/users/avatar` completes, the server returns the updated `User` document. The client `UserProfileModal` calls `setAuth(updatedUser, accessToken)` on the Zustand `useAuthStore`, triggering instant reactive re-renders across header avatars, user cards, and modal previews without requiring full page reloads.

---

## Phase 4: Socket.IO Real-Time Engine & Presence System

### Q1: How does WebSocket handshake authentication work in Socket.IO?
- **Architect Answer**: Socket.IO connections pass an `auth` object during the initial WebSocket handshake (`io(URL, { auth: { token } })`). A backend socket middleware interceptor (`socketAuthMiddleware`) extracts the JWT Bearer token, verifies signature and expiration via `jsonwebtoken`, and extracts the `userId`. If valid, `socket.userId` is attached to the connection; if invalid, the connection is rejected at handshake level before any events fire.

### Q2: How does real-time presence detection handle sudden socket disconnections (e.g. browser crash / network drop)?
- **Architect Answer**: Socket.IO automatically detects socket disconnects via periodic ping/pong heartbeats (`pingTimeout: 60000`, `pingInterval: 25000`). When a socket disconnects, the server `disconnect` event handler updates `User.isOnline = false` and sets `User.lastSeen = new Date()` in MongoDB, then broadcasts `user:presence_changed` to all connected clients.

### Q3: How does room isolation prevent un-targeted event broadcasting?
- **Architect Answer**: Upon connection, every socket automatically joins a private user room named `user_<userId>`. This allows the server to direct targeted events (such as direct messages or private notifications) to specific users without broadcasting to all sockets in the system.

### Q4: What caused the browser error `WebSocket is closed before the connection is established` during Socket.IO connection initialization, and how was it fixed?
- **Root Cause & Mechanism**: When `io(SOCKET_URL, ...)` is called, Socket.IO immediately creates a WebSocket object in `CONNECTING` state (`readyState === 0`). In React 18 / Next.js Strict Mode, initial component mounting triggers an immediate effect cleanup cycle. Additionally, calling `useSocketStore()` without selectors subscribed `useSocket` to all store changes (including `setSocket`), causing immediate component re-renders that re-executed the `useEffect` cleanup. The cleanup function executed `socketInstance.disconnect()` while the WebSocket was still in `CONNECTING` state. Calling `.close()` on a connecting WebSocket causes the browser engine to abort the handshake and log `WebSocket connection to ws://... failed: WebSocket is closed before the connection is established.`.
- **Exact Fix**:
  1. Updated `useSocket.js` to extract state using atomic selectors (`useAuthStore(state => state.accessToken)`), preventing unnecessary effect re-renders when store state updates.
  2. Implemented singleton socket checking via `useSocketStore.getState()`. Before instantiating `io()`, the hook checks `if (!socketInstance || (!socketInstance.connected && !socketInstance.connecting))`, preventing duplicate socket instantiations.
  3. Modified the `useEffect` cleanup function to check `if (!useAuthStore.getState().isAuthenticated)`. During React 18 double-mounts, the cleanup function no longer closes in-flight connecting WebSockets if the user remains authenticated.
- **Socket Lifecycle & Safety**: When a user logs out (`isAuthenticated == false`), the effect detects session termination and executes `clearSocket()`, closing the socket cleanly. During navigation or component re-renders, the single active socket remains connected safely without duplicate connections or aborted handshakes.



