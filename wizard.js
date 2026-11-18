// Hermes setup wizard: step engine, rendering, send. Plain ES module.
// Worker B file. Styles come from Worker A. Data from catalogue.js, steps.js, brief.js.
import { GROUPS, SKILLS, TOOLS, APPS } from './catalogue.js';
import { visibleSteps, validate } from './steps.js';
import { buildBrief, briefText } from './brief.js';

const ALIAS = 'josh@parkup.nz'; // FormSubmit target (activated 18 Nov 2026); can swap for the random alias later
const CONTACT_EMAIL = 'josh@parkup.nz'; // public email shown in the send fallback
const KEY = 'tlm-wizard-v1';
const PRIVACY = 'Only Josh and Farley read your answers. They reach us by email through FormSubmit, which keeps a copy for up to 30 days. Ask any time and we delete them.';
const PROMISE = 'It always asks you before it sends, posts or pays anything.';

const wizardEl = document.getElementById('wizard');
let a = {};            // answers: field id -> string or string[]
let stepId = null;     // current step id, or 'check'
let fromCheck = false; // came from the check screen?
let started = false;
let sending = false;
let doneName = '';        // first name kept for the done screen
let honeyInput = null;    // honeypot on the check screen
let pendingErrStep = null; // when set, render shows this step's errors
let saved = null;          // draft read from storage at boot

/* ---------- small helpers ---------- */
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [v];
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* private mode, fine */ }
}
function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch (e) { /* ignore broken storage */ }
  return null;
}

/* ---------- options: inline, or read from the catalogue by source ---------- */
function resolveOptions(f) {
  if (f.options) {
    return f.options.map(o => (typeof o === 'string' ? { value: o, title: o } : { value: o.value, title: o.title, line: o.line, icon: o.icon }));
  }
  if (f.source === 'groups') return GROUPS.map(g => ({ value: g.id, title: g.title, line: g.line, icon: g.icon }));
  if (f.source === 'tools') return TOOLS.map(t => ({ value: t.id, title: t.title, line: t.line, icon: t.icon }));
  if (f.source === 'apps') return APPS.map(x => ({ value: x.id, title: x.title, line: x.line, icon: x.icon, soon: !!x.soon }));
  if (f.source === 'skills') {
    const picked = asArray(a.groups);
    const list = SKILLS.filter(s => s.groups.some(g => picked.includes(g)));
    return list
      .sort((x, y) => (y.popular ? 1 : 0) - (x.popular ? 1 : 0)) // popular first
      .map(s => ({ value: s.id, title: s.title, line: s.line, icon: s.icon, popular: !!s.popular }));
  }
  return [];
}

/* ---------- selection (single or multiple, aria-pressed) ---------- */
function selectHandlers(btn, f, opt) {
  const isOn = () => (f.multiple ? asArray(a[f.id]).includes(opt.value) : a[f.id] === opt.value);
  btn._paint = () => {
    btn.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
    btn.classList.toggle('is-selected', isOn());
  };
  btn.addEventListener('click', () => {
    if (f.multiple) {
      const arr = asArray(a[f.id]);
      a[f.id] = isOn() ? arr.filter(v => v !== opt.value) : [...arr, opt.value];
    } else {
      a[f.id] = opt.value; // single choice: tapping picks it
    }
    save();
    btn.parentElement.querySelectorAll('[aria-pressed]').forEach(b => b._paint && b._paint());
    const pt = document.querySelector('.progress-text'); // branches can change the step count
    if (pt && stepId !== 'check') {
      const vs = visibleSteps(a);
      const i = vs.findIndex(s => s.id === stepId);
      pt.textContent = `Step ${i + 1} of ${vs.length}`;
      const fill = document.querySelector('.progress-fill');
      if (fill) fill.style.width = Math.round(((i + 1) / vs.length) * 100) + '%';
    }
  });
  btn._paint();
}

