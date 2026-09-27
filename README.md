<div align="center">

# 💬 Real-Time Chat Application

### A modern, full-stack messaging platform built with React, Node.js, Socket.io & MongoDB

</div>

---

## 📖 About

**Chat Application** is a full-stack real-time messaging web app that allows users to connect and communicate seamlessly. It offers secure authentication, live typing indicators, accurate online/offline statuses with "last seen" tracking, read receipts, file and image sharing, and complete profile management — all wrapped in a responsive, premium UI.

---

## ✨ Features

- 🔐 **Authentication** — Secure sign-up & sign-in with JWT-based auth
- 💬 **Real-Time Messaging** — Instant message delivery powered by Socket.io
- 🟢 **Live Status & Typing** — Real-time typing indicators and accurate online/offline status with "last seen" timestamps
- 🖼️ **Media Sharing** — Send images and files effortlessly using Cloudinary integration
- 🗑️ **Message Management** — Delete your sent messages for everyone instantly
- 🧑 **User Profiles** — Manage your profile, upload avatars, or remove them
- 🔍 **User Search** — Quickly search and start conversations with new contacts
- 📱 **Responsive UI** — Beautiful, modern, and fluid design that works perfectly on mobile and desktop

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | [React](https://reactjs.org/) (built with Vite) |
| **Backend Framework** | Node.js with Express.js |
| **Real-Time Engine** | [Socket.io](https://socket.io/) |
| **Database** | MongoDB (via Mongoose) |
| **Image Hosting** | Cloudinary |
| **Authentication** | JWT (JSON Web Tokens) & bcrypt |
| **Styling** | Vanilla CSS (Modern Design System) |

---

## 📁 Project Structure

```text
Chat_Application/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (MessageBubble, Sidebar, etc.)
│   │   ├── context/        # React Context (AuthContext)
│   │   ├── pages/          # Application views (Login, Register, ChatDashboard, Profile)
│   │   ├── services/       # API integration logic
│   │   ├── utils/          # Helper utilities (Cloudinary upload logic)
│   │   ├── index.css       # Global styles and design tokens
│   │   └── App.jsx         # Main router setup
│   ├── .env                # Frontend environment variables
│   └── vite.config.js      # Vite build configuration
│
└── server/                 # Node.js Backend
    ├── controllers/        # Route controllers (Auth, Chat, User)
    ├── models/             # Mongoose schemas (User, Message, Conversation)
    ├── routes/             # Express API routes
    ├── sockets/            # Socket.io event handlers (chatSocket.js)
    ├── middleware/         # Custom middlewares (auth validation)
    ├── index.js            # Express server entry point
    └── .env                # Backend environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account for media uploads

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Chat_Application.git
cd Chat_Application

# 2. Setup the Server
cd server
npm install
# Create a .env file with your PORT, MONGO_URI, JWT_SECRET
npm run dev

# 3. Setup the Client
cd ../client
npm install
# Create a .env file with your VITE_API_URL and VITE_SOCKET_URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the app.

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate an existing user |
| `GET`  | `/api/auth/me` | Get the currently authenticated user |

### Users & Profiles

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/search` | Search users by name or email |
| `PUT` | `/api/users/profile` | Update user profile (name, photo) |

### Chat & Conversations

| Method | Endpoint | Description |
|---|---|---|
| `GET`  | `/api/conversations` | Fetch all user's conversations |
| `GET`  | `/api/conversations/:id` | Fetch conversation details & messages |
| `POST` | `/api/conversations` | Create a new conversation |

---

## 🧩 Application Pages

| Route | Description |
|---|---|
| `/login` | User login |
| `/register` | User registration |
| `/chat` | Main dashboard (Conversations & Messaging) |
| `/profile` | View and edit user profile settings |
