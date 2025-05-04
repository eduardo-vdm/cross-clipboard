# 🧠 Cursor Meta-Prompt – Cross Clipboard MVP

This project is a minimalist clipboard-sharing web app for personal and portfolio use. It allows users to share clipboard items across multiple devices using numeric session codes — completely anonymously and without authentication.

This prompt is meant to guide an AI agent inside **Cursor IDE** to understand and extend this repo efficiently.

---

## 📘 Project Summary

**Name**: Cross Clipboard  
**Goal**: Share plain text and images across devices using 6-digit codes  
**Style**: Anonymous, minimalistic, practical  
**Target**: Functional MVP, fast delivery, elegant codebase

Clipboard "items" are grouped under a "session" (a 6-digit numeric code). A session may be joined via URL or auto-generated on first use. Multiple devices (max 5) may join a session and push/pull content. Each item is either `text` or `image` and only the originating device may edit/delete it.

Sessions expire after 7 days and are archived (flagged, not deleted). Conflicts are detected only during edit actions and prompt the user to resolve.

---

## 🧱 Stack Overview

- **Client**: React + Vite + TailwindCSS (to be scaffolded)
- **Server**: Node.js + Express
- **Database**: MongoDB (containerized with local dev volumes)
- **Infra**: Docker Compose
  - `client`: exposed on `localhost:5173`
  - `server`: Express API on `localhost:3001`
  - `mongodb`: local DB with init script
- **Authentication**: None — anonymous device identifiers
- **Persistence**:
  - Sessions and Items stored in MongoDB
  - No user accounts

---

## 📂 Project Structure (as of now)

```
cross-clipboard/
├── docker-compose.yml              # Local dev: client, server, mongo
│
├── client/                         # React app (not yet scaffolded)
│   └── Dockerfile
│
├── server/                         # Express API
│   ├── index.js
│   ├── routes/session.js
│   └── Dockerfile
│
├── mongo/                          # Mongo container setup
│   └── mongod.conf
│
├── mongo-init.js                  # Placeholder init script (user only)
│
├── docs/
│   ├── PRD-v2-gpt-4o.md           # Functional specification
│   ├── wireframe-01.png           # Primary session screen layout
│   ├── state-context-diagram.png # Data/input state transition map
│
└── contexts/
    └── [you can save this file here]
```

---

## 🎯 What the Agent Should Do

### 1. **Scaffold client**
- Use Vite + React + TailwindCSS
- Apply layout based on `docs/wireframe-01.png`, `docs/wireframe-02.png`, `docs/wireframe-03.png`
- Implement core UX for:
  - Session code display & sharing
  - Adding items (text/image toggle)
  - Editing/deleting items
  - Conflict modals

### 2. **Expand server**
- Define `session` and `item` schema/models (Mongo)
- Implement routes to:
  - Create session
  - Join session by code
  - Add/edit/delete item (check for conflicts)
  - Fetch session content
- Avoid monolithic files — modular routes/controllers preferred

### 3. **Follow PRD logic**
- All state and behavioral logic should align with `docs/PRD-v2-gpt-4o.md`
- Use `docs/state-context-diagram.png` to handle edge cases like:
  - Editing while another device is editing
  - Session joining via direct link
  - DeviceID ownership

---

## 🧠 Agent Behavior Guidelines

- 🔧 Scaffold missing logic before diving deep into features
- 💬 Explain changes, but don’t be overly verbose
- 🧱 Avoid enforcing overly rigid patterns (let dev refactor later)
- 🧭 If a decision is unclear or risky, ask first
- 💡 Think like a co-dev, not a linter

---

## 🛠 Example Prompts for Cursor Agent

You can paste this and then ask:
- "Scaffold the React + Vite + Tailwind client folder and match layout to wireframe-01"
- "Set up session and item Mongo models per PRD"
- "Add API route to submit new items to a session"
- "Implement item conflict modal UI logic"