/* ---------- field rendering (all user text via textContent) ---------- */
function cardEl(opt) {
  const card = el('button', 'card');
  card.type = 'button';
  card.setAttribute('aria-pressed', 'false');
  if (opt.icon) card.appendChild(el('span', 'card-icon', opt.icon));
  card.appendChild(el('span', 'card-title', opt.title));
  if (opt.line) card.appendChild(el('span', 'card-line', opt.line));
  if (opt.popular) card.appendChild(el('span', 'card-badge', 'Popular'));
  if (opt.soon) { // pickable, but honest about the wait
    card.appendChild(el('span', 'card-badge', 'Coming soon'));
    card.classList.add('is-soon');
  }
  return card;
}
function fieldEl(f) {
  if (f.when && !f.when(a)) return null;
  const isChoice = f.type === 'cards' || f.type === 'chips';
  const wrap = el('div', 'field');
  wrap.dataset.field = f.id;
  const showLabel = !f.collapsed; // collapsed fields say it in the summary line instead
  if (showLabel && !isChoice) {
    const label = el('label', 'field-label', f.label);
    label.htmlFor = 'f-' + f.id;
    if (f.optional) label.appendChild(el('span', 'optional', ' (optional)'));
    wrap.appendChild(label);
  }
  const descIds = [];
  if (f.help) {
    const hp = el('p', 'field-help', f.help);
    hp.id = 'h-' + f.id;
    descIds.push(hp.id);
    wrap.appendChild(hp);
  }
  if (f.type === 'text' || f.type === 'email') {
    const inp = el('input', 'input');
    inp.type = f.type;
    inp.id = 'f-' + f.id;
    inp.name = f.id;
    inp.value = typeof a[f.id] === 'string' ? a[f.id] : '';
    inp.autocomplete = f.id === 'name' ? 'name' : f.id === 'email' ? 'email' : 'off';
    inp.addEventListener('input', () => { a[f.id] = inp.value; save(); });
    wrap.appendChild(inp);
  } else if (f.type === 'textarea') {
    const ta = el('textarea', 'input');
    ta.id = 'f-' + f.id;
    ta.name = f.id;
    ta.rows = 4;
    ta.value = typeof a[f.id] === 'string' ? a[f.id] : '';
    ta.addEventListener('input', () => { a[f.id] = ta.value; save(); });
    wrap.appendChild(ta);
  } else if (isChoice) {
    // cards and chips sit in a labelled group; Worker A styles the fieldset
    const fs = el('fieldset', 'field-group');
    if (showLabel) {
      const lg = el('legend', 'field-label', f.label);
      if (f.optional) lg.appendChild(el('span', 'optional', ' (optional)'));
      fs.appendChild(lg);
    } else {
      fs.setAttribute('aria-label', f.label);
    }
    const box = el('div', f.type === 'cards' ? 'cards' : 'chips');
    if (f.source === 'skills' && a.mode === 'advanced') box.classList.add('is-list'); // compact rows
    for (const opt of resolveOptions(f)) {
      const btn = f.type === 'cards' ? cardEl(opt) : el('button', 'chip', opt.title);
      btn.type = 'button';
      selectHandlers(btn, f, opt);
      box.appendChild(btn);
    }
    fs.appendChild(box);
    wrap.appendChild(fs);
  }
  const err = el('p', 'field-error');
  err.id = 'e-' + f.id;
  err.setAttribute('role', 'alert');
  descIds.push(err.id);
  wrap.appendChild(err);
  const desc = descIds.join(' '); // help and error read out with each control
  wrap.querySelectorAll('input, textarea, button').forEach(x => x.setAttribute('aria-describedby', desc));
  if (!f.collapsed) return wrap;
  // collapsed fields sit in a native details, open if it already has text
  const det = el('details', 'more');
  det.appendChild(el('summary', null, f.label + (f.optional ? ' (optional)' : '')));
  if (typeof a[f.id] === 'string' && a[f.id].trim() !== '') det.open = true;
  wrap.querySelectorAll('input, textarea').forEach(x => x.setAttribute('aria-label', f.label));
  det.appendChild(wrap);
  return det;
}
function clearErrors(root) {
  root.querySelectorAll('p.field-error').forEach(p => { p.textContent = ''; });
  root.querySelectorAll('.field.has-error').forEach(x => x.classList.remove('has-error'));
  root.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
}
function focusIn(wrap) {
  return wrap.querySelector('input, textarea, button, [role="button"]');
}

