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
  const sub = (keyNorm.includes(candNorm) || candNorm.includes(keyNorm)) ? 0.15 : 0;
  return Math.min(1, d + sub);
}

/* ──────────────────────────────────────────────────────────
   Composite field rules
   Handles "Name" → first_name + " " + last_name, etc.
─────────────────────────────────────────────────────────── */
const COMPOSITE_RULES = [
  {
    patterns: ['name', 'full name', 'fullname', 'your name', 'complete name', 'student name', 'candidate name'],
    groups: [
      ['first name', 'firstname', 'given name', 'givenname', 'first'],
      ['last name', 'lastname', 'surname', 'family name', 'familyname', 'last'],
    ],
    compose: parts => parts.filter(Boolean).join(' ').trim(),
  },
  {
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

// Generic placeholder text that should never be used as a label for matching
const GENERIC_PLACEHOLDERS = new Set([
  'your answer', 'type here', 'enter here', 'required', 'optional',
  'short answer text', 'long answer text', 'enter your answer',
  'select', 'choose', 'mm/dd/yyyy',
]);

/* ──────────────────────────────────────────────────────────
   Semantic Synonym Groups
─────────────────────────────────────────────────────────── */
const SYNONYM_GROUPS = [
  ['address', 'location', 'residence', 'street', 'city', 'mailing address', 'residential address', 'permanent address', 'current address', 'place', 'locality', 'area'],
  ['comments', 'comment', 'review', 'reviews', 'feedback', 'feedbacks', 'message', 'remarks', 'remark', 'note', 'notes', 'suggestion', 'suggestions', 'description', 'opinion', 'query', 'queries', 'complaint', 'thoughts', 'additional info', 'additional comments'],
  ['phone', 'phone number', 'phonenumber', 'mobile', 'mobile number', 'mobilenumber', 'contact', 'contact number', 'telephone', 'cell', 'whatsapp', 'cell phone'],
  ['email', 'email address', 'e mail', 'mail', 'email id', 'mail id'],
  ['name', 'full name', 'fullname', 'your name', 'applicant name', 'candidate name', 'student name', 'user name', 'username'],
  // College/University — institution name ONLY, NOT percentages or CGPA
  ['college', 'university', 'institute', 'institution', 'school', 'campus'],
  ['gender', 'sex'],
  ['dob', 'date of birth', 'birth date', 'birthday'],
  ['designation', 'role', 'job title', 'title', 'occupation', 'profession', 'position'],
  ['company', 'company name', 'organization', 'employer', 'workplace'],
];

/* ──────────────────────────────────────────────────────────
   FIELD_ALIASES — explicit academic field patterns
   Maps field label keywords → profile key keywords.

   CRITICAL: if the field label matches an alias pattern but NO profile key
   matches the profileKeywords, we return { blocked: true } to PREVENT
   dice/synonym from wrongly filling the field (e.g. CGPA into 10th %).
─────────────────────────────────────────────────────────── */
const FIELD_ALIASES = [
  // 10th / SSC / Matriculation percentage
  {
    fieldPatterns:  ['10th', 'tenth', 'ssc', 'matric', 'matriculation', 'x %', 'x percent',
                     '10 percent', '10th percent', '10th %', 'class 10', 'class x',
                     'secondary percent', 'secondary %'],
    profileKeywords: ['10th', 'tenth', 'ssc', 'matric', 'class 10', 'class x',
                      'secondary percent', '10 percent'],
  },
  // 12th / HSC / Intermediate percentage
  {
    fieldPatterns:  ['12th', 'twelfth', 'hsc', 'intermediate', 'xii', 'class 12', 'class xii',
                     '12 percent', '12th percent', '12th %', 'higher secondary', 'inter percent'],
    profileKeywords: ['12th', 'twelfth', 'hsc', 'intermediate', 'class 12', 'class xii',
                      'higher secondary', '12 percent'],
  },
  // Graduation CGPA / GPA (checked before graduation %)
  {
    fieldPatterns:  ['cgpa', 'gpa', 'graduation cgpa', 'college cgpa', 'ug cgpa',
                     'grad cgpa', 'degree cgpa', 'graduation gpa'],
    profileKeywords: ['cgpa', 'gpa'],
  },
  // Graduation / UG percentage
  {
    fieldPatterns:  ['graduation percent', 'ug percent', 'degree percent', 'bachelor percent',
                     'college percent', 'graduation %', 'ug %'],
    profileKeywords: ['graduation percent', 'ug percent', 'degree percent',
                      'bachelor percent', 'college percent'],
  },
];

/**
 * resolveAlias — explicit field-pattern → profile-key mapping.
 *
 * Returns:
 *   { key, val, blocked: false }  — matched a profile key → use this value
 *   { blocked: true }             — field IS an academic field, but no matching
 *                                   profile key found → SKIP (don't fall through
 *                                   to dice/synonym which would pick the wrong key)
 *   null                          — field doesn't match any alias → let other
 *                                   strategies handle it
 */
function resolveAlias(field, profileMap) {
  const rawCandidates = [
    field.label,
    field.ariaLabel,
    field.name,
    field.placeholder,
  ];

  const candNorm = rawCandidates
    .map(t => normalize(t || ''))
    .filter(t => t && !GENERIC_PLACEHOLDERS.has(t))
    .join(' ');

  if (!candNorm) return null;

  for (const alias of FIELD_ALIASES) {
    const fieldMatches = alias.fieldPatterns.some(p => candNorm.includes(normalize(p)));
    if (!fieldMatches) continue;

    // Field pattern matched — now look for a profile key that fits
    for (const [profileKey, profileVal] of Object.entries(profileMap)) {
      const normKey = normalize(profileKey);
      const keyMatches = alias.profileKeywords.some(pk => normKey.includes(normalize(pk)));
      if (keyMatches && profileVal !== undefined && profileVal !== null && profileVal !== '') {
        return { key: profileKey, val: profileVal, blocked: false };
      }
    }

    // Field IS a recognized academic field but no matching profile key exists.
    // Block dice/synonym from wrongly assigning a different academic value.
    return { blocked: true };
  }

  return null; // Not a recognized alias field — no opinion
}

function resolveSynonym(field, profileMap) {
  const rawCandidates = [
    field.label,
    field.ariaLabel,
    field.name,
    field.id,
    field.placeholder,
  ];

  const candTexts = rawCandidates
    .map(t => normalize(t))
    .filter(t => t && !GENERIC_PLACEHOLDERS.has(t));

  for (const cand of candTexts) {
    for (const group of SYNONYM_GROUPS) {
      const inGroup = group.some(item => cand === item || cand.includes(item) || item.includes(cand));
      if (!inGroup) continue;

      for (const [profileKey, profileVal] of Object.entries(profileMap)) {
        const normKey = normalize(profileKey);
        const keyInGroup = group.some(item => normKey === item || normKey.includes(item) || item.includes(normKey));
        if (keyInGroup && (profileVal !== undefined && profileVal !== null && profileVal !== '')) {
          return { key: profileKey, val: profileVal };
        }
      }
    }
  }

  return null;
}

function resolveComposite(fieldLabel, profileMap) {
  const normLabel = normalize(fieldLabel);
  if (!normLabel) return null;

  for (const profileKey of Object.keys(profileMap)) {
    if (score(normalize(profileKey), normLabel) >= 0.88) return null;
  }

  for (const rule of COMPOSITE_RULES) {
    const ruleMatches = rule.patterns.some(
      p => score(normalize(p), normLabel) > 0.72 || normLabel === normalize(p),
    );
    if (!ruleMatches) continue;

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
   Best profile key → field matching (Dice)
─────────────────────────────────────────────────────────── */
function bestMatch(field, profileMap, threshold) {
  const rawCandidates = [
    { text: field.label       || '', weight: 1.0  },
    { text: field.ariaLabel   || '', weight: 1.0  },
    { text: field.name        || '', weight: 0.85 },
    { text: field.id          || '', weight: 0.85 },
    { text: field.placeholder || '', weight: 0.7  },
  ];

  const candidates = rawCandidates
    .map(c => ({ ...c, text: normalize(c.text) }))
    .filter(c => c.text && !GENERIC_PLACEHOLDERS.has(c.text));

  let best = { key: null, val: null, score: 0 };

  for (const [profileKey, profileVal] of Object.entries(profileMap)) {
    const normKey = normalize(profileKey);
    for (const cand of candidates) {
      const s = score(normKey, cand.text) * cand.weight;
      if (s > best.score) best = { key: profileKey, val: profileVal, score: s };
    }
  }

  if (best.score >= threshold) return best;

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
    desc.set.call(el, value);
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
async function fillText(el, value) {
  el.focus();
  setNativeValue(el, String(value));
  fire(el, 'input', 'change', 'blur');
}

function fillSelect(el, value) {
  const strVal = String(value).toLowerCase().trim();
  for (const opt of el.options) {
    if (opt.value.toLowerCase() === strVal || opt.text.toLowerCase().trim() === strVal) {
      el.value = opt.value;
      fire(el, 'change', 'blur');
      return true;
    }
  }
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

/**
 * fillRadio — for standard HTML radio inputs (input[type="radio"]).
 *
 * Strategy 1: by [name] attribute (standard HTML forms).
 * Strategy 2: container-scoped search for custom UIs where name is absent.
 */
function fillRadio(name, value, sourceEl) {
  const strVal = String(value).toLowerCase().trim();

  // ── Strategy 1: by name attribute ──
  if (name) {
    const radios = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
    if (radios.length > 0) {
      for (const r of radios) {
        if (r.value.toLowerCase() === strVal) {
          r.click(); fire(r, 'change'); return true;
        }
      }
      let best = { el: null, s: 0 };
      for (const r of radios) {
        const s = score(normalize(r.value), normalize(strVal));
        if (s > best.s) best = { el: r, s };
      }
      if (best.el && best.s > 0.5) {
        best.el.click(); fire(best.el, 'change'); return true;
      }
    }
  }

  // ── Strategy 2: container-scoped search ──
  if (sourceEl) {
    const containers = [
      sourceEl.closest('[role="listitem"]'),
      sourceEl.closest('[role="group"]'),
      sourceEl.closest('[data-params]'),
      sourceEl.closest('fieldset'),
      sourceEl.parentElement,
      sourceEl.parentElement?.parentElement,
      sourceEl.parentElement?.parentElement?.parentElement,
    ].filter(Boolean);

    for (const container of containers) {
      const radios = Array.from(container.querySelectorAll('input[type="radio"]'));
      if (!radios.length) continue;

      const getRadioLabel = (r) => {
        const al = r.getAttribute('aria-label');
        if (al?.trim()) return al.trim().toLowerCase();
        if (r.id) {
          const lbl = document.querySelector(`label[for="${CSS.escape(r.id)}"]`);
          if (lbl) return lbl.innerText.trim().toLowerCase();
        }
        const parentLbl = r.closest('label');
        if (parentLbl) {
          const clone = parentLbl.cloneNode(true);
          clone.querySelectorAll('input').forEach(n => n.remove());
          return clone.innerText.trim().toLowerCase();
        }
        const sib = r.nextElementSibling;
        if (sib) return sib.innerText.trim().toLowerCase();
        return (r.parentElement?.innerText || '').trim().toLowerCase();
      };

      for (const r of radios) {
        const lbl = getRadioLabel(r);
        if (lbl === strVal || r.value.toLowerCase() === strVal) {
          r.click(); fire(r, 'change'); return true;
        }
      }
      let best = { el: null, s: 0 };
      for (const r of radios) {
        const lbl = getRadioLabel(r);
        const s = Math.max(
          score(normalize(lbl), normalize(strVal)),
          score(normalize(r.value), normalize(strVal)),
        );
        if (s > best.s) best = { el: r, s };
      }
      if (best.el && best.s > 0.45) {
        best.el.click(); fire(best.el, 'change'); return true;
      }
    }
  }

  return false;
}

/**
 * fillAriaRadio — for Google Forms style radio buttons (div[role="radio"]).
 *
 * Finds the radiogroup by radioGroupIndex (recorded at scan time),
 * then clicks the [role="radio"] whose aria-label best matches `value`.
 */
function fillAriaRadio(field, value) {
  const strVal = String(value).toLowerCase().trim();

  // ── Find the radiogroup element ──
  let group = null;

  // 1. By recorded radioGroupIndex (most reliable)
  if (typeof field.radioGroupIndex === 'number' && field.radioGroupIndex >= 0) {
    const all = document.querySelectorAll('[role="radiogroup"]');
    group = all[field.radioGroupIndex] || null;
  }

  // 2. By id
  if (!group && field.id) {
    group = document.getElementById(field.id);
  }

  // 3. By label text match in nearest heading
  if (!group) {
    const all = document.querySelectorAll('[role="radiogroup"]');
    for (const g of all) {
      const qBox = g.closest('[role="listitem"]') || g.closest('[data-params]') || g.parentElement;
      const heading = qBox?.querySelector('[role="heading"]');
      const lbl = normalize(heading?.innerText || g.getAttribute('aria-label') || '');
      const fieldNorm = normalize(field.label || field.ariaLabel || '');
      if (lbl && fieldNorm && (lbl === fieldNorm || lbl.includes(fieldNorm) || fieldNorm.includes(lbl))) {
        group = g;
        break;
      }
    }
  }

  if (!group) return false;

  const ariaRadios = Array.from(group.querySelectorAll('[role="radio"]'));
  if (!ariaRadios.length) return false;

  const getOptionText = (r) =>
    (r.getAttribute('aria-label') || r.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. Exact match
  for (const r of ariaRadios) {
    if (getOptionText(r) === strVal) {
      r.click(); return true;
    }
  }

  // 2. Contains match
  for (const r of ariaRadios) {
    const t = getOptionText(r);
    if (t.includes(strVal) || strVal.includes(t)) {
      r.click(); return true;
    }
  }

  // 3. Fuzzy match
  let best = { el: null, s: 0 };
  for (const r of ariaRadios) {
    const s = score(normalize(getOptionText(r)), normalize(strVal));
    if (s > best.s) best = { el: r, s };
  }
  if (best.el && best.s > 0.4) {
    best.el.click(); return true;
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

const GENERIC_ARIA_LABELS = new Set([
  'your answer', 'type here', 'enter here', 'enter your answer',
  'short answer text', 'long answer text', 'required',
]);

function findElement(field) {
  // ariaradio fields are handled entirely within fillAriaRadio — no DOM element needed here
  if (field.type === 'ariaradio') return true; // sentinel — signals "ok to proceed"

  if (field.id) {
    const el = document.querySelector(`#${CSS.escape(field.id)}`);
    if (el) return el;
  }

  if (field.name) {
    const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
    if (el) return el;
  }

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

  if (typeof field.domIndex === 'number' && field.domIndex >= 0) {
    const all = document.querySelectorAll(FILLABLE_SEL);
    const el  = all[field.domIndex];
    if (el) return el;
  }

  return null;
}


export async function autofill(fields, profileMap, options = {}) {
  const { threshold = 0.42, delayBetween = 60, aiMatches = {} } = options;
  const results = [];

  for (let idx = 0; idx < fields.length; idx++) {
    const field = fields[idx];
    if (field.disabled) {
      results.push({ ...field, matched: false, reason: 'disabled' });
      continue;
    }

    let fillValue = null;
    let matchedKey = null;

    /* ── Priority 1: Gemini AI direct match ── */
    const aiMatch = aiMatches?.[idx] ?? aiMatches?.[String(idx)];
    if (aiMatch && (aiMatch.value || aiMatch.value === 0)) {
      fillValue = aiMatch.value;
      matchedKey = aiMatch.key || 'Gemini AI';
    }

    /* ── Priority 2: Explicit field aliases (academic fields — CGPA, 10th %, 12th %, etc.)
          If the field IS a recognized academic field but no matching profile key exists,
          we BLOCK dice/synonym from wrongly filling it. ── */
    if (!fillValue && fillValue !== 0) {
      const alias = resolveAlias(field, profileMap);
      if (alias) {
        if (alias.blocked) {
          // Field recognized as academic but no matching profile key → skip entirely
          results.push({ ...field, matched: false, reason: 'alias-blocked: recognized field but no matching profile key' });
          continue;
        }
        fillValue = alias.val;
        matchedKey = alias.key;
      }
    }

    /* ── Priority 3: Semantic Synonyms ── */
    if (!fillValue && fillValue !== 0) {
      const syn = resolveSynonym(field, profileMap);
      if (syn) {
        fillValue = syn.val;
        matchedKey = syn.key;
      }
    }

    /* ── Priority 4: Composite rule (e.g. "Name" → first + last) ── */
    if (!fillValue && fillValue !== 0) {
      const rawCompLabel = field.ariaLabel || field.label || field.name || field.placeholder || '';
      const compLabel = GENERIC_PLACEHOLDERS.has(normalize(rawCompLabel)) ? '' : rawCompLabel;
      fillValue = resolveComposite(compLabel, profileMap);
      if (fillValue) matchedKey = 'Composite';
    }

    /* ── Priority 5: Dice coefficient fuzzy match fallback ── */
    if (!fillValue && fillValue !== 0) {
      const m = bestMatch(field, profileMap, threshold);
      if (m.key) { fillValue = m.val; matchedKey = m.key; }
    }

    if (!fillValue && fillValue !== 0) {
      results.push({ ...field, matched: false, reason: `no match (best < ${threshold})` });
      continue;
    }

    /* ── Special case: ARIA radio (Google Forms) — handle before findElement ── */
    if (field.type === 'ariaradio') {
      const filled = fillAriaRadio(field, fillValue);
      results.push({
        ...field,
        matched:    filled,
        matchedKey: filled ? matchedKey : null,
        value:      fillValue,
        reason:     filled ? undefined : 'ariaradio: no matching option found',
      });
      if (delayBetween > 0) await sleep(delayBetween);
      continue;
    }

    /* ── Find the DOM element (id → name → aria-label → domIndex) ── */
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
        fillRadio(field.name, fillValue, el);
      } else if (t === 'checkbox') {
        fillCheckbox(el, fillValue);
      } else {
        await fillText(el, fillValue);
      }

      results.push({ ...field, matched: true, matchedKey, value: fillValue });
      if (delayBetween > 0) await sleep(delayBetween);
    } catch (err) {
      results.push({ ...field, matched: false, reason: err.message });
    }
  }

  return results;
}
