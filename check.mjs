// Run: node check.mjs   (no deps). Walks every group path and checks the brief.
import assert from 'node:assert/strict';
import { GROUPS, SKILLS, TOOLS, APPS, SWAPS, TRY } from './catalogue.js';
import { STEPS, visibleSteps, validate, applySwaps, swapChoices } from './steps.js';
import { buildBrief, briefText, FILES_RULE } from './brief.js';

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
const text = JSON.stringify([GROUPS, SKILLS, TOOLS, APPS, SWAPS, TRY, STEPS.map(s => [s.title, s.lead, s.fields])]);
ok(!DASH.test(text), 'no em or en dashes');

// fill every visible required field with something valid
function fill(a, step) {
  for (const f of step.fields) {
    if (f.when && !f.when(a)) continue;
    if (a[f.id] !== undefined) continue;
    if (f.type === 'email') a[f.id] = 'test@example.com';
    else if (f.type === 'cards' || f.type === 'chips') {
      let opts = f.options || [];
      if (f.source === 'swaps') opts = swapChoices(a).map(w => w.id);
      else if (f.source === 'skills') opts = SKILLS.filter(s => s.groups.some(g => (a.groups || []).includes(g))).map(s => s.id);
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
  ok(vs.length >= 6 && vs.length <= (groups.length > 1 ? 13 : 10), `${label}: ${vs.length} screens`); // round 4: +1 for swaps
  for (const s of vs) ok(Object.keys(validate(s, a)).length === 0, `${label}: ${s.id} valid`);
  ok(Object.keys(validate(vs.find(s => s.id === 'about'), {})).length > 0, 'empty about is invalid');
  for (const g of gids) ok(vs.some(s => s.id === g) === (!adv && groups.includes(g)), `${label}: branch ${g}`);
  ok(vs.some(s => s.id === 'context') === adv && vs.some(s => s.id === 'tech') === adv, `${label}: advanced steps`);
  if (adv) ok(!vs.some(s => s.id === 'tune'), `${label}: no tune in advanced`);
  for (const s of vs) {
    const want = { skills: 'own.skills', swaps: 'own.swaps' }[s.id] || 'more.' + s.id; // round 4: skills gets the own-skill list
    ok(s.fields.some(f => f.id === want && f.collapsed && f.optional), `${label}: ${want}`);
  }
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

// round 4: Brooke's sister's feedback, delivery
{
  const habit = SKILLS.find(s => s.id === 'habit-check');
  ok(habit.ask.find(q => q.id === 'time').multiple === true, 'habit times are multi-pick');
  const base = { groups: ['personal'], skills: ['habit-check'], name: 'Sam', email: 'sam@example.com',
    'skill.habit-check.habits': ['Exercise'], 'skill.habit-check.habits.own': ['Stretch', 'Drink water'],
    'skill.habit-check.time': ['7am', '9pm'], 'skill.habit-check.style.own': ['Like a coach'],
    'skill.habit-check.style': 'Quiet',
    'own.skills': ["Organise the kids' photos by age", '', 'Track the garden', 'Track the garden too'] };
  const b = buildBrief(base);
  const job = b.jobs.find(j => j.id === 'habit-check');
  ok(job.settings.habits.join() === 'Exercise,Stretch,Drink water', 'own habits reach the brief');
  ok(job.settings.time.join() === '7am,9pm', 'two habit times reach the brief');
  ok(job.settings.style === 'Like a coach', 'own single answer wins');
  ok(b.ownSkills.length === 3 && b.ownSkills.every(o => /^own-[a-z0-9-]+$/.test(o.channel)), '3 own skills, 3 entries');
  ok(new Set(b.kit.CHANNELS.split(' ')).size === b.kit.CHANNELS.split(' ').length, 'own channels unique');
  ok(b.discord.categories.some(c => c.name === 'Your own' && c.channels.length === 3), 'own skills category');
  ok(b.soul.always.includes(FILES_RULE), 'file rule in every soul');
  ok(b.firstWeek[0] === TRY['habit-check'] && b.firstWeek.includes("Help me set up: Organise the kids' photos by age"), 'first week from picks');
  ok(b.firstWeek.length <= 6 && b.firstWeek.at(-1).includes('skill'), 'first week ends with making a skill');
  const t = briefText(b);
  ok(t.includes('THEIR OWN SKILL IDEAS') && t.includes('FIRST WEEK') && !DASH.test(t.split('--- JSON ---')[0]), 'brief text');
  // own answers count as answers
  const skillsStep = visibleSteps(base).find(s => s.id === 'skills');
  ok(!Object.keys(validate(skillsStep, { ...base, skills: [] })).length, 'own skills alone pass the skills step');
  ok(Object.keys(validate(skillsStep, { ...base, skills: [], 'own.skills': ['  '] })).length, 'blank own skill does not count');
  const tune = visibleSteps(base).find(s => s.id === 'tune');
  ok(!validate(tune, { ...base, 'skill.habit-check.habits': [] })['skill.habit-check.habits'], 'own habit alone passes');
  const talk = visibleSteps(base).find(s => s.id === 'talk');
  ok(talk.fields.find(f => f.id === 'users').noOwn && !talk.fields.some(f => f.id === 'delivery') && talk.showcase.items.length === 4, 'talk shows, not asks');
  ok(validate(talk, { ...base, 'users.own': ['Lots'] }).users, 'noOwn field ignores own answers');
  ok(!('users.own' in buildBrief({ ...base, users: 'Just me', 'users.own': ['Lots'] }).answers), 'noOwn own answers stay out of the brief');
  ok(!('tools.own' in buildBrief({ ...base, 'tools.own': ['  '] }).answers), 'blank own answers stay out of the brief');
  ok(briefText({ firstWeek: 'odd string' }).includes('odd string'), 'odd saved brief does not crash');
  ok(buildBrief({ name: 'X', email: 'x@y.z' }).firstWeek.length === 1, 'empty kit still teaches making a skill');
}

// round 4: every skill has one short thing to try saying
for (const s of SKILLS) ok(TRY[s.id] && TRY[s.id].split(/\s+/).length <= 14, `try line: ${s.id}`);
ok(Object.keys(TRY).every(id => SKILLS.some(s => s.id === id)), 'no stray try lines');

// round 4: apps it could replace
ok(SWAPS.length >= 12, 'at least 12 swaps');
const swapIds = new Set();
for (const w of SWAPS) {
  ok(/^[a-z0-9-]+$/.test(w.id) && !swapIds.has(w.id), `swap id ${w.id}`); swapIds.add(w.id);
  ok(w.title && w.title.split(/\s+/).length <= 4 && w.icon && w.examples, `swap shape: ${w.id}`);
  ok(Number.isInteger(w.nzd) && w.nzd > 0 && w.nzd < 1000, `swap price: ${w.id}`);
  ok(w.skills.length && w.skills.every(id => SKILLS.some(s => s.id === id)), `swap skills exist: ${w.id}`);
  ok(w.fit === 'full' || (w.fit === 'part' && w.note), `swap fit: ${w.id}`);
}
{
  const a = { groups: ['personal'], skills: ['morning-brief'], swaps: ['cycle', 'meals', 'nope'] };
  const got = applySwaps(a);
  ok(got[0] === 'morning-brief' && got.includes('cycle-tracker') && got.includes('meal-planner'), 'swaps tick their skills');
  ok(applySwaps({ groups: ['business'], swaps: ['cycle'] }).length === 0, 'swaps outside the groups add nothing');
  ok(!swapChoices({ groups: ['business'] }).some(w => w.id === 'cycle'), 'business sees no cycle tile');
  const b = buildBrief({ ...a, skills: got, name: 'X', email: 'x@y.z', 'own.swaps': ['Strava, $90 a year'] });
  const want = SWAPS.filter(w => ['cycle', 'meals'].includes(w.id)).reduce((t, w) => t + w.nzd, 0);
  ok(b.replaces.length === 2 && b.replacesNzd === want, 'swap total adds up');
  ok(b.otherApps[0] === 'Strava, $90 a year' && briefText(b).includes('APPS IT COULD REPLACE'), 'other apps in the brief');
  ok(buildBrief({ groups: ['business'], swaps: ['cycle'], name: 'X', email: 'x@y.z' }).replaces.length === 0, 'hidden swaps stay out');
}

console.log(`PASS ${n} checks`);
