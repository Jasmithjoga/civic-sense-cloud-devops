# 🏙️ Smart Civic Issue Reporting & Resolution Platform

A frontend-only responsive web app for reporting and tracking civic issues in Indian cities, built as a hackathon project.

## 🚀 Live Demo

> Run locally with `npm start` → opens at [http://localhost:3000](http://localhost:3000)

## ✨ Features

- 📝 **Report Issues** — Select type, upload photo, auto-detect GPS location, duplicate detection
- 🔍 **Track Complaints** — Search by Complaint ID, view 4-step status timeline
- 🗺️ **Map View** — Color-coded complaint pins on an SVG city map
- 🔐 **Admin Dashboard** — Assign departments, update statuses, email notification simulation
- 📊 **Analytics** — Bar, Pie & Area charts (Recharts) with hotspot resolution table
- 🌙 **Dark Mode** — Full light/dark theme with localStorage persistence
- 💾 **Persistent Storage** — All data lives in localStorage (no backend needed)
- 📧 **Email Simulation** — Collects reporter email; shows email preview modal on resolution

## 🛠️ Tech Stack

- **React 19** + **React Router v6**
- **Tailwind CSS v3** (dark mode, custom civic palette)
- **Recharts** (analytics charts)
- **Lucide React** (icons)
- **React Hot Toast** (notifications)
- **localStorage** (data persistence)

## 📦 Installation

```bash
git clone <repo-url>
cd my-app
npm install
npm start
```

## 📁 Project Structure

```
src/
├── context/AppContext.jsx    # Global state (complaints, role, dark mode)
├── data/mockData.js          # 10 pre-seeded Mumbai complaints + stats
├── hooks/useLocalStorage.js  # localStorage persistence hook
├── utils/helpers.js          # ID generation, priority logic, helpers
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── ui/                   # Badge, Skeleton, EmptyState
│   └── complaints/           # ComplaintCard, StatusTimeline
└── pages/                    # 7 pages
```

## 🧪 Sample Complaint IDs

| ID | Type | Status |
|----|------|--------|
| `CIV-2026-0001` | Pothole | ✅ Resolved |
| `CIV-2026-0005` | Drainage | ⏳ Pending |
| `CIV-2026-0002` | Streetlight | 🔧 In Progress |

## 📄 License

MIT — Built for Hackathon Demo purposes.
