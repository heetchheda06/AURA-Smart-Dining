# 🍽️ AURA – Smart Dining Platform

> ### AI-Powered Restaurant Management & Smart Ordering System

AURA is a modern, full-stack restaurant management platform designed to transform the traditional dining experience into a smart, digital, and real-time system. Customers can browse the menu, choose their preferred table, place orders, track them live, request bills, submit feedback, and receive AI-powered recommendations, while restaurant staff manage operations through dedicated dashboards synchronized using Socket.IO.

---

# 🌐 Live Demo

## 🚀 Website

**https://aura-smart-dining.onrender.com/**

## 🔐 Admin Login

| Credential | Value |
|------------|-------|
| **Email** | `admin@auradining.in` |
| **Password** | `AdminPassword123` |

> Use the above credentials to explore the Admin Dashboard.

---

# 📖 About the Project

AURA Smart Dining is a **Full Stack Restaurant Management System** developed to modernize restaurant operations through automation, real-time communication, artificial intelligence, and digital dining experiences.

The platform enables customers to:

- Browse a digital menu
- Select preferred dining tables
- Place orders instantly
- Track order preparation live
- Receive AI-powered food recommendations
- End dining sessions
- Generate digital bills
- Submit restaurant feedback
- View spending analytics
- Track previous orders

Restaurant staff manage operations through dedicated dashboards:

- 👑 Admin
- 📋 Manager
- 👨‍🍳 Chef
- 💳 Cashier
- 🍽️ Waiter

Using **Socket.IO**, every dashboard remains synchronized in real time, ensuring seamless communication across the restaurant.

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
- 🧾 End Session & Smart Bill Generation
- ⭐ Customer Feedback Form

---

## 🏨 Restaurant Operations

- ⚡ Real-Time WebSocket Synchronization
- 📈 Live Order Tracking
- 🪑 Automatic Table Status Updates
- 🔒 Role-Based Access Control
- 📊 Restaurant Analytics
- 🧠 AI Feedback Analyzer & Sentiment Insights

---

## 👨‍🍳 Staff Dashboards

### 👑 Admin Dashboard

- Revenue Analytics
- User Management
- Employee Management
- Sales Reports
- Restaurant KPIs
- Dashboard Overview

### 📋 Manager Dashboard

- Table Occupancy
- Inventory Management
- Ingredient Stock Tracking
- Restock Controls
- Restaurant Monitoring

### 👨‍🍳 Chef Dashboard

- Kitchen Display System (KDS)
- Incoming Orders
- Order Status Updates
- Preparation Queue

### 💳 Cashier Dashboard

- Billing
- Payment Processing
- Bill Generation
- Session Checkout
- Automatic Table Clearance

### 🍽️ Waiter Dashboard

- Order Tracking
- Customer Assistance Requests
- Table Notifications
- Cleaning Queue

---

## 📦 Inventory Management

- Ingredient Stock Tracking
- Real-Time Inventory Monitoring
- Restocking Controls
- Low Stock Alerts

---

## 🔐 Authentication & Security

- JWT Authentication
- Secure Password Encryption (bcryptjs)
- Google OAuth Login
- Role-Based Authorization
- Protected REST APIs
- Secure Customer Profiles
- Individual Customer Order History

---

# 🤖 AI Features

- AI Food Recommendation System
- AI Smart Flavor Pairing Engine
- AI Sommelier
- AI Feedback Analyzer
- AI Sentiment Analysis
- Personalized Dining Suggestions

---

# 🛠 Technology Stack

## Frontend

- React 18
- Vite
- Vanilla CSS
- Font Awesome
- Socket.IO Client

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcryptjs

## Deployment

- Render
- MongoDB Atlas
- GitHub

---

# 📂 Project Structure

```text
AURA-Smart-Dining/
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── CategoryFilters.jsx
│   │   │   ├── MenuGrid.jsx
│   │   │   ├── CartSidebar.jsx
│   │   │   ├── OrderModal.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── CheckoutModal.jsx
│   │   │   ├── CashierDashboard.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── ChefDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AiSommelierModal.jsx
│   │   │   ├── AiReviewAnalyzerModal.jsx
│   │   │   ├── CustomerReviewsModal.jsx
│   │   │   ├── AIRecommender.jsx
│   │   │   ├── TableSelectModal.jsx
│   │   │   ├── FloorPlanModal.jsx
│   │   │   ├── WaiterCleaningModal.jsx
│   │   │   ├── WaiterModal.jsx
│   │   │   ├── QueueModal.jsx
│   │   │   ├── TableFreedModal.jsx
│   │   │   ├── UserOrdersModal.jsx
│   │   │   └── RoleQuickSwitcher.jsx
│   │   └── data/
│   │       └── fallbackMenu.js
│   ├── package.json
│   └── vite.config.js

├── controllers/
│   ├── authController.js
│   ├── checkoutController.js
│   ├── orderController.js
│   ├── tableController.js
│   ├── reviewController.js
│   ├── menuController.js
│   └── csvController.js

├── models/
│   ├── User.js
│   ├── Session.js
│   ├── Order.js
│   ├── Table.js
│   ├── Cart.js
│   ├── MenuItem.js
│   ├── Review.js
│   └── Guest.js

├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   ├── checkoutRoutes.js
│   ├── orderRoutes.js
│   ├── tableRoutes.js
│   ├── menuRoutes.js
│   └── reviewRoutes.js

├── middleware/
│   ├── auth.js
│   ├── validate.js
│   └── errorHandler.js

├── socket/
│   └── socketHandler.js

├── config/
│   └── db.js

├── data/
│   ├── menuData.json
│   └── tableData.json

├── .env
├── render.yaml
├── app.js
├── server.js
└── package.json
```

