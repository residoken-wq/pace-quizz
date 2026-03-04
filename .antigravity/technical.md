# PACE Quizz — Technical Documentation

> Tài liệu kỹ thuật dành cho collaborators cùng phát triển dự án qua GitHub.

---

## 1. Tổng Quan Dự Án

**PACE Quizz** là một ứng dụng tương tác trực tiếp (live interactive quizzing) cho phép Presenter tạo phiên quiz, Participant tham gia trả lời qua mã PIN, và kết quả được hiển thị real-time.

### Các vai trò chính

| Vai trò       | Mô tả                                                              |
|---------------|---------------------------------------------------------------------|
| **Admin**     | Quản lý hệ thống, quản lý users (thêm/sửa/xóa HOST)               |
| **Host**      | Tạo Session, thiết lập câu hỏi, điều khiển phiên live              |
| **Presenter** | Trình chiếu Session lên màn hình lớn, xem kết quả real-time        |
| **Participant** | Tham gia trả lời quiz bằng mã PIN, chọn đáp án                   |

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────┐
│                   NGINX / Reverse Proxy             │
└────────┬───────────────────────┬────────────────────┘
         │                       │
   ┌─────▼──────┐         ┌─────▼──────┐
   │  Frontend   │         │  Backend   │
   │  (Next.js)  │         │  (NestJS)  │
   │  Port 3000  │         │  Port 3001 │
   └─────────────┘         └─────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼──┐  ┌─────▼──┐  ┌──────▼──┐
              │Postgres│  │ Redis  │  │Uploads  │
              │  :5432 │  │ :6379  │  │  /dist/ │
              └────────┘  └────────┘  └─────────┘