/* ---------- progress and actions ---------- */
function progressEl(x, y) {
  const p = el('div', 'progress');
  p.appendChild(el('p', 'progress-text', `Step ${x} of ${y}`));
  const bar = el('div', 'progress-bar');
  bar.appendChild(el('div', 'progress-fill')).style.width = Math.round((x / y) * 100) + '%';
  p.appendChild(bar);
  return p;
}
function actionsEl(back, primary, fn) {
  const nav = el('nav', 'actions');
  if (back) {
    const b = el('button', 'btn btn-back', 'Back');
    b.type = 'button';
    b.addEventListener('click', goBack);
    nav.appendChild(b);
  }
  const p = el('button', 'btn btn-primary', primary);
  p.type = 'button';
  p.addEventListener('click', fn);
  nav.appendChild(p);
  return nav;
}

/* ---------- step screens ---------- */
function renderStep(step, vs) {
  const idx = vs.findIndex(s => s.id === step.id);
  const y = vs.length; // vs already includes the check screen
  const root = el('div', 'step-view');
  root.appendChild(progressEl(idx + 1, y));
  const sec = el('section', 'screen');
  sec.dataset.step = step.id;
  const h = el('h2', 'screen-title', step.title);
  h.tabIndex = -1;
  sec.appendChild(h);
  if (step.lead) sec.appendChild(el('p', 'screen-lead', step.lead));
  for (const f of step.fields) {
    const fe = fieldEl(f);
    if (fe) sec.appendChild(fe);
  }
  if (step.id === 'limits') {
    const card = el('div', 'promise');
    card.appendChild(el('span', 'promise-icon', '🔒'));
    card.appendChild(el('p', null, PROMISE));
    sec.appendChild(card);
  }
  root.appendChild(sec);
  root.appendChild(actionsEl(idx > 0 || fromCheck, idx >= vs.length - 2 ? 'Check answers' : 'Next', next));
  return { root, focus: h };
}

/* ---------- check screen ---------- */
function titleFor(f, v) {
  for (const o of resolveOptions(f)) if (o.value === v) return o.title;
  return String(v);
}
function changeBtn(fn) {
  const b = el('button', 'link-change', 'Change');
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}
function summarySection(step) {
  const sec = el('div', 'summary-section');
  sec.appendChild(el('h3', null, step.title));
  const dl = el('dl');
  for (const f of step.fields) {
    if (f.when && !f.when(a)) continue;
    const v = a[f.id];
    const empty = Array.isArray(v) ? v.length === 0 : v === undefined || v === null || v === '';
    if (empty && (f.optional || f.collapsed)) continue; // empty more.* never shows
    dl.appendChild(el('dt', null, f.label));
    let text = empty ? 'Not answered'
      : Array.isArray(v) ? v.map(x => titleFor(f, x)).join(', ')
      : String(v);
    if (f.type === 'textarea') { const cut = text.split('\n')[0]; if (cut.length < text.length) text = cut + '...'; }
    dl.appendChild(el('dd', null, text));
  }
  sec.appendChild(dl);
  sec.appendChild(changeBtn(() => { fromCheck = true; stepId = step.id; render(); }));
  return sec;
}
function setupSection() {
  const sec = el('div', 'summary-section');
  sec.appendChild(el('h3', null, 'Setup'));
  const dl = el('dl');
  dl.appendChild(el('dt', null, 'Mode'));
  dl.appendChild(el('dd', null, a.mode === 'advanced' ? 'Advanced' : 'Simple'));
  sec.appendChild(dl);
  sec.appendChild(changeBtn(() => { stepId = 'mode'; render(); }));
  return sec;
}
function extraSection() { // the check step's own more.* answer, only when filled in
  const v = a['more.check'];
  if (typeof v !== 'string' || v.trim() === '') return null;
  const sec = el('div', 'summary-section');
  sec.appendChild(el('h3', null, 'Extra detail'));
  const dl = el('dl');
  dl.appendChild(el('dt', null, 'Add more detail'));
  dl.appendChild(el('dd', null, v));
  sec.appendChild(dl);
  return sec;
}

