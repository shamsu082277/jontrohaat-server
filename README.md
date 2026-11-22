# JontroHaat – Backend API

A RESTful backend API for **JontroHaat**, an agricultural equipment rental platform built to connect equipment owners with customers in Bangladesh.

The backend handles authentication, equipment management, bookings, payments, image hosting, user management, and administrative operations.

## Live Deployment

| Service | URL |
|---|---|
| Frontend | https://jontrohaat.vercel.app |
| Backend API | https://jontrohaat-server.onrender.com |
| API Health Check | https://jontrohaat-server.onrender.com/api/health |
| Frontend Repository | https://github.com/shamsu082277/jontrohaat |
| Backend Repository | https://github.com/shamsu082277/jontrohaat-server |

## Technology Stack

- **Runtime:** Node.js 20+
- **Backend Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** Better Auth JWT
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting
- **Payment Gateway:** Stripe (Test Mode)
- **Image Hosting:** ImgBB
- **Deployment:** Render

## Core Features

### Authentication & Authorization
- Better Auth JWT verification.
- Secure authenticated API endpoints.
- Role-based access control.
- Customer, Owner, and Admin permissions.
- User profile management.

### Equipment Management
- Create, update, and delete equipment listings.
- Browse approved equipment.
- Search, filter, sort, and paginate equipment.
- Featured equipment.
- Equipment approval and moderation.
- Owner-specific listing management.

### Booking Management
- Create equipment rental bookings.
- Validate booking dates and availability.
- Prevent conflicting reservations.
- Transaction-protected booking operations.
- Booking status management.
- Automatic expiration of unpaid reservations.
- Separate customer, owner, and admin booking access.

### Payment Integration
- Stripe Checkout integration.
- Create and reuse checkout sessions.
- Secure Stripe webhook verification.
- Payment status verification.
- Idempotent payment processing.
- Paid booking verification.

**Note:** Stripe is configured for test-mode integration. Live Bangladesh merchant payouts are not enabled or guaranteed by this implementation.

### Image Management
- ImgBB image hosting integration.
- Authenticated image upload endpoint.
- PNG, JPEG, and WEBP validation.
- Maximum upload size: 5 MB.
- Images are hosted externally rather than stored directly in MongoDB.

### Dashboards & Analytics
- Owner inventory and rental analytics.
- Owner earnings based on paid bookings.
- Admin platform statistics.
- Monthly booking reports.
- Equipment category statistics.
- User and equipment administration.

## Project Structure

```text
jontrohaat-server/
│
├── index.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── render.yaml
│
└── src/
    ├── server.js
    ├── app.js
    │
    ├── config/
    │
    ├── controllers/
    │
    ├── middleware/
    │
    ├── routes/
    │
    ├── services/
    │
    ├── validators/
    │
    └── utils/
```

*The structure above represents the main application organization; individual files may vary as the project evolves.*

## Installation & Local Development

### Prerequisites

- Node.js 20 or later
- npm
- MongoDB Atlas account or a local MongoDB replica set
- Stripe account (for payment testing)
- ImgBB API key

### 1. Clone the Repository

```bash
git clone https://github.com/shamsu082277/jontrohaat-server.git

cd jontrohaat-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory.

Copy the example configuration:

```bash
cp .env.example .env
```

Configure the required environment variables:

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string
DB_NAME=jontrohaat
AUTH_USER_COLLECTION=user

BETTER_AUTH_JWKS_URL=your_better_auth_jwks_url
JWT_ISSUER=your_jwt_issuer
JWT_AUDIENCE=your_jwt_audience

RESERVATION_MINUTES=60

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_CURRENCY=bdt

IMGBB_API_KEY=your_imgbb_api_key
```

Never commit your actual `.env` file or expose server-side credentials in frontend environment variables.

### 4. Start the Development Server

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 5. Run Tests

```bash
npm test
```

### 6. Start Production Mode Locally

```bash
npm start
```

## API Documentation

