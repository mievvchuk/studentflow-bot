# StudentFlow Bot

StudentFlow Bot is a full-stack MVP for a Telegram bot plus Telegram Mini App that helps student programmers manage subjects, labs, deadlines, GitHub links, study tracks, learning tasks, progress, and reminders.

Authentication is Telegram-only. The Mini App sends Telegram WebApp `initData` to the backend, the backend validates it with the bot token, creates or updates the user, and returns an application JWT.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Telegram WebApp integration
- Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT, Pydantic, CORS
- Bot: aiogram with `/start` and Mini App button
- Scheduler: APScheduler polling due reminders every minute and sending weekly group summaries

## Project Structure

```text
studentflow-bot/
  backend/
    app/
      main.py
      config.py
      database.py
      models/
      schemas/
      routes/
      services/
      utils/
      scheduler/
      bot/
    alembic/
    requirements.txt
    .env.example
  frontend/
    src/
      api/
      components/
      pages/
      hooks/
      types/
      utils/
      App.tsx
      main.tsx
    package.json
    .env.example
  docker-compose.yml
```

## Environment

Backend:

```bash
cd backend
cp .env.example .env
```

Set:

- `DATABASE_URL`
- `BOT_TOKEN`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `JWT_EXPIRES_MINUTES`
- `MINI_APP_URL`
- `BACKEND_CORS_ORIGINS`

Frontend:

```bash
cd frontend
cp .env.example .env
```

Set:

- `VITE_API_URL`

## Run With Docker

Create both env files first:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then start PostgreSQL, backend, and frontend:

```bash
docker compose up --build
```

The backend service runs Alembic migrations before starting FastAPI.

- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

To also run the Telegram bot and reminder scheduler, set a real `BOT_TOKEN` and run:

```bash
docker compose --profile telegram up --build
```

## Production Deploy

Recommended MVP deploy shape:

- one VPS with Docker and Docker Compose
- two DNS records:
  - `studentflow.example.com` for the Mini App frontend
  - `api.studentflow.example.com` for the backend API
- Caddy reverse proxy for automatic HTTPS
- PostgreSQL in Docker volume for MVP data
- backend, bot, scheduler, and frontend as separate containers

Production files:

- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.deploy.example`
- `frontend/Dockerfile.prod`
- `frontend/nginx.conf`

Setup on the server:

```bash
cp .env.deploy.example .env.deploy
cp backend/.env.example backend/.env
```

Set `.env.deploy`:

```env
FRONTEND_DOMAIN=studentflow.example.com
API_DOMAIN=api.studentflow.example.com
PUBLIC_API_URL=https://api.studentflow.example.com
```

Set `backend/.env`:

```env
DATABASE_URL=postgresql://studentflow:studentflow@postgres:5432/studentflow
BOT_TOKEN=your_bot_token
JWT_SECRET=your_long_random_secret
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=43200
MINI_APP_URL=https://studentflow.example.com
BACKEND_CORS_ORIGINS=https://studentflow.example.com
```

Deploy:

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml up -d --build
```

Then configure BotFather Mini App/Menu Button URL to:

```text
https://studentflow.example.com
```

## Run Locally

Use Python 3.12 for the backend. Python 3.14 is too new for some native dependencies used by Pydantic/FastAPI in this MVP.

Start PostgreSQL first, then:

