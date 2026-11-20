# JontroHaat Express API

Express.js API for the JontroHaat Next.js client. It uses MongoDB's native driver and the same Better Auth user collection as the frontend (`user`, Better Auth's default model name with `usePlural: false`). The user `role` field is read from MongoDB for every protected request.

## Local setup

Requirements: Node.js 20+ and a MongoDB Atlas cluster (or a local replica set for transactions).

1. Copy `.env.example` to `.env` and set the service credentials.
2. Keep `AUTH_USER_COLLECTION=user` unless Better Auth's adapter model name is intentionally changed.
3. Configure `MONGODB_URI` to a replica-set deployment; Atlas provides transaction support.
4. From this directory run `npm install`, `npm test`, and `npm run dev`.
5. Set the frontend's `NEXT_PUBLIC_API_URL=http://localhost:5000`.

The server can start when MongoDB is unavailable so `/api/health` can report a `503` database status. Booking writes require transaction support and return `503` when the configured MongoDB server cannot run transactions.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to `5000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `CLIENT_URL` | Exact CORS-allowed frontend origin(s), comma-separated |
| `MONGODB_URI` | MongoDB Atlas connection string; server-only |
| `DB_NAME` | Application database; defaults to `jontrohaat` |
| `AUTH_USER_COLLECTION` | Exact Better Auth collection; defaults to `user` |
| `BETTER_AUTH_JWKS_URL` | Better Auth JWT plugin JWKS endpoint |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Required JWT claims |
| `RESERVATION_MINUTES` | Unpaid booking reservation lifetime; defaults to `60` |
| `STRIPE_SECRET_KEY` | Stripe **test-mode** secret key; server-only |
| `STRIPE_WEBHOOK_SECRET` | Stripe test webhook signing secret; server-only |
| `STRIPE_CURRENCY` | Checkout currency; `bdt` |
| `IMGBB_API_KEY` | ImgBB API key; server-only |

Never put MongoDB, Stripe secret, webhook, or ImgBB keys in `NEXT_PUBLIC_*` variables. Live Bangladesh merchant payouts are not asserted or enabled by this assignment implementation.

## API

All JSON responses use `{ "success": boolean, "message": string, "data": ... }` on success and `{ "success": false, "message": string }` on errors. Protected routes use `Authorization: Bearer <Better Auth JWT>`.

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /api/health` | Public | Server and MongoDB ping status |
| `GET /api/equipment` | Public | Approved equipment, search/filter/sort/page |
| `GET /api/equipment/featured` | Public | Featured approved equipment |
| `GET /api/equipment/:id` | Public / owner / admin | Equipment details; non-approved records hidden from public |
| `POST /api/equipment` | Owner | Create pending listing |
| `PATCH, DELETE /api/equipment/:id` | Owner / admin | Manage listing; owners are restricted to their own |
| `GET, POST, DELETE /api/favorites` | Customer | List/add/remove favorites (`POST` and `DELETE` use `/:equipmentId`) |
| `GET, PATCH /api/users/me` | Authenticated | Read/update allowed profile fields |
| `POST /api/bookings` | Customer | Create a date-checked, transaction-protected unpaid reservation |
| `GET /api/bookings/my`, `GET /api/bookings/:id` | Customer / owner / admin | Own or authorized booking access |
| `GET /api/owner/bookings`, `PATCH /api/owner/bookings/:id/status` | Owner | Own bookings and allowed fulfilment transitions |
| `GET /api/admin/bookings`, `PATCH /api/admin/bookings/:id/status` | Admin | All bookings and status management |
| `POST /api/payments/checkout-session` | Customer | Create/reuse Stripe Checkout for an owned booking |
| `POST /api/payments/webhook` | Stripe signature | Raw-body signed, idempotent Checkout webhook |
| `GET /api/payments/verify-session?session_id=...` | Customer | Retrieve actual Stripe status for the customer's session |
| `POST /api/uploads/image` | Authenticated | Validate and proxy PNG/JPEG/WEBP to ImgBB (5MB max) |
| `GET /api/owner/analytics` | Owner | Owner-scoped inventory, rentals, paid earnings |
| `GET /api/admin/analytics` | Admin | Platform metrics, paid revenue, monthly bookings, categories |
| `/api/admin/users`, `/api/admin/equipment` | Admin | User and listing management |

The webhook route is registered with Express raw-body parsing before JSON middleware. Payment success is established by Stripe's retrieved Checkout Session, not the browser return URL. Pending bookings expire and are released by scheduled cleanup.

## Local integration checks

- `npm test` covers health behavior, missing/invalid authentication, role-protected route access, request schema rejection, webhook configuration failure, and 404 response format.
- `npm start` starts the API. Verify with `curl http://localhost:5000/api/health`.
- Real Atlas, JWKS, Stripe webhook, and ImgBB integration require valid service credentials; they are not mocked by the test suite.

## Render preparation

`render.yaml` describes the Node web service and its health check. Set every `sync: false` value in Render's environment UI. The service has not been deployed from this repository; a public API URL must be supplied after deployment.
