# NexusChat - Socket.IO Event Specification

This document details all real-time WebSocket event signatures, payload structures, acknowledgements, and error codes for NexusChat.

---

## 1. Handshake & Connection Protocol

- **Connection Endpoint**: `/`
- **Auth Payload**: Transmitted in `handshake.auth` object.

```javascript
// Client Connection Initialization
const socket = io("http://localhost:5000", {
  auth: {
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR..."
  }
});
```

- **Server Handshake Verification**:
  1. Extract JWT from `socket.handshake.auth.token`.
  2. Verify signature using `JWT_SECRET`.
  3. If invalid/expired, reject connection with error: `Authentication error: Invalid or expired token`.
  4. If valid, bind `socket.userId = decoded.userId` and auto-join socket room `user_<userId>`.

---

## 2. Client to Server Events (Outgoing from Client)

### 2.1 `conversation:join`
Joins the client socket to a specific conversation room for real-time broadcasts.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888"
}
```
- **Acknowledgement Callback**:
```json
{
  "status": "ok",
  "joinedRoom": "conv_64f888888888888888888888"
}
```

---

### 2.2 `message:send`
Dispatches a new text or media message to a conversation.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888",
  "text": "Hello, how are you?",
  "attachments": [
    {
      "url": "https://res.cloudinary.com/...",
      "mimeType": "image/png"
    }
  ],
  "tempId": "client-temp-uuid-1234"
}
```
- **Acknowledgement Callback**:
```json
{
  "status": "success",
  "data": {
    "tempId": "client-temp-uuid-1234",
    "messageId": "64f777777777777777777777",
    "createdAt": "2026-08-21T18:05:00.000Z"
  }
}
```

---

### 2.3 `message:seen`
Notifies server that unread messages in a conversation have been viewed by the client.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888"
}
```
- **Acknowledgement Callback**:
```json
{
  "status": "success",
  "updatedCount": 3
}
```

---

### 2.4 `typing:start`
Emits typing activity notification.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888"
}
```

---

### 2.5 `typing:stop`
Emits typing inactivity notification.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888"
}
```

---

## 3. Server to Client Events (Incoming to Client)

### 3.1 `connection:success`
Emitted to the connecting client immediately after authentication success.

- **Payload**:
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "socketId": "wX9kL_a1b2c3d4",
  "serverTime": "2026-08-21T18:00:00.000Z"
}
```

---

### 3.2 `message:received`
Broadcasted to all sockets joined to room `conv_<conversationId>` when a new message is saved.

- **Payload**:
```json
{
  "id": "64f777777777777777777777",
  "conversationId": "64f888888888888888888888",
  "sender": {
    "id": "64f999999999999999999999",
    "username": "alice_smith",
    "avatarUrl": "https://..."
  },
  "text": "Hello, how are you?",
  "attachments": [],
  "status": "sent",
  "createdAt": "2026-08-21T18:05:00.000Z"
}
```

---

### 3.3 `message:status_updated`
Broadcasted when a message's status transitions (e.g. `sent` -> `delivered` or `seen`).

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888",
  "messageIds": ["64f777777777777777777777"],
  "status": "seen",
  "updatedByUserId": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

---

### 3.4 `user:presence_changed`
Broadcasted to contacts when a user's network connectivity status changes.

- **Payload**:
```json
{
  "userId": "64f999999999999999999999",
  "isOnline": false,
  "lastSeen": "2026-08-21T18:10:00.000Z"
}
```

---

### 3.5 `typing:display`
Broadcasted to conversation members when a contact starts or stops typing.

- **Payload**:
```json
{
  "conversationId": "64f888888888888888888888",
  "userId": "64f999999999999999999999",
  "username": "alice_smith",
  "isTyping": true
}
```

---

### 3.6 `error:socket`
Emitted directly to client when a socket event processing fails.

- **Payload**:
```json
{
  "event": "message:send",
  "code": "CONVERSATION_NOT_FOUND",
  "message": "Target conversation thread does not exist or access is denied."
}
```
