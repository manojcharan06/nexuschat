# NexusChat - UI & UX Architectural Plan

This document describes screen layouts, component hierarchies, visual design system tokens, responsive design rules, and optimistic rendering strategies.

---

## 1. Design System & Style Tokens

NexusChat UI uses a modern, sleek dark mode theme with dynamic glassmorphism cards, glowing status badges, smooth micro-animations, and clean modern typography (Inter / Outfit Google Fonts).

### 1.1 Color Palette Tokens

```css
:root {
  /* Surface & Background Colors */
  --bg-primary: #0b0f19;         /* Deep obsidian base background */
  --bg-secondary: #111827;       /* Card & sidebar background */
  --bg-tertiary: #1f2937;        /* Input fields & hover states */
  --bg-glass: rgba(17, 24, 39, 0.75); /* Glassmorphism backdrop blur */

  /* Brand Accent Colors */
  --accent-primary: #6366f1;     /* Vibrant Indigo */
  --accent-hover: #4f46e5;       /* Darker Indigo hover */
  --accent-glow: rgba(99, 102, 241, 0.35);

  /* Status Colors */
  --color-online: #10b981;       /* Emerald Green badge */
  --color-offline: #6b7280;      /* Slate Gray */
  --color-seen: #3b82f6;         /* Bright Blue checks */
  --color-error: #ef4444;        /* Crimson Red error */

  /* Text Typography */
  --text-primary: #f9fafb;       /* High-contrast crisp text */
  --text-secondary: #9ca3af;     /* Muted gray captions */
  --text-muted: #6b7280;         /* Subtle icons & placeholders */
}
```

---

## 2. Screen Layouts & Component Hierarchy

### Screen 1: Authentication View (`/login` & `/register`)

#### Wireframe Concept
```
┌─────────────────────────────────────────────────────────┐
│                    NEXUSCHAT LOGO                       │
│        "Real-Time Messaging For The Modern Web"         │
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │            [ Login / Register ]             │     │
│     │                                             │     │
│     │  Email Address                              │     │
│     │  [ user@example.com                      ]  │     │
│     │                                             │     │
│     │  Password                                   │     │
│     │  [ •••••••••••••                         ]  │     │
│     │                                             │     │
│     │  [       Sign In / Create Account       ]   │     │
│     │                                             │     │
│     │  Don't have an account? Sign Up             │     │
│     └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### Component Hierarchy
```
App
└── AuthLayout
    ├── BrandHeader (Logo, Title, Tagline)
    └── AuthCard (Glassmorphism Container)
        ├── TabSwitcher (Login / Register toggles)
        ├── LoginForm
        │   ├── InputField (Email)
        │   ├── InputField (Password)
        │   └── SubmitButton (with loading spinner)
        └── RegisterForm
            ├── InputField (Username)
            ├── InputField (Email)
            ├── InputField (Password)
            └── SubmitButton