/* ---------- mode choice (from the Setup row on the check screen) ---------- */
const MODE_CHOICES = [
  { id: 'simple', icon: '🌿', title: 'Simple', line: 'A short walk through the questions.' },
  { id: 'advanced', icon: '🛠️', title: 'Advanced', line: 'Skip the basics, describe it your way.' },
];
function renderModeChoice() {
  const root = el('div', 'step-view');
  const sec = el('section', 'screen');
  sec.dataset.step = 'mode';
  const h = el('h2', 'screen-title', 'Choose your setup');
  h.tabIndex = -1;
  sec.appendChild(h);
  sec.appendChild(el('p', 'screen-lead', 'Change when you like. Your answers stay.'));
  const box = el('div', 'cards');
  for (const m of MODE_CHOICES) {
    const card = cardEl({ icon: m.icon, title: m.title, line: m.line });
    card.setAttribute('aria-pressed', a.mode === m.id ? 'true' : 'false');
    if (a.mode === m.id) card.classList.add('is-selected');
    card.addEventListener('click', () => { a.mode = m.id; save(); gateToCheck(); }); // a mode switch re-checks everything
    box.appendChild(card);
  }
  sec.appendChild(box);
  root.appendChild(sec);
  const nav = el('nav', 'actions');
  const b = el('button', 'btn btn-back', 'Back');
  b.type = 'button';
  b.addEventListener('click', () => { fromCheck = false; stepId = 'check'; render(); }); // no change made, straight back
  nav.appendChild(b); root.appendChild(nav);
  return { root, focus: h };
}
function renderCheck(vs) {
  const y = vs.length; // vs already includes the check screen
  const root = el('div', 'step-view');
  root.appendChild(progressEl(y, y));

  const sec = el('section', 'screen');
  sec.dataset.step = 'check';
  const h = el('h2', 'screen-title', 'Check your answers');
  h.tabIndex = -1;
  sec.appendChild(h);
  sec.appendChild(el('p', 'screen-lead', 'Look it over. Change anything you like, then send it to Josh.'));

  const sum = el('div', 'summary');
  sum.appendChild(setupSection());
  for (const s of vs) if (s.id !== 'check') sum.appendChild(summarySection(s));
  const extra = extraSection();
  if (extra) sum.appendChild(extra);
  sec.appendChild(sum);

  const picked = SKILLS.filter(s => asArray(a.skills).includes(s.id) && s.groups.some(g => asArray(a.groups).includes(g)));
  if (picked.length) {
    sec.appendChild(el('h3', 'kit-title', 'Your starter kit'));
    const gal = el('div', 'kit-gallery');
    for (const s of picked) {
      const c = el('div', 'card is-static');
      if (s.icon) c.appendChild(el('span', 'card-icon', s.icon));
      c.appendChild(el('span', 'card-title', s.title));
      if (s.line) c.appendChild(el('span', 'card-line', s.line));
      gal.appendChild(c);
    }
    sec.appendChild(gal);
  }

  honeyInput = el('input', 'honeypot'); // bots fill it, people never see it
  honeyInput.type = 'text';
  honeyInput.name = '_honey';
  honeyInput.setAttribute('aria-hidden', 'true');
  honeyInput.setAttribute('autocomplete', 'off');
  honeyInput.setAttribute('tabindex', '-1');
  Object.assign(honeyInput.style, { position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: '0' });
  sec.appendChild(honeyInput);

  root.appendChild(sec);
  root.appendChild(actionsEl(true, 'Send', next));
  return { root, focus: h };
}

