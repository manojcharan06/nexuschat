# NexusChat - Testing & Quality Assurance Manual

This document outlines the testing procedures, environment requirements, and test suites for **NexusChat**.

---

## 1. Prerequisites & Local Environment Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Tested on Node.js `v22.12.0`)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017/nexuschat` OR MongoDB Atlas URI.
- **Git**: Installed and configured.

### Environment Variable Setup

1. **Server Configuration**:
   Copy `server/.env.example` to `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/nexuschat
   JWT_ACCESS_SECRET=super_secret_jwt_access_key_nexuschat_2026
   JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_nexuschat_2026
   CLIENT_URL=http://localhost:3000
   ```

2. **Client Configuration**:
   Copy `client/.env.example` to `client/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

---

## 2. Starting Application Services Locally

### Step 1: Start MongoDB
Ensure MongoDB daemon is running locally:
```bash
mongod
```

### Step 2: Start Express Backend Server
Navigate to `server/` directory and launch the dev server:
```bash
cd server
npm run dev
```
*Expected Server Output*:
- `🔌 Socket.IO Server initialized cleanly`
- `MongoDB Connected: 127.0.0.1/nexuschat`
- `🚀 NexusChat Server listening on port 5000 in development mode`

### Step 3: Start Next.js Frontend Application
Navigate to `client/` directory and start Next.js Turbopack dev server:
```bash
cd client
npm run dev
```
*Expected Client Output*:
- `▲ Next.js 16 (Turbopack) Ready in 900ms`
- Available at `http://localhost:3000`

---

## 3. Comprehensive Manual Test Suites

### Suite A: Authentication & Identity Management

| Test ID | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| **AUTH-01** | User Registration | 1. Navigate to `/register`<br>2. Fill username, email, password<br>3. Click Register | Toast success notification shown, redirects to `/login` after 1.5s. Document stored in MongoDB. | ✅ PASS |
| **AUTH-02** | User Login | 1. Navigate to `/login`<br>2. Enter credentials<br>3. Click Sign In | Toast success shown, Access Token in memory, Refresh Token in HttpOnly cookie. Redirects to `/chat`. | ✅ PASS |
| **AUTH-03** | Auth Guard Protection | 1. Clear session<br>2. Access `/chat` directly in browser bar | AuthGuard catches unauthenticated state, redirects immediately to `/login`. | ✅ PASS |
| **AUTH-04** | Dual-Token Silent Refresh | 1. Wait for Access Token expiry (15m)<br>2. Trigger API request | Axios interceptor intercepts 401, calls `/api/v1/auth/refresh`, updates Access Token silently without log out. | ✅ PASS |
| **AUTH-05** | User Logout | 1. Click Logout in Sidebar | Access Token cleared, HttpOnly cookie cleared, Socket disconnected cleanly, redirects to `/login`. | ✅ PASS |

### Suite B: User Profile & Media Service

| Test ID | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| **PROF-01** | Status Bio Update | 1. Click Settings icon<br>2. Enter status message<br>3. Click Save Changes | `PATCH /api/v1/users/profile` succeeds. Toast success shown. UI updates bio instantly. | ✅ PASS |
| **PROF-02** | Avatar Upload | 1. Click avatar in Profile modal<br>2. Upload 2MB PNG image | `POST /api/v1/users/avatar` processes image. Returns CDN URL (or local base64 fallback). Avatar updates. | ✅ PASS |
| **PROF-03** | Avatar File Validation | 1. Attempt uploading 10MB file | Toast error shown ("Image file size must be less than 5MB"). Upload aborted. | ✅ PASS |

### Suite C: One-to-One Real-Time Messaging

| Test ID | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| **CHAT-01** | Contact Search | 1. Type username query in Sidebar search | `GET /api/v1/users/search?q={query}` returns matching user list excluding current user. | ✅ PASS |
| **CHAT-02** | Thread Creation | 1. Click searched user | `POST /api/v1/conversations/direct` returns thread. Duplicate thread is not created if already exists. | ✅ PASS |
| **CHAT-03** | Send Message (Optimistic) | 1. Type "Hello world"<br>2. Hit Enter | Instant optimistic bubble rendered with `tempId`. Message saved to MongoDB. Ack callback updates bubble to `_id`. | ✅ PASS |
| **CHAT-04** | Dual-Browser Real-Time Sync | 1. User A in Browser 1<br>2. User B in Browser 2 (Incognito)<br>3. User A sends message | User B receives `message:received` event via Socket.IO instantly without refreshing. | ✅ PASS |
| **CHAT-05** | History Persistence | 1. Refresh both browsers (F5) | `GET /api/v1/messages/:conversationId` reloads history logs from MongoDB in correct order. | ✅ PASS |
| **CHAT-06** | Duplicate Prevention | 1. Inspect sender & recipient DOM | Reducer matches `tempId` and `_id`. Zero duplicate message bubbles rendered. | ✅ PASS |

### Suite D: Socket.IO Engine & Presence

| Test ID | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| **SOCK-01** | Handshake Auth | 1. Socket attempts connection without token | `socketAuthMiddleware` rejects connection at handshake level. | ✅ PASS |
| **SOCK-02** | Online Broadcast | 1. User A logs in | Server broadcasts `user:presence_changed` (`isOnline: true`). User B sees green dot. | ✅ PASS |
| **SOCK-03** | Connection Status UX | 1. Toggle server or network off | Header health pill displays pulsing amber badge ("Reconnecting..."). Re-displays green upon reconnect. | ✅ PASS |

### Suite E: Security Audit

- [x] Passwords excluded from all API outputs (`select: '-password'`).
- [x] JWT secrets stored in environment variables, never sent to client bundle.
- [x] Database queries verify user membership before returning private conversation logs (`403 Forbidden`).
- [x] No infinite HTTP loops on 401 unauthenticated refresh responses.

---

## 4. Production Build Verification

To execute production build check:
```bash
cd client
npm run build
```
*Verification Result*:
- Compiled successfully in 13.4s. Static pages generated (7/7). Zero TypeScript/JSX errors.
