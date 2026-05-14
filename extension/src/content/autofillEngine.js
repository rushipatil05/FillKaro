function normalize(str) {
  return String(str)
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase → words
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_\-\.\/\\]+/g, ' ')           // separators → space
    .replace(/[^a-z0-9 ]/g, '')             // strip special chars
    .replace(/\s+/g, ' ')
    .trim();
}

/* ──────────────────────────────────────────────────────────
   Dice coefficient fuzzy matching
─────────────────────────────────────────────────────────── */
function bigrams(s) {
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b)  return 1;
  const ag = bigrams(a), bg = bigrams(b);
  if (!ag.size || !bg.size) return (a.includes(b) || b.includes(a)) ? 0.5 : 0;
  let n = 0;
  for (const g of ag) if (bg.has(g)) n++;
  return (2 * n) / (ag.size + bg.size);
}

function score(keyNorm, candNorm) {
  if (!keyNorm || !candNorm) return 0;
  if (keyNorm === candNorm)  return 1;
  const d = dice(keyNorm, candNorm);
  // Boost for substring containment
  const sub = (keyNorm.includes(candNorm) || candNorm.includes(keyNorm)) ? 0.15 : 0;
  return Math.min(1, d + sub);
}

/* ──────────────────────────────────────────────────────────
   Composite field rules
   Handles "Name" → first_name + " " + last_name, etc.
─────────────────────────────────────────────────────────── */
const COMPOSITE_RULES = [
  {
    // "Name", "Full Name", "Your Name" → firstName + lastName
    patterns: ['name', 'full name', 'fullname', 'your name', 'complete name', 'student name', 'candidate name'],
    groups: [
      ['first name', 'firstname', 'given name', 'givenname', 'first'],
      ['last name', 'lastname', 'surname', 'family name', 'familyname', 'last'],
    ],
    compose: parts => parts.filter(Boolean).join(' ').trim(),
  },
  {
    // "Full Address" → street + city + state + zip
    patterns: ['full address', 'complete address', 'mailing address', 'address'],
    groups: [
      ['address', 'street', 'street address', 'address line 1', 'address1'],
      ['city'],
      ['state', 'province', 'region'],
      ['zip', 'zipcode', 'zip code', 'postal code', 'pincode', 'pin code', 'pin'],
    ],
    compose: parts => parts.filter(Boolean).join(', ').trim(),
  },
];

/**
 * Try to resolve a field label using composite rules.
 * Returns the composed string, or null if no rule matched.
 */
// Generic placeholder text that should never be used as a label for matching
const GENERIC_PLACEHOLDERS = new Set([
  'your answer', 'type here', 'enter here', 'required', 'optional',
  'short answer text', 'long answer text', 'enter your answer',
  'select', 'choose', 'mm/dd/yyyy',
]);

function resolveComposite(fieldLabel, profileMap) {
  const normLabel = normalize(fieldLabel);
  if (!normLabel) return null;

  // ── If a profile key directly/nearly matches the field label, skip composite ──
  // e.g. field = "Address", profile has key "Address" → score 1.0 → use it directly
  for (const profileKey of Object.keys(profileMap)) {
    if (score(normalize(profileKey), normLabel) >= 0.88) return null; // let bestMatch handle it
  }

  for (const rule of COMPOSITE_RULES) {
    const ruleMatches = rule.patterns.some(
      p => score(normalize(p), normLabel) > 0.72 || normLabel === normalize(p),
    );
    if (!ruleMatches) continue;

    // For each source group, find the best matching profile key
    const parts = rule.groups.map(group => {
      let best = { val: '', s: 0 };
      for (const [profileKey, profileVal] of Object.entries(profileMap)) {
        const normKey = normalize(profileKey);
        const s = Math.max(...group.map(g => score(normalize(g), normKey)));
        if (s > best.s) best = { val: profileVal, s };
      }
      return best.s > 0.7 ? best.val : '';
    });

    if (parts.some(Boolean)) return rule.compose(parts);
  }

  return null;
}