/* ---------- done and send error ---------- */
function renderDone() {
  const sec = el('section', 'screen done');
  sec.dataset.step = 'done';
  const h = el('h2', 'screen-title', 'Thanks, ' + doneName + '.');
  h.tabIndex = -1;
  sec.appendChild(h);
  sec.appendChild(el('p', 'screen-lead', 'Josh will be in touch within 2 days.'));
  return { root: sec, focus: h };
}
function finishDone() { // shared by a real success and the honeypot's fake one
  doneName = String(a.name || '').trim().split(/\s+/)[0] || 'friend'; // keep the first name for the done screen
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  a = {};
  sending = false;
  stepId = 'done';
  render();
}
function showSendError(text) {
  sending = false;
  const view = wizardEl.querySelector('.step-view') || wizardEl;
  view.querySelector('.send-error')?.remove();
  const box = el('div', 'send-error');
  box.setAttribute('role', 'alert');
  const h = el('h3', 'send-error-title', 'Sending failed');
  h.tabIndex = -1;
  box.appendChild(h);
  box.appendChild(el('p', null, 'Sorry about that. Your answers are still here. Copy your brief and send it to us another way.'));
  const line = el('p', 'send-error-links');
  if (CONTACT_EMAIL !== 'REPLACE_ME') { // hide the link until a real address is set
    line.appendChild(document.createTextNode('Email it to '));
    const m = el('a', null, CONTACT_EMAIL);
    m.href = 'mailto:' + CONTACT_EMAIL;
    line.appendChild(m);
    line.appendChild(document.createTextNode(', or use the '));
  } else {
    line.appendChild(document.createTextNode('Use the '));
  }
  line.appendChild(document.createTextNode('Copy button below and try again later.'));
  box.appendChild(line);
  const ta = el('textarea', 'brief-copy');
  ta.id = 'brief-copy';
  ta.setAttribute('aria-label', 'Your brief, ready to copy');
  ta.readOnly = true;
  ta.rows = 6;
  ta.value = text;
  box.appendChild(ta);
  const cp = el('button', 'btn', 'Copy');
  cp.type = 'button';
  cp.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      cp.textContent = 'Copied';
      setTimeout(() => { cp.textContent = 'Copy'; }, 2000);
    } catch (e) {
      ta.select();
      document.execCommand?.('copy');
    }
  });
  box.appendChild(cp);
  view.appendChild(box);
  const btn = wizardEl.querySelector('.btn-primary');
  if (btn) { btn.classList.remove('is-loading'); btn.disabled = false; }
  h.focus();
}

/* ---------- send (FormSubmit AJAX) ---------- */
async function send() {
  if (sending) return;
  if (honeyInput && honeyInput.value.trim() !== '') { finishDone(); return; } // honeypot filled: done screen, no request
  const text = briefText(buildBrief(a));
  if (ALIAS === 'REPLACE_ME') { showSendError(text); return; } // no destination set, keep the draft
  sending = true;
  const btn = wizardEl.querySelector('.btn-primary');
  if (btn) { btn.classList.add('is-loading'); btn.disabled = true; }
  try {
    const res = await fetch('https://formsubmit.co/ajax/' + ALIAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: a.name,
        email: a.email,
        _subject: 'New Hermes brief: ' + (a.name || 'unknown'),
        _template: 'box',
        _captcha: 'false',
        _honey: '',
        message: text,
      }),
    });
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; } // a 200 with bad JSON is a failure
    if (!res.ok || !data || (data.success !== true && data.success !== 'true')) throw new Error('send failed');
    finishDone();
  } catch (e) {
    showSendError(text); // the draft stays in storage
  }
}

