# Stadiumapp connected frontend and backend

## Frontend

1. In `my-app`, copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the running backend URL (default `http://localhost:8000`).
3. Run `npm install` and `npm run dev`.

## Backend

1. In `stadium-backend`, copy `.env.example` to `.env` and configure PostgreSQL, JWT, and Paystack test keys.
2. Keep `FRONTEND_URL` set to the frontend's origin and include the same origin in `FRONTEND_ORIGINS`.
3. Install `requirements.txt`, run `alembic upgrade head`, then start `uvicorn app.main:app --reload --port 8000`.

Checkout goes through the backend to Paystack. The frontend verifies the returned reference with the backend before reporting the payment status. Keep Paystack secret keys only in the backend `.env` file; never put them in the Vite environment.


To run a test on the software do this:
1. Run `python -m app.seed` from stadium-backend. This creates an admin account (admin@stadiumapp-admin.com / ChangeMe123!), a demo fan account (demo.fan@stadiumapp.example / ChangeMe123!), and a paid order with issued tickets plus gate-scan history — so Ticket Sales, Attendance/Gate, and Sales by Category aren't empty on first load.

2. From stadium-backend, run `uvicorn app.main:app --reload --port 8000`.

3. In a second terminal, cd my-app, run `npm install` then `npm run dev`. It reads VITE_API_BASE_URL from my-app/.env, which is already set to http://localhost:8000. Open the printed localhost URL (usually :5173).