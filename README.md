# 🟩 PixelGrid Live - Real-Time Shared Grid App

[![Full Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Socket.IO%20%7C%20Prisma-indigo)](https://github.com/surjeetkumar8006/PixelGrid)
[![Grid Size](https://img.shields.io/badge/Grid-30x30%20(900%20Blocks)-emerald)](#)
[![License](https://img.shields.io/badge/License-MIT-blue)](#)

A high-performance, real-time shared grid web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **Socket.IO**, and **Prisma ORM**. 

Hundreds of concurrent users can claim blocks on a shared 30×30 (900 blocks) board with instant real-time synchronization, atomic conflict resolution, live player cursor tracking, activity streams, and audio-visual feedback.

---

## 📋 Assignment Submission Form Answers

### 1. Deployed App Link / Running Locally
- **Local Development App:** `http://localhost:5173` (Frontend) & `http://localhost:5000` (Backend REST & WebSockets)
- **Deployment Ready:** Frontend configured for **Vercel**; Backend configured for **Render / Railway / Fly.io**; Database compatible with **Neon PostgreSQL** or local **SQLite**.

### 2. GitHub Repository Link
- **Repository:** Public Git Repo (`https://github.com/surjeetkumar8006/PixelGrid`)

### 3. Tech Stack Used
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript | Fast, type-safe interactive UI |
| **Styling & Icons**| Tailwind CSS, Lucide React, Framer Motion | Modern dark theme, smooth micro-interactions |
| **Canvas Engine** | HTML5 Canvas API | 60 FPS Zoom/Pan rendering for 900+ cells |
| **Backend** | Node.js, Express, TypeScript | REST API & HTTP server |
| **Real-Time** | Socket.IO (WebSockets) | Instant state sync & multiplayer cursors |
| **Database** | Prisma ORM (SQLite / PostgreSQL) | Persistent storage & atomic state transactions |
| **Audio** | Web Audio API | Zero-dependency procedural synth sound FX |

---

### 4. How did you handle real-time updates?
Real-time updates are handled using **Socket.IO over WebSockets** with a single-source-of-truth backend:

1. **Bi-Directional Event Synchronization:**
   - On connect, the server emits `init:data` containing the full 900-block snapshot, current leaderboard, stats, and active players.
   - When any user clicks a block, a `block:claim` event is emitted to the server.
2. **Atomic Verification & Broadcasting:**
   - The backend runs a database transaction (`claimBlockAtomic`) to check ownership and rate limiting.
   - Upon successful claim, the server broadcasts `block:claimed` to **ALL** connected sockets simultaneously.
   - All clients update their grid canvas instantly without refreshing.
3. **Live Multiplayer Cursors:**
   - Mouse movements on the canvas emit `cursor:move` events, which are relayed to other connected sockets to render live floating player cursors with username badges.

---

### 5. What trade-offs did you make?

| Area | Choice | Trade-off & Rationale |
| :--- | :--- | :--- |
| **Rendering** | HTML5 Canvas vs DOM Grid | Used **HTML5 Canvas** instead of 900 `<div>` DOM nodes. DOM nodes can cause layout thrashing with rapid color updates and zoom/pan; Canvas provides buttery 60 FPS performance and low memory overhead. |
| **Database** | Prisma SQLite (Local) / PostgreSQL | Selected **Prisma with SQLite** for zero-config out-of-the-box local execution, while keeping the schema 100% compliant with PostgreSQL/Neon for production deployment. |
| **Concurrency** | 3-Second Action Cooldown | Implemented a **3-second action cooldown** per player to balance gameplay, prevent click-bot spamming, and give all connected users a fair chance to compete. |
| **WebSockets** | Socket.IO vs Raw WebSockets | Used **Socket.IO** instead of raw `ws` module for built-in automatic reconnects, fallback transport options (polling/websocket), and room management. |

---

### 6. Any bonus features you added?
- 🟢 **Live Multiplayer Cursors:** Real-time visibility of other players' cursor positions on the shared grid map.
- ⚡ **Atomic Conflict Protection:** Backend transaction ensures simultaneous clicks resolve with 1 winner, while giving second-place users a clear *"This block was already claimed!"* warning.
- ⏳ **Visual Cooldown Timer Bar:** 3-second visual progress countdown bar (`2.4s remaining`).
- 🏆 **Real-Time Leaderboard:** Live ranking of top land owners with owned block counts and percentage coverage.
- 📊 **Statistics Dashboard:** Top header metrics displaying Total (900), Claimed, Available, Online Users, and Your Blocks.
- 📜 **Live Activity Feed:** Stream of recent block captures with timestamps ("Surjeet captured #247").
- 🔍 **Interactive Zoom & Pan:** Smooth mouse wheel zoom, click & drag pan, hover tooltips, and reset view controls.
- 🔊 **Web Audio Synth Effects:** Procedural sound pops for captures, conflict buzzes, and player join notifications without any external asset loading.
- 📱 **Fully Responsive Layout:** Optimized 2-column desktop layout and compact 1-column mobile interface.

---

## 🛠️ Quick Start (Run Locally)

### Prerequisites
- Node.js v18+ and npm

### 1. Run the Backend Server
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*Server starts on `http://localhost:5000`*

### 2. Run the Frontend Client
```bash
cd client
npm install
npm run dev
```
*App opens on `http://localhost:5173`*

---

## 🎮 How to Play
1. Enter your **Username** and pick your favorite **Theme Color**.
2. Click **Join Grid** to connect to the live shared canvas.
3. Click any unclaimed cell (or enemy block) to trigger the capture confirmation dialog.
4. Watch the cell change to your color in real-time across all connected browser tabs!
5. Track your rank on the live **Leaderboard** and watch the **Activity Feed**!

---

## 🧪 Testing Real-Time Sync & Conflict Handling
1. Open `http://localhost:5173` in two different browser tabs (or Chrome + Firefox).
2. Enter different usernames in each tab (e.g. *Surjeet* in Tab 1, *Rahul* in Tab 2).
3. Click Block #100 in Tab 1 -> Watch Tab 2 update instantly without refreshing!
4. Try clicking the same block simultaneously from both tabs to test atomic conflict rejection.