/* ---------- navigation ---------- */
function firstIncomplete(vs) { // first visible step whose required fields fail, or null
  return vs.find(s => s.id !== 'check' && Object.keys(validate(s, a)).length > 0) || null;
}
function gateToCheck() { // open the first incomplete step, otherwise the check screen
  const bad = firstIncomplete(visibleSteps(a));
  if (bad) { stepId = bad.id; pendingErrStep = bad.id; }
  else stepId = 'check';
  render();
}
function trySend() { // Send only when every visible step passes
  const bad = firstIncomplete(visibleSteps(a));
  if (bad) { stepId = bad.id; pendingErrStep = bad.id; render(); return; }
  send();
}
function paintErrors(view, step) { // show errs on a rendered step, focus the first control
  const errs = validate(step, a);
  clearErrors(view);
  let first = null;
  for (const f of step.fields) {
    if (!Object.prototype.hasOwnProperty.call(errs, f.id)) continue;
    const wrap = view.querySelector('.field[data-field="' + CSS.escape(f.id) + '"]');
    if (!wrap) continue;
    wrap.classList.add('has-error');
    const e = wrap.querySelector('p.field-error');
    if (e) e.textContent = errs[f.id];
    const c = focusIn(wrap);
    if (c) { c.setAttribute('aria-invalid', 'true'); if (!first) first = c; }
  }
  if (first) { first.focus(); return true; }
  return Object.keys(errs).length > 0;
}
function next() {
  if (!started || stepId === 'done' || stepId === 'mode') return;
  if (stepId === 'check') { trySend(); return; }
  const vs = visibleSteps(a);
  const i = vs.findIndex(s => s.id === stepId);
  const step = vs[i < 0 ? 0 : i];
  stepId = step.id;
  if (Object.keys(validate(step, a)).length) {
    paintErrors(wizardEl.querySelector('.step-view') || wizardEl, step);
    return;
  }
  if (fromCheck) { fromCheck = false; gateToCheck(); return; } // an edit re-checks everything first
  if (i >= 0 && i < vs.length - 1) { stepId = vs[i + 1].id; render(); }
  else gateToCheck(); // the last question step lands on check only when all is valid
}
function goBack() {
  if (sending || stepId === 'done') return;
  if (fromCheck) { fromCheck = false; gateToCheck(); return; }
  if (stepId === 'check') {
    const vs = visibleSteps(a).filter(s => s.id !== 'check');
    stepId = vs[vs.length - 1].id; // back to the last question step
    render();
    return;
  }
  const vs = visibleSteps(a);
  const i = vs.findIndex(s => s.id === stepId);
  if (i > 0) { stepId = vs[i - 1].id; render(); }
}

/* ---------- render loop ---------- */
function render() {
  const vs = visibleSteps(a);
  let view;
  if (stepId === 'done') view = renderDone();
  else if (stepId === 'check') view = renderCheck(vs);
  else if (stepId === 'mode') view = renderModeChoice();
  else {
    let step = vs.find(s => s.id === stepId);
    if (!step) { step = vs[0]; stepId = step.id; }
    view = renderStep(step, vs);
  }
  wizardEl.innerHTML = '';
  wizardEl.appendChild(view.root);
  view.root.classList.add('step-view');
  const sec = view.root.querySelector('.screen');
  if (sec) { // one frame with the enter class, then off, so CSS can transition
    sec.classList.add('is-entering');
    requestAnimationFrame(() => sec.classList.remove('is-entering'));
  }
  let focused = false;
  if (pendingErrStep === stepId) { // a gated jump opens this step with its errors shown
    const st = vs.find(s => s.id === stepId);
    if (st) focused = paintErrors(view.root, st);
  }
  pendingErrStep = null;
  if (!focused) view.focus.focus();
  window.scrollTo(0, 0);
}

function firstStepToOpen(vs) {
  if (Object.keys(a).length === 0) return vs[0].id;
  const bad = firstIncomplete(vs); // resume where it left off
  return bad ? bad.id : 'check';   // a complete draft opens on Check
}
function start(mode) {
  // "Carry on" keeps the saved mode; the advanced link always means advanced
  a.mode = mode === 'simple' && saved && saved.mode === 'advanced' ? 'advanced' : mode;
  save();
  started = true;
  stepId = firstStepToOpen(visibleSteps(a));
  render();
}
function init() {
  saved = loadSaved();
  if (saved) {
    a = saved;
    const btn = document.getElementById('start');
    if (btn) btn.textContent = 'Welcome back, carry on';
  }
  document.getElementById('start')?.addEventListener('click', () => start('simple'));
  document.getElementById('start-advanced')?.addEventListener('click', () => start('advanced'));
  document.addEventListener('keydown', (e) => {
    // Enter advances only from text and email inputs; native controls keep their own Enter
    if (!started || stepId === 'done' || e.key !== 'Enter' || e.shiftKey) return;
    const t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    const ty = (t.getAttribute('type') || 'text').toLowerCase();
    if (ty !== 'text' && ty !== 'email') return;
    e.preventDefault();
    next();
  });
}
init();
