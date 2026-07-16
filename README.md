# ProManager (Internship)

A production-ready collaborative project management application.

## Tech Stack

### Frontend (`/frontend`)
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI Framework & Build Tool |
| TypeScript 6 | Type Safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI Component Library |
| React Router v7 | Client-side Routing |
| Axios | HTTP Client |
| Zustand | Global State Management |
| TanStack Query v5 | Server State & Data Fetching |
| React Hook Form + Zod | Forms & Validation |

### Backend (`/backend`)
| Technology | Purpose |
|---|---|
| Node.js + Express v5 | Web Framework |
| TypeScript 6 | Type Safety |
| Prisma v7 | ORM |
| MySQL | Database |
| Socket.IO v4 | Real-time (installed, not implemented) |
| Helmet, CORS | Security Middleware |

---

## Project Structure

```
promanager/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Page layout wrappers
│   │   ├── lib/
│   │   │   └── utils.ts     # shadcn/ui cn() utility
│   │   ├── pages/           # Route-level page components
│   │   ├── routes/          # React Router route definitions
│   │   ├── services/        # Axios HTTP client & API services
│   │   ├── store/           # Zustand global state stores
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # General utility functions
│   │   ├── App.tsx          # Root component
│   │   └── index.css        # Global styles (Tailwind v4)
│   ├── .env                 # Frontend environment variables
│   ├── vite.config.ts       # Vite config with path aliases & proxy
│   └── tsconfig.app.json    # TypeScript config
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Prisma database schema (MySQL)
│   ├── src/
│   │   ├── config/          # Database client, env config
│   │   ├── controllers/     # Route controller functions
│   │   ├── generated/       # Prisma generated client (auto-generated)
│   │   ├── middleware/       # Express middleware (error, 404, auth)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic services
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Server entry point
│   ├── .env                 # Backend environment variables
│   ├── nodemon.json         # Nodemon dev server config
│   ├── prisma.config.ts     # Prisma v7 configuration
│   └── tsconfig.json        # TypeScript config
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 20
- MySQL running locally

### Frontend

```bash
cd frontend
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run format       # Prettier format
```

### Backend

```bash
cd backend
npm install
# Configure .env with your MySQL credentials
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run dev               # Start dev server with nodemon on port 5000
npm run build             # Compile TypeScript to dist/
npm run start             # Run compiled server
```
