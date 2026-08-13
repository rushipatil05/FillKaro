/**
 * embeddings.js — Gemini text-embedding-004 + cosine similarity
 *
 * GenAI concepts used here:
 *   - Text Embeddings   : Dense vector representation of text meaning
 *   - Cosine Similarity : Measures the angle between two vectors (0=unrelated, 1=identical)
 *   - Semantic Matching : Matching by meaning, not just character overlap
 *   - Batch Embedding   : Embedding multiple texts in a single API call for efficiency
 *
 * NOTE: We use direct REST calls (v1) instead of the @google/generative-ai SDK
 * because SDK v0.21.0 hardcodes the v1beta endpoint, and text-embedding-004 is
 * only available on v1. Direct fetch bypasses that limitation cleanly.
 */

const MODEL = 'gemini-embedding-001';

/* ── Light normalisation before embedding ── */
function norm(str) {
  return String(str || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase → words
    .replace(/[_\-./\\]+/g, ' ')            // separators → spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Embed an array of strings via direct v1 REST API call.
 * Returns an array of number[] (one embedding per input string).
 *
 * Uses parallel embedContent calls (Promise.all) since batchEmbedContents
 * is not available on gemini-embedding-001 via the REST API.
 */
async function batchEmbed(texts) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');

  // embedContent calls run in parallel — fast for small batches (< 20 texts)
  const results = await Promise.all(
    texts.map(async function(text) {
      const url = 'https://generativelanguage.googleapis.com/v1/models/' + MODEL + ':embedContent?key=' + key;
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:  { parts: [{ text: text }] },
          taskType: 'SEMANTIC_SIMILARITY',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(function(){ return {}; });
        throw new Error('Gemini API ' + res.status + ': ' + (err && err.error && err.error.message || res.statusText));
      }
      const data = await res.json();
      return data.embedding.values; // number[]
    })
  );

  return results; // number[][]
}

/**
 * Cosine similarity between two embedding vectors.
 *  - Returns 1.0  → vectors point in the same direction (identical meaning)
 *  - Returns 0.0  → vectors are perpendicular (unrelated)
 *  - Returns -1.0 → vectors point in opposite directions
 */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Main function — matches each form field to the best profile key using embeddings.
 *
 * @param {Array}  fields     - Detected form fields [{label, name, id, placeholder, type, index}]
 * @param {Object} profileMap - User profile data { "First Name": "Rushikesh", "Email": "..." }
 * @returns {Object} matches  - { fieldIndex: { key, value, score } }
 *
 * How it works:
 *  1. Collect all text to embed: field labels + profile key names
 *  2. Send ONE batch request to Gemini → get all embeddings at once
 *  3. For each field, compute cosine similarity against every profile key
 *  4. Return the best match (highest score) if it clears a threshold
 */
async function matchFields(fields, profileMap) {
  const profileKeys   = Object.keys(profileMap);
  const profileValues = Object.values(profileMap);

  if (!profileKeys.length || !fields.length) return {};

  /* ── Build representative text for each field ── */
  // Priority: label > ariaLabel > name > placeholder (mirrors autofillEngine.js)
  const fieldTexts = fields.map(f =>
    norm(f.label || f.ariaLabel || f.name || f.placeholder || f.type || '')
  );

  const keyTexts = profileKeys.map(k => norm(k));

  /* ── Filter out empty strings (unrepresentable fields) ── */
  const validFieldIndices = fieldTexts
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.length > 0)
    .map(({ i }) => i);

  if (!validFieldIndices.length) return {};

  /* ── Batch embed: all field texts + all profile key texts in ONE call ── */
  const allTexts = [
    ...validFieldIndices.map(i => fieldTexts[i]),
    ...keyTexts,
  ];

  const allEmbeddings = await batchEmbed(allTexts);

  // Split back into field embeddings and key embeddings
  const fieldEmbeddings = allEmbeddings.slice(0, validFieldIndices.length);
  const keyEmbeddings   = allEmbeddings.slice(validFieldIndices.length);

  /* ── Compute cosine similarity matrix and pick best match per field ── */
  const THRESHOLD = 0.60; // Minimum similarity score to accept a match
  const matches   = {};

  validFieldIndices.forEach((fieldIdx, embIdx) => {
    const fieldEmb = fieldEmbeddings[embIdx];
    let bestScore = -1;
    let bestKeyIdx = -1;

    for (let k = 0; k < keyEmbeddings.length; k++) {
      const sim = cosineSimilarity(fieldEmb, keyEmbeddings[k]);
      if (sim > bestScore) {
        bestScore  = sim;
        bestKeyIdx = k;
      }
    }

    if (bestScore >= THRESHOLD && bestKeyIdx >= 0) {
      matches[fieldIdx] = {
        key:   profileKeys[bestKeyIdx],
        value: profileValues[bestKeyIdx],
        score: Math.round(bestScore * 100) / 100,   // round to 2 decimal places
      };
    }
  });

  return matches;
}

module.exports = { matchFields };
