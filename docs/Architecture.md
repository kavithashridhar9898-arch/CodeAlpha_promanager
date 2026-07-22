# Architecture & System Design

ProManager is built with a decoupled architecture, separating the Next.js frontend from the Express.js API backend, allowing each to scale independently.

## System Architecture

```mermaid
graph TD
    Client[Web Browser] -->|HTTP / WebSocket| Nginx[Reverse Proxy / Ingress]
    
    Nginx -->|Route /api/*| Backend[Node.js + Express API]
    Nginx -->|Route /*| Frontend[Next.js Server]
    
    Frontend -->|SSR Data Fetching| Backend
    
    Backend -->|Queries| Prisma[Prisma ORM]
    Prisma -->|TCP| DB[(MySQL Database)]
    
    Backend -->|Events| Socket[Socket.IO Server]
    Socket -->|Push| Client
```

## Database ERD (Simplified)

```mermaid
erDiagram
    USER ||--o{ ORGANIZATION_MEMBER : has
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : contains
    ORGANIZATION ||--o{ PROJECT : owns
    PROJECT ||--o{ TASK : contains
    USER ||--o{ TASK : assigned_to
    TASK ||--o{ COMMENT : has
    TASK ||--o{ TIME_ENTRY : tracks
```

## Authentication Flow (JWT)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB

    User->>Frontend: Enter Credentials
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: Verify User
    DB-->>Backend: User Data
    Backend-->>Frontend: Set HttpOnly Cookie (JWT) + return User
    Frontend->>Frontend: Update Zustand Store
    Frontend->>User: Redirect to Dashboard
```

## Automated Workflows & Integrations

```mermaid
graph LR
    GitHub[GitHub Webhook] -->|POST /webhook| Backend
    Backend -->|Parse Event| Logic[Workflow Engine]
    Logic -->|Update Task| Prisma
    Logic -->|Emit| Socket[Socket.IO]
    Socket -->|Refresh UI| Client[Frontend App]
```
