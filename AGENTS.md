# AGENTS.md - Kemazon.ar Development Guide

This file provides guidelines and instructions for AI agents working on the Kemazon.ar project.

## Project Overview

Kemazon.ar is a multi-vendor e-commerce marketplace with auction system built with:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Laravel 11 (PHP 8.3)
- **Database**: MySQL with Redis for caching/sessions
- **Real-time**: Laravel Reverb for live auction updates

---

## 1. Project Structure

```
kemazon-ar/
├── backend/                 # Laravel 11 API
│   ├── app/
│   │   ├── Console/Commands/
│   │   ├── Events/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   └── config/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── vite.config.js
└── database/
    └── schema.sql
```

---

## 2. Build, Lint, and Test Commands

### Backend

```bash
cd backend

# Install dependencies
composer install

# Run migrations (requires MySQL)
php artisan migrate

# Seed database
php artisan db:seed

# Start development server
php artisan serve

# Run auction cron jobs
php artisan auctions:end-expired
php artisan auctions:activate-pending
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 3. Backend Guidelines (Laravel)

### Models & Migrations

- Models are in `app/Models/`
- Migrations are in `database/migrations/`
- Use Eloquent ORM with relationships
- Currency: All prices stored in ARS with 2 decimal places

### API Routes

API routes are in `routes/api.php`:
- `/api/auth/*` - Authentication
- `/api/products/*` - Products CRUD
- `/api/auctions/*` - Auctions and bidding
- `/api/cart/*` - Shopping cart
- `/api/orders/*` - Order management
- `/api/seller/*` - Seller dashboard

### Authentication

- JWT-based authentication using `tymon/jwt-auth`
- Guard: `auth:api` for protected routes
- Token stored in localStorage on frontend

### Real-time Events

Events are in `app/Events/`:
- `NewBid` - Broadcasted when a new bid is placed
- `AuctionEnded` - Broadcasted when an auction ends

### Commands

```bash
php artisan auctions:end-expired    # End expired auctions
php artisan auctions:activate-pending  # Activate pending auctions
```

---

## 4. Frontend Guidelines (React)

### Tech Stack

- React 19 with Hooks
- React Router v7 for routing
- TanStack Query for data fetching
- Tailwind CSS v4 for styling
- Lucide React for icons
- Sonner for toasts

### State Management

- `AuthContext` - User authentication state
- `CartContext` - Shopping cart state
- TanStack Query - Server state

### Code Style

- Functional components with hooks
- PascalCase for component files
- camelCase for variables/functions
- Use absolute imports from `@/` alias
- Tailwind classes for styling

### Components

UI components are in `src/components/ui/`:
- `Button` - Primary, secondary, outline, ghost variants
- `Input` - Form inputs
- `Card` - Product cards
- `Badge` - Status badges
- `Modal` - Dialogs
- `PriceFormatter` - Format ARS currency

### Pages

Pages are in `src/pages/` organized by feature:
- `home/` - Homepage
- `auth/` - Login, Register
- `product/` - Product listing and detail
- `auction/` - Auction listing
- `cart/` - Shopping cart
- `profile/` - User profile
- `seller/` - Seller dashboard

---

## 5. Design System

### Colors

Primary: Indigo/Purple gradient
- `primary-500`: #6366f1
- `primary-600`: #4f46e5
- `secondary-500`: #a855f7
- `secondary-600`: #9333ea

### Typography

- Font: Inter (Google Fonts)
- Prices in ARS format: `$ 1.250,10`

### Components

- Cards: rounded-2xl with subtle shadow
- Buttons: rounded-xl with gradient variants
- Inputs: rounded-xl with focus ring
- Mobile-first responsive design

---

## 6. Key Features

### Products

- Direct sales with fixed price
- Auctions with countdown timer
- Both modes supported

### Auctions

- Real-time bid updates (via Reverb)
- Countdown timer component
- Bid history
- Reserve price support
- Buy-now option
- Automatic winner notification

### Cart

- Mix direct and auction items
- Grouped by seller
- Checkout flow

### Orders

- Status tracking
- Payment integration (MercadoPago ready)
- Seller order management

---

## 7. Demo Credentials

After seeding:
- Admin: admin@kemazon.ar / password
- Seller: vendedor@kemazon.ar / password  
- Buyer: comprador@kemazon.ar / password

---

## 8. Common Issues

- Ensure MySQL is running before migrations
- Clear cache: `php artisan cache:clear`
- Regenerate JWT secret: `php artisan jwt:secret`
- CORS issues: Check Laravel config for frontend origin

---

## 9. Resources

- [Laravel 11 Docs](https://laravel.com/docs/11.x)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)
- [Vite](https://vitejs.dev)
