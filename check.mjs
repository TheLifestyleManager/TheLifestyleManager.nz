// Run: node check.mjs   (no deps). Walks every group path and checks the brief.
import assert from 'node:assert/strict';
import { GROUPS, SKILLS, TOOLS, APPS } from './catalogue.js';
import { STEPS, visibleSteps, validate } from './steps.js';
import { buildBrief, briefText } from './brief.js';

const DASH = /[–—]/;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// catalogue shape
const gids = GROUPS.map(g => g.id);
ok(['personal', 'business', 'newbiz', 'projects'].every(id => gids.includes(id)), 'four groups');
const tids = new Set(TOOLS.map(t => t.id));
const ids = new Set();
for (const s of SKILLS) {
  ok(/^[a-z0-9-]+$/.test(s.id) && !ids.has(s.id), `skill id ${s.id}`); ids.add(s.id);
  ok(s.title && s.title.split(/\s+/).length <= 4, `title <= 4 words: ${s.id}`);
  ok(s.line && s.line.split(/\s+/).length <= 12, `line <= 12 words: ${s.id}`);
  ok(s.icon && s.groups.length && s.groups.every(g => gids.includes(g)), `groups: ${s.id}`);
  ok(s.tools.every(t => tids.has(t)), `tools exist: ${s.id}`);
  ok(/^[a-z0-9-]+$/.test(s.channel) && s.category, `channel: ${s.id}`);
  ok(typeof s.outward === 'boolean' && typeof s.heavy === 'boolean', `flags: ${s.id}`);
  ok((s.ask || []).length <= 3, `<= 3 asks: ${s.id}`);
}
for (const g of gids) ok(SKILLS.filter(s => s.groups.includes(g)).length >= 6, `>= 6 skills for ${g}`);
ok(APPS.some(a => a.id === 'web' && a.soon) && APPS.some(a => a.id === 'unsure'), 'apps');

// no dashes in any person-facing text
const text = JSON.stringify([GROUPS, SKILLS, TOOLS, APPS, STEPS.map(s => [s.title, s.lead, s.fields])]);
ok(!DASH.test(text), 'no em or en dashes');

// fill every visible required field with something valid
function fill(a, step) {
  for (const f of step.fields) {
    if (f.when && !f.when(a)) continue;
    if (a[f.id] !== undefined) continue;
    if (f.type === 'email') a[f.id] = 'test@example.com';
    else if (f.type === 'cards' || f.type === 'chips') {
      let opts = f.options || [];
      if (f.source === 'skills') opts = SKILLS.filter(s => s.groups.some(g => (a.groups || []).includes(g))).map(s => s.id);
      else if (f.source) opts = { groups: GROUPS, tools: TOOLS, apps: APPS }[f.source].map(o => o.id);
      const vals = opts.map(o => (typeof o === 'string' ? o : o.value ?? o.id));
      a[f.id] = f.multiple ? vals.slice(0, 3) : vals[0];
    } else a[f.id] = 'Test value';
  }
}

const paths = [...gids.map(g => [g]), gids];
for (const mode of ['simple', 'advanced'])
for (const groups of paths) {
  const a = { groups, mode };
  for (let i = 0; i < 20; i++) {          // walk; steps can appear as answers land
    const vs = visibleSteps(a);
    const next = vs.find(s => Object.keys(validate(s, a)).length);
    if (!next) break;
    fill(a, next);
  }
  const vs = visibleSteps(a);
  const label = mode + ':' + groups.join('+');
  const adv = mode === 'advanced';
  ok(vs.length >= 6 && vs.length <= (groups.length > 1 ? 12 : 9), `${label}: ${vs.length} screens`);
  for (const s of vs) ok(Object.keys(validate(s, a)).length === 0, `${label}: ${s.id} valid`);
  ok(Object.keys(validate(vs.find(s => s.id === 'about'), {})).length > 0, 'empty about is invalid');
  for (const g of gids) ok(vs.some(s => s.id === g) === (!adv && groups.includes(g)), `${label}: branch ${g}`);
  ok(vs.some(s => s.id === 'context') === adv && vs.some(s => s.id === 'tech') === adv, `${label}: advanced steps`);
  if (adv) ok(!vs.some(s => s.id === 'tune'), `${label}: no tune in advanced`);
  for (const s of vs) ok(s.fields.some(f => f.id === 'more.' + s.id && f.collapsed && f.optional), `${label}: more.${s.id}`);
  const picked = SKILLS.filter(s => a.skills.includes(s.id));
  const tune = vs.find(s => s.id === 'tune');
  if (!adv && picked.some(s => (s.ask || []).length)) ok(tune && tune.fields.every(f => f.collapsed || f.id.startsWith('skill.')), `${label}: tune`);

  const b = buildBrief(a);
  ok(b.version === 1 && b.contact.email === 'test@example.com', `${label}: contact`);
  const ch = b.kit.CHANNELS.split(' ');
  ok(['hermes', 'needs-you', 'alerts'].every(c => ch.includes(c)), `${label}: core channels`);
  ok(new Set(ch).size === ch.length && picked.every(s => ch.includes(s.channel)), `${label}: skill channels`);
  ok(/^[a-z0-9-]+$/.test(b.kit.BIZ_SLUG) && b.kit.BIZ_NAME && b.kit.CHAT_APP, `${label}: kit`);
  ok(b.discord.categories[0].channels.slice(0, 3).join() === 'hermes,needs-you,alerts', `${label}: discord`);
  ok(b.jobs.length === picked.length && b.soul.tone && Array.isArray(b.soul.never), `${label}: jobs, soul`);
  ok(typeof b.vm.fits === 'boolean' && b.vm.fits === !picked.some(s => s.heavy), `${label}: vm`);
  ok(b.mode === mode && typeof b.notes === 'object' && Object.keys(b.notes).length > 0, `${label}: mode, notes`);
  if (adv) ok(b.tech && Object.keys(b.tech).length > 0 && b.soul.business.includes('Test value'), `${label}: tech`);
  const t = briefText(b);
  ok(t.includes('--- JSON ---') && JSON.parse(t.split('--- JSON ---')[1]).version === 1, `${label}: text`);
  ok(!DASH.test(t.split('--- JSON ---')[0]), `${label}: text has no dashes`);
}

// a heavy skill flips vm.fits
const heavy = SKILLS.find(s => s.heavy);
if (heavy) ok(buildBrief({ groups: heavy.groups, skills: [heavy.id], name: 'X', email: 'x@y.z' }).vm.fits === false, 'heavy');

console.log(`PASS ${n} checks`);
