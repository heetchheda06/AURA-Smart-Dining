# AURA – Smart Interactive Dining Experience

A production-ready Full Stack Smart Restaurant Management System built with **Node.js**, **Express.js**, **MongoDB Atlas**, **Mongoose**, and **Socket.IO**. AURA elevates dine-in experiences with real-time collaborative ordering, digital interactive floor plans, Google Identity Services OAuth 2.0, secure JWT authentication, and localized Indian currency (₹) formatting.

---

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Security & Compliance](#security--compliance)
3. [Environment Configuration](#environment-configuration)
4. [Third-Party Setup Guides](#third-party-setup-guides)
   - [MongoDB Atlas Setup](#mongodb-atlas-setup)
   - [Google OAuth 2.0 Setup](#google-oauth-2-0-setup)
   - [Cloudinary Configuration](#cloudinary-configuration)
5. [Database Seeding](#database-seeding)
6. [API Documentation](#api-documentation)
7. [Real-time Socket.IO Events](#real-time-socketio-events)
8. [Production Deployment Guide](#production-deployment-guide)

---

## Project Architecture

AURA follows a clean **MVC (Model-View-Controller)** pattern:

```
├── config/             # Connection configurations (DB, Cloudinary)
├── controllers/        # Logical controllers processing requests
├── middleware/         # Security, JWT auth, and validation filters
├── models/             # Mongoose database schemas
├── routes/             # API routing endpoints
├── socket/             # Socket.IO event handler for collaborative features
├── public/             # Serves the responsive front-end client
├── seed/               # Database seeder scripts
├── tests/              # Automated integration tests
├── .env.example        # Environment variable template
├── app.js              # Express app setup and config
├── server.js           # Server runner and listener
└── package.json        # Dependencies and execution scripts
```

---

## Security & Compliance

AURA implements top-tier security standards to protect users and servers:
- **Helmet**: Secures the HTTP headers and configures strict Content Security Policies (CSP) to restrict remote script execution (like GIS and Socket.IO integrations).
- **CORS**: Domain verification restricting API calls to authenticated origins.
- **Rate-Limiting**: Mitigates DDoS attacks by limiting client IP requests.
- **NoSQL Injection Protection**: MongoDB queries are sanitized automatically by Mongoose validator schemas.
- **XSS Protection**: Secure HTTP-only cookies preventing cross-site scripting storage hijacking.
- **Security Hashing**: Hashed user passwords using `bcryptjs`.

---

## Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=8080
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_change_in_production
GOOGLE_CLIENT_ID=686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

---

## Third-Party Setup Guides

### MongoDB Atlas Setup
1. Log in or create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database cluster (the Shared free tier is sufficient).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist the IP addresses that require access (`0.0.0.0/8` allows global cloud access).
5. Click **Connect**, choose **Connect your application**, copy the connection string, and paste it into `MONGODB_URI` in `.env`.

### Google OAuth 2.0 Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Search for **APIs & Services** -> **OAuth consent screen**, choose "External", and complete the required fields.
4. Go to **Credentials**, click **Create Credentials**, and select **OAuth client ID**.
5. Select **Web application** as application type.
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8080` (for development)
   - `https://your-production-url.com` (for production)
7. Save the configuration. Copy the **Client Secret** and add it to `GOOGLE_CLIENT_SECRET` in `.env`. (The Client ID is preconfigured as: `686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com`).

### Cloudinary Configuration
1. Register at [Cloudinary](https://cloudinary.com/).
2. From the Console Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Paste these values into the respective fields in `.env`.

---

## Database Seeding

Populate the database with pre-arranged table configurations, category taxonomies, and gourmet menu items (with Indian Rupee formatting and pricing):

```bash
npm run seed
```

This also creates system-wide default role accounts:
- **Admin**: `admin@auradining.in` / `AdminPassword123`
- **Waiter**: `waiter@auradining.in` / `WaiterPassword123`
- **Customer**: `customer@auradining.in` / `CustomerPassword123`

---

## API Documentation

### 1. Authentication
* **POST `/api/auth/register`**
  - Payload: `{ "name": "...", "email": "...", "password": "...", "mobile": "..." }`
  - Action: Registers member customer account. Returns JWT.
* **POST `/api/auth/login`**
  - Payload: `{ "email": "...", "password": "..." }`
  - Action: Standard login verification. Returns JWT.
* **POST `/api/auth/google`**
  - Payload: `{ "idToken": "..." }`
  - Action: Validates Google ID Token, logs in or registers user, returns JWT.
* **POST `/api/auth/guest-login`**
  - Payload: `{ "name": "...", "tableNum": 8 }`
  - Action: Commences on-site session, updates table status, returns guest JWT.
* **POST `/api/auth/logout`**
  - Action: Clears secure cookies.
* **GET `/api/auth/profile`**
  - Header: `Authorization: Bearer <token>`
  - Action: Returns authenticated profile.

### 2. Menu & Categories
* **GET `/api/categories`**
  - Action: Returns menu categories.
* **GET `/api/menu`**
  - Query Params: `?category=sushi` or `?search=steak`
  - Action: Returns filtered/searched menu items.
* **POST `/api/menu`** (Admin only)
  - Content-Type: `multipart/form-data`
  - Body: `{ name, category, price, prep, image (file) }`

### 3. Collaborative Cart
* **GET `/api/cart/:tableNum`**
  - Action: Gets table cart items.
* **POST `/api/cart/:tableNum/add`**
  - Body: `{ menuItemId, name, price, addedBy }`
* **POST `/api/cart/:tableNum/update`**
  - Body: `{ menuItemId, delta: 1 | -1 }`
* **POST `/api/cart/:tableNum/clear`**

### 4. Orders
* **POST `/api/orders`** (Customer/Guest JWT Required)
  - Action: Dispatches active cart items as an order to the kitchen.
* **GET `/api/orders`**
  - Action: Customer history / Staff view.
* **PUT `/api/orders/:id/status`** (Waiter/Admin JWT Required)
  - Body: `{ "status": "preparing" }`
* **GET `/api/orders/:id/split/:count`**
  - Action: Calculates and syncs split bill per person (formatted in ₹).

---

## Real-time Socket.IO Events

Clients communicate via Socket.IO to coordinate tables:
- `table:join`: Diners join room `table_room_{tableNum}`.
- `user:joined` / `user:left`: Emitted to sync diner counts.
- `cart:add` / `cart:update` / `cart:clear`: Triggers DB modification and broadcasts `cart:updated` to table room.
- `table:status_changed`: Broadcasts live seating updates to all users (auto-updating floor plans).
- `waiter:call`: Registers help calls and emits `waiter:request_new` to waitstaff monitoring dashboards.

---

## Production Deployment Guide

AURA is fully cloud-ready and contains zero localhost dependencies.

### Deploying to Render / Railway / Heroku
1. Push the code to a private or public GitHub repository.
2. Link the repository to your hosting provider.
3. Configure the environment variables in the service dashboard.
4. Set the build command to `npm install --legacy-peer-deps` (if peer conflict arises) or `npm install`.
5. Set start command to `npm start`.
6. Run the database seed once. Your AURA dining application is live globally!
