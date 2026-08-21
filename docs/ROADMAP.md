# NexusChat - Implementation Roadmap & Task Breakdown

This document breaks down the complete development lifecycle into 10 sequential milestones composed of small, actionable development tasks.

---

## Milestone 1: Project Repository Initialization & Environment Setup
- [ ] Task 1.1: Initialize git repository, configure `.gitignore`, and set up project folder structure (`server/`, `client/`, `docs/`).
- [ ] Task 1.2: Initialize Express backend Node package (`server/package.json`) and install core dependencies (`express`, `mongoose`, `socket.io`, `dotenv`, `cors`, `cookie-parser`, `bcrypt`, `jsonwebtoken`, `express-validator`, `multer`, `cloudinary`, `winston`).
- [ ] Task 1.3: Initialize Vite React client package (`client/package.json`) and install core dependencies (`react`, `react-dom`, `zustand`, `@tanstack/react-query`, `axios`, `socket.io-client`, `lucide-react`, `date-fns`).
- [ ] Task 1.4: Setup environment variable templates (`.env.example` in client and server).

## Milestone 2: Backend Foundation, Database Schemas & Error Handling
- [ ] Task 2.1: Implement MongoDB database connection module (`server/src/config/db.js`) with Mongoose connection pooling.
- [ ] Task 2.2: Implement `User` schema model (`server/src/models/User.model.js`) with indexes and password hash pre-save hooks.
- [ ] Task 2.3: Implement `Conversation` schema model (`server/src/models/Conversation.model.js`) with participant compound indexes.
- [ ] Task 2.4: Implement `Message` schema model (`server/src/models/Message.model.js`) with compound index (`conversationId + createdAt`).
- [ ] Task 2.5: Implement standardized `ApiError` class and global Express error handling middleware (`server/src/middlewares/error.middleware.js`).

## Milestone 3: Authentication Engine & JWT Middleware
- [ ] Task 3.1: Write JWT helper utility (`server/src/utils/jwt.util.js`) for Access Token and Refresh Token generation and verification.
- [ ] Task 3.2: Implement `auth.service.js` (registration, login, refresh token rotation, logout).
- [ ] Task 3.3: Implement `auth.controller.js` and input DTO validation chains (`express-validator`).
- [ ] Task 3.4: Implement Express authentication middleware (`auth.middleware.js`) for protecting REST endpoints.
- [ ] Task 3.5: Mount auth routes (`/api/v1/auth/*`) and verify via HTTP tests.

## Milestone 4: User Management & Conversation REST APIs
- [ ] Task 4.1: Implement `user.controller.js` for profile fetches, user search queries, and status updates.
- [ ] Task 4.2: Implement `conversation.controller.js` for listing active threads and creating direct chats.
- [ ] Task 4.3: Implement `message.controller.js` for historical message log retrieval with cursor pagination (`before=<messageId>`).
- [ ] Task 4.4: Implement Cloudinary media upload service (`server/src/services/upload.service.js`) and endpoint (`POST /api/v1/upload/image`).

## Milestone 5: Socket.IO Real-Time Engine Setup
- [ ] Task 5.1: Initialize Socket.IO server bound to HTTP server instance (`server/src/server.js`).
- [ ] Task 5.2: Implement Socket authentication handshake middleware (`socket.auth.js`) validating JWT token.
- [ ] Task 5.3: Implement Socket connection manager (`presence.handler.js`) handling `user:online`, disconnect triggers, and presence broadcasts.
- [ ] Task 5.4: Implement chat socket event handler (`chat.handler.js`) for `conversation:join`, `message:send`, and `message:seen`.
- [ ] Task 5.5: Implement typing indicator socket handler (`typing:start` and `typing:stop`).

## Milestone 6: Frontend React Architecture, Stores & Axios Setup
- [ ] Task 6.1: Setup Axios HTTP client instance (`client/src/api/axiosInstance.js`) with automatic JWT auth header injection and automatic `/refresh` interceptors on 401 response.
- [ ] Task 6.2: Create Zustand Auth store (`useAuthStore.js`) managing user session state, login token storage, and logout.
- [ ] Task 6.3: Create Zustand Chat store (`useChatStore.js`) managing active conversation selection, message lists, and unread counters.
- [ ] Task 6.4: Implement custom `useSocket.js` hook managing Socket.IO client lifecycle, event registration, and state updates.

## Milestone 7: Auth UI Screens & Navigation Architecture
- [ ] Task 7.1: Build design system CSS variables and layout styles (`client/src/styles/index.css`).
- [ ] Task 7.2: Build reusable UI elements (`Avatar`, `StatusBadge`, `Button`, `InputField`, `Modal`).
- [ ] Task 7.3: Build `LoginForm` and `RegisterForm` components with client validation and error toast notifications.
- [ ] Task 7.4: Implement route guards (`ProtectedRoute` & `PublicRoute`).

## Milestone 8: Chat Workspace UI & Sidebar Integration
- [ ] Task 8.1: Build main chat layout container (`ChatLayout`).
- [ ] Task 8.2: Build `Sidebar` component with header avatar, profile modal button, and search bar.
- [ ] Task 8.3: Implement `UserSearchBar` with debounced search querying `/api/v1/users/search`.
- [ ] Task 8.4: Build `ConversationList` and `ConversationItem` with active presence indicator badges and unread item counts.

## Milestone 9: Real-Time Chat Window, Messaging & Status Pipeline
- [ ] Task 9.1: Build `ChatHeader` with recipient presence badge and info drawer toggle.
- [ ] Task 9.2: Build `MessageListContainer` with cursor-based infinite scroll (`useChatScroll`) and auto-scroll down mechanics.
- [ ] Task 9.3: Build `MessageBubble` rendering text content, image attachments, timestamp, and status checkmarks (`sent`, `delivered`, `seen`).
- [ ] Task 9.4: Build `ChatInputComposer` with message textarea, optimistic message dispatching (`tempId`), attachment upload trigger, and debounced typing indicator emitters.
- [ ] Task 9.5: Build `InfoDrawer` displaying contact details and shared media gallery grid.

## Milestone 10: Testing, Performance Optimization & Final Verification
- [ ] Task 10.1: Conduct full end-to-end user flow testing (Signup -> Login -> Search -> Chat -> Real-time status -> Image upload -> Read receipts).
- [ ] Task 10.2: Validate database index performance using MongoDB `explain()` on heavy queries.
- [ ] Task 10.3: Conduct socket disconnection/reconnection resilience testing.
- [ ] Task 10.4: Perform final security audit (XSS validation, CORS origin verification, HttpOnly cookie security).
