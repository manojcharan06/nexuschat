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
