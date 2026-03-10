# Pulsefy Local Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.11 (for MusicGen/Audiocraft compatibility)

## Environment Variables

### API (`server/.env`)
```env
PORT=4000
DATABASE_URL=postgres://<your_pg_user>@localhost:5432/pulsefy
JWT_SECRET=replace-with-a-long-random-secret
JAMENDO_CLIENT_ID=your-jamendo-client-id
MUSICGEN_PYTHON=/absolute/path/to/server/musicgen/.venv/bin/python
MUSICGEN_MODEL=facebook/musicgen-small
MUSICGEN_DURATION_SEC=8
MUSICGEN_DEVICE=cpu
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000
```

## Database Bootstrap
Run these SQL files in order:
1. `server/db/bootstrap.sql`
2. `server/db/schema.sql`
3. `server/db/seed.sql`

## MusicGen Setup (Meta Audiocraft)
1. Install Python 3.11 if needed:
   - `brew install python@3.11`
2. Create a Python virtual env:
   - `/opt/homebrew/bin/python3.11 -m venv server/musicgen/.venv`
3. Activate it:
   - `source server/musicgen/.venv/bin/activate`
4. Install dependencies:
   - `pip install -r server/musicgen/requirements.txt`
5. Keep `MUSICGEN_PYTHON` pointing to that venv interpreter in `server/.env`.

Notes:
- Current macOS setup runs MusicGen on CPU (`MUSICGEN_DEVICE=cpu`).
- `av` / `xformers` are shimmed for inference compatibility in `server/musicgen/`.

## Run Locally
1. Install frontend deps: `npm install`
2. Install backend deps: `npm --prefix server install`
3. Start API: `npm --prefix server run dev`
4. Start frontend: `npm run dev`

## Quick Health Check
- API health: `GET http://localhost:4000/health`
- Frontend app: open URL shown by Vite (usually `http://localhost:5173`)
- Music generation endpoint: `POST http://localhost:4000/ai/generate` (authenticated)
