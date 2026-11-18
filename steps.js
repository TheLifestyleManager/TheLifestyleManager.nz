// steps.js - Worker C. The step list, the branch logic, and validation.
// answers (a) is one flat object: field id -> string or string[].
// Round 2: a.mode is 'simple' (default) or 'advanced'.
// Advanced skips the four branch screens and tune, and adds 'context'
// (after groups) and 'tech' (after tools).
// Every step gets one collapsed, optional "Add more detail" field with the
// id more.<stepId>. wizard.js renders collapsed fields inside a <details>.
// Round 3 (audit): validate trims text and checks required choices against
// the options that exist right now (catalogue ids for source fields, eligible
// skills for the skills field). The email help says how answers reach us.

import { GROUPS, SKILLS, TOOLS, APPS } from './catalogue.js';

const has = (a, g) => Array.isArray(a.groups) && a.groups.includes(g);
const isAdv = (a) => a && a.mode === 'advanced';

// The one optional detail field every step gets.
function moreField(stepId) {
  return {
    id: `more.${stepId}`,
    type: 'textarea',
    label: 'Add more detail',
    optional: true,
    collapsed: true,
  };
}

// Steps as authored. The more field is added to every one at the bottom.
const BASE_STEPS = [
  {
    id: 'about',
    title: 'First, who are you?',
    lead: 'A few basics so we can make this yours.',
    fields: [
      { id: 'name', type: 'text', label: 'Your name' },
      { id: 'email', type: 'email', label: 'Email', help: 'Only Josh and Farley read your answers. They reach us by email through FormSubmit, which keeps a copy for up to 30 days. Ask any time and we delete them.' },
      { id: 'region', type: 'text', label: 'Town or city', optional: true },
    ],
  },
  {
    id: 'groups',
    title: 'What would you like help with?',
    lead: 'Pick any that fit. You can change these later.',
    fields: [
      { id: 'groups', type: 'cards', label: 'Choose one or more', multiple: true, source: 'groups' },
    ],
  },
  {
    id: 'personal',
    title: 'Your household',
    lead: 'So it knows who it is looking after.',
    when: (a) => has(a, 'personal') && !isAdv(a),
    fields: [
      { id: 'household', type: 'chips', label: 'Who is in your household?', multiple: true, options: ['Just me', 'Partner', 'Kids', 'Flatmates', 'Elder parents'] },
      { id: 'busiest', type: 'chips', label: 'Busiest part of life right now?', multiple: true, options: ['Work', 'Home admin', 'Kids and school', 'Health', 'Money', 'Study'] },
    ],
  },
  {
    id: 'business',
    title: 'Your business',
    lead: 'Just the headline for now.',
    when: (a) => has(a, 'business') && !isAdv(a),
    fields: [
      { id: 'bizname', type: 'text', label: 'Business name' },
      { id: 'bizdoes', type: 'text', label: 'What it does', help: 'One line is plenty.' },
      { id: 'team', type: 'chips', label: 'How many people work with you?', options: ['Just me', '2 to 5', '6 to 20', 'More than 20'] },
    ],
  },
  {
    id: 'newbiz',
    title: 'Your new thing',
    lead: 'No polish needed, a rough line is fine.',
    when: (a) => has(a, 'newbiz') && !isAdv(a),
    fields: [
      { id: 'idea', type: 'text', label: 'The idea in one line' },
      { id: 'stage', type: 'chips', label: 'Where is it at?', options: ['Just an idea', 'Testing it', 'About to launch', 'Launched'] },
    ],
  },
  {
    id: 'projects',
    title: 'Your project',
    lead: 'The thing you keep meaning to move on.',
    when: (a) => has(a, 'projects') && !isAdv(a),
    fields: [
      { id: 'project', type: 'text', label: 'What project?', help: 'One line is plenty.' },
      { id: 'goal', type: 'chips', label: 'What does done look like?', options: ['Launched', 'Finished', 'On pace', 'Learned it'] },
    ],
  },
  {
    // Advanced mode replaces the branch screens with one free text screen.
    id: 'context',
    title: 'Your set-up, in your own words',
    lead: 'You know your stack, so no forms. The more you tell us, the better the first build.',
    when: (a) => isAdv(a),
    fields: [
      { id: 'describe', type: 'textarea', label: 'Describe your set-up and what you want, in as much detail as you like' },
      { id: 'setname', type: 'text', label: 'Business or project name', optional: true },
    ],
  },
  {
    id: 'skills',
    title: 'Pick what it does for you',
    lead: 'Start with a few. Each one gets its own channel.',
    fields: [
      { id: 'skills', type: 'cards', label: 'Choose one or more', multiple: true, source: 'skills' },
    ],
  },
  {
    // Fields are built in visibleSteps from the picked skills' ask lists.
    // Hidden in advanced mode; the context screen covers the same ground.
    // Only skills that still fit the groups picked now count here.
    id: 'tune',
    title: 'A few quick settings',
    lead: 'Just for the ones you picked.',
    when: (a) => !isAdv(a) && (
      Array.isArray(a.skills) && a.skills.length > 0 &&
      SKILLS.some(s => a.skills.includes(s.id) && fitsGroups(s, a) && (s.ask || []).length > 0)),
    fields: [],
  },
  {
    id: 'tools',
    title: 'What do you already use?',
    lead: 'Pick the ones you already have. Skip any you do not.',
    fields: [
      { id: 'tools', type: 'chips', label: 'Tick what applies', multiple: true, optional: true, source: 'tools' },
    ],
  },
  {
    // Advanced only, after tools. All fields optional.
    id: 'tech',
    title: 'The technical bits',
    lead: 'All optional. Skip anything you do not care about.',
    when: (a) => isAdv(a),
    fields: [
      { id: 'model', type: 'chips', label: 'Which model should it run?', optional: true, options: ['Let Josh pick', 'Nous Portal', 'OpenRouter', 'Anthropic', 'OpenAI', 'My own endpoint'] },
      { id: 'extras', type: 'chips', label: 'Anything extra?', multiple: true, optional: true, options: ['Web app (Open WebUI)', 'Voice notes', 'API access', 'SSH access for me', 'Git repo for its skills', 'MCP servers', 'Browser tools', 'Local files sync'] },
      { id: 'integrations', type: 'textarea', label: 'Accounts, APIs or MCP servers it should use', optional: true, help: 'Names only, never paste passwords or keys.' },
      { id: 'jobs', type: 'textarea', label: 'Scheduled jobs you want', optional: true, help: 'What they do and when they run.' },
      { id: 'access', type: 'chips', label: 'When should it ask you first?', optional: true, options: ['Ask me before anything outward', 'Ask only for money and posts', "I'll set it myself later"] },
    ],
  },
  {
    id: 'talk',
    title: 'How do you want to talk to it?',
    lead: 'This is the app you will message it in.',
    fields: [
      { id: 'app', type: 'cards', label: 'Pick one', source: 'apps' },
      { id: 'users', type: 'chips', label: 'Who else will use it?', options: ['Just me', 'Me plus 1', '2 to 5', 'More'] },
      { id: 'tone', type: 'cards', label: 'How should it talk?', options: [
        { value: 'warm', title: 'Warm and friendly', icon: '😊' },
        { value: 'sharp', title: 'Short and sharp', icon: '🔪' },
        { value: 'cheeky', title: 'Fun and cheeky', icon: '😄' },
        { value: 'calm', title: 'Calm and formal', icon: '🧊' },
      ] },
    ],
  },
  {
    id: 'limits',
    title: 'Anything it must never do?',
    lead: 'It always asks you before it sends, posts or pays anything.',
    fields: [
      { id: 'never', type: 'textarea', label: 'Anything it must never do?', optional: true, help: 'One per line works well.' },
    ],
  },
  {
    id: 'check',
    title: 'Look right?',
    lead: 'Check it over. Change anything, then send.',
    fields: [],
  },
];