```bash
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

For Telegram testing from a phone, keep Vite on the exact port used by your tunnel:

```bash
cd frontend
npm run dev:telegram
```

Bot:

```bash
cd backend
python -m app.bot.main
```

Scheduler:

```bash
cd backend
python -m app.scheduler.worker
```

The scheduler checks due reminders every minute. It locks due rows while processing and sets `is_sent=true` after a Telegram message is sent, so a reminder is not sent again on later runs.

## Telegram Mini App Setup

1. Create a bot with BotFather and set `BOT_TOKEN`.
2. Configure the Mini App URL in BotFather to your deployed or tunneled frontend URL.
3. Set `MINI_APP_URL` in the backend to the same frontend URL.
4. Open the bot and run `/start`.
5. Use the `Open StudentFlow` button to launch the Mini App.

For local Telegram testing, expose the frontend with a tunnel such as ngrok or Cloudflare Tunnel and use the HTTPS URL as `MINI_APP_URL`.

### Telegram Phone Testing With Ngrok

Telegram on your phone cannot access `localhost` on your laptop. Use public HTTPS URLs for both frontend and backend:

1. Start PostgreSQL and backend locally:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

2. Start the frontend on a fixed port:

```bash
cd frontend
npm run dev:telegram
```

3. Open two tunnels:

```bash
ngrok http 5173
ngrok http 8000
```

4. Put the frontend tunnel URL into `backend/.env`:

```env
MINI_APP_URL=https://your-frontend-tunnel.ngrok-free.app
BACKEND_CORS_ORIGINS=https://your-frontend-tunnel.ngrok-free.app
```

5. Put the backend tunnel URL into `frontend/.env`:

```env
VITE_API_URL=https://your-backend-tunnel.ngrok-free.app
```

6. Restart backend, frontend, and bot after changing `.env` files.
7. In BotFather, set the Mini App/Menu Button URL to the frontend tunnel URL. For BotFather domain prompts, use only the host, for example `your-frontend-tunnel.ngrok-free.app`.
8. In Telegram, send `/start` to the bot again and press the new `Open StudentFlow` button.

Do not paste the ngrok URL directly into Telegram chat or open it from a normal browser tab. Telegram only provides `WebApp.initData` when the page is launched as a Mini App from the bot button/menu button. If you still see an `initData` error, the button is opening an old URL or the bot was not restarted after changing `MINI_APP_URL`.

## Auth Flow

1. `TelegramAuthPage` reads `window.Telegram.WebApp.initData`.
2. Frontend sends `POST /auth/telegram` with `{ "initData": "..." }`.
3. Backend validates the HMAC signature using `BOT_TOKEN`.
4. Backend creates or updates the user by `telegram_id`.
5. Backend returns `{ access_token, token_type, user }`.
6. Frontend stores the JWT and sends it as `Authorization: Bearer <token>`.

The backend never trusts raw Telegram user data until `initData` is verified.

## API Summary

- `POST /auth/telegram`
- `GET /me`
- `GET|POST /subjects`
- `GET|PUT|DELETE /subjects/{id}`
- `GET|POST /labs`
- `GET|PUT|DELETE /labs/{id}`
- `GET|POST /labs/{lab_id}/tasks`
- `PUT|DELETE /lab-tasks/{id}`
- `GET|POST /study-tracks`
- `GET|PUT|DELETE /study-tracks/{id}`
- `GET|POST /study-tracks/{track_id}/technologies`
- `PUT|DELETE /technologies/{id}`
- `GET|POST /technologies/{technology_id}/tasks`
- `PUT|DELETE /learning-tasks/{id}`
- `GET|POST /reminders`
- `PUT|DELETE /reminders/{id}`
- `GET /dashboard`
- `GET|POST /groups`
- `POST /groups/join`
- `GET|POST /institutions`
- `POST /institutions/join`
- `GET /leaderboard?group_id={id}`

Lab filters:

```bash
GET /labs?status=in_progress&subject_id=1&deadline_from=2026-05-01T00:00:00Z&deadline_to=2026-06-01T00:00:00Z
```

## Security Notes

- No email/password registration exists.
- All protected routes require JWT.
- Every resource query is scoped to the authenticated user.
- Nested resources are ownership-checked through their parent lab, subject, track, or technology.
- Telegram `initData` is validated with the official HMAC flow before user creation.
- Leaderboard data is visible only to members of the requested group.

## Gamification

Groups let students compete inside a class, team, or study group. A user can create a group, share its invite code, or join an existing group by invite code.

Institutions add a higher-level structure for schools, colleges, and universities. A user can create or join an institution by invite code, then create groups inside that institution. Groups remain the leaderboard scope, and institution membership is checked before a user can create a group under that institution.

Additional tables:

- `institutions`
- `institution_members`
- `groups`
- `group_members`
- `weekly_statistics`

Weekly leaderboard scoring:

- `+10` points for each lab completed before or on deadline
- `+3` points for each lab completed after deadline
- `+2` points for each completed learning task
- `+5` bonus points for a weekly streak when the user completed at least one lab or learning task every day of the current week so far

The backend calculates the current week from Monday 00:00 UTC through the next Monday 00:00 UTC. `GET /leaderboard` returns the selected group, top three podium entries, full weekly ranking, and the current user's personal stats.

The scheduler sends a weekly group summary every Sunday at 18:00 UTC to each group member through Telegram.