```

### Giao tiếp

- **REST API**: Frontend → Backend qua HTTP (JWT Bearer Token)
- **WebSocket**: Real-time via Socket.IO + Redis Adapter (cho horizontal scaling)

---

## 3. Cấu Trúc Thư Mục

```
pace-quizz/
├── docker-compose.yml          # Docker orchestration
│
├── backend/                    # ── NestJS Backend ──
│   ├── Dockerfile
│   ├── .env                    # ← Env vars (GIT IGNORED)
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── main.ts             # Entry point (port, CORS, static serve)
│   │   ├── app.module.ts       # Root module
│   │   ├── redis-io.adapter.ts # Socket.IO + Redis adapter
│   │   ├── prisma/             # PrismaService (DB connection)
│   │   ├── auth/               # JWT + Passport auth
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   ├── strategies/     # JwtStrategy
│   │   │   └── decorators/     # @Roles() decorator
│   │   ├── users/              # User CRUD (admin management)
│   │   ├── sessions/           # Session CRUD + business logic
│   │   ├── questions/          # Question CRUD (per session)
│   │   ├── responses/          # Participant response handling
│   │   ├── events/             # WebSocket Gateway (Socket.IO)
│   │   │   └── events.gateway.ts
│   │   └── upload/             # File upload (multer → /dist/uploads/)
│   └── test/                   # E2E tests
│
├── frontend/                   # ── Next.js Frontend ──
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── postcss.config.mjs      # PostCSS + Tailwind
│   ├── public/                 # Static assets (images, icons)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Home / Landing page
│       │   ├── globals.css     # Global styles (Tailwind v4)
│       │   ├── admin/          # Admin panel
│       │   │   ├── layout.tsx
│       │   │   ├── login/      # Admin login
│       │   │   └── users/      # User management
│       │   ├── presenter/      # Presenter views
│       │   │   ├── login/      # Presenter login
│       │   │   ├── dashboard/  # Session list / management
│       │   │   ├── edit/       # Session & question editor
│       │   │   ├── [id]/       # Live session presenter view
│       │   │   └── components/ # Real-time result visualizations
│       │   │       ├── LiveQuestionChart.tsx
│       │   │       ├── PodiumLeaderboard.tsx
│       │   │       └── WordCloudDisplay.tsx
│       │   └── participant/
│       │       └── [pin]/      # Participant join & answer via PIN
│       ├── components/         # Shared UI components
│       ├── context/
│       │   └── SocketProvider.tsx  # Socket.IO context
│       └── lib/
│           └── utils.ts        # Utility functions (cn, API helpers)
│
└── .antigravity/               # AI agent notes & docs
```

---

## 4. Tech Stack

### Backend

| Công nghệ        | Phiên bản | Mục đích                             |
|-------------------|-----------|--------------------------------------|
| **Node.js**       | 20        | Runtime                              |
| **NestJS**        | 11        | Framework (modules, DI, decorators)  |
| **Prisma**        | 5.22      | ORM — Schema-first + migrations      |
| **PostgreSQL**    | 15        | Database chính                       |
| **Redis**         | 7         | WebSocket adapter + caching          |
| **Socket.IO**     | —         | Real-time communication              |
| **Passport + JWT**| —         | Authentication                       |
| **Multer**        | 2         | File upload handling                 |
| **bcryptjs**      | 3         | Password hashing                     |

### Frontend

| Công nghệ         | Phiên bản | Mục đích                            |
|--------------------|-----------|--------------------------------------|
| **Next.js**        | 16        | React framework (App Router, SSR)    |
| **React**          | 19        | UI library                           |
| **Tailwind CSS**   | 4         | Utility-first styling                |
| **Recharts**       | 3         | Charts (Bar, Radar)                  |
| **Framer Motion**  | 12        | Animations                           |
| **Socket.IO Client** | 4       | WebSocket client                     |
| **Lucide React**   | —         | Icon library                         |
| **QRCode**         | —         | Generate QR cho join link            |

---

## 5. Database Schema (Prisma)

### ERD tóm tắt

```mermaid
erDiagram
    User ||--o{ Session : "hosts"
    Session ||--o{ Question : "has"
    Session ||--o{ Participant : "has"
    Session ||--o{ ActivityLog : "logs"
    Question }o--o{ Tag : "tagged"
    Question ||--o{ Response : "receives"
    Participant ||--o{ Response : "submits"

    User {
        String id PK
        String email UK
        String name
        String password
        Role role
    }
    Session {
        String id PK
        String name
        String pin UK
        SessionType type
        SessionStatus status
        String hostId FK
    }
    Question {
        String id PK
        String sessionId FK
        String title
        Int order
        QuestionType type
        Json options
        Int timeLimit
    }
    Participant {
        String id PK
        String sessionId FK
        String nickname
        String mascot
    }
    Response {
        String id PK
        String participantId FK
        String questionId FK
        Json answer
        Int score
        Int timeTaken
    }
```

### Enums

| Enum              | Giá trị                                     |
|-------------------|---------------------------------------------|
| `Role`            | `ADMIN`, `HOST`                             |
| `SessionType`     | `LIVE`, `SURVEY`                            |
| `SessionStatus`   | `CREATED`, `ACTIVE`, `FINISHED`             |
| `QuestionType`    | `MULTIPLE_CHOICE`, `WORD_CLOUD`, `RATING_SCALE`, `POLL` |
| `ActivityAction`  | `SESSION_STARTED`, `SESSION_ENDED`, `RESULTS_RESET`, `QUESTION_NAVIGATED`, `PARTICIPANT_JOINED` |

---

## 6. Thiết Lập Môi Trường Dev

### Yêu cầu

- **Node.js** >= 20
- **npm** >= 9
- **Docker & Docker Compose** (cho DB + Redis)
- **Git**

### Bước 1 — Clone repo

```bash
git clone https://github.com/<org>/pace-quizz.git
cd pace-quizz
```

### Bước 2 — Backend setup

```bash
cd backend
cp .env.example .env        # Tạo file .env từ example
npm install
npx prisma generate         # Generate Prisma Client
npx prisma db push          # Sync schema → DB
npm run start:dev            # Chạy dev server (hot reload)
```

### Bước 3 — Frontend setup

```bash
cd frontend
npm install
npm run dev                  # Chạy Next.js dev (port 3000)
```

### Bước 4 — Database & Redis (Docker)

Nếu chỉ cần Postgres + Redis mà không build toàn bộ:

```bash
# Ở thư mục gốc
docker compose up db redis -d
```

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Biến                | Mô tả                                     | Ví dụ                                                               |
|---------------------|--------------------------------------------|----------------------------------------------------------------------|
| `DATABASE_URL`      | Prisma connection string                   | `postgresql://postgres:postgres@localhost:5432/pace_quizz`           |
| `JWT_SECRET`        | Secret key cho JWT token                   | `your-super-secret-key`                                              |
| `REDIS_HOST`        | Redis hostname                             | `localhost` (dev) / `redis` (Docker)                                 |
| `REDIS_PORT`        | Redis port                                 | `6379`                                                               |
| `PORT`              | Backend listening port                     | `3001`                                                               |

### Frontend (env / build arg)

| Biến                   | Mô tả                       | Ví dụ                                |
|------------------------|------------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL          | `http://localhost:3001` (dev)        |

> [!IMPORTANT]
> File `.env` được **gitignored**. Mỗi collaborator phải tự tạo file `.env` theo mẫu trên. KHÔNG commit secrets lên GitHub.

---

## 8. API Modules & Endpoints

### Auth (`/auth`)

| Method | Endpoint        | Mô tả                        | Auth |
|--------|-----------------|-------------------------------|------|
| POST   | `/auth/login`   | Đăng nhập → trả về JWT token | ❌   |

### Users (`/users`) — Admin only

| Method | Endpoint         | Mô tả               | Auth  |
|--------|------------------|----------------------|-------|
| GET    | `/users`         | Danh sách users      | ADMIN |
| POST   | `/users`         | Tạo user mới         | ADMIN |
| PATCH  | `/users/:id`     | Cập nhật user        | ADMIN |
| DELETE | `/users/:id`     | Xóa user             | ADMIN |

### Sessions (`/sessions`) — Host

| Method | Endpoint                | Mô tả                         | Auth |
|--------|-------------------------|--------------------------------|------|
| POST   | `/sessions`             | Tạo session mới                | HOST |
| GET    | `/sessions`             | Lấy sessions của host hiện tại | HOST |
| GET    | `/sessions/:id`         | Chi tiết session               | HOST |
| PATCH  | `/sessions/:id`         | Update session                 | HOST |
| DELETE | `/sessions/:id`         | Xóa session                    | HOST |
| GET    | `/sessions/pin/:pin`    | Tìm session qua PIN (public)   | ❌   |

### Questions (`/questions`) — Host

| Method | Endpoint            | Mô tả                | Auth |
|--------|---------------------|-----------------------|------|
| POST   | `/questions`        | Tạo question          | HOST |
| PATCH  | `/questions/:id`    | Update question       | HOST |
| DELETE | `/questions/:id`    | Xóa question          | HOST |

### Responses (`/responses`)

| Method | Endpoint            | Mô tả                       | Auth |
|--------|---------------------|------------------------------|------|
| POST   | `/responses`        | Submit response (participant) | ❌   |

### Upload (`/upload`)

| Method | Endpoint   | Mô tả             | Auth |
|--------|------------|--------------------|------|
| POST   | `/upload`  | Upload file/image  | HOST |

---

## 9. WebSocket Events (Socket.IO)

Gateway: `events.gateway.ts` — namespace mặc định `/`

| Event              | Direction           | Payload                              | Mô tả                                     |
|--------------------|---------------------|--------------------------------------|--------------------------------------------|
| `join-session`     | Client → Server     | `{ pin, nickname, mascot }`          | Participant join phiên                     |
| `vote-update`      | Server → Client     | Question results data                | Broadcast kết quả vote real-time           |
| `participant-joined` | Server → Client   | `{ participant }`                    | Thông báo có người mới tham gia            |
| `submit-vote`      | Client → Server     | `{ optionId, sessionId }`            | Participant gửi câu trả lời               |
| `navigate-question` | Client → Server    | `{ sessionId, questionIndex }`       | Presenter chuyển câu hỏi                  |

> Redis Adapter được sử dụng (`redis-io.adapter.ts`) để broadcast events xuyên suốt nhiều instances khi scale horizontal.

---

## 10. Docker — Deployment

### Services

| Service      | Image / Build         | Container Name          | Port nội bộ |
|--------------|----------------------|-------------------------|-------------|
| `db`         | `postgres:15-alpine` | `pace_quizz_db`         | 5432        |
| `redis`      | `redis:7-alpine`     | `pace_quizz_redis`      | 6379        |
| `backend`    | Build `./backend`    | `pace_quizz_backend`    | 3001        |
| `frontend`   | Build `./frontend`   | `pace_quizz_frontend`   | 3000        |

### Deploy commands

```bash
# Build & start tất cả services
docker compose up --build -d

# Xem logs
docker compose logs -f backend

# Restart 1 service
docker compose restart backend

# Rebuild chỉ frontend
docker compose up --build -d frontend
```

### Networks

- `default` — internal service-to-service
- `proxy_net` — kết nối tới Nginx Proxy Manager (external)
- `nexus-network` — kết nối tới các service khác trên VPS

---

## 11. Git Workflow & Branching

### Branch structure

```
main                ← Production-ready code
 └── develop        ← Integration branch
      ├── feature/xxx     ← New features
      ├── fix/xxx         ← Bug fixes
      └── hotfix/xxx      ← Urgent production fixes
```

### Quy trình làm việc

1. **Tạo branch** từ `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ten-tinh-nang
   ```

2. **Code & commit** theo convention:
   ```
   feat: thêm word cloud component
   fix: sửa lỗi WebSocket reconnect
   refactor: tách service ra module riêng
   docs: cập nhật technical docs
   ```

3. **Push & tạo Pull Request** vào `develop`:
   ```bash
   git push origin feature/ten-tinh-nang
   ```

4. **Code Review** → Approve → Merge

5. **Release**: merge `develop` → `main` → deploy

---

## 12. Coding Conventions

### Backend (NestJS)

- Sử dụng **module pattern**: mỗi feature là 1 module (`*.module.ts`, `*.service.ts`, `*.controller.ts`)
- DTOs dùng `class-validator` decorators
- Guard cho authentication (`JwtAuthGuard`) và authorization (`RolesGuard`)
- Prisma service inject qua DI
- Error handling: throw `HttpException` hoặc built-in exceptions

### Frontend (Next.js)

- **App Router** (directory-based routing)
- Component đặt trong `components/` (shared) hoặc `presenter/components/` (feature-specific)
- State real-time qua `SocketProvider` context
- Styling: **Tailwind CSS v4** — utility classes, không viết CSS riêng
- Animation: **Framer Motion** cho micro-interactions

### General

- TypeScript **strict mode**
- Prettier + ESLint cho formatting
- Tất cả text hardcode bằng tiếng Anh trong code, UI text có thể song ngữ
- Không commit `node_modules`, `.env`, `.next`, `dist`

---

## 13. Scripts Tham Khảo Nhanh

### Backend

| Script              | Lệnh                     | Mô tả                          |
|---------------------|---------------------------|---------------------------------|
| Dev server          | `npm run start:dev`       | Hot reload                      |
| Production build    | `npm run build`           | Compile → `dist/`              |
| Production start    | `npm run start:prod`      | Chạy từ `dist/`               |
| Prisma generate     | `npx prisma generate`     | Generate Prisma Client          |
| Prisma push schema  | `npx prisma db push`      | Sync schema → DB (no migration) |
| Lint                | `npm run lint`            | ESLint fix                      |
| Format              | `npm run format`          | Prettier                        |
| Test                | `npm run test`            | Jest unit tests                 |

### Frontend

| Script          | Lệnh             | Mô tả                  |
|-----------------|-------------------|-------------------------|
| Dev server      | `npm run dev`     | Next.js dev (port 3000) |
| Production build | `npm run build`  | Static + SSR build      |
| Production start | `npm run start`  | Serve built app         |
| Lint            | `npm run lint`    | ESLint                  |

---

## 14. Liên Hệ & Tài Nguyên

- **Repository**: `https://github.com/<org>/pace-quizz`
- **Tên miền Production**: `quizz.pace.edu.vn` (frontend), `api.quizz.pace.edu.vn` (backend)
- **Reverse Proxy**: Nginx Proxy Manager trên VPS
- **UI Components Spec**: xem [`.antigravity/ui-components.md`](file:///c:/Users/nt.nhan/Documents/GitHub/pace-quizz/.antigravity/ui-components.md)

---

*Cập nhật lần cuối: 2026-03-04*
