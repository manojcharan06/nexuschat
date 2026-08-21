# NexusChat - Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **NexusChat**, a production-quality, real-time messaging application. It outlines functional, non-functional, external interface, and database requirements to guide the engineering team during implementation.

### 1.2 Scope
NexusChat provides high-performance real-time messaging, user presence tracking, delivery/read receipts, media sharing, and profile management. The target platform is modern web browsers desktop and mobile.

### 1.3 Definitions, Acronyms, and Abbreviations
- **JWT**: JSON Web Token
- **HttpOnly**: Cookie flag preventing client-side JavaScript access to safeguard tokens against XSS.
- **CSR Pattern**: Controller-Service-Repository architectural pattern.
- **Optimistic UI**: Interface update pattern where UI renders changes immediately before receiving backend server acknowledgement.
- **Presence**: Real-time indication of user connectivity (Online, Offline, Away).

---

## 2. Overall Description

### 2.1 Product Perspective
NexusChat is a full-stack MERN application operating in a client-server and real-time event model:
- **Frontend**: React single-page application built with Vite and rendered on modern browsers.
- **Backend**: Node.js and Express.js REST API providing auth, conversation management, user queries, and media routing.
- **Real-Time Engine**: Socket.IO server running alongside Express to manage WebSocket persistent connections.
- **Persistence Layer**: MongoDB database storing user profiles, conversation metadata, messages, and read states.

### 2.2 User Classes and Characteristics
- **Standard User**: Authenticated individual capable of searching users, creating direct conversations, sending text/media messages, viewing presence, and updating profile settings.
- **System Administrator**: Operates at database/infrastructure level to maintain system integrity and manage resource quotas.

### 2.3 Operating Environment
- **Server**: Node.js v18 LTS+, Express 4.x, Socket.io 4.x, MongoDB 6.0+.
- **Client**: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+ running ES6 JavaScript.

### 2.4 Design and Implementation Constraints
- Must enforce stateless HTTP authentication using short-lived access tokens (15 mins) and long-lived refresh cookies (7 days).
- Must restrict image file uploads to standard formats (PNG, JPEG, WEBP) with a maximum size limit of 5MB per upload.
- Must prevent memory leaks by managing socket event listeners inside React component lifecycles (`useEffect` cleanup).

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- **Authentication View**: Login and Register cards with client-side form validation and error handling.
- **Main Chat Workspace**:
  - **Left Sidebar**: User header with avatar and profile modal trigger, contact search bar, conversation list with active indicators and unread counts.
  - **Central Chat View**: Chat header displaying current conversation partner's status, scrollable message container with auto-scroll logic, message input box with emoji selector and image attach button.
  - **Right Details Drawer**: User details, shared media gallery, and conversation metadata.

#### 3.1.2 Hardware & Software Interfaces
- **REST Protocol**: Standard JSON over HTTPS for auth, profile, and upload operations.
- **WebSocket Protocol**: WS/WSS protocol over Socket.IO for real-time bidirection message frames.

---

### 3.2 System Features

#### 3.2.1 Real-Time Direct Messaging
- **Description**: Users can exchange messages instantly in direct 1-on-1 conversations.
- **Inputs**: User message string or media URL payload sent via `message:send` socket event.
- **Processing**: Server verifies token, extracts user ID, validates content, persists message to MongoDB, resolves target user socket room, and emits `message:received`.
- **Outputs**: Target client receives message and renders bubble; sender receives `message:sent` confirmation to update temporary optimistic client ID.

#### 3.2.2 Live Presence Detection
- **Description**: System automatically broadcasts user online/offline status changes.
- **Inputs**: Socket `connection` and `disconnect` handshake triggers.
- **Processing**: Socket server updates `User.isOnline` and `User.lastSeen` fields in database, then broadcasts `user:presence_changed` to connected peers.
- **Outputs**: Client state store updates user status badge (Green online dot / Grey offline text).

#### 3.2.3 Read Receipts (Seen Status)
- **Description**: Sender is notified when the recipient views the message.
- **Inputs**: Recipient client triggers `message:seen` event when conversation tab is actively focused and unread messages are visible.
- **Processing**: Server updates message documents in MongoDB set `status: "seen"` and `readBy` array, then emits `message:status_updated` to sender.
- **Outputs**: Sender client updates message status icon from double gray checks to double blue checks.

---

## 4. Performance Requirements
- **Concurrent Connections**: Initial capacity targeted at 1,000 simultaneous active socket connections per Node.js server instance.
- **Database Query Latency**: Message fetch queries utilizing index `{ conversationId: 1, createdAt: -1 }` must execute in under 15ms.
- **Image Optimization**: Images uploaded must be compressed server-side or delivered via optimized Cloudinary CDN paths.

---

## 5. Security Requirements
- **Data in Transit**: All API traffic and WebSocket frames encrypted over TLS (HTTPS / WSS).
- **Data at Rest**: Passwords stored using `bcrypt` with salt rounds = 10.
- **XSS Protection**: User text content automatically sanitized before rendering to mitigate injection vectors.
- **CORS Policy**: Configured to restrict origin requests strictly to white-listed client URLs.
