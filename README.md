# FillKaro 🤖

A production-ready Chrome Extension (MV3) + MERN web app that detects, exports, and autofills web forms intelligently.

## Project Structure

```
FillKaro/
├── extension/    # Chrome Extension (MV3) — React + Vite + Tailwind
├── server/       # Express + MongoDB API
└── client/       # MERN Dashboard — React + Vite + Tailwind
```

---

## Prerequisites

- Node.js >= 18
- MongoDB running locally (`mongod`)
- Chrome browser

---

## 1. Start the Server

```bash
cd server
npm install
cp .env.example .env   # edit if needed
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
- 📊 Excel export/import with SheetJS
- 🤖 Fuzzy-match autofill engine (Dice coefficient)
- 👤 Profile management (save & reuse fill data)
- ⌨️ Human-like typing mode