/* ──────────────────────────────────────────────────────────
   Best profile key → field matching
─────────────────────────────────────────────────────────── */
function bestMatch(field, profileMap, threshold) {
  // Build candidates in PRIORITY order:
  //   label > ariaLabel > name > id > placeholder (only if not generic)
  const rawCandidates = [
    { text: field.label       || '', weight: 1.0  },
    { text: field.ariaLabel   || '', weight: 1.0  },
    { text: field.name        || '', weight: 0.85 },
    { text: field.id          || '', weight: 0.85 },
    { text: field.placeholder || '', weight: 0.7  },
  ];

  const candidates = rawCandidates
    .map(c => ({ ...c, text: normalize(c.text) }))
    .filter(c => {
      if (!c.text) return false;
      // Exclude generic placeholder text — it matches everything equally wrong
      if (GENERIC_PLACEHOLDERS.has(c.text)) return false;
      return true;
    });

  let best = { key: null, val: null, score: 0 };

  for (const [profileKey, profileVal] of Object.entries(profileMap)) {
    const normKey = normalize(profileKey);
    for (const cand of candidates) {
      const s = score(normKey, cand.text) * cand.weight;
      if (s > best.score) best = { key: profileKey, val: profileVal, score: s };
    }
  }

  if (best.score >= threshold) return best;

  // ── Type-based fallback (when labels are completely missing) ──
  const TYPE_HINTS = {
    email:    ['email', 'e mail', 'mail'],
    tel:      ['phone', 'mobile', 'telephone', 'contact', 'tel', 'cell'],
    number:   ['number', 'age', 'zip', 'pin', 'postal'],
    date:     ['date', 'dob', 'birthday', 'birth date'],
    url:      ['url', 'website', 'link', 'web'],
    password: ['password', 'pass', 'pwd'],
  };
  const hints = TYPE_HINTS[field.type] || [];
  if (hints.length) {
    for (const [profileKey, profileVal] of Object.entries(profileMap)) {
      const normKey = normalize(profileKey);
      const s = Math.max(...hints.map(h => score(h, normKey)));
      if (s > best.score) best = { key: profileKey, val: profileVal, score: s };
    }
    if (best.score >= threshold) return best;
  }

  return { key: null, val: null, score: 0 };
}

/* ──────────────────────────────────────────────────────────
   React / Vue compatible native setters + event dispatch
─────────────────────────────────────────────────────────── */
function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  if (desc?.set) {
    desc.set.call(el, value); // Must use .call(el) — native setter needs correct `this`
  } else {
    el.value = value;
  }
}

