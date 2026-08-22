# NexusChat - Detailed Workflow Specifications

This document explains every core system workflow in simple English using a standardized 5-step breakdown:
1. **Trigger**
2. **Backend process**
3. **Database operation**
4. **Socket event**
5. **Frontend update**

---

## Workflow 1: Signup Flow

### 1. Trigger
The user fills out the Registration Form on the client with their `username`, `email`, and `password`, and clicks the **"Create Account"** button.

### 2. Backend Process
The request hits `POST /api/auth/register`. The server validates input format using DTO middleware. The auth service verifies that the email and username are not already registered. The password is then securely hashed using `bcrypt` (10 salt rounds).

### 3. Database Operation
The backend creates and saves a new document in the `users` MongoDB collection with fields `username`, `email`, `passwordHash`, `avatarUrl` (default generated gravatar/ui-avatar), `isOnline: false`, and `createdAt`.

### 4. Socket Event
No socket event is fired during signup.

### 5. Frontend Update
Upon receiving a `201 Created` HTTP response, the frontend clears the form, displays a success notification, and automatically redirects the user to the Login screen.

---

## Workflow 2: Login Flow

### 1. Trigger
The user enters their `email` and `password` on the Login page and clicks **"Sign In"**.

### 2. Backend Process
The request hits `POST /api/auth/login`. The server fetches the user by email, compares the submitted password against the stored bcrypt hash. If valid, it generates:
1. Short-lived Access JWT (15 min lifespan).
2. Long-lived Refresh JWT (7 day lifespan).
The server sets the Refresh JWT inside an `HttpOnly`, `SameSite=Strict` cookie and returns the Access JWT and user object in the JSON body.

### 3. Database Operation
The backend updates the `users` document setting `lastSeen: new Date()` and saves the hashed refresh token into the user's active session array.

### 4. Socket Event
No socket event directly inside HTTP login handler, but login triggers client-side Socket initialization (see Workflow 3).

### 5. Frontend Update
The frontend receives the Access JWT, stores it in memory (`useAuthStore`), updates global auth status to `isAuthenticated = true`, and navigates the user to the Main Chat Workspace dashboard.

---

## Workflow 3: Socket Connection & Lifecycle Flow

### 1. Trigger
The user logs in or reloads the application while an active session exists. The React `useSocket` custom hook detects `isAuthenticated == true` and queries the Zustand `useSocketStore` singleton state.

### 2. Backend Process
The Socket.IO server interceptor (`socketAuthMiddleware`) intercepts the WebSocket handshake request (`ws://localhost:5000/socket.io/?EIO=4&transport=websocket`), extracts the JWT from `socket.handshake.auth.token`, verifies its signature, attaches `socket.userId = userId`, and joins the socket to room `user_<userId>`.

### 3. Database Operation
The server executes `User.findByIdAndUpdate(userId, { isOnline: true })` in MongoDB.

### 4. Socket Event
1. Server emits `connection:success` back to the connecting client socket.
2. Server broadcasts `user:presence_changed` payload `{ userId, isOnline: true }` to all connected client sockets.

### 5. Frontend Update & Lifecycle Protection
1. Connecting client receives `connection:success` and updates Zustand state `isConnected: true`.
2. UI components render active presence indicators (pulsing green online badge).
3. **React 18 Lifecycle Protection**: In React 18 / Next.js Strict Mode, double-effect execution is guarded using a singleton socket state check (`!socketInstance || (!socketInstance.connected && !socketInstance.connecting)`). Unmount cleanup only disconnects when `isAuthenticated == false`, preventing accidental `ws.close()` calls on in-flight connecting WebSockets.


---

## Workflow 4: Send Message Flow

### 1. Trigger
The user types a text message in the chat input bar and presses **Enter** or clicks the **"Send"** button.

### 2. Backend Process
The client immediately creates an optimistic message with a client-generated temporary ID (`tempId`) and renders it in the chat bubble list. Simultaneously, the client emits socket event `message:send` with payload `{ conversationId, text, tempId }`. The backend socket listener intercepts the payload, validates content length and user membership in the conversation room.

### 3. Database Operation
The backend inserts a new document into the `messages` collection:
`{ conversationId, senderId, text, status: "sent", tempId, createdAt: new Date() }`.
It also updates the `conversations` document setting `lastMessage: messageId` and increments unread count for other conversation members.

### 4. Socket Event
1. Server returns acknowledgement callback to sender socket containing `{ tempId, realMessageId, status: "sent" }`.
2. Server emits `message:received` payload containing full message object to all sockets in room `conversationId`.

### 5. Frontend Update
1. Sender client matches `tempId` and replaces optimistic message state with confirmed `realMessageId` and status icon **Sent** (Single Gray Check).
2. Recipient client appends the new message bubble to active conversation log and updates conversation sidebar item preview text.

---

## Workflow 5: Receive Message Flow

### 1. Trigger
An incoming socket event `message:received` arrives at the recipient's client device.

### 2. Backend Process
The backend socket server dispatched this event to all sockets currently joined to the specific `conversationId` room.

