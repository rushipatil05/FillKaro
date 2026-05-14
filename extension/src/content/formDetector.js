/**
 * formDetector.js — Improved label extraction
 * Handles Google Forms, Material UI, TypeForm, plain HTML forms
 */

const SKIP_TYPES  = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const SKIP_LABELS = new Set([
  'your answer', 'required question', 'required', 'optional',
  'short answer text', 'long answer text', 'enter your answer',
  'type here', 'select...', 'choose...', 'mm/dd/yyyy', '*', '',
]);

export function detectFormFields() {
  // Build a stable ordered list of all fillable elements ONCE.
  // domIndex into this list lets autofill find the element even when id/name are absent.
  const FILLABLE = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select';
  const allFillable = Array.from(document.querySelectorAll(FILLABLE));

  const elements = Array.from(document.querySelectorAll('input, textarea, select'));
  const fields   = [];
  const seen     = new Set();

  elements.forEach((el, rawIndex) => {
    const type = (el.type || el.tagName).toLowerCase();
    if (SKIP_TYPES.has(type)) return;

    // Skip invisible
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Deduplicate by name+id
    const key = `${el.name}||${el.id}||${el.type}||${rawIndex}`;
    if (seen.has(key)) return;
    seen.add(key);

    const label = getLabel(el);

    const field = {
      index:       fields.length,
      tagName:     el.tagName.toLowerCase(),
      type,
      id:          el.id          || '',
      name:        el.name        || '',
      label,
      placeholder: el.placeholder || '',
      required:    el.required    || false,
      value:       el.value       || '',
      disabled:    el.disabled    || false,
      // Extra selectors for robust element lookup (critical for Google Forms)
      ariaLabel:   el.getAttribute('aria-label') || '',  // raw, with asterisk
      domIndex:    allFillable.indexOf(el),              // positional fallback
    };

    if (el.tagName === 'SELECT') {
      field.options = Array.from(el.options).map(o => ({
        value: o.value,
        text:  o.text.trim(),
      }));
    }
    if (type === 'radio' || type === 'checkbox') {
      field.checked = el.checked;
    }

    fields.push(field);
  });

  return fields;
}

/* ──────────────────────────────────────────────────────────
   Label extraction — 8 strategies in priority order
─────────────────────────────────────────────────────────── */
function cleanText(t) {
  return (t || '').replace(/\s+/g, ' ').replace(/[*✱＊]/g, '').trim();
}

function isUseful(t) {
  if (!t) return false;
  const l = t.toLowerCase();
  return t.length > 0 && t.length < 200 && !SKIP_LABELS.has(l);
}

function getLabel(el) {
  let t;

  // 1 ── aria-label (Typeform, some Google Forms versions)
  t = cleanText(el.getAttribute('aria-label'));
  if (isUseful(t)) return t;

  // 1.5 ── role="heading" in the nearest question container
  //         Google Forms: each question is role="listitem", title is role="heading"
  //         Also catches aria-level and data-params containers
  const questionBox = (
    el.closest('[role="listitem"]') ||
    el.closest('[role="group"]')    ||
    el.closest('[data-params]')     ||
    el.closest('[jsmodel]')
  );
  if (questionBox) {
    // Prefer role="heading" (Google Forms standard)
    const heading = questionBox.querySelector('[role="heading"]');
    t = cleanText(heading?.innerText);
    if (isUseful(t)) return t;

    // Fallback: any element with aria-level (screen-reader heading marker)
    const ariaHeading = questionBox.querySelector('[aria-level]');
    t = cleanText(ariaHeading?.innerText);
    if (isUseful(t)) return t;
  }

  // 2 ── <label for="id">
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    t = cleanText(lbl?.innerText);
    if (isUseful(t)) return t;
  }

  // 3 ── aria-labelledby (pick first useful id)
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      t = cleanText(document.getElementById(id)?.innerText);
      if (isUseful(t)) return t;
    }
  }

  // 4 ── Wrapping <label>
  const parentLabel = el.closest('label');
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true);
    clone.querySelectorAll('input, select, textarea').forEach(n => n.remove());
    t = cleanText(clone.innerText);
    if (isUseful(t)) return t;
  }

  // 5 ── <fieldset><legend>
  const legend = el.closest('fieldset')?.querySelector('legend');
  t = cleanText(legend?.innerText);
  if (isUseful(t)) return t;

  // 6 ── Walk up DOM looking for question text in preceding siblings
  //      Handles Google Forms, MUI, Ant Design, Formik wrappers
  t = walkUpForLabel(el);
  if (isUseful(t)) return t;

  // 7 ── Immediately preceding sibling element
  let sib = el.previousElementSibling;
  for (let i = 0; i < 4 && sib; i++) {
    if (!sib.querySelector('input, select, textarea')) {
      t = cleanText(sib.innerText?.split('\n')[0]);
      if (isUseful(t)) return t;
    }
    sib = sib.previousElementSibling;
  }

  // 8 ── Fall back to name attribute (skip entry.XXXXXX style Google Forms names)
  if (el.name && !/^entry\.\d+$/.test(el.name)) return el.name;

  return '';
}

/**
 * Walk up the DOM from `el` and look for sibling/ancestor text that
 * appears BEFORE the input in DOM order — this captures question titles
 * in Google Forms, Material UI FormControl, Formik Field wrappers, etc.
 */
function walkUpForLabel(el) {
  const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'head']);
  let current = el;
  let parent  = el.parentElement;

  for (let depth = 0; depth < 12 && parent; depth++) {
    const children   = Array.from(parent.children);
    const currentIdx = children.indexOf(current);

    // Check all children that come BEFORE `current`
    for (let i = currentIdx - 1; i >= 0; i--) {
      const sib = children[i];
      if (SKIP_TAGS.has(sib.tagName?.toLowerCase())) continue;
      if (sib.querySelector('input, select, textarea')) continue;

      // Prefer text in heading-like elements
      const headline = sib.querySelector('h1,h2,h3,h4,h5,h6,strong,b,legend,dt,[class*="title"],[class*="label"],[class*="question"],[class*="heading"]');
      let t = cleanText(headline?.innerText);
      if (isUseful(t)) return t;

      // Fall back to first line of text in the sibling
      t = cleanText(sib.innerText?.split('\n').find(l => isUseful(cleanText(l))));
      if (isUseful(t)) return t;
    }

    current = parent;
    parent  = parent.parentElement;
  }

  return '';
}
