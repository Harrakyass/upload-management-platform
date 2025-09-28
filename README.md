# Upload Management Platform

## Overview
The **Upload Management Platform** is a full-stack web application designed to manage document uploads securely and efficiently. It consists of a **React (Vite)** frontend and a **Node.js (Express)** backend, connected to a **PostgreSQL** database.

### Key Features
- Secure file upload using `multer`
- Authentication with JWT and password hashing (`bcryptjs`)
- Middleware for security (`helmet`, `cors`)
- Logging with `morgan`
- Environment-based configuration with `dotenv`

## Project Structure
```
upload-management-platform/
├── client/          # React frontend (Vite)
├── server/          # Express backend
└── package.json     # Root scripts for running client & server together
```

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS (optional for styling)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication & Security**: JWT, bcryptjs, helmet, cors
- **File Uploads**: multer
- **Other Tools**: dotenv, morgan, nodemon, concurrently

## Prerequisites
- Node.js (v18+ recommended)
- npm
- PostgreSQL

## Setup Instructions

### 1. Clone the project
```bash
git clone <repository-url>
cd upload-management-platform
```

### 2. Install all dependencies
This will install root, client, and server dependencies:
```bash
npm run install:all
```

### 3. Environment configuration
Create a `.env` file inside the `server/` directory with the following variables (adjust as needed):
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>
JWT_SECRET=your_jwt_secret
```

### 4. Run the application in development
```bash
npm run dev
```
This will start both frontend and backend concurrently.

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### 5. Build for production
```bash
npm run build
```

### 6. Start backend server
```bash
npm run server:start
```

## Application Screenshots

### Login Interface
![Login Page](../screenshots/login.png)
*Secure authentication system with role-based access (Admin/Client) and quick test login options*

### Admin Dashboard
![Admin Dashboard](../screenshots/dashboard.png)
*Comprehensive overview showing user statistics, file counts, and active upload windows with intuitive metrics*

### File Management
![File Management](../screenshots/file-management.png)
*Efficient file listing with detailed metadata, upload tracking, and download capabilities*

### User Management System
![User Management](../screenshots/user-management.png)
*Complete user administration with role assignment, file tracking, and account creation*

### Upload Windows Management
![Upload Windows](../screenshots/upload-windows.png)
*Advanced time-based upload control with deadline management and client-specific permissions*

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend & backend together in development |
| `npm run client:dev` | Run frontend only |
| `npm run server:dev` | Run backend only (with nodemon) |
| `npm run build` | Build frontend for production |
| `npm run server:start` | Start backend in production |
| `npm run install:all` | Install all dependencies (root, client, server) |

## License
This project is delivered under the MIT License.

## Author
Developed by Yassir Harrak as part of an internship project.