function fire(el, ...events) {
  events.forEach(name => el.dispatchEvent(new Event(name, { bubbles: true, cancelable: true })));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ──────────────────────────────────────────────────────────
   Field fillers
─────────────────────────────────────────────────────────── */
async function fillText(el, value, humanMode) {
  el.focus();
  if (humanMode) {
    setNativeValue(el, '');
    fire(el, 'input');
    for (const ch of String(value)) {
      setNativeValue(el, el.value + ch);
      fire(el, 'input');
      await sleep(18 + Math.random() * 20);
    }
    fire(el, 'change', 'blur');
  } else {
    setNativeValue(el, String(value));
    fire(el, 'input', 'change', 'blur');
  }
}

function fillSelect(el, value) {
  const strVal = String(value).toLowerCase().trim();
  // Exact value/text match first
  for (const opt of el.options) {
    if (opt.value.toLowerCase() === strVal || opt.text.toLowerCase().trim() === strVal) {
      el.value = opt.value;
      fire(el, 'change', 'blur');
      return true;
    }
  }
  // Fuzzy text match
  let best = { opt: null, s: 0 };
  for (const opt of el.options) {
    const s = Math.max(
      score(normalize(opt.text), normalize(strVal)),
      score(normalize(opt.value), normalize(strVal)),
    );
    if (s > best.s) best = { opt, s };
  }
  if (best.opt && best.s > 0.4) {
    el.value = best.opt.value;
    fire(el, 'change', 'blur');
    return true;
  }
  return false;
}

function fillRadio(name, value) {
  const radios = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
  const strVal = String(value).toLowerCase();
  for (const r of radios) {
    if (r.value.toLowerCase() === strVal) {
      r.click();
      fire(r, 'change');
      return true;
    }
  }
  // Fuzzy fallback
  let best = { el: null, s: 0 };
  for (const r of radios) {
    const s = score(normalize(r.value), normalize(strVal));
    if (s > best.s) best = { el: r, s };
  }
  if (best.el && best.s > 0.5) {
    best.el.click();
    fire(best.el, 'change');
    return true;
  }
  return false;
}

function fillCheckbox(el, value) {
  const check = ['true', 'yes', '1', 'on', 'checked', 'x'].includes(String(value).toLowerCase());
  if (el.checked !== check) { el.click(); fire(el, 'change'); }
  return true;
}

/* ──────────────────────────────────────────────────────────
   Robust element finder — 4 strategies for Google Forms etc.
─────────────────────────────────────────────────────────── */
const FILLABLE_SEL = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select';

// aria-label values that are NOT unique — shared by all inputs on Google Forms.
// Using querySelector with these would always return the FIRST input on the page.
const GENERIC_ARIA_LABELS = new Set([
  'your answer', 'type here', 'enter here', 'enter your answer',
  'short answer text', 'long answer text', 'required',
]);

function findElement(field) {
  // 1. By id (most reliable for standard forms)
  if (field.id) {
    const el = document.querySelector(`#${CSS.escape(field.id)}`);
    if (el) return el;
  }

  // 2. By name attribute — works for both standard forms AND Google Forms (entry.XXXXX is unique per question)
  if (field.name) {
    const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
    if (el) return el;
  }

  // 3. By aria-label — ONLY when the label is question-specific (not a shared generic like "Your answer").
  //    On Google Forms all short-answer inputs share aria-label="Your answer",
  //    so querySelector would always return the FIRST input — causing wrong-field fills.
  if (field.ariaLabel) {
    const normAria = field.ariaLabel.replace(/[*✱＊]\s*/g, '').trim().toLowerCase();
    if (!GENERIC_ARIA_LABELS.has(normAria)) {
      const selectors = [
        `[aria-label="${CSS.escape(field.ariaLabel)}"]`,
        `[aria-label="${CSS.escape(field.ariaLabel.replace(/[*✱＊]\s*/g, '').trim())}"]`,
      ];
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el) return el;
        } catch { /* invalid selector, skip */ }
      }
    }
  }

  // 4. By DOM position index — recorded at scan time, always unique and correct.
  //    This is the primary fallback for Google Forms where id/name/aria-label are absent or shared.
  if (typeof field.domIndex === 'number' && field.domIndex >= 0) {
    const all = document.querySelectorAll(FILLABLE_SEL);
    const el  = all[field.domIndex];
    if (el) return el;
  }

  return null;
}


export async function autofill(fields, profileMap, options = {}) {
  const { threshold = 0.42, humanMode = false, delayBetween = 60 } = options;
  const results = [];

  for (const field of fields) {
    if (field.disabled) {
      results.push({ ...field, matched: false, reason: 'disabled' });
      continue;
    }

    /* ── Try composite rule first (e.g. "Name" → first + last) ── */
    // Prefer ariaLabel (reliable on Google Forms), then label, skip generic placeholders
    const rawCompLabel = field.ariaLabel || field.label || field.name || field.placeholder || '';
    const compLabel = GENERIC_PLACEHOLDERS.has(normalize(rawCompLabel)) ? '' : rawCompLabel;
    let fillValue   = resolveComposite(compLabel, profileMap);

    /* ── Direct fuzzy match ── */
    let matchedKey = null;
    if (!fillValue) {
      const m = bestMatch(field, profileMap, threshold);
      if (m.key) { fillValue = m.val; matchedKey = m.key; }
    }

    if (!fillValue && fillValue !== 0) {
      results.push({ ...field, matched: false, reason: `no match (best < ${threshold})` });
      continue;
    }

    /* ── Find the DOM element (4-strategy: id → name → aria-label → domIndex) ── */
    const el = findElement(field);
    if (!el) {
      results.push({ ...field, matched: false, reason: 'element not found in DOM' });
      continue;
    }

    try {
      const t = field.type;
      if (t === 'select' || field.tagName === 'select') {
        fillSelect(el, fillValue);
      } else if (t === 'radio') {
        fillRadio(field.name, fillValue);
      } else if (t === 'checkbox') {
        fillCheckbox(el, fillValue);
      } else {
        await fillText(el, fillValue, humanMode);
      }

      results.push({ ...field, matched: true, matchedKey, value: fillValue });
      if (delayBetween > 0) await sleep(delayBetween);
    } catch (err) {
      results.push({ ...field, matched: false, reason: err.message });
    }
  }

  return results;
}
