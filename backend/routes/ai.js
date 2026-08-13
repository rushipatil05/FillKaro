/**
 * routes/ai.js
 *
 * POST /api/ai/match-fields
 * ─────────────────────────
 * Takes detected form fields and a user profile map.
 * Uses Gemini text-embedding-004 to semantically match each field
 * to the best-fitting profile key via cosine similarity.
 *
 * Request body:
 *   {
 *     fields:     [ { label, name, id, placeholder, type, index, ariaLabel } ],
 *     profileMap: { "First Name": "Rushikesh", "Email": "rush@gmail.com", ... }
 *   }
 *
 * Response:
 *   {
 *     matches: {
 *       "0": { key: "First Name", value: "Rushikesh", score: 0.95 },
 *       "2": { key: "Email",      value: "rush@gmail.com", score: 0.99 }
 *     },
 *     engine: "gemini-embedding"   // so client knows AI was used
 *   }
 *
 * On error (no API key, quota exceeded, etc.) → returns { matches: {}, engine: "none", error }
 * The extension will silently fall back to the Dice coefficient engine.
 */

const express      = require('express');
const { matchFields } = require('../services/embeddings');

const router = express.Router();

router.post('/match-fields', async (req, res) => {
  const { fields, profileMap } = req.body;

  if (!Array.isArray(fields) || !fields.length) {
    return res.status(400).json({ error: '`fields` must be a non-empty array' });
  }
  if (!profileMap || typeof profileMap !== 'object') {
    return res.status(400).json({ error: '`profileMap` must be an object' });
  }
  if (!process.env.GEMINI_API_KEY) {
    // Graceful degradation — client will fall back to Dice
    return res.json({ matches: {}, engine: 'none', reason: 'GEMINI_API_KEY not set' });
  }

  try {
    const matches = await matchFields(fields, profileMap);
    res.json({ matches, engine: 'gemini-embedding' });
  } catch (err) {
    console.error('[AI] matchFields error:', err.message);
    // Return empty matches so extension gracefully falls back to Dice
    res.json({ matches: {}, engine: 'none', error: err.message });
  }
});

module.exports = router;