// Round 2: every step gets the one collapsed "Add more detail" field.
export const STEPS = BASE_STEPS.map(s => ({ ...s, fields: [...s.fields, moreField(s.id)] }));

const TONES = {
  warm: 'Warm and friendly',
  sharp: 'Short and sharp',
  cheeky: 'Fun and cheeky',
  calm: 'Calm and formal',
};

// Whether a skill fits the groups picked now. Removed branches take their
// skills out of the running, answers kept or not.
function fitsGroups(s, a) {
  const gs = Array.isArray(a && a.groups) ? a.groups : [];
  return s.groups.some(g => gs.includes(g));
}

// Skills that apply to the picked groups, popular first, keeping catalogue order
// within each tier.
export function skillChoices(a) {
  const pool = SKILLS.filter(s => fitsGroups(s, a));
  return [...pool.filter(s => s.popular), ...pool.filter(s => !s.popular)];
}

// Build the tune step's ask fields from the picked skills' ask lists.
// Only skills that still fit the groups picked now contribute fields.
function tuneFields(a) {
  const picked = Array.isArray(a.skills) ? a.skills : [];
  const fields = [];
  for (const s of SKILLS) {
    if (!picked.includes(s.id) || !fitsGroups(s, a)) continue;
    for (const q of s.ask || []) {
      fields.push({
        id: `skill.${s.id}.${q.id}`,
        type: q.type,
        label: `${s.icon} ${s.title}: ${q.label}`,
        multiple: !!q.multiple,
        optional: !!q.optional,
        options: q.options,
        _skill: s.id,
        _ask: q.id,
      });
    }
  }
  return fields;
}

