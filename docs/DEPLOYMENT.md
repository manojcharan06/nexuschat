# NexusChat - Production Deployment & Cloud Configuration Guide

This guide provides platform-independent architecture guidelines, environment configuration steps, cloud hosting recommendations, and post-deployment verification procedures for deploying **NexusChat** to production.

---

## 1. System Deployment Architecture

```
                               ┌────────────────────────────────┐
                               │  Frontend: Vercel / Netlify    │
                               │  https://nexuschat.vercel.app  │
                               └───────────────┬────────────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         │                                           │
                HTTPS / REST APIs                               WSS / Socket.IO
             (Auth, Profile, History)                        (Real-time Events)
                         │                                           │
                         ▼                                           ▼
         ┌──────────────────────────────┐            ┌──────────────────────────────┐
         │   Backend: Render / Railway  │            │ Socket.IO Connection Engine  │
         │ https://nexuschat.onrender.com│           │  (WSS Transports over HTTPS) │
         └───────────────┬──────────────┘            └───────────────┬──────────────┘
                         │                                           │
                         └─────────────────────┬─────────────────────┘
                                               │
                                     TLS Database Connection
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │   MongoDB Atlas Cluster   │
                                 │   (mongodb+srv://...)     │
                                 └───────────────────────────┘
```

---

## 2. Recommended Production Hosting Platforms

Based on the decoupled architecture of NexusChat (Next.js App Router frontend + stateful persistent WebSocket Node.js backend), the recommended cloud stack is:

| Layer | Recommended Host | Alternatives | Rationale |
|---|---|---|---|
| **Frontend** | **Vercel** | Netlify, Render Static | Built natively by the creators of Next.js; automatic global Edge CDN deployment, SSL, and instant Git deployments. |
| **Backend & Socket.IO** | **Render** | Railway, Fly.io, AWS EC2 | Supports persistent Node.js servers, long-lived WebSockets (`wss://`), automatic HTTPS termination, and process management. |
| **Database** | **MongoDB Atlas** | AWS DocumentDB | Managed cloud MongoDB cluster with automated backups, multi-region replication, and TLS encryption. |

---

## 3. Database Setup: MongoDB Atlas

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a shared/dedicated cluster.
2. Under **Database Access**, create a database user with `Read and Write to any database` permissions.
3. Under **Network Access**, add `0.0.0.0/0` to allow connection requests from cloud backend IP addresses.
4. Obtain the connection string in the format:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nexuschat?retryWrites=true&w=majority
   ```

---

## 4. Backend & Socket.IO Deployment (Render / Railway)

### Environment Variables
Configure the following environment variables in your backend service dashboard:

| Variable | Sample Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Server listening port (automatically set by PaaS like Render). |
| `NODE_ENV` | `production` | Enables production optimizations, `secure` cookies, and `SameSite=None`. |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/nexuschat` | MongoDB Atlas cluster connection string. |
| `JWT_ACCESS_SECRET` | `64_character_random_string` | Secret key for signing Access Tokens. |
| `JWT_REFRESH_SECRET` | `64_character_random_string` | Secret key for signing Refresh Tokens. |
| `CLIENT_URL` | `https://nexuschat.vercel.app` | Allowed CORS frontend origin(s). Supports comma-separated origins. |

### Build & Start Commands
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`

### Host Binding & Health Endpoint
The backend binds to `0.0.0.0:${PORT}` and provides a health check endpoint:
```http
GET https://nexuschat.onrender.com/health
```
Response:
```json
{
  "status": "ok",
  "service": "NexusChat API Server",
  "timestamp": "2026-08-22T01:33:00.000Z",
  "environment": "production"
}
```

---

## 5. Frontend Deployment (Vercel)

### Environment Variables
Configure the following environment variables in Vercel project settings:

| Variable | Sample Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://nexuschat.onrender.com/api/v1` | Public REST API base URL. |
| `NEXT_PUBLIC_SOCKET_URL` | `https://nexuschat.onrender.com` | Public Socket.IO backend URL. |

### Build & Root Settings
- **Root Directory**: `client`
- **Framework Preset**: `Next.js`
- **Build Command**: `next build`
- **Output Directory**: `.next`

---

## 6. CORS, WSS & Cookie Security Configuration

### Cross-Origin Resource Sharing (CORS)
- Backend `app.js` parses `CLIENT_URL` into an array of allowed origins.
- Credentials (`credentials: true`) are permitted only for specified origins (never `*`).

### HTTPS & WebSockets (`wss://`)
- Modern cloud hosts terminate SSL at the load balancer level.
- Client Socket.IO automatically upgrades HTTP requests to secure WebSockets (`wss://nexuschat.onrender.com/socket.io/...`).

### Cross-Site HttpOnly Cookie Policy
- In `production` (`env.NODE_ENV === 'production'`), the refresh token cookie is configured with:
  - `httpOnly: true` (prevents XSS token theft).
  - `secure: true` (transmitted strictly over HTTPS).
  - `sameSite: 'none'` (enables cross-site cookie transmission between `vercel.app` frontend and `onrender.com` backend).

---

## 7. Post-Deployment Verification Checklist

1. [ ] **Health Endpoint**: Verify `https://<backend-url>/health` returns status `200 OK`.
2. [ ] **User Auth**: Test signup, login, and silent refresh cookie issuance across origins.
3. [ ] **Profile Update**: Test status bio update and Cloudinary avatar upload.
4. [ ] **Socket Connection**: Confirm green "Connected" status pill renders in header.
5. [ ] **Real-Time Chat**: Test dual-device messaging and message history reload from MongoDB Atlas.