```

---

### Screen 2: Main Workspace Screen (`/chat`)

#### Wireframe Concept
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (320px)            │ CHAT MAIN WINDOW (Flex 1)              │ INFO DRAWER (280px)│
├────────────────────────────┼────────────────────────────────────────┼────────────────────┤
│ [Avatar] John Doe  [⚙] [+]  │ [Avatar] Alice Smith     🟢 Online      │ [Avatar]           │
├────────────────────────────┼────────────────────────────────────────┤ Alice Smith        │
│ [🔍 Search users...      ] │                                        │ alice_smith@io     │
├────────────────────────────┼────────────────────────────────────────┤ "In a meeting"     │
│ CONVERSATION LIST          │  ┌──────────────────────────────────┐  ├────────────────────┤
│ 🟢 Alice Smith      18:05  │  │ Alice: Hey John, how are you?    │  │ SHARED MEDIA (4)   │
│   "Hey John, how..."  (1)  │  │ 18:05                            │  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│                            │  └──────────────────────────────────┘  │ │  │ │  │ │  │ │  ││
│ ⚪ Bob Johnson      Yesterday│  ┌──────────────────────────────────┐  │ └──┘ └──┘ └──┘ └──┘│
│   "See you tomorrow!"      │  │        John: I'm good! Thanks!   │  │                    │
│                            │  │        18:06 ✔️✔️                 │  ├────────────────────┤
│                            │  └──────────────────────────────────┘  │ [ Block User     ] │
├────────────────────────────┼────────────────────────────────────────┴────────────────────┤
│                            │ ✍️ Alice is typing...                                       │
│                            ├─────────────────────────────────────────────────────────────┤
│                            │ [📎] [Type a message...                           ] [😀] [▶]│
└────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

#### Component Hierarchy
```
App
└── ChatLayout (Main Grid Container)
    ├── Sidebar (Left Pane - 320px)
    │   ├── SidebarHeader
    │   │   ├── UserAvatar (Current Auth User)
    │   │   ├── UserProfileTriggerModalButton
    │   │   └── NewChatModalButton
    │   ├── UserSearchBar (Debounced query filter)
    │   ├── UserSearchResultsList (Renders when query active)
    │   └── ConversationList (Scrollable list of active threads)
    │       └── ConversationItem
    │           ├── UserAvatarBadge (With presence dot)
    │           ├── ConversationInfo (Name, last message snippet)
    │           ├── ConversationMeta (Timestamp, unread badge counter)
    │
    ├── ChatWindow (Center Pane - Dynamic Flex Box)
    │   ├── ChatHeader
    │   │   ├── ActiveUserAvatarBadge
    │   │   ├── ActiveUserInfo (Username, presence label "Online / Offline")
    │   │   └── ToggleInfoDrawerButton
    │   │
    │   ├── MessageListContainer (Auto-scrolls to bottom, infinite scroll)
    │   │   ├── LoadingSkeleton / InfiniteScrollSpinner
    │   │   ├── DateSeparator ("Today", "Yesterday", "August 21, 2026")
    │   │   └── MessageBubble
    │   │       ├── MessageSenderAvatar (In group context)
    │   │       ├── MessageContent (Text / Sanitized HTML)
    │   │       ├── MessageAttachments (Inline clickable thumbnails)
    │   │       └── MessageFooter (Timestamp, Seen Status Checkmarks)
    │   │
    │   └── ChatInputComposer (Bottom Fixed Form)
    │       ├── TypingIndicatorBar ("Alice is typing...")
    │       ├── AttachmentButton (Triggers file input)
    │       ├── AttachmentPreviewBar (Appears when image attached)
    │       ├── EmojiPickerButton & EmojiPopover
    │       ├── MessageTextInput (Auto-resizing textarea)
    │       └── SendMessageButton
    │
    └── InfoDrawer (Right Pane - Collapsible 280px)
        ├── ProfileHeader (Enlarged avatar, display name, bio status)
        ├── SharedMediaSection (Grid of image thumbnails exchanged)
        └── ConversationActions (Block, Mute, Delete Conversation)
```

---

## 3. Modal Architecture

### Modal 1: User Profile Settings Modal
- Allows user to update `avatarUrl`, `statusMessage`, and view account metrics.
- Component: `UserProfileModal`.

### Modal 2: Image Lightbox Preview Modal
- Fullscreen dark backdrop for inspecting high-resolution image attachments when clicked inside a message bubble.
- Component: `ImageLightboxModal`.

---

## 4. Responsive Layout Rules

- **Desktop (>= 1024px)**: Full 3-column view active (Sidebar + Chat Window + Info Drawer).
- **Tablet (768px - 1023px)**: 2-column view active (Sidebar + Chat Window). Info Drawer transforms into a toggleable slide-over drawer.
- **Mobile (< 768px)**: 1-column single view. Navigation toggles between Sidebar view and Chat Window view with a top left back arrow button.
