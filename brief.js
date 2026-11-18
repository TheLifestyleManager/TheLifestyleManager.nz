// brief.js - Worker C. Turns the flat answers object into the brief, and the
// brief into the email body. Must never crash on missing answers.
// Round 2: brief.mode, brief.notes (all more.* text keyed by step), brief.tech
// (the tech step answers, advanced defaults standing in for model and access),
// soul.business also carries the advanced context text. briefText adds a Mode
// line, a Notes section, and an Advanced section when present.
// Round 3: only the active path reaches the brief. Skills must still fit the
// groups picked now, branch and tune answers count only while their own step
// is visible, tech only in advanced mode, notes only for visible steps.
// kit.USERS is a number and kit.USERS_LABEL keeps the chip text. Job settings
// keep their answered shape: strings stay strings, arrays stay arrays, and
// briefText is the one place arrays are joined for reading.

import { GROUPS, SKILLS, TOOLS, APPS, SWAPS, TRY } from './catalogue.js';
import { STEPS, visibleSteps, OWN, ownValues, listValues, swapChoices, takesOwn } from './steps.js';
// Round 4: own answers (<fieldId>.own) merge in wherever their field is read:
// multi-pick fields get them appended, single-pick fields use theirs first.
// Own skills (own.skills) get a channel each. delivery says how it sends things.

const TONE_LABELS = {
  warm: 'Warm and friendly',
  sharp: 'Short and sharp',
  cheeky: 'Fun and cheeky',
  calm: 'Calm and formal',
};

// Round 4: Hermes only makes files when told to, so every box gets this rule.
export const FILES_RULE = 'Text by default. Send a PDF, chart or spreadsheet for quotes, invoices, reports, and money or customer numbers, or whenever they ask.';
const SAVE_SKILL = 'That worked. Save it as a skill.';

// "Your first week": up to 5 things to try, from the active skills and own
// ideas, always ending with how to make a new skill. Hermes opens with these.
export function firstWeek(skills, ownSkills) {
  const lines = [
    ...skills.map(s => TRY[s.id]).filter(Boolean),
    ...ownSkills.map(o => `Help me set up: ${o.title}`),
  ].slice(0, 5);
  return [...lines, SAVE_SKILL];
}

const ALWAYS_DEFAULTS = [
  'Always ask you first if it is unsure.',
  'Start read only, and earn more access over time.',
  'Keep a log of everything it does.',
];

const NEVER_DEFAULTS = [
  'Never spend money on its own.',
  'Never delete anything without asking.',
  'Never share your data with anyone else.',
];

// The tech step's field ids, in order, for the brief and the email body.
const TECH_FIELDS = ['model', 'extras', 'integrations', 'jobs', 'access'];
const TECH_LABELS = {
  model: 'Model',
  extras: 'Extras',
  integrations: 'Accounts, APIs or MCP servers',
  jobs: 'Scheduled jobs',
  access: 'When it asks first',
};
// The defaults the tech step states, so an advanced brief is complete.
const TECH_ADVANCED_DEFAULTS = {
  model: 'Inference, hosted in NZ (recommended)',
  access: 'Ask me before anything outward',
};

function arr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
}

// A multi-pick answer with the visitor's own answers added on the end.
function many(answers, id) {
  return [...arr(answers[id]), ...ownValues(answers, id)];
}
// A single-pick answer: their own answer wins, the preset otherwise.
function one(answers, id) {
  return ownValues(answers, id)[0] || answers[id];
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'hermes';
}

// The talk step's users chips, and the headcount each one stands for. The
// chips are ranges, so each maps to a set number for the kit.
const USERS_COUNT = {
  'Just me': 1,
  'Me plus 1': 2,
  '2 to 5': 5,
  'More': 10,
};

// { users: number, label: chip text } for kit.USERS and kit.USERS_LABEL.
function usersInfo(v) {
  const first = Array.isArray(v) ? v[0] : v;
  const label = typeof first === 'string' ? first.trim() : '';
  if (Object.prototype.hasOwnProperty.call(USERS_COUNT, label)) {
    return { users: USERS_COUNT[label], label };
  }
  return { users: 1, label: 'Just me' };
}

// Picked skills that still fit the active path: in the catalogue and with
// groups that overlap the groups picked now. Answers about removed branches
// or removed skills never reach the brief.
function activeSkills(answers, groups) {
  const ids = arr(answers.skills);
  return SKILLS.filter(s => ids.includes(s.id) && s.groups.some(g => groups.includes(g)));
}

