# 🍊 Juicy App - Complete SaaS Platform

Juicy App is a premium, full-stack SaaS platform for a juice shop business. It includes a beautiful customer mobile application, a powerful admin dashboard, and a secure backend for payment processing.

## 🚀 Project Structure

This is a monorepo containing the following components:

- **`customer-app/`**: A React Native (Expo) mobile application for customers to browse, order, and pay for juices.
- **`admin-dashboard/`**: A Next.js web application for shop owners to manage inventory, orders, and products.
- **`razorpay-backend/`**: A Node.js/Express server that securely handles Razorpay payment creation and verification.

---

## 📱 Customer App (Expo)

A sleek, nature-themed mobile app built with Expo and Supabase.

### Features
- **Real-time Inventory**: Products fetched directly from Supabase.
- **Secure Auth**: User signup and login with Supabase Auth.
- **Dynamic Cart**: Global state management with Zustand.
- **Razorpay Integration**: Secure checkout via WebView and custom backend.
- **Theming**: Premium design with Outfit & Poppins typography.

### Setup
1. `cd customer-app`
2. `npm install`
3. Update `.env` with your Supabase and Backend URLs.
4. `npx expo start`

---

## 💻 Admin Dashboard (Next.js)

A professional dashboard for business operations.

### Features
- **Inventory Management**: Add, edit, and track juice variants.
- **Order Tracking**: Real-time status updates for customer orders.
- **Analytics**: High-level overview of sales and product performance.

### Setup
1. `cd admin-dashboard`
2. `npm install`
3. `npm run dev`

---

## 🔐 Razorpay Backend (Node.js)

The secure bridge between the mobile app and Razorpay.

### Features
- **Order Creation**: Securely generates Razorpay order IDs.
- **Signature Verification**: Validates payment authenticity.
- **Deployment Ready**: Configured for instant deployment on Render or Railway.

### Setup
1. `cd razorpay-backend`
2. `npm install`
3. `npm start`

---

## 🛠️ Global Technologies

- **Frontend**: React Native, Expo, Next.js, TailwindCSS (Dashboard).
- **Backend**: Node.js, Express.
- **Database/Auth**: Supabase (PostgreSQL).
- **Payments**: Razorpay.
- **State Management**: Zustand, React Context.

---

## 📜 Database Schema

The system requires the following tables in Supabase:
- `products`: id, name, category, image_url, is_available.
- `juice_variants`: id, product_id, variant_type, price.
- `orders`: id, user_id, total_amount, status, address.
- `order_items`: id, order_id, product_id, quantity, price.
- `profiles`: id, full_name, phone, role (admin/customer).

---

## 👨‍💻 Developer

**Preetham Goud**
- GitHub: [@preetham-18-developer](https://github.com/preetham-18-developer)

---

## 📄 License
MIT License