All API responses follow a consistent JSON response structure.

**Successful response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error response:**

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

### API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public |
| GET | `/api/equipment` | Public |
| GET | `/api/equipment/featured` | Public |
| GET | `/api/equipment/:id` | Public / Owner / Admin |
| POST | `/api/equipment` | Owner |
| PATCH | `/api/equipment/:id` | Owner / Admin |
| DELETE | `/api/equipment/:id` | Owner / Admin |
| GET | `/api/favorites` | Customer |
| POST | `/api/favorites/:equipmentId` | Customer |
| DELETE | `/api/favorites/:equipmentId` | Customer |
| GET | `/api/users/me` | Authenticated |
| PATCH | `/api/users/me` | Authenticated |
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/my` | Customer |
| GET | `/api/bookings/:id` | Authorized User |
| GET | `/api/owner/bookings` | Owner |
| PATCH | `/api/owner/bookings/:id/status` | Owner |
| GET | `/api/admin/bookings` | Admin |
| PATCH | `/api/admin/bookings/:id/status` | Admin |
| POST | `/api/payments/checkout-session` | Customer |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/payments/verify-session` | Customer |
| POST | `/api/uploads/image` | Authenticated |
| GET | `/api/owner/analytics` | Owner |
| GET | `/api/admin/analytics` | Admin |
| / | `/api/admin/users` | Admin |
| / | `/api/admin/equipment` | Admin |

### Authentication Headers

Protected endpoints require a valid Better Auth JWT.

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The backend verifies JWT signatures and retrieves user roles from the shared MongoDB user collection.

## Deployment – Render

The backend is deployed on Render.

**Production API URL:**

```text
https://jontrohaat-server.onrender.com
```

### Render Configuration

| Setting | Value |
|---|---|
| Service Type | Web Service |
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### Environment Variables on Render

Add the following server-side variables in:

**Render Dashboard → Your Web Service → Environment**

- `NODE_ENV=production`
- `CLIENT_URL=https://jontrohaat.vercel.app`
- `MONGODB_URI`
- `DB_NAME=jontrohaat`
- `AUTH_USER_COLLECTION=user`
- `BETTER_AUTH_JWKS_URL`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `RESERVATION_MINUTES=60`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY=bdt`
- `IMGBB_API_KEY`

Use the actual values from your service configuration. Never publish secret credentials in GitHub.

### Verify Deployment

Open the health endpoint:

https://jontrohaat-server.onrender.com/api/health

A successful response should confirm that the server is running and MongoDB is connected.

**Important:** Render free-tier services may spin down after inactivity, causing a delay on the first request.

## Frontend Integration

The backend is connected to the Next.js frontend.

Frontend repository:

https://github.com/shamsu082277/jontrohaat

Configure this environment variable in the frontend:

```env
NEXT_PUBLIC_API_URL=https://jontrohaat-server.onrender.com
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

The frontend API client is responsible for attaching the `/api/...` endpoint paths.

## Security & Reliability

- JWT-based authentication.
- Role-based authorization.
- Request validation.
- CORS configuration.
- HTTP security headers.
- Rate limiting.
- Secure payment webhook verification.
- MongoDB transaction protection for booking operations.
- Ownership checks for protected resources.
- Server-side environment variable management.

## Testing

The backend test suite covers:

- Health endpoint behavior.
- Authentication failures.
- Invalid JWT handling.
- Role-protected routes.
- Request validation.
- Payment webhook configuration failures.
- Standard 404 error responses.

Real MongoDB, Better Auth JWKS, Stripe, and ImgBB integrations require valid service credentials.

## Project Information

**Project:** JontroHaat  
**Type:** Agricultural Equipment Rental Platform  
**Backend:** Node.js & Express.js  
**Database:** MongoDB  
**Frontend:** Next.js  
**Deployment:** Render  
**Developer:** Shamsu Uddin

---

**JontroHaat – Making Agricultural Equipment Rental Easier.**