function titleLookup(list) {
  return (id) => {
    const found = list.find(x => x.id === id);
    return found ? found.title : String(id || '');
  };
}

// The step title a note came from, for the email body.
function stepTitle(id) {
  const s = STEPS.find(x => x.id === id);
  return s ? s.title : String(id || '');
}

// All the more.<stepId> texts, keyed by step id, empty ones dropped, and
// only for steps visible on the active path.
function collectNotes(answers, visible) {
  const notes = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!key.startsWith('more.')) continue;
    const stepId = key.slice('more.'.length);
    if (visible && !visible.has(stepId)) continue;
    const text = (Array.isArray(value) ? value.join(', ') : String(value || '')).trim();
    if (text) notes[stepId] = text;
  }
  return notes;
}

// The tech step answers, kept as tidy strings. The caller only collects them
// when the tech step is visible, which means advanced mode.
function collectTech(answers) {
  const tech = {};
  for (const id of TECH_FIELDS) {
    const v = id === 'extras' ? many(answers, id) : answers[id];
    if (Array.isArray(v) && v.length) tech[id] = v.join(', ');
    else if (typeof v === 'string' && v.trim()) tech[id] = v.trim();
  }
  for (const [id, d] of Object.entries(TECH_ADVANCED_DEFAULTS)) {
    if (!tech[id]) tech[id] = d;
  }
  return tech;
}

