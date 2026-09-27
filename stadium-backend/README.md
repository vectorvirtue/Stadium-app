# Stadiumapp Backend

FastAPI + PostgreSQL backend for the Stadiumapp ticketing frontend (SignIn/SignUp,
Matches → seat selection → checkout, Wallet, Profile, Admin).

## 1. Set up PostgreSQL

Create a database and user (adjust names/password as you like):

```sql
CREATE USER stadium_user WITH PASSWORD 'stadium_pass';
CREATE DATABASE stadium_db OWNER stadium_user;
```

## 2. Install dependencies

```bash
cd stadium-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — point at the database you created in step 1.
- `JWT_SECRET_KEY` — generate one: `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — from your Paystack dashboard
  (use the `sk_test_...` / `pk_test_...` keys while developing).
- `FRONTEND_ORIGINS` — the URL(s) your Vite dev server / deployed frontend runs on.

## 4. Run migrations

```bash
alembic upgrade head
```

## 5. (Optional) Seed sample data

Creates the 4 sample matches + seat tiers that match the frontend's old mock data,
plus an admin login (`admin@stadiumapp.local` / `ChangeMe123!` — change this password
immediately in a real deployment):

```bash
python -m app.seed
```

## 6. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## API overview

| Area | Endpoint | Auth |
|---|---|---|
| Auth | `POST /auth/signup` | — |
| | `POST /auth/login` | — |
| | `GET /auth/me` | user |
| Matches | `GET /matches` | — |
| | `GET /matches/{id}` | — |
| Tickets | `POST /tickets/checkout` | user |
| | `GET /tickets` (my orders) | user |
| | `POST /tickets/{id}/cancel` | user |
| Payments | `GET /payments/verify/{reference}` | user |
| | `POST /payments/webhook` | Paystack (signature-verified) |
| Profile | `GET /profile` | user |
| | `PATCH /profile` | user |
| | `POST /profile/change-password` | user |
| Wallet | `GET /wallet` | user |
| Admin | `POST /admin/matches`, `PATCH /admin/matches/{id}`, `DELETE /admin/matches/{id}` | admin |
| | `GET /admin/users` | admin |
| | `GET /admin/orders` | admin |
| | `POST /admin/wallet/adjust` | admin |

All authenticated routes expect `Authorization: Bearer <access_token>` from
`/auth/signup` or `/auth/login`.

## Checkout flow

1. Frontend calls `POST /tickets/checkout` with `match_id` and the seat types/quantities
   picked on the "Pick tickets" screen. The backend re-prices everything server-side
   (never trusts a client-sent total), reserves the seats, and creates a `pending` order.
2. It returns an `authorization_url` from Paystack — redirect the browser there
   (this replaces the current placeholder "Payments processed securely off-platform" button).
3. After payment, either:
   - Paystack redirects the user back to your app, where you call
     `GET /payments/verify/{reference}` to confirm and update the order, or
   - Paystack's webhook hits `POST /payments/webhook` directly (recommended as the
     source of truth — set this up in the Paystack dashboard pointing at
     `https://<your-api-domain>/payments/webhook`).

## Notes / things to decide before production

- **Stale pending orders**: seats are reserved as soon as checkout starts. If a user
  abandons the Paystack page, those seats stay reserved until you call
  `POST /tickets/{id}/cancel`. Add a periodic job that cancels pending orders older
  than e.g. 30 minutes so seats aren't held forever.
- **Match date/time formatting**: the old frontend mock used a single `meta` string
  ("14 Nov | 2:00pm | Abuja National Stadium"). The API instead returns structured
  `venue` and `kickoff_at` fields — format them on the frontend however you like.
- **Admin role**: there's no signup flow for admins on purpose — promote a user by
  setting `role = 'admin'` directly in the database, or add an internal-only endpoint
  for it later.
- **AdminDashboard.jsx** on the frontend is currently an empty stub — the `/admin/*`
  endpoints above are ready whenever you build it out.


Frontend integration: set VITE_API_BASE_URL=http://localhost:8000 in the React app's .env.local. Set FRONTEND_URL=http://localhost:5173 in the backend .env; checkout redirects back to /dashboard with a Paystack reference, which the frontend verifies through the backend.
