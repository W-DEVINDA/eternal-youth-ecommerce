# Eternal Youth — E-Commerce Platform

A full-stack MERN e-commerce platform built for a Sri Lankan fashion boutique, featuring an AI chatbot, real-time complaint/live chat system, and a TensorFlow-powered analytics dashboard.

## Features

- Multi-image product catalogue with size-specific cart
- Stripe and Cash-on-Delivery checkout with promo codes
- AI chatbot powered by Hugging Face (Llama 4 Scout)
- Real-time complaint handling and live chat via Socket.io
- Admin panel with full product/order/complaint management
- Analytics dashboard with Chart.js and TensorFlow.js, exportable to PDF

## Tech Stack

- **Frontend:** React
- **Admin Panel:** React
- **Backend:** Node.js, Express, MongoDB
- **Auth:** JWT, bcrypt, Google OAuth
- **Payments:** Stripe
- **AI:** Hugging Face Inference API (Llama 4 Scout)
- **Real-time:** Socket.io

## Project Structure

```
eternal-youth-ecommerce/
├── admin/       # Admin panel (React) — port 3001
├── backend/     # REST API server (Node/Express) — port 4000
└── frontend/    # Customer-facing storefront (React) — port 3000
```

## Getting Started

### Prerequisites

- Node.js and npm installed
- A MongoDB connection URI (e.g. from MongoDB Atlas)
- A Stripe secret key
- A Hugging Face API key

### 1. Install dependencies

Run `npm install` in each of the three directories:

```bash
cd admin && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** — create a `.env` file inside `backend/`:

```dotenv
STRIPE_SECRET_KEY=
```

**Frontend** — create a `.env` file inside `frontend/`:

```dotenv
REACT_APP_HF_API_KEY=
MONGO_URI=
```

> Fill in your own keys — the Stripe secret key from your Stripe dashboard, the Hugging Face API key from your Hugging Face account, and your MongoDB connection string.

### 3. Run the project

Open separate terminals for each part of the app:

**Backend**
```bash
cd backend
node index.js
```

**Frontend**
```bash
cd frontend
npm start
```

**Admin panel**
```bash
cd admin
npm start
```

The frontend will run on `http://localhost:3000`, the admin panel on `http://localhost:3001`, and the backend API on `http://localhost:4000`.

## Author

Developed by Devinda Weerasinghe as a Final Year Project at Universiti Teknologi Malaysia (UTM), Faculty of Computing, supervised by Dr. Ruhaida bt. Samsudin.