---
# 🚀 Getting Started

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v18 or later)
- npm
- MongoDB Atlas Account (or Local MongoDB)

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

GOOGLE_CLIENT_ID=your_google_client_id

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

# 🔌 REST API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register Customer |
| POST | `/api/auth/login` | Login User |
| GET | `/api/auth/profile` | User Profile |
| POST | `/api/auth/logout` | Logout |

---

## Menu

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/menu` | Get Complete Menu |
| GET | `/api/menu/:id` | Get Menu Item |

---

## Tables

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tables` | Fetch Table Status |
| PUT | `/api/tables/:id/status` | Update Table Status |
| POST | `/api/tables/select` | Reserve Table |

---

## Orders

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/orders` | Place Order |
| GET | `/api/orders` | Fetch Orders |
| GET | `/api/orders/:id` | Fetch Single Order |
| PUT | `/api/orders/:id/status` | Update Order Status |

---

## Checkout

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/checkout` | Generate Bill |
| POST | `/api/checkout/payment` | Process Demo Payment |
| POST | `/api/checkout/end-session` | End Customer Session |

---

## Reviews

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reviews` | Submit Feedback |
| GET | `/api/reviews` | Get Reviews |
| GET | `/api/reviews/analytics` | AI Feedback Analysis |

---

## Inventory

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/inventory` | Inventory Details |
| POST | `/api/inventory/:id/restock` | Restock Ingredient |

---

## Admin

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard Statistics |
| GET | `/api/admin/users` | User Management |
| GET | `/api/admin/reports` | Sales Reports |

---

# ⚙️ System Highlights

- ⚡ Socket.IO Real-Time Communication
- 🔐 JWT Authentication & Google OAuth
- 🛡️ Role-Based Access Control (RBAC)
- 🍽️ Smart Digital Ordering System
- 🧾 End Session & Automatic Bill Generation
- 💳 Demo Payment Gateway
- ⭐ Customer Feedback Collection
- 🧠 AI Feedback Analyzer & Sentiment Analysis
- 🤖 AI Food Recommendation Engine
- 🍷 AI Smart Flavor Pairing Engine
- 📦 Inventory Management System
- 👨‍🍳 Kitchen Display System (KDS)
- 📊 Live Dashboard Synchronization
- 🪑 Automatic Table Allocation & Status Updates
- 📈 Restaurant Business Analytics
- 🌐 RESTful API Architecture
- ☁️ MongoDB Atlas Cloud Database
- 📱 Responsive UI for Desktop, Tablet & Mobile

---

# 📈 Future Enhancements

- 📱 Android Application
- 🍎 iOS Application
- 💳 Razorpay / Stripe Payment Gateway
- 📷 QR Code Table Ordering
- 🤖 AI Chat Assistant
- 📊 Advanced Business Intelligence Dashboard
- 🌍 Multi-language Support
- 🎁 Customer Loyalty & Rewards Program
- 🚚 Delivery & Takeaway Module
- 📅 Online Table Reservation
- 🍷 Advanced AI Sommelier Recommendations
- 📢 AI Customer Retention Insights
- 📍 Live Wait Time Prediction
- 📦 Supplier Management System
- 📈 Predictive Demand Forecasting
- 🧾 GST Invoice Generation
- 🔔 Push Notifications
- 📧 Email Bill Delivery
- 📲 WhatsApp Order Notifications
- ☁️ Docker & Kubernetes Deployment

---

# 👥 Team

| Member | Role | College |
|---------|------|----------|
| **Heet Chheda** | Full Stack Developer | MCT Rajiv Gandhi Institute of Technology |
| **Shardul Dalvi** | Backend Developer | MCT Rajiv Gandhi Institute of Technology |
| **Aryan Keni** | Frontend Developer | MCT Rajiv Gandhi Institute of Technology |
| **Falgun Patel** | UI/UX & Documentation | Universal College of Engineering, Mumbai |

---

# 📜 License

This project was developed as part of a **Hackathon**.

© **2025 Team AURA**. All Rights Reserved.

---

# ⭐ Support

If you found this project useful, please consider giving it a **⭐ Star** on GitHub.

Your support motivates us to continue improving AURA with more smart dining features.

---

<div align="center">

# 🍽️ AURA Smart Dining Platform

### Smart • Fast • Intelligent • Digital Dining Experience

🌐 **Live Website**

https://aura-smart-dining.onrender.com/

---

### 🔐 Admin Credentials

**Email:** `admin@auradining.in`

**Password:** `AdminPassword123`

---

### 🚀 Built With

**React • Node.js • Express.js • MongoDB • Socket.IO • JWT • Gemini AI • Render**

---

**Made with ❤️ by Team AURA**

</div>
