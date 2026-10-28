# TaskFlow — Full-Stack Task Management System

TaskFlow is a production-grade, responsive task management platform built with React, Node.js, Express, and SQLite. Designed as a college final-year capstone project and technical placement portfolio piece.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Axios, Modern CSS (CSS Variables, Flexbox, CSS Grid)
- **Backend:** Node.js, Express.js REST API
- **Database:** SQLite (`taskflow.db`) with parameterized queries and foreign keys
- **Security:** JWT authentication, bcryptjs password hashing, protected routes, CORS

## ✨ Features

- **Authentication:** Registration, login, session persistence, secure password hashing.
- **Task Management:** Create, view, edit, delete with confirmation.
- **Organization:** Real-time search by title/description, filter by status and priority, sort by date.
- **Task Analytics:** Instant summary statistics for total, pending, in-progress, and completed tasks.
- **Strict Data Isolation:** Each user can only access, modify, or delete their own tasks.
- **Responsive Design:** Optimized layout for desktop, tablet, and mobile screens.

## 🛠️ Local Setup (Windows)

### Prerequisites
- Node.js v18+ (tested on Node.js v24.7.0)
- npm v9+

### 1. Clone & Navigate
```powershell
cd "C:\placement project"
```

### 2. Start Both Services
Run the included launch script:
```powershell
& "C:\placement project\run-app.ps1"
```

Or run them individually:
- **Backend:**
  ```powershell
  cd backend
  npm run dev
  ```
  Runs at: `http://localhost:5000`

- **Frontend:**
  ```powershell
  cd frontend
  npm run dev
  ```
  Runs at: `http://localhost:5173`

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token |
| `GET` | `/api/auth/me` | Get current user profile (Protected) |
| `GET` | `/api/tasks` | List tasks & summary stats (Protected) |
| `GET` | `/api/tasks/:id` | Get single task details (Protected) |
| `POST` | `/api/tasks` | Create a new task (Protected) |
| `PUT` | `/api/tasks/:id` | Update task details/status (Protected) |
| `DELETE` | `/api/tasks/:id` | Delete task permanently (Protected) |

## 🧪 Testing Checklist

- [x] User registration with email regex & password length validation
- [x] Duplicate email prevention (HTTP 409)
- [x] Secure password hashing with bcryptjs (10 salt rounds)
- [x] JWT token generation, verification, and route protection
- [x] Task CRUD operations with ownership enforcement
- [x] Live search, status/priority filtering, and sorting
- [x] Responsive layout across desktop, tablet, and mobile devices
- [x] SQLite file persistence across application restarts