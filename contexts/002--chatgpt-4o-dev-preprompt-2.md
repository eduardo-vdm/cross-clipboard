🧠 **Meta-Prompt for Cursor Agent (Cross Clipboard App)**

You are resuming development on a full-stack web application named **Cross Clipboard**. This project is designed to **sync and share clipboard content between multiple devices or users**, using short numeric session codes.

You MUST follow this context and treat it as the **source of truth** for the project goals, architecture, and current progress. The user is developing this as an MVP-focused tool for personal productivity and as a showcase project for their portfolio.

Use best practices, but do not over-engineer. Prioritize real functionality over polish.

---

# 📌 Cross Clipboard — Product Context & Goals

## 💡 Purpose
A utility app that allows a user (or small group of users) to copy and paste text, rich text, images, or files across multiple devices using a shared **6-digit session code**.

## 🧪 MVP Goals (Stage: In Progress)
- Share **plain text** via 6-digit codes
- Session created via backend (`POST /session`) and retrievable by others (`GET /session/:code`)
- Handle overwrites with basic **soft conflict resolution**
- Local development via Docker (React client, Express server, MongoDB)

## 🚧 Future Features (Out of Scope for now)
- Rich text, image, and file sync
- WebSocket syncing
- Authentication or user accounts

---

# ⚙️ Architecture

## Frontend
- React + Vite + TailwindCSS
- Exposes port 5173 via Docker
- Minimal UI currently; App.jsx is scaffolded
- Goal: show a textbox, a "share" button, and a "join" code field

## Backend
- Node.js + Express API
- MongoDB via Docker (one instance per project)
- Routes:
  - `POST /api/session`: creates a new session with 6-digit code
  - `POST /api/session/:code`: writes content to a session (with optional `deviceId`)
  - `GET /api/session/:code`: retrieves session content and metadata
- Conflict handling: if another device wrote < 5s ago, return HTTP 409 Conflict

## Mongo Schema (per session)
```json
{
  "code": "123456",
  "content": "Some shared text",
  "type": "text",
  "createdAt": "...",
  "updatedAt": "...",
  "lastUpdatedBy": "deviceId-string",
  "lockedBy": null,
  "lockedAt": null
}
```

---

# ✅ What Has Been Done

- Docker containers work for server, client, and Mongo
- Backend logic and seeding scripts working
- Routes implemented and confirmed manually via curl
- Markdown summary available in `001--chatgpt-4o-dev-preprompt.md`

---

# ⏭️ What You Should Help With Next

## Suggestion 1: Implement a basic UI in `App.jsx`
- Input field to write shared text
- Button to create a new session
- Show generated 6-digit code
- Input to enter an existing code and retrieve content
- Show warnings if 409 Conflict occurs (i.e., "Recently updated by another device")

## Suggestion 2: Add reusable API helpers
- `createSession()`
- `updateSession(code, content, deviceId)`
- `fetchSession(code)`

Use `fetch()` or Axios to call the Express API.

---

Be concise, respectful of the context, and always assume the backend is working as described above.