export function buildBrief(a) {
  const answers = a && typeof a === 'object' ? a : {};
  const mode = answers.mode === 'advanced' ? 'advanced' : 'simple';
  // Only steps visible on the active path may reach the brief. Answers kept
  // for Back never leak out of a hidden branch.
  const visible = new Set(visibleSteps(answers).map(s => s.id));
  const shown = (id) => visible.has(id);
  const groups = arr(answers.groups).filter(g => GROUPS.some(x => x.id === g));
  const skills = activeSkills(answers, groups);
  const tools = many(answers, 'tools');
  const notes = collectNotes(answers, visible);
  const tech = shown('tech') ? collectTech(answers) : {};

  const bizName = (shown('business') ? String(answers.bizname || '').trim() : '')
    || (shown('context') ? String(answers.setname || '').trim() : '');
  const bizSlug = slugify(bizName || answers.name);
  const userInfo = usersInfo(answers.users);

  const channels = ['hermes', 'needs-you', 'alerts'];
  for (const s of skills) {
    if (!channels.includes(s.channel)) channels.push(s.channel);
  }
  // Own skill ideas: one entry and one channel each, named from the first words.
  const ownSkills = [];
  for (const title of shown('skills') ? listValues(answers['own.skills']) : []) {
    const base = 'own-' + slugify(title.split(/\s+/).slice(0, 3).join(' ')).slice(0, 24).replace(/-+$/, '');
    let channel = base;
    for (let i = 2; channels.includes(channel); i++) channel = `${base}-${i}`;
    channels.push(channel);
    ownSkills.push({ title, channel });
  }

  // Discord categories, grouped by skill.category, Hermes first.
  const categories = [{ name: 'Hermes', channels: ['hermes', 'needs-you', 'alerts'] }];
  for (const s of skills) {
    let cat = categories.find(c => c.name === s.category);
    if (!cat) { cat = { name: s.category, channels: [] }; categories.push(cat); }
    if (!cat.channels.includes(s.channel)) cat.channels.push(s.channel);
  }
  if (ownSkills.length) categories.push({ name: 'Your own', channels: ownSkills.map(o => o.channel) });

  // soul.who: name, region, household or team, from visible steps only.
  const whoBits = [];
  if (answers.name) whoBits.push(String(answers.name).trim());
  if (answers.region) whoBits.push(`${String(answers.region).trim()} area`);
  const household = shown('personal') ? many(answers, 'household') : [];
  if (household.length) whoBits.push(`Household: ${household.join(', ')}`);
  if (shown('business') && one(answers, 'team')) whoBits.push(`Team size: ${one(answers, 'team')}`);
  if (answers.users) whoBits.push(`People using it: ${userInfo.label}`);
  const who = whoBits.length ? whoBits.join('. ') + '.' : 'Not given.';

  // soul.business: the context text in advanced, otherwise the branch answers,
  // each one only while its own step is visible.
  const bizBits = [];
  if (shown('context') && answers.describe) {
    bizBits.push(`Set-up: ${String(answers.describe).trim()}`);
  }
  if (bizName) bizBits.push(`Business: ${bizName}`);
  if (shown('business') && answers.bizdoes) bizBits.push(`What it does: ${answers.bizdoes}`);
  if (shown('newbiz') && answers.idea) bizBits.push(`New venture idea: ${answers.idea}`);
  if (shown('newbiz') && one(answers, 'stage')) bizBits.push(`Stage: ${one(answers, 'stage')}`);
  if (shown('projects') && answers.project) bizBits.push(`Project: ${answers.project}`);
  if (shown('projects') && one(answers, 'goal')) bizBits.push(`Definition of done: ${one(answers, 'goal')}`);
  const busiest = shown('personal') ? many(answers, 'busiest') : [];
  if (busiest.length) bizBits.push(`Busiest parts of life: ${busiest.join(', ')}`);
  const business = bizBits.length ? bizBits.join('. ') + '.' : 'Personal use, no business given.';

  const tone = TONE_LABELS[answers.tone] || (answers.tone ? String(answers.tone) : 'Warm and friendly');

  const never = arr(answers.never)
    .join('\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  for (const d of NEVER_DEFAULTS) if (!never.includes(d)) never.push(d);

  // Settings keep the answered shape: a string stays a string, an array stays
  // an array. briefText is where arrays are joined for reading.
  const jobs = skills.map(s => {
    const settings = {};
    for (const q of s.ask || []) {
      const key = `skill.${s.id}.${q.id}`;
      const own = ownValues(answers, key);
      const v = !own.length ? answers[key] : q.multiple ? [...arr(answers[key]), ...own] : own[0];
      const empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
      if (!empty) settings[q.id] = v;
    }
    const job = { id: s.id, title: s.title, outward: !!s.outward, channel: s.channel, settings };
    if (s.reads) job.reads = skills.filter(x => s.reads.includes(x.id)).map(x => x.id); // only the logs they picked
    if (s.rule) job.rule = s.rule;
    return job;
  });

  // Paid apps it could replace, and the typical yearly cost of the picked ones.
  const fitting = shown('swaps') ? swapChoices(answers) : [];
  const replaces = fitting.filter(w => arr(answers.swaps).includes(w.id))
    .map(w => ({ id: w.id, title: w.title, examples: w.examples, nzd: w.nzd, fit: w.fit, note: w.note }));
  const otherApps = shown('swaps') ? listValues(answers['own.swaps']) : [];

  const heavyOn = skills.some(s => s.heavy);
  const vm = {
    fits: !heavyOn,
    notes: heavyOn
      ? ['Some picks are heavy (big archives or video). We may size the box up.']
      : ['All picks fit a small box. Nothing heavy here.'],
  };

  return {
    version: 1,
    mode,
    contact: {
      name: String(answers.name || '').trim(),
      email: String(answers.email || '').trim(),
      region: String(answers.region || '').trim(),
    },
    groups,
    kit: {
      BIZ_NAME: bizName || String(answers.name || '').trim() || 'New Hermes user',
      BIZ_SLUG: bizSlug,
      CHANNELS: channels.join(' '),
      CHAT_APP: APPS.some(x => x.id === answers.app) ? answers.app : (answers.app ? String(answers.app) : 'unsure'),
      USERS: userInfo.users,
      USERS_LABEL: userInfo.label,
    },
    discord: { categories },
    soul: {
      who,
      business,
      tone,
      always: ['Ask before sending, posting or paying anything', FILES_RULE, ...ALWAYS_DEFAULTS],
      never,
    },
    jobs,
    ownSkills,
    firstWeek: firstWeek(skills, ownSkills),
    replaces,
    replacesNzd: replaces.reduce((t, w) => t + w.nzd, 0),
    otherApps,
    tools,
    notes,
    tech,
    vm,
    // raw answers, but only fields on the screens they actually saw
    answers: Object.fromEntries(visibleSteps(answers)
      .flatMap(st => st.fields.flatMap(f => {
        const pairs = answers[f.id] !== undefined && answers[f.id] !== '' ? [[f.id, answers[f.id]]] : [];
        const own = takesOwn(f) ? ownValues(answers, f.id) : []; // own answers only where the field takes them
        if (own.length) pairs.push([f.id + OWN, own]);
        return pairs;
      }))),
  };
}

export function briefText(brief) {
  const b = brief && typeof brief === 'object' ? brief : buildBrief({});
  const gTitle = titleLookup(GROUPS);
  const tTitle = titleLookup(TOOLS);
  const aTitle = titleLookup(APPS);
  const lines = [];
  const push = (s = '') => lines.push(s);

  push('HERMES STARTER BRIEF');
  push('====================');
  push();

  push(`Mode: ${b.mode === 'advanced' ? 'Advanced setup' : 'Simple setup'}`);
  push();

  push('WHO YOU ARE');
  push(`Name: ${b.contact?.name || 'Not given'}`);
  push(`Email: ${b.contact?.email || 'Not given'}`);
  if (b.contact?.region) push(`Area: ${b.contact.region}`);
  push();

  push('WHAT YOU WANT HELP WITH');
  push((b.groups || []).map(gTitle).join(', ') || 'Not given');
  push();

  push('THE SETUP');
  push(`Name for the kit: ${b.kit?.BIZ_NAME || ''}`);
  push(`Short name: ${b.kit?.BIZ_SLUG || ''}`);
  push(`Talk to it in: ${aTitle(b.kit?.CHAT_APP) || 'Not sure yet'}`);
  push(`People using it: ${b.kit?.USERS_LABEL || 'Just me'}`);
  push(`Channels: ${b.kit?.CHANNELS || ''}`);
  push();

  push('YOUR STARTER KIT');
  for (const j of b.jobs || []) {
    push(`- ${j.title} (channel: ${j.channel}${j.outward ? ', talks to other people' : ''})`);
    for (const [k, v] of Object.entries(j.settings || {})) {
      push(`    ${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
    }
    if (j.reads) push(`    reads the logs of: ${j.reads.length ? j.reads.join(', ') : 'none picked yet, it keeps its own'}`);
    if (j.rule) push(`    rule: ${j.rule}`);
  }
  if (!(b.jobs || []).length) push('- None picked yet.');
  push();

  if ((b.ownSkills || []).length) {
    push('THEIR OWN SKILL IDEAS');
    for (const o of b.ownSkills) push(`- ${o.title} (channel: ${o.channel})`);
    push();
  }

  if ((b.replaces || []).length || (b.otherApps || []).length) {
    push('APPS IT COULD REPLACE');
    for (const w of b.replaces || []) {
      push(`- ${w.title} (like ${w.examples}), about NZ$${w.nzd} a year. ${w.fit === 'full' ? 'Does the whole job.' : 'Does most of it: ' + w.note}`);
    }
    for (const x of b.otherApps || []) push(`- Other: ${x}`);
    if (b.replacesNzd) push(`Typical cost of the picked apps: about NZ$${b.replacesNzd} a year`);
    push();
  }

  push('TOOLS YOU ALREADY USE');
  push((b.tools || []).map(tTitle).join(', ') || 'None given');
  push();

  if (b.tech && Object.keys(b.tech).length) {
    push('ADVANCED SETUP');
    for (const [k, v] of Object.entries(b.tech)) {
      push(`${TECH_LABELS[k] || k}: ${v}`);
    }
    push();
  }

  push('HOW IT SHOULD FEEL');
  push(`Tone: ${b.soul?.tone || 'Warm and friendly'}`);
  push();

  push('IT ALWAYS DOES THIS');
  for (const x of b.soul?.always || []) push(`- ${x}`);
  push();

  push('IT NEVER DOES THIS');
  for (const x of b.soul?.never || []) push(`- ${x}`);
  push();

  if (b.notes && Object.keys(b.notes).length) {
    push('EXTRA NOTES YOU ADDED');
    for (const [stepId, text] of Object.entries(b.notes)) {
      push(`${stepTitle(stepId)}: ${text}`);
    }
    push();
  }

  push('FIRST WEEK: THINGS TO TRY SAYING (Hermes sends these as its welcome)');
  for (const x of arr(b.firstWeek)) push(`- "${x}"`);
  push();

  push('YOUR MACHINE');
  push(b.vm?.fits ? 'All picks fit a small box.' : 'Some picks are heavy, we may size the box up.');
  push();

  push('YOUR PRIVACY');
  push('Only our small NZ team reads your answers. They reach us by email through FormSubmit. Ask any time and we will delete them.');
  push();

  const body = lines.join('\n');
  return `${body}\n--- JSON ---\n${JSON.stringify(b, null, 2)}`;
}
