import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

/* ── Inline SVG icons (keeps bundle self-contained) ─── */
const IcoZap      = ({s=16}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13Z"/></svg>;
const IcoDownload = ({s=15}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoClock    = ({s=12}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IcoMonitor  = ({s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IcoUser     = ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoShield   = ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoKey      = ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IcoGlobe    = ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
const IcoFile     = ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 2 13 9 20 9"/><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>;
const IcoCheck    = ({s=13,c='#10B981'}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoChevron  = ({s=16}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoGithub   = ({s=15}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
const IcoSearch   = ({s=13}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoPlus     = ({s=12}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoDots     = ({s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;

/* ─────────────────────────────────────────────────────────
   📦 PASTE YOUR GOOGLE DRIVE DIRECT-DOWNLOAD LINK HERE
   Format: https://drive.google.com/uc?export=download&id=FILE_ID
   Replace FILE_ID with the ID from your Drive share link.
──────────────────────────────────────────────────────────── */
const DRIVE_ZIP_URL = 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_HERE';

/* ── Scroll-fade hook ───────────────────────────────── */
function useScrollFade() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.lp-fade');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
function Navbar() {
  return (
    <nav className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <a href="#" className="lp-nav-logo">
          <div className="lp-logo-icon"><IcoZap s={16}/></div>
          FillKaro
        </a>

        <ul className="lp-nav-links">
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#download">Download</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="lp-nav-cta">
          <Link to="/profiles" className="lp-btn lp-btn-outline">Manage Profiles</Link>
          <a href="#download" className="lp-btn lp-btn-primary">
            <IcoDownload s={14}/> Download
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO DEMO  — improved animated autofill sequence
═══════════════════════════════════════════════════════ */
const DEMO_FIELDS = [
  { id: 'hd-name',    label: 'Full Name',      text: 'Rushikesh Patil' },
  { id: 'hd-email',   label: 'Email Address',  text: 'rushi@example.com' },
  { id: 'hd-phone',   label: 'Phone Number',   text: '9876543210' },
  { id: 'hd-address', label: 'Address',        text: 'Thakur College of Engineering' },
  { id: 'hd-city',    label: 'City',           text: 'Mumbai' },
];

function HeroDemo() {
  const wrapRef   = useRef(null);
  const cursorRef = useRef(null);
  const timers    = useRef([]);          // track all timeouts for cleanup
  const running   = useRef(false);

  /* ── Sleep that tracks its timer ── */
  const sleep = (ms) => new Promise(r => {
    const id = setTimeout(r, ms);
    timers.current.push(id);
  });

  /* ── Query inside wrapper ── */
  const q = (sel) => wrapRef.current?.querySelector(sel);

  /* ── Move floating cursor to centre of target ── */
  const moveTo = (el) => {
    if (!wrapRef.current || !el || !cursorRef.current) return;
    // Use wrapRef (lp-hd-wrap) as origin — cursor is a direct child of it
    const wR = wrapRef.current.getBoundingClientRect();
    const eR = el.getBoundingClientRect();
    cursorRef.current.style.left = (eR.left - wR.left + eR.width  / 2 - 10) + 'px';
    cursorRef.current.style.top  = (eR.top  - wR.top  + eR.height / 2 - 10) + 'px';
  };

  /* ── Fire click-ripple on cursor ── */
  const clickRipple = () => {
    if (!cursorRef.current) return;
    cursorRef.current.classList.remove('hd-cursor-ripple');
    void cursorRef.current.offsetWidth;          // reflow to restart
    cursorRef.current.classList.add('hd-cursor-ripple');
  };

  /* ── Set status text in extension panel ── */
  const setStatus = (text, cls = '') => {
    const el = q('#hd-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'lp-hd-status ' + cls;
  };

  /* ── Update live progress bar + counter ── */
  const setProgress = (done) => {
    const total = DEMO_FIELDS.length;
    const pct   = Math.round((done / total) * 100);
    const bar   = q('#hd-progress-bar');
    const label = q('#hd-progress-label');
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = `${done}/${total} fields`;
  };

  /* ── Full state reset ── */
  const resetAll = () => {
    if (!wrapRef.current) return;
    DEMO_FIELDS.forEach(f => {
      const box = q(`#${f.id}`);
      if (!box) return;
      box.classList.remove('hd-typing', 'hd-done', 'hd-shimmer');
      [...box.childNodes].forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
      const caret = box.querySelector('.hd-caret');
      if (caret) caret.classList.remove('hd-caret-hidden');
    });
    q('#hd-success')?.classList.remove('hd-success-visible');
    q('#hd-btn')?.classList.remove('hd-btn-clicked', 'hd-btn-loading', 'hd-btn-done');
    q('#hd-card-personal')?.classList.remove('hd-card-selected');
    q('#hd-radio-personal')?.classList.remove('hd-radio-checked');
    q('#hd-scan-beam')?.classList.remove('hd-scan-active');
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '0';
      cursorRef.current.classList.remove('hd-cursor-ripple');
    }
    setProgress(0);
    setStatus('Ready', '');
    const btnText = q('#hd-btn-text');
    if (btnText) btnText.textContent = 'Autofill Now';
  };

  /* ── Type one field character-by-character ── */
  const typeField = async (fieldDef, index) => {
    if (!wrapRef.current) return;
    const box   = q(`#${fieldDef.id}`);
    const caret = box?.querySelector('.hd-caret');
    if (!box) return;

    box.classList.add('hd-typing');
    if (caret) caret.classList.remove('hd-caret-hidden');

    for (const ch of fieldDef.text.split('')) {
      box.insertBefore(document.createTextNode(ch), caret);
      await sleep(42 + Math.random() * 24 - 12);
    }

    // Field done — shimmer then lock
    if (caret) caret.classList.add('hd-caret-hidden');
    box.classList.remove('hd-typing');
    box.classList.add('hd-done', 'hd-shimmer');
    setProgress(index + 1);
    await sleep(280);
  };

  /* ════════════ Main animation loop ════════════ */
  const runLoop = async () => {
    if (!running.current) return;
    resetAll();
    await sleep(500);
    if (!running.current) return;

    /* 1 — cursor appears, glides to profile card */
    if (cursorRef.current) cursorRef.current.style.opacity = '1';
    moveTo(q('#hd-card-personal'));
    await sleep(650);

    /* 2 — click profile */
    clickRipple();
    await sleep(120);
    q('#hd-card-personal')?.classList.add('hd-card-selected');
    q('#hd-radio-personal')?.classList.add('hd-radio-checked');
    await sleep(380);

    /* 3 — cursor glides to Autofill button */
    moveTo(q('#hd-btn'));
    setStatus('Profile selected • Ready', 'hd-status-ready');
    await sleep(620);

    /* 4 — click Autofill button */
    clickRipple();
    await sleep(100);
    q('#hd-btn')?.classList.add('hd-btn-clicked');
    await sleep(120);
    q('#hd-btn')?.classList.remove('hd-btn-clicked');
    q('#hd-btn')?.classList.add('hd-btn-loading');
    const btnText = q('#hd-btn-text');
    if (btnText) btnText.textContent = 'Scanning…';
    if (cursorRef.current) cursorRef.current.style.opacity = '0';
    setStatus('Scanning form…', 'hd-status-scanning');

    /* 5 — scan beam sweeps the form */
    q('#hd-scan-beam')?.classList.add('hd-scan-active');
    await sleep(820);
    q('#hd-scan-beam')?.classList.remove('hd-scan-active');

    /* 6 — switch button to Filling state */
    q('#hd-btn')?.classList.remove('hd-btn-loading');
    if (btnText) btnText.textContent = 'Filling…';
    setStatus('Filling fields…', 'hd-status-filling');
    await sleep(180);

    /* 7 — type each field, cursor glides to each one */
    for (let i = 0; i < DEMO_FIELDS.length; i++) {
      if (!running.current) return;
      await typeField(DEMO_FIELDS[i], i);
      await sleep(100);
    }

    /* 8 — button done state */
    q('#hd-btn')?.classList.add('hd-btn-done');
    if (btnText) btnText.textContent = 'Done ✓';
    setStatus('All fields filled!', 'hd-status-done');
    await sleep(350);

    /* 9 — success overlay */
    q('#hd-success')?.classList.add('hd-success-visible');
    await sleep(2000);

    /* 10 — fade out, reset, loop */
    if (!running.current) return;
    q('#hd-success')?.classList.remove('hd-success-visible');
    await sleep(500);
    runLoop();
  };

  useEffect(() => {
    running.current = true;
    const t = setTimeout(() => { if (running.current) runLoop(); }, 900);
    timers.current.push(t);
    return () => {
      running.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lp-hd-wrap lp-anim lp-delay4" ref={wrapRef} style={{maxWidth:860,margin:'72px auto 0'}}>

      {/* Browser chrome bar */}
      <div className="lp-hd-bar">
        <div className="lp-hd-dot" style={{background:'#FCA5A5'}}/>
        <div className="lp-hd-dot" style={{background:'#FCD34D'}}/>
        <div className="lp-hd-dot" style={{background:'#6EE7B7'}}/>
        <div className="lp-hd-url">https://apply.university.edu/admission-form</div>
        {/* Secure badge */}
        <div className="lp-hd-secure">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Secure
        </div>
      </div>

      <div className="lp-hd-body">

        {/* ── Left: web form ── */}
        <div className="lp-hd-form-side">
          {/* Scan beam overlay */}
          <div className="lp-hd-scan-beam" id="hd-scan-beam"/>

          <div className="lp-hd-page-title">Contact Information</div>

          {DEMO_FIELDS.map(f => (
            <div className="lp-hd-field" key={f.id}>
              <label className="lp-hd-label">{f.label} <span className="lp-hd-req">*</span></label>
              <div className="lp-hd-input" id={f.id}>
                <span className="hd-caret"/>
              </div>
            </div>
          ))}

          {/* Success overlay */}
          <div className="lp-hd-success" id="hd-success">
            <div className="lp-hd-success-ring">
              <div className="lp-hd-success-icon">
                {/* SVG checkmark with stroke-dasharray draw animation */}
                <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round">
                  <polyline className="hd-check-path" points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div className="lp-hd-success-title">✓  Form completed in seconds</div>
            <div className="lp-hd-success-sub">5 fields filled automatically</div>
          </div>
        </div>

        {/* ── Right: extension panel ── */}
        <div className="lp-hd-ext">

          {/* Header */}
          <div className="lp-hd-ext-header">
            <div className="lp-hd-ext-logo">
              <div className="lp-hd-ext-logo-icon"><IcoZap s={12}/></div>
              <span className="lp-hd-ext-name">FillKaro</span>
            </div>
            <div className="lp-hd-tabs">
              <span className="lp-hd-tab">Scan</span>
              <span className="lp-hd-tab lp-hd-tab-active">Autofill</span>
              <span className="lp-hd-tab">Settings</span>
            </div>
          </div>

          <div className="lp-hd-section-label">Profile</div>

          {/* Profile cards */}
          <div className="lp-hd-profiles">
            <div className="lp-hd-profile-card" id="hd-card-personal">
              <div className="lp-hd-avatar" style={{background:'#EFF6FF',color:'#2563EB'}}>R</div>
              <div className="lp-hd-profile-info">
                <div className="lp-hd-profile-name">Rushikesh Patil</div>
                <div className="lp-hd-profile-count">5 fields</div>
              </div>
              <div className="lp-hd-radio" id="hd-radio-personal"/>
            </div>
            <div className="lp-hd-profile-card" id="hd-card-work">
              <div className="lp-hd-avatar" style={{background:'#F0FDF4',color:'#059669'}}>W</div>
              <div className="lp-hd-profile-info">
                <div className="lp-hd-profile-name">Work</div>
                <div className="lp-hd-profile-count">8 fields</div>
              </div>
              <div className="lp-hd-radio" id="hd-radio-work"/>
            </div>
          </div>

          {/* Live progress bar */}
          <div className="lp-hd-progress-wrap">
            <div className="lp-hd-progress-header">
              <span className="lp-hd-progress-title">Progress</span>
              <span className="lp-hd-progress-count" id="hd-progress-label">0/5 fields</span>
            </div>
            <div className="lp-hd-progress-track">
              <div className="lp-hd-progress-bar" id="hd-progress-bar" style={{width:'0%'}}/>
            </div>
          </div>

          {/* Status line */}
          <div className="lp-hd-status" id="hd-status">Ready</div>

          {/* Toggle */}
          <div className="lp-hd-toggle-row">
            <div>
              <div className="lp-hd-toggle-label">Human-like typing</div>
              <div className="lp-hd-toggle-sub">Types char-by-char with delay</div>
            </div>
            <div className="lp-hd-toggle lp-hd-toggle-on"/>
          </div>

          {/* Autofill button */}
          <button className="lp-hd-btn" id="hd-btn">
            <span className="lp-hd-btn-spinner"/>
            <IcoZap s={13}/>
            <span id="hd-btn-text">Autofill Now</span>
          </button>
        </div>


      </div>{/* /lp-hd-body */}

      {/* Cursor lives here — direct child of lp-hd-wrap (position:relative)
          so left/top match moveTo() which also refs lp-hd-wrap */}
      <div className="lp-hd-cursor" ref={cursorRef}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="#1e293b">
          <path d="M5 3l14 9-7 1-4 7z"/>
        </svg>
        <div className="lp-hd-ripple"/>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-container">


        <h1 className="lp-anim lp-delay1">Fill Any Form<br/>in Seconds.</h1>

        <p className="lp-hero-sub lp-anim lp-delay2">
          Create multiple profiles and let AI intelligently fill online forms —
          while keeping your data completely private.
        </p>

        <div className="lp-hero-btns lp-anim lp-delay3">
          <a href="#download" className="lp-btn lp-btn-primary" style={{fontSize:15,padding:'12px 24px'}}>
            <IcoDownload s={15}/> Download Extension
          </a>
          <Link to="/profiles" className="lp-btn lp-btn-outline" style={{fontSize:15,padding:'12px 24px'}}>
            Manage Profiles →
          </Link>
        </div>

        <HeroDemo />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS — creative interactive timeline
═══════════════════════════════════════════════════════ */
const HIW_STEPS = [
  { n:'01', color:'#2563EB', bg:'#EFF6FF', icon:<IcoDownload s={22}/>, title:'Download the ZIP', desc:'Grab the extension directly from this page — no Chrome Web Store approval needed.', tag:'~30 sec' },
  { n:'02', color:'#7C3AED', bg:'#F5F3FF', icon:<IcoMonitor s={22}/>, title:'Load in Chrome', desc:'Enable Developer Mode, extract the ZIP, and click "Load Unpacked". Instant setup.', tag:'~1 min' },
  { n:'03', color:'#059669', bg:'#ECFDF5', icon:<IcoUser s={22}/>,    title:'Build Your Profile', desc:'Open the Profile Manager and fill in your details once — for any context you need.', tag:'~2 min' },
  { n:'04', color:'#EA580C', bg:'#FFF7ED', icon:<IcoZap s={22}/>,     title:'Autofill Any Form', desc:'Click the extension on any site, pick a profile, and watch AI fill the form instantly.', tag:'Instant ⚡' },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % HIW_STEPS.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="lp-section lp-hiw-section" id="how-it-works">
      <div className="lp-container">
        <div className="lp-text-center">
          <div className="lp-label lp-mx-auto"><IcoClock s={11}/> How it works</div>
          <h2 className="lp-section-title">Up and running in four steps</h2>
          <p className="lp-section-sub lp-mx-auto">No Chrome Web Store. No account. Just install and go.</p>
        </div>
        <div className="lp-hiw-timeline">
          <div className="lp-hiw-track">
            <div className="lp-hiw-track-fill" style={{width:`${(active/(HIW_STEPS.length-1))*100}%`}}/>
          </div>
          {HIW_STEPS.map((s,i) => (
            <div key={s.n} className={`lp-hiw-step${active===i?' lp-hiw-active':''}`} onClick={()=>setActive(i)}>
              <div className="lp-hiw-node" style={{background:active>=i?s.color:'#E5E7EB', boxShadow:active===i?`0 0 0 7px ${s.color}25`:'none'}}>
                {active>i
                  ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{color:active>=i?'#fff':'#9CA3AF',fontSize:12,fontWeight:700}}>{s.n}</span>
                }
              </div>
              <div className="lp-hiw-card" style={{'--sc':s.color,'--sb':s.bg}}>
                <div className="lp-hiw-bg-num">{s.n}</div>
                <div className="lp-hiw-card-top">
                  <div className="lp-hiw-icon" style={{background:s.bg,color:s.color}}>{s.icon}</div>
                  <span className="lp-hiw-tag" style={{background:s.bg,color:s.color}}>{s.tag}</span>
                </div>
                <h3 className="lp-hiw-title">{s.title}</h3>
                <p className="lp-hiw-desc">{s.desc}</p>
                <div className="lp-hiw-bar" style={{background:s.color}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-hiw-dots">
          {HIW_STEPS.map((s,i) => (
            <button key={i} className={`lp-hiw-dot${active===i?' lp-hiw-dot-active':''}`}
              style={active===i?{background:s.color}:{}} onClick={()=>setActive(i)}/>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES
═══════════════════════════════════════════════════════ */
const FEATURES = [
  { icon:<IcoUser/>,  title:'Multiple Profiles',       desc:'Create unlimited profiles for any context — Personal, Work, College, and more.' },
  { icon:<IcoZap s={18}/>, title:'One-Click Autofill', desc:'Select a profile and fill an entire form instantly — no manual typing needed.' },
  { icon:<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title:'AI Form Understanding', desc:'Gemini embeddings match your profile fields to any form label — even unusual ones.' },
  { icon:<IcoGlobe/>, title:'Works on Most Sites',     desc:'Handles standard forms, Google Forms, React, Vue, and Material UI inputs.' },
  { icon:<IcoShield/>,title:'Privacy First',            desc:'Your profile data never leaves your device. No servers receive your personal info.' },
  { icon:<IcoKey/>,   title:'User-Owned API Key',      desc:'Use your own Gemini key. We never see it, store it, or pay for your API usage.' },

  { icon:<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>, title:'Fast & Lightweight', desc:'No background processes, no bloat. Loads only when you click the icon.' },
];

function Features() {
  return (
    <section className="lp-section" id="features">
      <div className="lp-container">
        <div className="lp-text-center">
          <div className="lp-label lp-mx-auto">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Features
          </div>
          <h2 className="lp-section-title">Everything you need, nothing you don't</h2>
          <p className="lp-section-sub lp-mx-auto">Built to be fast, private, and effective on any kind of web form.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map(f=>(
            <div className="lp-feature-card lp-fade" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   WHY USER API KEYS
═══════════════════════════════════════════════════════ */
const API_POINTS = [
  { icon:<IcoShield s={16}/>, title:'Zero developer exposure',   desc:'The developer\'s API key is never embedded in the extension or accessible to users.' },
  { icon:<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, title:'No unexpected charges', desc:'Your usage is billed to your Google AI account. You see exactly what you consume.' },
  { icon:<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>, title:'Prevents abuse', desc:'Rate limits apply per user — no single actor can exhaust shared resources.' },
  { icon:<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, title:'Stored locally only', desc:'Your API key lives in browser extension storage only. Never sent to any server.' },
];

function WhyApiKeys() {
  return (
    <section className="lp-section lp-section-gray">
      <div className="lp-container">
        <div className="lp-apikey-inner">
          <div>
            <div className="lp-label"><IcoKey s={11}/> Why User API Keys?</div>
            <h2 className="lp-section-title">Your key. Your AI. Your control.</h2>
            <p className="lp-section-sub">FillKaro uses Google Gemini for intelligent field matching. You provide your own key — keeping you in complete control.</p>
            <div className="lp-apikey-points">
              {API_POINTS.map(p=>(
                <div className="lp-apikey-point lp-fade" key={p.title}>
                  <div className="lp-apikey-point-icon">{p.icon}</div>
                  <div><h4>{p.title}</h4><p>{p.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* API key visual */}
          <div className="lp-apikey-visual">
            <div className="lp-apikey-card-label">Extension Settings</div>
            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:10,padding:16,display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>Gemini API Key</div>
              <div className="lp-apikey-field">
                <IcoKey s={14}/>
                <input type="password" defaultValue="AIzaSyD••••••••••••••" readOnly />
                <button className="lp-apikey-save">Save</button>
              </div>
              <div className="lp-apikey-note">
                <IcoCheck s={13}/> Stored locally · Never sent to any server
              </div>
            </div>
            <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:14,fontSize:13,color:'#1E40AF',lineHeight:1.6}}>
              <strong>Get a free key</strong> at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style={{color:'#2563EB'}}>
                aistudio.google.com/app/apikey
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════════════════ */
const DL_STEPS = [
  { title:'Download the ZIP', sub:'Click the Download button and save the file.' },
  { title:'Extract the ZIP file', sub:'Unzip to a permanent folder on your computer.' },
  { title:'Open Chrome Extensions', sub:<>Navigate to <span className="lp-code">chrome://extensions</span></> },
  { title:'Enable Developer Mode', sub:'Toggle "Developer mode" in the top-right corner.' },
  { title:'Click "Load Unpacked"', sub:'Select the extracted extension folder. Done!' },
];

function Download() {
  return (
    <section className="lp-section" id="download">
      <div className="lp-container">
        <div className="lp-download-inner">
          <div>
            <div className="lp-label"><IcoDownload s={11}/> Installation</div>
            <h2 className="lp-section-title">Install in five minutes</h2>
            <p className="lp-section-sub">No Chrome Web Store needed. Load the extension manually using Developer Mode.</p>
            <div className="lp-download-steps">
              {DL_STEPS.map((s,i)=>(
                <div className="lp-dl-step lp-fade" key={i}>
                  <div className="lp-dl-step-num">{i+1}</div>
                  <div className="lp-dl-step-text">
                    <strong>{s.title}</strong>
                    <span>{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download card */}
          <div>
            <div className="lp-dl-card">
              <div className="lp-dl-card-header">
                <h3>FillKaro — Chrome Extension</h3>
                <p>Manually installable ZIP for Chrome Developer Mode</p>
              </div>
              <div className="lp-dl-card-body">
                <div className="lp-dl-meta">
                  <span><IcoFile s={13}/> fillkaro-extension.zip</span>
                  <span><IcoClock s={13}/> v1.1.0</span>
                  <span><IcoMonitor s={13}/> Chrome MV3</span>
                </div>
                <a
                  href={DRIVE_ZIP_URL}
                  download="fillkaro-extension.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-btn lp-btn-primary"
                  style={{width:'100%',justifyContent:'center',padding:12}}
                >
                  <IcoDownload s={15}/> Download ZIP
                </a>
                <div style={{fontSize:12,color:'#9CA3AF',textAlign:'center',padding:'4px 0'}}>
                  Free & open source · No account required
                </div>
                <div style={{borderTop:'1px solid #F3F4F6',paddingTop:16,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'#9CA3AF'}}>Requirements</div>
                  {['Google Chrome (any recent version)','Free Gemini API key (optional — for AI matching)','No key? Dice coefficient fallback works automatically'].map(r=>(
                    <div key={r} style={{fontSize:13,color:'#6B7280',display:'flex',alignItems:'center',gap:8}}>
                      <IcoCheck s={13}/> {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <a href="https://github.com/rushipatil05/FillKaro" target="_blank" rel="noopener"
               className="lp-btn lp-btn-outline" style={{width:'100%',justifyContent:'center',marginTop:10}}>
              <IcoGithub s={15}/> View Source on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE MANAGER PREVIEW
═══════════════════════════════════════════════════════ */
const PM_CARDS = [
  { letter:'R', bg:'#EFF6FF', fg:'#2563EB', name:'Personal',      count:8,  desc:'Daily personal info for registrations and apps.',   tags:['Personal','Daily'],           date:'Jul 15, 2026' },
  { letter:'W', bg:'#F0FDF4', fg:'#16A34A', name:'Work',          count:11, desc:'Company details, work email, office address.',       tags:['Work','Professional'],        date:'Jul 12, 2026' },
  { letter:'C', bg:'#FFF7ED', fg:'#EA580C', name:'College Apply', count:16, desc:'Academic records, entrance scores, college forms.',  tags:['College','Education'],        date:'Jul 10, 2026' },
];

function ProfileManagerPreview() {
  return (
    <section className="lp-section lp-section-gray" id="profiles">
      <div className="lp-container">
        <div className="lp-text-center">
          <div className="lp-label lp-mx-auto">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Profile Manager
          </div>
          <h2 className="lp-section-title">Create and manage all your profiles</h2>
          <p className="lp-section-sub lp-mx-auto">A clean web dashboard for creating, editing, and organizing your autofill profiles.</p>
        </div>

        <div className="lp-pm-preview">
          {/* Top bar */}
          <div className="lp-pm-topbar">
            <div className="lp-pm-logo">
              <div className="lp-pm-logo-icon"><IcoZap s={14}/></div>
              Autofill Profiles
            </div>
            <div className="lp-pm-search">
              <IcoSearch className="lp-pm-search-icon" s={13}/>
              <input type="text" placeholder="Search profiles…" readOnly />
            </div>
            <button className="lp-pm-new-btn"><IcoPlus s={12}/> New Profile</button>
          </div>

          {/* Grid */}
          <div className="lp-pm-body">
            <div style={{fontSize:12,color:'#9CA3AF',marginBottom:14}}>3 profiles</div>
            <div className="lp-pm-grid">
              {PM_CARDS.map(c=>(
                <div className="lp-pm-card" key={c.name}>
                  <div className="lp-pm-card-top">
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="lp-pm-avatar" style={{background:c.bg,color:c.fg}}>{c.letter}</div>
                      <div>
                        <div className="lp-pm-card-name">{c.name}</div>
                        <div className="lp-pm-card-count">{c.count} fields</div>
                      </div>
                    </div>
                    <div style={{color:'#9CA3AF'}}><IcoDots/></div>
                  </div>
                  <div className="lp-pm-card-desc">{c.desc}</div>
                  <div className="lp-pm-tags">{c.tags.map(t=><span className="lp-pm-tag" key={t}>{t}</span>)}</div>
                  <div className="lp-pm-card-footer">
                    <span>Updated {c.date}</span>
                    <span className="lp-pm-active">● Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:28}}>
          <Link to="/profiles" className="lp-btn lp-btn-primary" style={{fontSize:15,padding:'12px 28px'}}>
            Manage Your Profiles →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════ */
const FAQS = [
  { q:'Is FillKaro free?',
    a:'Yes — the extension and Profile Manager are completely free and open source. You can optionally use your own Gemini API key for smart matching with Google\'s free tier, or rely on the built-in Dice coefficient matching with zero API keys.' },
  { q:'Is my data secure and private?',
    a:'Yes. Your API key and custom settings are stored locally in your browser extension storage and never shared. Profiles are synced securely with your backend database.' },
  { q:'Why do I provide my own Gemini API key?',
    a:'Using your own Gemini key keeps you in complete control of your usage and privacy. Get a free key at aistudio.google.com. If you don\'t want to use an API key, FillKaro automatically falls back to fast, local Dice coefficient matching.' },
  { q:'Does it work on every website?',
    a:'It works on standard HTML forms, Google Forms, React/Vue/Angular SPAs, and Material UI inputs. Dynamic and complex multi-step forms are continuously supported.' },
  { q:'Is it open source?',
    a:'Yes. The full source code — extension, Node.js backend, and React dashboard — is available on GitHub. You are welcome to inspect, fork, or self-host.' },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="lp-section" id="faq">
      <div className="lp-container" style={{maxWidth:720}}>
        <div className="lp-text-center">
          <div className="lp-label lp-mx-auto">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            FAQ
          </div>
          <h2 className="lp-section-title">Common questions</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map((f,i)=>(
            <div className="lp-faq-item" key={i}>
              <button className="lp-faq-q" onClick={()=>setOpen(open===i?null:i)}>
                {f.q}
                <span className={`lp-faq-chevron${open===i?' open':''}`}><IcoChevron/></span>
              </button>
              <div className={`lp-faq-a${open===i?' open':''}`}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-nav-logo" style={{display:'inline-flex'}}>
                <div className="lp-logo-icon"><IcoZap s={16}/></div>
                FillKaro
              </div>
              <p>A privacy-first Chrome extension that fills forms intelligently using your own AI key and reusable profiles.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <h4>Product</h4>
                <ul>
                  <li><a href="#how-it-works">How it Works</a></li>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#download">Download</a></li>
                  <li><a href="#profiles">Profile Manager</a></li>
                </ul>
              </div>
              <div className="lp-footer-col">
                <h4>Resources</h4>
                <ul>
                  <li><a href="https://github.com/rushipatil05/FillKaro" target="_blank" rel="noopener">GitHub</a></li>
                  <li><a href="#how-it-works">Documentation</a></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="https://github.com/rushipatil05/FillKaro/issues" target="_blank" rel="noopener">Support & Issues</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 FillKaro. All rights reserved.</span>
            <span>Made with ♥ for privacy-conscious users</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════ */
export default function Landing() {
  const pageRef = useScrollFade();
  return (
    <div className="lp" ref={pageRef}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <WhyApiKeys />
      <Download />
      <ProfileManagerPreview />
      <FAQ />
      <Footer />
    </div>
  );
}
