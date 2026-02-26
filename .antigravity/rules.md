# Antigravity IDE Workspace Rules: Enterprise Polling Platform

## 1. Project Context & Identity
- **Project Goal:** Build a highly scalable, real-time B2B polling and survey platform (similar to Mentimeter). 
- **Target Audience:** Corporate environments, town halls, internal trainings, and professional conferences.
- **Key Characteristics:** Enterprise-grade security, extreme stability under high concurrent load, and sophisticated data visualization.

## 2. Technical Stack
- **Frontend:** Next.js (App Router), React, TypeScript.
- **Styling & UI:** Tailwind CSS, Radix UI (or shadcn/ui) for accessible components, Framer Motion for smooth transitions.
- **Data Visualization:** Recharts or D3.js.
- **Backend:** NestJS (Node.js framework), TypeScript.
- **Real-time Engine:** Socket.io.
- **Database & Cache:** PostgreSQL (primary data), Redis (caching and WebSockets Pub/Sub).
- **Infrastructure:** Docker, Docker Compose.

## 3. UI/UX Core Principles (@Agent: Strictly follow these)
- **Participant View (Mobile-first):** - MUST be ultra-minimalist and frictionless. No login required to join a session.
  - Flow: Enter 6-digit PIN -> Enter Name (optional) -> Wait for Presenter -> Vote.
  - Use large, accessible tap targets (min 44x44px), high contrast ratios, and progressive disclosure (one question per screen).
- **Presenter View (Desktop-first):**
  - Use Dark Mode by default for presentation screens to reduce glare on stage.
  - Implement real-time updating charts (Bar, Donut, Word Cloud) with smooth animations (no layout thrashing).
  - Include a hidden control dashboard with keyboard shortcuts for slide navigation and result toggling.

## 4. Architecture & Concurrency Rules
- **Microservices-ready:** Keep Frontend and Backend strictly separated. Use RESTful APIs for standard CRUD and WebSockets for real-time interactions.
- **High Concurrency:** The WebSockets implementation MUST use the `socket.io-redis` adapter. The system must be designed assuming it will scale across multiple load-balanced backend containers.
- **State Synchronization:** The Presenter dictates the "State" (e.g., current active question). Participants' screens must sync instantly based on the Presenter's state.

## 5. Agent Behaviors & Coding Standards
- **Strict TypeScript:** Enforce strong typing for all interfaces, DTOs, and API responses. No `any` types.
- **Docker-First:** Always ensure that new dependencies or services are reflected in the `Dockerfile` and `docker-compose.yml`. Use environment variables (`.env`) for all secrets and database URIs.
- **Validation:** Always validate incoming payloads on the backend using `class-validator` in NestJS to prevent injection or malformed data crashes.
- **Testing:** When asked to verify, write load testing scripts (e.g., using K6 or Artillery) to simulate hundreds of concurrent WebSocket connections.
- **Artifact Creation:** For complex logic (like the WebSockets event flow or Database Schema), generate an Artifact/Markdown document first for review before writing code.

"Feature Requirement: The system must support two session types: 'Live Synchronous' (with strict server-side timers, e.g., 20s per question) and 'Self-paced Asynchronous' surveys. Questions must support categorization tags (e.g., Awareness, Mindset) so the backend can aggregate results and the frontend can render percentage-based analytical charts (Radar/Bar charts) mapping users' behavioral scores."