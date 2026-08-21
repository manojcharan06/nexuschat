# NexusChat - Database Schema Specification

NexusChat uses **MongoDB** as its primary document store, accessed via **Mongoose ORM**.

---

## 1. `users` Collection

Stores user identity credentials, profile customization, and real-time connectivity status.

### 1.1 Field Breakdown

| Field | Type | Required | Default | Description & Purpose |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto | Primary key unique identifier. |
| `username` | String | Yes | N/A | Unique handle for user discovery. Trimmed, lowercase, 3-20 chars. |
| `email` | String | Yes | N/A | Unique email address for authentication. Lowercase, validated pattern. |
| `passwordHash` | String | Yes | N/A | Bcrypt hashed string (salt factor 10). Never returned in API queries. |
| `avatarUrl` | String | No | Auto Gravatar | URL to profile picture image stored on CDN. |
| `statusMessage` | String | No | "Hey there! I am using NexusChat." | Bio status string shown on user profile card (max 100 chars). |
| `isOnline` | Boolean | No | `false` | Real-time presence flag updated via Socket connection handlers. |
| `lastSeen` | Date | No | `Date.now` | Timestamp of user's last active socket disconnect or HTTP ping. |
| `refreshTokens` | [String] | No | `[]` | Array of active refresh token hashes for session invalidation. |
| `createdAt` | Date | Auto | `Date.now` | Timestamp when user account was created. |
| `updatedAt` | Date | Auto | `Date.now` | Timestamp when profile was last modified. |

### 1.2 Indexes

- **Single Index (Unique)**: `{ username: 1 }` (Unique constraint for user search).
- **Single Index (Unique)**: `{ email: 1 }` (Unique constraint for authentication lookups).
- **Single Index**: `{ isOnline: 1 }` (Fast filtering of active/online contacts).

---

## 2. `conversations` Collection

Stores conversation metadata, participant arrays, and unread counters.

### 2.1 Field Breakdown

| Field | Type | Required | Default | Description & Purpose |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto | Primary key unique identifier. |
| `type` | String | Yes | `"direct"` | Conversation mode: `"direct"` (1-on-1) or `"group"`. |
| `participants` | [ObjectId] | Yes | N/A | Array of `User._id` references involved in the conversation. |
| `groupName` | String | Conditional | `null` | Title of group chat (required if `type === "group"`). |
| `groupAdmin` | ObjectId | Conditional | `null` | Reference to `User._id` of group creator/admin. |
| `lastMessage` | ObjectId | No | `null` | Foreign key ref to latest `Message._id` for quick sidebar preview. |
| `unreadCounts` | Map<String, Number> | No | `{}` | Key-value map (`userId -> unreadCount`) tracking unread items per user. |
| `createdAt` | Date | Auto | `Date.now` | Creation timestamp of the conversation thread. |
| `updatedAt` | Date | Auto | `Date.now` | Timestamp of the last message activity in this conversation. |

### 2.2 Indexes

- **Compound Index**: `{ participants: 1, updatedAt: -1 }` (Accelerates conversation sidebar list queries sorted by latest activity).
- **Single Index**: `{ participants: 1 }` (Used for lookup of existing 1-on-1 direct conversations).

---

## 3. `messages` Collection

Stores individual text messages, media attachments, delivery status flags, and read receipts.

### 3.1 Field Breakdown

| Field | Type | Required | Default | Description & Purpose |
|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto | Primary key unique identifier. |
| `conversationId` | ObjectId | Yes | N/A | Foreign key ref to `Conversation._id`. |
| `senderId` | ObjectId | Yes | N/A | Foreign key ref to `User._id` of message author. |
| `text` | String | Conditional | `""` | Message text content (Max 5000 chars). Sanitized against XSS. |
| `attachments` | [AttachmentSchema] | No | `[]` | Array of media sub-documents (URL, mimeType, dimensions). |
| `status` | String | Yes | `"sent"` | Delivery lifecycle status: `"sent"`, `"delivered"`, `"seen"`. |
| `readBy` | [{ userId, readAt }] | No | `[]` | Sub-document array of users who viewed this message and timestamp. |
| `tempId` | String | No | `null` | Client-side optimistic tracking string passed during initial socket emit. |
| `isDeleted` | Boolean | No | `false` | Soft delete flag preserving thread sequence while scrubbing content. |
| `createdAt` | Date | Auto | `Date.now` | Server insertion timestamp for message order sorting. |
| `updatedAt` | Date | Auto | `Date.now` | Timestamp of last status modification. |

### 3.2 Sub-Document Schema: `AttachmentSchema`

```json
{
  "url": "String (Required)",
  "publicId": "String (Required for Cloudinary deletion)",
  "mimeType": "String (e.g. 'image/png')",
  "size": "Number (bytes)",
  "width": "Number (px)",
  "height": "Number (px)"
}
```

### 3.3 Indexes

- **Compound Index (Critical)**: `{ conversationId: 1, createdAt: -1 }` (Essential for $O(1)$ cursor-based pagination of message logs).
- **Single Index**: `{ senderId: 1 }` (Fast auditing of user activity).
- **Single Index**: `{ status: 1 }` (Used for background batch status updates).
