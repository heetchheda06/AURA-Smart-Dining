# 🍽️ AURA – Smart Dining Platform

> ### AI-Powered Restaurant Management & Smart Ordering System

AURA is a modern, full-stack restaurant management platform designed to transform the traditional dining experience into a smart, digital, and real-time system. Customers can browse the menu, choose their preferred table, place orders, and track them live, while restaurant staff manage operations through dedicated dashboards synchronized using WebSockets.

---

## 🌐 Live Demo

### 🚀 Website

**https://aura-smart-dining.onrender.com/**

### 🔐 Admin Login

| Credential | Value |
|------------|-------|
| **Email** | `admin@auradining.in` |
| **Password** | `AdminPassword123` |

> Use the above credentials to explore the Admin Dashboard.

---

# 📖 About the Project

AURA Smart Dining is a **Full Stack Restaurant Management System** built to simplify restaurant operations and enhance customer experience through automation and real-time communication.

The platform enables customers to:

- Browse a digital menu
- Select their preferred dining table
- Place orders instantly
- Receive live order updates
- Track previous orders
- View spending analytics
- Get AI-powered food recommendations

Restaurant staff have dedicated dashboards for:

- 👑 Admin
- 📋 Manager
- 👨‍🍳 Chef
- 💳 Cashier
- 🍽️ Waiter

Using **Socket.IO**, every dashboard stays synchronized in real time, ensuring efficient communication between customers and staff.

---

# ✨ Features

## 👤 Customer Features

- 🪑 Interactive Table Selection
- 🍽️ Digital Menu Browsing
- 🔍 Search & Filter Menu Items
- 🤖 AI Food Recommendation System
- 🛒 Real-Time Order Placement
- 📊 Personal Dashboard
- ❤️ Favourite Dishes
- 💰 Spending Analytics
- 🧾 Order History
- 🔔 Call Waiter Feature

---

## 🏨 Restaurant Operations

- ⚡ Real-Time WebSocket Synchronization
- 📈 Live Order Tracking
- 🪑 Automatic Table Status Updates
- 🔒 Role-Based Access Control
- 📊 Restaurant Analytics

---

## 👨‍🍳 Staff Dashboards

### 👑 Admin Dashboard

- Revenue Analytics
- User Management
- Sales Reports
- Restaurant KPIs
- Dashboard Overview

### 📋 Manager Dashboard

- Table Occupancy
- Inventory Management
- Ingredient Stock Tracking
- Restock Controls

### 👨‍🍳 Chef Dashboard

- Kitchen Display System (KDS)
- Incoming Orders
- Update Order Status

### 💳 Cashier Dashboard

- Billing
- Payment Processing
- Bill Generation
- Automatic Table Clearance

### 🍽️ Waiter Dashboard

- Order Tracking
- Waiter Assistance Requests
- Customer Notifications

---

## 📦 Inventory Management

- Ingredient Stock Tracking
- Live Inventory Monitoring
- Restocking Controls
- Low Stock Alerts

---

## 🔐 Authentication & Security

- JWT Authentication
- Secure Password Encryption (bcryptjs)
- Role-Based Authorization
- Protected REST APIs
- Secure Member Profiles
- Individual Customer Order History

---

# 🛠️ Technology Stack

## Frontend

- React 18
- Vite
- Vanilla CSS
- Font Awesome
- Socket.IO Client

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT (jsonwebtoken)
- bcryptjs

---

## Deployment

- Render
- MongoDB Atlas
- GitHub

---

# 📂 Project Structure

```text
AURA-Smart-Dining
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.jsx
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── socket/
├── public/
├── server.js
├── package.json
├── render.yaml
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js v18+
- npm
- MongoDB Atlas (or Local MongoDB)

---

## Clone Repository

```bash
git clone https://github.com/heetchheda06/AURA-Smart-Dining.git

cd AURA-Smart-Dining
```

---

## Install Dependencies

### Backend

```bash
npm install
```

### Frontend

```bash
npm install --prefix client
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

NODE_ENV=development
```

---

## Run the Project

### Start Backend

```bash
npm run dev
```

### Start Frontend

```bash
npm run dev --prefix client
```

---

## Build for Production

```bash
npm run build --prefix client
```

---

# 🔌 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register Member |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | User Profile |
| GET | `/api/menu` | Fetch Menu |
| GET | `/api/tables` | Get Table Status |
| PUT | `/api/tables/:id/status` | Update Table Status |
| POST | `/api/orders` | Place Order |
| GET | `/api/orders` | Fetch Orders |
| PUT | `/api/orders/:id/status` | Update Order Status |
| GET | `/api/inventory` | Inventory Details |
| POST | `/api/inventory/:id/restock` | Restock Ingredients |
| GET | `/api/admin/dashboard` | Dashboard Statistics |

---

# ⚙️ System Highlights

- ⚡ Socket.IO Real-Time Communication
- 🔐 JWT Authentication
- 🛡️ Role-Based Access Control
- 📦 Inventory Management System
- 👨‍🍳 Kitchen Display System (KDS)
- 📊 Live Dashboard Synchronization
- 🪑 Automatic Table Status Updates
- 📈 Analytics Dashboard
- 🌐 RESTful API Architecture
- ☁️ Cloud Database with MongoDB Atlas

---

# 📈 Future Enhancements

- 📱 Android & iOS Mobile Application
- 💳 Online Payment Gateway
- 📷 QR Code Table Ordering
- 🤖 AI Chat Assistant
- 📊 Advanced Business Analytics
- 🌍 Multi-language Support
- 🎁 Customer Loyalty Program
- 🚚 Delivery & Takeaway Module
- 📅 Online Table Reservation

---

# 👥 Team

| Member | College |
|---------|---------|
| **Heet Chheda** | MCT Rajiv Gandhi Institute of Technology |
| **Shardul Dalvi** | MCT Rajiv Gandhi Institute of Technology |
| **Aryan Keni** | MCT Rajiv Gandhi Institute of Technology |
| **Falgun Patel** | Universal College of Engineering, Mumbai |

---

# 📜 License

This project was developed as part of a **Hackathon**.

© **2025 Team AURA**. All Rights Reserved.

---

# ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub.

---

<div align="center">

# 🍽️ AURA Smart Dining Platform

### Smart • Fast • Digital Dining Experience

🌐 **Live Website**

https://aura-smart-dining.onrender.com/

---

### 🔐 Admin Credentials

**Email:** `admin@auradining.in`

**Password:** `AdminPassword123`

---

**Built with ❤️ by Team AURA**

</div>
