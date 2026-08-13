require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');

const profileRoutes  = require('./routes/profiles');
const templateRoutes = require('./routes/templates');
const historyRoutes  = require('./routes/history');
const aiRoutes       = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fillkaro';

/* ── Middleware ────────────────────────────────────────────── */
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '2mb' }));

/* ── Routes ────────────────────────────────────────────────── */
app.use('/api/profiles',  profileRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/history',   historyRoutes);
app.use('/api/ai',        aiRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

/* ── MongoDB connect (cached for serverless warm reuse) ────── */
let _isConnected = false;

async function connectDB() {
  if (_isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    _isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

/* ── Local dev: start the HTTP server normally ─────────────── */
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)))
    .catch(() => process.exit(1));
} else {
  /* Vercel serverless: connect on first cold-start request */
  const originalHandler = app.handle.bind(app);
  app.handle = async (req, res) => {
    await connectDB();
    originalHandler(req, res);
  };
}

/* ── Export for Vercel serverless ──────────────────────────── */
module.exports = app;