### 3. Database Operation
If recipient socket is connected, the server automatically updates the message status in database from `"sent"` to `"delivered"` for that recipient.

### 4. Socket Event
1. Server emits `message:received` to recipient.
2. Server emits `message:status_updated` with `{ messageId, status: "delivered" }` to sender socket.

### 5. Frontend Update
1. If recipient is currently viewing that conversation, the message bubble appends smoothly and view auto-scrolls down.
2. If recipient is on a different conversation, unread message badge count increments by 1.
3. Sender client updates message status icon from single check to **Delivered** (Double Gray Checks).

---

## Workflow 6: Seen Status Flow

### 1. Trigger
The recipient opens or brings focus to a conversation window containing unread messages.

### 2. Backend Process
Recipient client emits `message:seen` with payload `{ conversationId, lastMessageId }`. Backend validates recipient identity and fetches all unread messages in that conversation for that user.

### 3. Database Operation
Backend executes bulk update on `messages` collection:
`UPDATE messages SET status = "seen", readBy = readBy + userId WHERE conversationId = conversationId AND senderId != userId AND status != "seen"`.
Backend also resets recipient's unread counter in the `conversations` collection to `0`.

### 4. Socket Event
Server broadcasts `message:status_updated` payload `{ conversationId, seenByUserId: userId, status: "seen" }` to all members of the conversation room.

### 5. Frontend Update
1. Sender client receives update and changes all relevant message status indicators to **Seen** (Double Blue Checks).
2. Recipient client updates unread badge counter on sidebar conversation item to `0`.

---

## Workflow 7: Typing Indicator Flow

### 1. Trigger
The user starts typing characters into the chat text input field (or pauses typing for >300ms).

### 2. Backend Process
Client sends `typing:start` event when keypress occurs. A debouncer runs; if no keypress occurs for 3000ms, client sends `typing:stop`. Backend receives event and forwards payload `{ conversationId, userId, username }` to the target room, excluding the sender socket.

### 3. Database Operation
No database operation is performed (transient memory-only real-time event).

### 4. Socket Event
1. Server emits `typing:display` `{ conversationId, userId, isTyping: true }` to recipient.
2. Server emits `typing:display` `{ conversationId, userId, isTyping: false }` when stopped.

### 5. Frontend Update
Recipient chat window header or bottom chat area displays animated typing indicator dots (`"Alice is typing..."`). When `isTyping: false` is received, the indicator smoothly fades out.

---

## Workflow 8: Image Upload Flow

### 1. Trigger
The user clicks the attachment icon, selects an image file (PNG/JPG/WEBP < 5MB) from file chooser, and confirms upload.

### 2. Backend Process
Client constructs `FormData` and sends `POST /api/upload/image`. Express `multer` middleware validates file MIME type and byte size, then streams the buffer to Cloudinary / AWS S3 storage service. Storage service returns secure CDN image URL.

### 3. Database Operation
Backend creates an `attachments` record metadata (optional) or prepares attachment sub-document `{ url, publicId, mimeType, size }` to be referenced when user submits final message.

### 4. Socket Event
No socket event occurs during HTTP file upload. Socket event `message:send` is fired immediately after with `attachments: [{ url }]`.

### 5. Frontend Update
Frontend displays inline upload loader preview bar. Upon 200 OK HTTP response, the image preview attaches to message input composer. User clicks send, triggering Workflow 4.

---

## Workflow 9: System Health & Infrastructure Boot Flow

### 1. Trigger
Administrator or automated monitoring health check pings `GET /api/v1/health` or client launches application.

### 2. Backend Process
Express server intercepts HTTP request, verifies server readiness, inspects database connection state (`mongoose.connection.readyState`), and generates JSON metadata payload.

### 3. Database Operation
Backend verifies Mongoose connection object status (`readyState === 1`).

### 4. Socket Event
No socket event involved in HTTP health ping.

### 5. Frontend Update
Client checks health response `{ success: true, data: { status: "UP" } }` and displays active infrastructure status badge.

---

## Workflow 10: User Profile Update & Avatar Upload Flow

### 1. Trigger
User opens `UserProfileModal` inside workspace, inputs a new bio status message (e.g. *"In a meeting"*), picks a new avatar image file (PNG/JPG/WEBP < 5MB), and clicks **"Save Changes"**.

### 2. Backend Process
1. For avatar image: Client sends `POST /api/v1/users/avatar` with `multipart/form-data`. `uploadSingleImage` Multer middleware validates file MIME type and byte size. `uploadImageToStorage` streams buffer to Cloudinary CDN (or generates local fallback URL).
2. For status bio: Client sends `PATCH /api/v1/users/profile` with `{ statusMessage }`. `updateProfile` controller validates string length (max 100 chars).

### 3. Database Operation
Backend executes `User.findByIdAndUpdate(_id, { avatarUrl, statusMessage }, { new: true })` in MongoDB.

### 4. Socket Event
No socket event involved in HTTP profile editing (Presence updates handle online status broadcast separately in Phase 4).

