# FillKaro — Backend (Node.js + Express)

REST API server powering the FillKaro dashboard and Chrome extension.
Includes a **Gemini AI embedding** endpoint for semantic form-field matching.

## Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) or a MongoDB Atlas connection string
- A free [Gemini API key](https://aistudio.google.com/app/apikey) *(optional — Dice fallback is used if not set)*

## Setup

```bash
cd backend
npm install
```

Add your values to `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fillkaro
GEMINI_API_KEY=your_key_here   # get free key at aistudio.google.com
```

## Run

```bash
npm run dev     # development (auto-restart via nodemon)
npm start       # production
```

Server starts at `http://localhost:5000`

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET/POST/PUT/DELETE | `/api/profiles` | Profile CRUD |
| GET/POST/PUT/DELETE | `/api/templates` | Template CRUD |
| GET/POST/DELETE | `/api/history` | History with pagination |
| GET | `/api/history/stats` | Aggregated fill stats |
| POST | `/api/ai/match-fields` | **GenAI** — Gemini embedding-based field matching |

## GenAI Endpoint

`POST /api/ai/match-fields`

```json
{
  "fields": [{ "label": "Full Name", "name": "name", "type": "text" }],
  "profileMap": { "First Name": "Rushikesh", "Last Name": "Patil" }
}
```

Response:
```json
{
  "matches": {
    "0": { "key": "First Name", "value": "Rushikesh", "score": 0.94 }
  },
  "engine": "gemini-embedding"
}
```

If `GEMINI_API_KEY` is not set, returns `{ "matches": {}, "engine": "none" }` and the extension falls back to Dice coefficient matching automatically.
