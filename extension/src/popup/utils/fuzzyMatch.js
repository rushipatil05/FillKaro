/**
 * fuzzyMatch.js — Dice coefficient + smart normalization for popup preview
 */

export function normalize(str) {
  return String(str)
    .replace(/([a-z])([A-Z])/g, '$1 $2')    // camelCase → words
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_\-\.\/\\]+/g, ' ')            // separators → space
    .replace(/[^a-z0-9 ]/g, '')              // strip special chars
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

export function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b)  return 1;
  const ag = bigrams(a), bg = bigrams(b);
  if (!ag.size || !bg.size) return (a.includes(b) || b.includes(a)) ? 0.5 : 0;
  let n = 0;
  for (const g of ag) if (bg.has(g)) n++;
  return (2 * n) / (ag.size + bg.size);
}

function score(a, b) {
  const d = dice(a, b);
  const sub = (a.includes(b) || b.includes(a)) ? 0.15 : 0;
  return Math.min(1, d + sub);
}

/** Composite rules — mirrors autofillEngine.js for preview */
const COMPOSITE_RULES = [
  {
    patterns: ['name', 'full name', 'fullname', 'your name', 'complete name'],
    groups:   [['first name', 'firstname', 'first'], ['last name', 'lastname', 'surname', 'last']],
  },
  {
    patterns: ['full address', 'address', 'complete address'],
    groups:   [['address', 'street'], ['city'], ['state', 'province'], ['zip', 'postal code', 'pincode']],
  },
];

function isCompositeMatch(fieldLabel, profileKeys) {
  const normLabel = normalize(fieldLabel);
  for (const rule of COMPOSITE_RULES) {
    if (rule.patterns.some(p => score(normalize(p), normLabel) > 0.72)) {
      const anyGroupMatched = rule.groups.some(group =>
        profileKeys.some(k => group.some(g => score(normalize(g), normalize(k)) > 0.7)),
      );
      if (anyGroupMatched) return { key: '⚡ composite', score: 1 };
    }
  }
  return null;
}

/**
 * Find the best matching profile key for a detected field.
 * Returns { key, score } or { key: null, score: 0 }.
 */
export function findBestMatch(field, profileKeys, threshold = 0.42) {
  // Check composite first
  const comp = isCompositeMatch(
    field.label || field.placeholder || field.name || '',
    profileKeys,
  );
  if (comp) return comp;

  const candidates = [
    normalize(field.label       || ''),
    normalize(field.name        || ''),
    normalize(field.id          || ''),
    normalize(field.placeholder || ''),
  ].filter(Boolean);

  let best = { key: null, score: 0 };
  for (const key of profileKeys) {
    const normKey = normalize(key);
    for (const cand of candidates) {
      const s = score(normKey, cand);
      if (s > best.score) best = { key, score: s };
    }
  }

  return best.score >= threshold ? best : { key: null, score: 0 };
}
