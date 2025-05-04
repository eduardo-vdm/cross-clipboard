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
- “New Session” button triggers confirmation modal and starts new session on acceptance

### ✅ Items
- Sessions contain a list of items (plain text or image)
- Each item has:
  - `type`: `"text"` or `"image"`
  - `content`: actual content (string or Base64 image)
  - `createdAt`: timestamp
  - `createdBy`: deviceId
- Items are:
  - Added one by one
  - Listed in reverse chronological order
  - Scrollable with dynamic length
  - Editable/deletable by original creator (soft ownership via deviceId)
- Item UI includes:
  - Sort dropdown (e.g., “Newest First”)
  - Item count badge (e.g., “Items (4)”)

### ✅ Input UI
- Content-type switch (tabs/buttons for Text or Image)
- Unified input area
- “Add” or “Update” button based on mode
- Edit loads item into the input area
- Optional “Cancel Edit” button shown when editing

### ✅ Conflict Resolution (via Modal)
- When another device has recently edited, a modal appears:
  - Show who edited and when
  - Show both local and remote content (if applicable)
  - Options:
    - “Overwrite remote”
    - “Discard my change”
    - “Append and overwrite”
    - “Cancel” (dismiss modal only)

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
- Archived sessions are not recoverable in MVP

---

## 🧪 MVP Constraints

- No offline mode for now (online-only)
- No WebSockets (uses polling or manual refresh)
- UI optimized for:
  - Desktop and Mobile
  - Two breakpoints (min-width 400px)
  - Responsive layout, no wide screen mode
- No file uploads or rich text yet

---

## 💡 UX and Visual Design

- Default dark mode (light mode optional toggle)
- Style: *elegantly simple*, clear, readable
- Tailwind used throughout, with generous spacing and modern form controls
- Utility-style layout: top section for session info and actions, main section for input and item list
- Scrollable item list area with mock scrollbar

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

### Story 4: Editing an item
> As the original author,  
> I want to update or delete my items  
> So I can fix or remove content I’ve added.

### Story 5: Conflict warning
> As a user trying to push a new item,  
> I want to be warned if someone recently edited  
> So I can decide whether to overwrite or keep both versions.

### Story 6: New session override
> As a user in a session,  
> I want a "New" button  
> So I can leave and start over, with a warning about losing access to the current one.

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