### 5. Frontend Update
1. Upon receiving updated user document from server, `useAuthStore` updates `user` state.
2. Top header navigation pill, active profile avatar, and status bio render new values instantly.

---

## Workflow 11: One-to-One Real-Time Messaging & Persistence Flow

### 1. Trigger
User A selects User B from contact search or conversation list and types a message *"Hello from User A"* in `ChatInputComposer`.

### 2. Frontend Optimistic Process
1. Client generates a temporary UUID `tempId` (e.g. `temp_17200000_abc`).
2. Client renders optimistic message bubble immediately in `MessageList` with status `sending`.

### 3. Socket & Backend Process
1. Client emits socket event `message:send` with payload `{ conversationId, text, tempId }`.
2. Backend socket listener verifies user membership in `conversationId`.
3. Backend saves new document into MongoDB `messages` collection: `{ conversationId, senderId, text, status: "sent", tempId }`.
4. Backend updates `conversations` document setting `lastMessage: message._id` and `updatedAt: new Date()`.
5. Backend invokes acknowledgement callback returning `{ status: "success", data: savedMessage }` to sender.
6. Backend emits `message:received` to socket room `conv_<conversationId>` and personal user rooms `user_<recipientId>`.

### 4. Database Operation
`Message.create()` inserts document into MongoDB `messages` collection. `Conversation.findByIdAndUpdate()` updates thread summary metadata.

### 5. Frontend Real-Time Sync & Duplicate Prevention
1. Sender socket receives acknowledgement callback, matches `tempId`, and replaces optimistic bubble with confirmed `_id` and status `sent`.
2. Recipient socket receives `message:received` event. Client checks if message `_id` or `tempId` already exists in Zustand store. If not present, appends bubble to log and updates sidebar preview text. If the target conversation is not yet in client store, client calls `getConversationsApi()` to immediately hydrate sidebar state without requiring a page refresh.
3. Upon page refresh or browser reopen, `getMessagesApi(conversationId)` fetches history directly from MongoDB sorted by `createdAt: -1`, and the active conversation ID is restored from `localStorage`.

---

## Workflow 12: Mobile Viewport Navigation & Toast Notification Flow

### 1. Mobile View Navigation
1. On mobile screens (`< 768px`), `ChatPage` checks `activeConversationId`.
2. If `activeConversationId == null`, `Sidebar` renders at 100% viewport width (`w-full`), hiding the central chat area.
3. When user taps a contact, `setActiveConversationId(id)` sets the active thread. `ChatPage` hides `Sidebar` and slides `main` chat area to 100% viewport width.
4. Tapping `ArrowLeft` in `ChatHeader` executes `setActiveConversationId(null)`, returning cleanly to `Sidebar`.

### 2. Toast Notification Feedback
1. User actions (Login, Register, Profile update, Avatar upload, Socket reconnect) trigger `toast.success()`, `toast.error()`, or `toast.info()`.
2. `ToastProvider` appends toast object to `toasts` array state.
3. Toast renders fixed in bottom-right corner with type icon (`CheckCircle2`, `AlertCircle`, `Info`), auto-dismissing after 4000ms.

---

## Workflow 13: Production Build & System Security Audit Flow

### 1. Production Bundle Build Process
1. Developer runs `npm run build` inside `client/`. Next.js 15 Turbopack parses App Router pages (`/`, `/login`, `/register`, `/chat`).
2. Static HTML/JSX pages are pre-rendered into `.next/` standalone output directory.
3. Node server verified using ES Module `import` statements and Winston structured logging.

### 2. Security Audit Execution
1. Password Hashing: Bcrypt salt rounds (10) hash passwords before MongoDB save (`User.model.js`).
2. API Projections: Mongoose queries explicitly exclude `password` field (`select('-password')`).
3. Silent Refresh Interceptor: Axios interceptor traps HTTP 401, verifies `!originalRequest._retry`, calls `/auth/refresh`. If refresh fails, session is cleared without infinite HTTP request loops.

---

## Workflow 14: Production Cloud Deployment & Health Verification Flow

### 1. Cloud PaaS Startup & Health Probe
1. PaaS host (Render / Railway / Fly.io) pulls `server` repository code and runs `node src/server.js`.
2. Server binds to `0.0.0.0:${PORT}` and connects to MongoDB Atlas URI (`mongodb+srv://...`).
3. Load balancer issues automated HTTP GET probe to `https://nexuschat.onrender.com/health`.
4. API responds with HTTP 200 `{ status: 'ok', service: 'NexusChat API Server' }`, marking container healthy.

### 2. Cross-Domain HTTPS Client & Socket Connection
1. User accesses `https://nexuschat.vercel.app`.
2. Frontend issues REST requests to `NEXT_PUBLIC_API_URL` (`https://nexuschat.onrender.com/api/v1`).
3. Server returns Access Token in body and `refreshToken` cookie set to `SameSite=None; Secure; HttpOnly`.
4. Client Socket.IO establishes secure WebSocket connection over WSS (`wss://nexuschat.onrender.com/socket.io/?EIO=4&transport=websocket`).






