# NexusChat - REST API Specification

Base URL: `/api/v1`

All requests and responses use standard `application/json` format unless specified otherwise (e.g. `multipart/form-data` for file uploads).

---

## Standard Response Envelopes

### Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Human readable error message",
    "details": []
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 `POST /api/v1/auth/register`
Creates a new user account.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```
- **Responses**:
  - `201 Created`:
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "message": "User registered successfully",
    "userId": "64f1a2b3c4d5e6f7a8b9c0d1"
  }
}
```
  - `400 Bad Request` (`EMAIL_IN_USE` / `USERNAME_TAKEN` / `INVALID_INPUT`)

---

### 1.2 `POST /api/v1/auth/login`
Authenticates user credentials, sets Refresh Cookie, and returns Access JWT.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```
- **Response Headers**: `Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh`
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "username": "john_doe",
      "email": "john@example.com",
      "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/avatar.png",
      "statusMessage": "Hey there! I am using NexusChat."
    }
  }
}
```
  - `401 Unauthorized` (`INVALID_CREDENTIALS`)

---

### 1.3 `POST /api/v1/auth/refresh`
Generates a new Access JWT using the `HttpOnly` Refresh Cookie.

- **Request Headers**: `Cookie: refreshToken=<jwt>`
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```
  - `401 Unauthorized` (`REFRESH_TOKEN_EXPIRED` / `NO_TOKEN_PROVIDED`)

---

### 1.4 `POST /api/v1/auth/logout`
Revokes refresh token and clears HTTP cookie.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 2. User Management Endpoints (`/api/v1/users`)

### 2.1 `GET /api/v1/users/me`
Retrieves current authenticated user profile.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "username": "john_doe",
    "email": "john@example.com",
    "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/avatar.png",
    "statusMessage": "Available",
    "isOnline": true
  }
}
```

---

### 2.2 `GET /api/v1/users/search?q={query}`
Searches users by username or email for initiating new direct chats.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Query Params**: `q` (string, required)
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "64f999999999999999999999",
      "username": "alice_smith",
      "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/alice.png",
      "isOnline": true
    }
  ]
}
```

---

### 2.3 `PATCH /api/v1/users/profile`
Updates display profile metadata.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "statusMessage": "In a meeting",
  "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/new_avatar.png"
}
```
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "username": "john_doe",
    "statusMessage": "In a meeting",
    "avatarUrl": "https://res.cloudinary.com/demo/image/upload/v1/new_avatar.png"
  }
}
```

---

## 3. Conversation Endpoints (`/api/v1/conversations`)

### 3.1 `GET /api/v1/conversations`
Retrieves all active conversations for the authenticated user.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "64f888888888888888888888",
      "type": "direct",
      "participant": {
        "id": "64f999999999999999999999",
        "username": "alice_smith",
        "avatarUrl": "https://...",
        "isOnline": true,
        "lastSeen": "2026-08-21T18:00:00.000Z"
      },
      "lastMessage": {
        "id": "64f777777777777777777777",
        "senderId": "64f999999999999999999999",
        "text": "Hey John, how are you?",
        "createdAt": "2026-08-21T18:05:00.000Z",
        "status": "delivered"
      },
      "unreadCount": 1
    }
  ]
}
```

---

### 3.2 `POST /api/v1/conversations/direct`
Finds or creates a direct 1-on-1 conversation with another user.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "recipientId": "64f999999999999999999999"
}
```
- **Responses**:
  - `200 OK` (Existing) / `201 Created` (New):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "64f888888888888888888888",
    "type": "direct",
    "participants": ["64f1a2b3c4d5e6f7a8b9c0d1", "64f999999999999999999999"]
  }
}
```

---

## 4. Message Endpoints (`/api/v1/messages`)

### 4.1 `GET /api/v1/messages/:conversationId`
Fetches historical messages for a conversation using cursor pagination.

- **Request Headers**: `Authorization: Bearer <accessToken>`
- **Query Params**:
  - `limit`: Integer (default: 30)
  - `before`: Message ID string (optional, for infinite scroll backwards)
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "messages": [
      {
        "id": "64f777777777777777777777",
        "conversationId": "64f888888888888888888888",
        "senderId": "64f999999999999999999999",
        "text": "Hey John, how are you?",
        "attachments": [],
        "status": "seen",
        "isDeleted": false,
        "createdAt": "2026-08-21T18:05:00.000Z"
      }
    ],
    "hasMore": true,
    "nextCursor": "64f777777777777777777777"
  }
}
```

---

## 5. Media Upload Endpoints (`/api/v1/upload`)

### 5.1 `POST /api/v1/upload/image`
Uploads an image file to CDN storage.

- **Request Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: multipart/form-data`
- **Form Body**: `image` (File binary: PNG/JPG/WEBP < 5MB)
- **Responses**:
  - `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "url": "https://res.cloudinary.com/demo/image/upload/v1690000000/chat_uploads/sample.png",
    "publicId": "chat_uploads/sample",
    "width": 1200,
    "height": 800,
    "format": "png",
    "bytes": 245120
  }
}
```
  - `400 Bad Request` (`FILE_TOO_LARGE` / `INVALID_FILE_TYPE`)