export function visibleSteps(a) {
  const answers = a || {};
  return STEPS
    .filter(s => !s.when || s.when(answers))
    .map(s => (s.id === 'tune'
      ? { ...s, fields: [...tuneFields(answers), moreField('tune')] }
      : s));
}

// Values a choice field may hold right now: catalogue ids for source fields
// (for skills, only the ones that fit the groups picked now), the field's own
// options otherwise. Null when the field has no fixed list.
export function fieldValues(f, a) {
  const answers = a || {};
  if (f.source === 'skills') return skillChoices(answers).map(s => s.id);
  if (f.source === 'groups') return GROUPS.map(g => g.id);
  if (f.source === 'tools') return TOOLS.map(t => t.id);
  if (f.source === 'apps') return APPS.map(x => x.id);
  if (Array.isArray(f.options)) return f.options.map(o => (typeof o === 'string' ? o : o.value));
  return null;
}

export function validate(step, a) {
  const errors = {};
  const answers = a || {};
  for (const f of step.fields) {
    if (f.when && !f.when(answers)) continue;
    if (f.optional) continue;
    let v = answers[f.id];
    if (Array.isArray(v)) v = v.map(x => (typeof x === 'string' ? x.trim() : x));
    else if (typeof v === 'string') v = v.trim(); // blank text is not filled in
    const empty = v === undefined || v === null || v === '' ||
      (Array.isArray(v) && v.length === 0);
    if (!empty && (f.type === 'cards' || f.type === 'chips')) {
      const valid = fieldValues(f, answers);
      if (valid) {
        // A saved choice that no longer exists is not a real answer.
        // Multiple fields stay valid while at least one pick still applies,
        // so a branch removed on the way back never strands the visitor.
        if (!f.multiple && Array.isArray(v)) { errors[f.id] = 'Pick one.'; continue; }
        const list = Array.isArray(v) ? v : [v];
        const good = list.filter(x => valid.includes(x));
        const okPick = f.multiple ? good.length > 0 : good.length === list.length;
        if (!okPick) errors[f.id] = f.multiple ? 'Pick at least one.' : 'Pick one.';
        continue;
      }
    }
    if (!empty && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
      errors[f.id] = 'That email does not look right.';
      continue;
    }
    if (empty) {
      if (f.type === 'cards' || f.type === 'chips') {
        errors[f.id] = f.multiple ? 'Pick at least one.' : 'Pick one.';
      } else {
        errors[f.id] = 'Please fill this in.';
      }
    }
  }
  return errors;
}

// Helpers Worker B can use for labels (harmless if unused).
export function groupTitle(id) {
  const g = GROUPS.find(x => x.id === id);
  return g ? g.title : id;
}
export function toneLabel(v) {
  return TONES[v] || v || '';
}
