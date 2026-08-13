# FillKaro 🤖

A Chrome Extension (MV3) + web dashboard that detects, exports, and autofills web forms intelligently — powered by **Gemini AI embeddings** for semantic field matching.

## Project Structure

```
FillKaro/
├── extension/   # Chrome Extension (MV3) — React + Vite + Tailwind
├── backend/     # Node.js + Express API — MongoDB + Gemini AI
└── client/      # Dashboard — React + Vite + Tailwind
```

---

## Prerequisites

- Node.js ≥ 18
- MongoDB running locally (`mongod`)
- Chrome browser
- A free [Gemini API key](https://aistudio.google.com/app/apikey) *(for AI field matching)*

---

## 1. Start the Backend

```bash
cd backend
npm install
```

Edit `backend/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```
Server runs at `http://localhost:5000`

---

## 2. Start the Dashboard (Web App)

```bash
cd client
npm install
npm run dev
```
Dashboard runs at `http://localhost:5173`

---

## 3. Build & Load the Chrome Extension

```bash
cd extension
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

The FillKaro icon will appear in your toolbar.

---

## Usage

1. Navigate to any page with a form
2. Click the **FillKaro** extension icon
3. **Scan Form** — detects all fields and shows them in the popup
4. **Export Excel** — downloads a `.xlsx` file with field names as columns
5. Edit the Excel with your data, re-upload it in the Dashboard to create a Profile
6. **Autofill** — select a profile and fill the form instantly

---

## Features

- 🔍 Smart form field detection (input, textarea, select, radio, checkbox)
- ✨ **Gemini AI embedding-based field matching** (semantic similarity)
- 🎲 Dice coefficient fuzzy matching (fallback when AI is offline)
- 📊 Excel export/import with SheetJS
- 👤 Profile management (save & reuse fill data)
- ⌨️ Human-like typing mode
