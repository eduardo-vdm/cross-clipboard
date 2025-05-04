# 📄 Product Requirements Document (PRD) – Cross Clipboard (MVP)

---

## 🧠 Overview

**Cross Clipboard** is a full-stack web app designed to share clipboard content (plain text and images) across devices using 6-digit numeric codes called *sessions*. The application targets quick personal use (across personal devices) and also serves as a public showcase project for the developer's portfolio.

The MVP is designed for speed, clarity, and graceful handling of simple content sharing without authentication, relying on per-device anonymous identifiers.

---

## 🧑‍💻 Target Users

- **Primary:** Individual users with multiple devices (phone, laptop, desktop).
- **Secondary:** Friends or collaborators briefly sharing clipboard items.
- **Note:** No authentication. Each device is anonymously identified via a derived identifier from request headers.

---

## 🧩 Core Features

### ✅ Sessions
- Created automatically when user opens app with no session code
- Auto-joined if a valid session code exists in URL
- 6-digit numeric codes
- Limited to 5 simultaneous device IDs per session

### ✅ Items
- Sessions contain a list of items
- Each item has a `type` (`text`, `image`), `content`, `createdAt`, and `createdBy` (deviceId)
- Items are added one by one, listed in reverse chronological order

### ✅ Content Types (MVP)
- Plain text (simple string)
- Images (Base64 for now)

### ✅ Conflict Resolution
- On update attempt:
  - If the session's last update was <5s ago by another device, return 409 Conflict
  - UI prompts user: overwrite (up/down), or cancel
  - Optional: checkbox to "append to my clipboard" when overwriting down

---

## 🏗️ Architecture Notes

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Express.js (Node) + MongoDB (Dockerized per project)
- **Storage**: Mongo collections for `sessions` and `items`
- **No authentication**. Each device gets a derived `deviceId` from headers, persisted via localStorage.

---

## 🕓 Expiration / Archiving

- Sessions expire after 1 week of inactivity
- Expired sessions are *archived*, not deleted
  - Flag-based soft-deletion (`isArchived: true`)
  - Future plan may allow recovery or history
- Items remain attached but are no longer writable

---

## 🧪 MVP Constraints

- No offline mode for now (online-only)
- No WebSockets (uses polling or manual refresh)
- UI optimized for:
  - Desktop and Mobile
  - Two breakpoints (min-width 400px)
  - Responsive layout, but no wide screen modes
- No file uploads or rich text yet

---

## 💡 UX and Visual Design

- Default dark mode (light mode optional toggle)
- Style: *elegantly simple*, clear, readable
- Tailwind used throughout, with generous spacing and modern form controls
- Utility-style layout: like a clipboard hub, not a feed or social UI

---

## ✍️ User Stories

### Story 1: Creating a new session
> As a user with no session URL,  
> I want a session to be auto-generated  
> So I can immediately begin pasting or uploading content.

### Story 2: Joining an existing session
> As a user with a session code in my URL,  
> I want to auto-join that session  
> So I can access and contribute to the shared clipboard.

### Story 3: Adding a new item
> As a user,  
> I want to add clipboard content (text/image)  
> So others in the session can access it.

### Story 4: Conflict warning
> As a user trying to push a new item,  
> I want to be warned if someone recently edited  
> So I can decide whether to overwrite or keep both versions.

### Story 5: Expiration
> As a user,  
> I expect old sessions to disappear  
> So the app stays clean and doesn't retain stale data.

---

## 📌 Future Considerations (not in MVP)

- File uploads and rich text types
- WebSocket syncing
- Offline-first architecture with Service Workers
- Session recovery from archive
- PWA installability
- Rate limiting and anti-abuse system
- Optional session "pinning" or bookmarking

---

## 🚀 MVP Development Notes

- Code structure should allow future type expansion (e.g., `type: "file"`)
- Start from core: session creation, item addition, and basic conflict UX
- Avoid visual clutter; prefer minimal but styled interface
- Total devices per session capped at 5 (with UI for slot freeing)

---

## 📆 Timeline Suggestion (with AI + Cursor IDE)

- Session API + storage = 3–4 hours
- Item logic + frontend list UI = 4–6 hours
- Conflict resolution logic + error UI = 2–3 hours
- Basic Tailwind styling + dark/light mode toggle = 1–2 hours
- Final testing and polishing = 2–3 hours

🟰 **~12–18 focused hours total**, accelerated if agent support is effective and scoped tasks are followed strictly.

---

## 🧭 Next Steps

1. Wireframes (basic layout)  
2. Flow diagram (user/content behavior)  
3. Context state diagram (session+item status logic)  
4. Meta-prompt to guide dev agents (Cursor)
