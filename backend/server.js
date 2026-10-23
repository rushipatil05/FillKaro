require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');

const profileRoutes  = require('./routes/profiles');
const templateRoutes = require('./routes/templates');
const aiRoutes       = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fillkaro';

/* ── Middleware ────────────────────────────────────────────── */
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '2mb' }));

/* ── MongoDB connect (cached for serverless warm reuse) ────── */
let _isConnected = false;

async function connectDB() {
  if (_isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    _isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    _isConnected = false;
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

// Ensure DB is connected before handling API requests
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(503).json({ error: 'Database connection unavailable', details: err.message });
  }
});

/* ── Routes ────────────────────────────────────────────────── */
app.use('/api/profiles',  profileRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai',        aiRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

/* ── Local dev: start the HTTP server normally ─────────────── */
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)))
    .catch((err) => console.warn('⚠️ Server started without DB connection:', err.message));
}

module.exports = app;
