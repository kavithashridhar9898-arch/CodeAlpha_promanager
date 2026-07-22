<div align="center">
  <img src="docs/assets/logo.png" alt="ProManager Logo" width="120" />
  
  # ProManager 🚀
  
  **The Enterprise-Grade Collaborative Project Management Platform**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

  [View Live Demo](#demo) • [Read Architecture](docs/Architecture.md) • [Report Bug](.github/ISSUE_TEMPLATE/bug_report.md) • [Request Feature](.github/ISSUE_TEMPLATE/feature_request.md)
</div>

<br />

ProManager is a modern, fast, and feature-rich open-source project management application designed for agile teams. Built from the ground up for scale, it integrates real-time collaboration, an embedded AI Assistant, interactive Gantt charts, and advanced resource management.

![ProManager Dashboard Preview](docs/assets/screenshots/dashboard.png)

---

## ✨ Features

- **Interactive Kanban Boards:** Drag-and-drop task management with customizable columns and real-time Socket.IO updates.
- **Gantt Charts & Timelines:** Visualize project dependencies, critical paths, and project durations.
- **Embedded AI Assistant (ProAI):** Generate task summaries, analyze project risks, and automatically route issues.
- **Time Tracking & Timesheets:** Track billable hours and view resource allocation heatmaps.
- **Advanced Resource Management:** Prevent team burnout with visual capacity planning.
- **GitHub Integration:** Automatically link PRs and commits to tasks via Webhooks.
- **Enterprise Security:** XSS sanitization, Helmet headers, robust Rate Limiting, and unified Winston logging.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router) & React 19
- **Styling:** Tailwind CSS v4 & `shadcn/ui`
- **State Management:** Zustand (Global) & TanStack Query v5 (Server State)
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod validation

### Backend
- **Core:** Node.js + Express v5
- **Language:** TypeScript
- **Database:** PostgreSQL / MySQL (via Prisma ORM)
- **Real-time:** Socket.IO v4
- **Security:** Helmet, `xss` Middleware, `express-rate-limit`
- **Logging:** Winston + Morgan

---

## 🚀 Quick Start (Demo Mode)

Want to see it in action without configuring a database?

1. Clone the repository:
   ```bash
   git clone https://github.com/promanager/promanager.git
   cd promanager
   ```
2. Start the stack via Docker:
   ```bash
   docker-compose up -d
   ```
3. Open `http://localhost:3000` and click **"Try Demo Workspace"** on the login page!

---

## 💻 Manual Development Setup

### Prerequisites
- Node.js >= 20
- MySQL or PostgreSQL database

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Update with your DB credentials
npm run prisma:generate
npm run prisma:migrate
npm run seed             # (Optional) Load sample data
npm run dev
```
### 2. Frontend Setup
```bash
cd frontend-v2
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```
The app will be running at `http://localhost:3000`.

---

## 🏗️ Architecture

Read the full [Architecture & System Design Documentation](docs/Architecture.md) to explore the system's database schema, authentication flow, and real-time infrastructure.

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
