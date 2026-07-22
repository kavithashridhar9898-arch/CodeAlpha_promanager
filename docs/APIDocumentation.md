# ProManager API Documentation

## Base URL
`/api`

## Authentication
Most routes are protected and require a Bearer token in the `Authorization` header.
- **Login:** `POST /api/auth/login` (Returns `accessToken`, sets HTTP-only `refreshToken` cookie).
- **Register:** `POST /api/auth/register`
- **Refresh:** `POST /api/auth/refresh`

## Core Modules

### 1. Projects & Boards
- `GET /projects` - Fetch all projects for the current user.
- `POST /projects` - Create a new project.
- `GET /projects/:id/board` - Fetch the Kanban board for a project.

### 2. Time Tracking
- `POST /time/timer/start` - Starts a timer for a specific task.
- `POST /time/timer/stop` - Stops the active timer.
- `GET /time/report/project/:projectId` - Fetches time utilization data per member.

### 3. AI & Automations
- `POST /ai/chat` - Interact with the AI Assistant.
- `POST /automations` - Create a new node-based automation workflow.

---
*For a fully interactive API spec, visit `/api/docs` while the server is running to view the Swagger UI.*
