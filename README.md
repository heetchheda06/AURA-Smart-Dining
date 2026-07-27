# ??? AURA — Smart Dining Platform

> **AI-Powered Restaurant Management & Ordering System**
> Live Demo: [https://aura-smart-dining.onrender.com](https://aura-smart-dining.onrender.com)

---

## ?? About the Project

**AURA Smart Dining** is a full-stack, AI-powered restaurant management platform that transforms the traditional dining experience into a seamless, touchless, and intelligent system. Customers can browse the menu, select their preferred table, and place real-time orders — all from their phone. Behind the scenes, every restaurant role (Admin, Manager, Chef, Cashier, Waiter) gets a dedicated live dashboard, all connected via WebSockets so updates sync instantly across the entire restaurant floor.

---

## ? Features

### ?? Customer Experience
- ?? **Interactive Table Selection** — Live floor plan grid; customers choose their preferred table before ordering
- ??? **Full Menu Browsing** — Browse dishes by category with search and filters
- ?? **AI Food Recommender** — Personalized dish suggestions powered by smart preference analysis
- ?? **Real-Time Order Placement** — Add items to a shared table cart and place orders instantly
- ?? **Private Member Dashboard** — Each member sees only their own order history, receipts, and analytics
- ?? **Spending Analytics** — Total spend tracked per member with visit frequency
- ?? **Favourite Dishes** — Most-ordered dishes highlighted for quick reordering
- ?? **Waiter Assistance** — Call a waiter directly from the app with one tap

### ?? Restaurant Operations
- ? **Live WebSocket Sync** — Every order, table status, and kitchen update broadcasts instantly to all dashboards
- ?? **Auto Table Vacancy on Payment** — Table automatically becomes vacant the moment the cashier marks a bill as paid
- ?? **Role-Based Access Control** — Each staff role sees only their own portal; no cross-role data leakage

### ??? Staff Dashboards

| Role | Dashboard Features |
|------|--------------------|
| **Admin** | KPI stats, revenue charts, order analytics, user management |
| **Manager** | Live table occupancy (20 tables), ingredient stock tracking, restock controls |
| **Chef (KDS)** | Incoming kitchen orders, mark ready/in-progress controls |
| **Cashier** | Active bills, payment processing, table clearance |
| **Waiter** | Order tracking, table status, waiter call notifications |

### ?? Inventory & Stock
- ?? **Ingredient Stock Tracking** — Real-time quantity monitoring for all ingredients
- ?? **Restock Controls** — Managers can adjust stock levels with +1, -1, +10 buttons
- ?? **Low Stock Alerts** — Visual indicators for low and out-of-stock ingredients

### ?? Authentication & Security
- ?? **Member Sign In / Sign Up** — Secure JWT-based authentication with name/email/role encoded in token
- ?? **Google OAuth** — One-click Google Sign-In support
- ??? **Isolated Order History** — No two customers can ever see each other''s orders or receipts
- ?? **Profile Persistence** — Customer name stored in MongoDB and JWT; always shows real name in dashboard

---

## ??? Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Vanilla CSS** | Styling with glassmorphism & animations |
| **Socket.IO Client** | Real-time live updates |
| **Font Awesome** | Icons |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.IO** | WebSocket real-time events |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Google Auth Library** | Google OAuth verification |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Render** | Full-stack deployment (web service) |
| **MongoDB Atlas** | Cloud database |
| **GitHub** | Version control & CI |

---

## ?? Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone the Repository
```bash
git clone https://github.com/heetchheda06/AURA-Smart-Dining.git
cd AURA-Smart-Dining
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix client
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
NODE_ENV=development
```

### 4. Run in Development
```bash
# Run backend (from root)
npm run dev

# Run frontend (in a separate terminal)
npm run dev --prefix client
```

The app will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 5. Build for Production
```bash
npm run build --prefix client
```

---

## ?? Project Structure

```
AURA-Smart-Dining/
+-- client/                    # React frontend (Vite)
¦   +-- src/
¦       +-- components/        # All UI components
¦       ¦   +-- AdminDashboard.jsx
¦       ¦   +-- ManagerDashboard.jsx
¦       ¦   +-- ChefDashboard.jsx
¦       ¦   +-- CashierDashboard.jsx
¦       ¦   +-- AuthModal.jsx
¦       ¦   +-- TableSelectModal.jsx
¦       ¦   +-- UserOrdersModal.jsx
¦       ¦   +-- ...
¦       +-- data/              # Fallback data
¦       +-- App.jsx            # Root component
+-- controllers/               # Express route controllers
¦   +-- authController.js
¦   +-- orderController.js
¦   +-- tableController.js
¦   +-- inventoryController.js
¦   +-- adminController.js
+-- models/                    # Mongoose schemas
¦   +-- User.js
¦   +-- Order.js
¦   +-- Table.js
¦   +-- ...
+-- routes/                    # API route definitions
+-- middleware/                # Auth & error middleware
+-- public/                    # Built frontend assets (served by Express)
+-- server.js                  # Express + Socket.IO entry point
+-- render.yaml                # Render deployment config
+-- README.md
```

---

## ?? Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Member registration |
| `POST` | `/api/auth/login` | Member / Staff login |
| `GET` | `/api/auth/profile` | Get logged-in user profile |
| `GET` | `/api/menu` | Fetch menu items |
| `GET` | `/api/tables` | Get all table statuses |
| `PUT` | `/api/tables/:num/status` | Update table status |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/orders` | Get orders (filtered by role) |
| `PUT` | `/api/orders/:id/status` | Update order status |
| `GET` | `/api/inventory` | Get ingredient stock |
| `POST` | `/api/inventory/:id/restock` | Adjust ingredient stock |
| `GET` | `/api/admin/dashboard` | Admin KPI stats |

---

## ?? Key Design Decisions

- **In-Memory Order Store** — Orders are cached in RAM as a fallback, ensuring Chef and Cashier dashboards always work even if MongoDB is temporarily unavailable
- **JWT with Embedded Profile** — Customer name, email, and role are encoded inside the JWT so the dashboard always displays the correct name without an extra DB round-trip
- **Per-Member Order Isolation** — The `/api/orders` endpoint intelligently filters by `userRef` or `customerName` for member customers, ensuring complete data privacy between accounts
- **Socket.IO Room Architecture** — Each table has its own socket room (`table_room_X`) so cart and order updates only reach the relevant table's customers
- **Auto Table Vacancy** — When a cashier marks payment as completed, the table status is automatically set to `free` and broadcast via socket to all active clients in real-time

---

## ?? Team

| Name | Role |
|------|------|
| ?? **Heet Chheda** | Team Leader — Full Stack Development & System Architecture |
| **Falgun Patel** | Backend Development & API Integration |
| **Shardul Dalvi** | Frontend Development & UI/UX Design |
| **Aryan Keni** | Database Design & Real-Time Features |

---

## ?? License

This project was built for a Hackathon. All rights reserved © 2025 Team AURA.

---

<div align="center">
  <strong>Built with ?? by Team AURA</strong><br/>
  <em>Making every dining experience smarter, faster, and more delightful.</em>
</div>
