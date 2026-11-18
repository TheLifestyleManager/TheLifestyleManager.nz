// catalogue.js - Worker C. The content: paths, skills, tools, chat apps.
// Content pulled from research/skills.md and research/use-cases.md.
// Anything that would spend money on its own is rebuilt here as "it finds and asks you".

export const GROUPS = [
  { id: 'personal', title: 'Personal and home', line: 'A hand with the everyday, for you and the household.', icon: '🏡' },
  { id: 'business', title: 'Run a business', line: 'Less admin, more time with customers and the work.', icon: '💼' },
  { id: 'newbiz', title: 'Start something new', line: 'A steady co-founder for the idea keeping you up at night.', icon: '🌱' },
  { id: 'projects', title: 'A project or passion', line: 'Keep a side project, creative work, or study moving.', icon: '🛠️' },
];

// About 20 common NZ tools plus an out. kind is just a label for styling.
export const TOOLS = [
  { id: 'gmail', title: 'Gmail', icon: '✉️', kind: 'email' },
  { id: 'outlook', title: 'Outlook', icon: '📧', kind: 'email' },
  { id: 'gcal', title: 'Google Calendar', icon: '📅', kind: 'calendar' },
  { id: 'icloud', title: 'iCloud', icon: '☁️', kind: 'calendar' },
  { id: 'xero', title: 'Xero', icon: '📒', kind: 'accounting' },
  { id: 'myob', title: 'MYOB', icon: '📕', kind: 'accounting' },
  { id: 'shopify', title: 'Shopify', icon: '🛍️', kind: 'sales' },
  { id: 'square', title: 'Square', icon: '💳', kind: 'sales' },
  { id: 'facebook', title: 'Facebook', icon: '👥', kind: 'social' },
  { id: 'instagram', title: 'Instagram', icon: '📸', kind: 'social' },
  { id: 'messenger', title: 'Messenger', icon: '💬', kind: 'social' },
  { id: 'whatsapp', title: 'WhatsApp', icon: '📱', kind: 'chat' },
  { id: 'notion', title: 'Notion', icon: '🗂️', kind: 'notes' },
  { id: 'trello', title: 'Trello', icon: '📋', kind: 'notes' },
  { id: 'gdrive', title: 'Google Drive', icon: '📁', kind: 'files' },
  { id: 'dropbox', title: 'Dropbox', icon: '🗄️', kind: 'files' },
  { id: 'sheets', title: 'Sheets or Excel', icon: '📊', kind: 'files' },
  { id: 'canva', title: 'Canva', icon: '🎨', kind: 'design' },
  { id: 'website', title: 'A website', icon: '🌐', kind: 'web' },
  { id: 'spotify', title: 'Spotify', icon: '🎧', kind: 'media' },
  { id: 'bank', title: 'Bank feed or CSV', icon: '🏦', kind: 'money' },
  { id: 'none', title: 'None of these', icon: '🚫', kind: 'none' },
];

export const SKILLS = [
  // ---- Starter pack and the daily habits ----
  {
    id: 'morning-brief', title: 'Morning brief',
    line: 'One message each morning with your day.',
    icon: '☀️', groups: ['personal', 'business'], tools: ['gcal', 'gmail', 'none'],
    outward: false, heavy: false, category: 'Daily', channel: 'morning-brief', popular: true,
    ask: [
      { id: 'time', label: 'What time?', type: 'chips', options: ['6am', '7am', '8am', '9am'] },
      { id: 'include', label: 'What should it include?', type: 'chips', multiple: true, options: ['Weather', 'Calendar', 'Key emails', 'News you pick'] },
      { id: 'notes', label: 'Anything else?', type: 'text', optional: true },
    ],
  },
  {
    id: 'inbox-triage', title: 'Inbox triage',
    line: 'Sorts your email and drafts the routine replies.',
    icon: '📥', groups: ['personal', 'business'], tools: ['gmail', 'outlook'],
    outward: false, heavy: false, category: 'Daily', channel: 'inbox-triage', popular: true,
    ask: [
      { id: 'accounts', label: 'Which accounts?', type: 'chips', multiple: true, options: ['Gmail', 'Outlook', 'Other'] },
      { id: 'urgent', label: 'What counts as urgent?', type: 'chips', multiple: true, options: ['People', 'Bills', 'Deadlines', "Builders and tradies"] },
      { id: 'send', label: 'May it ever send a reply?', type: 'chips', options: ['Never, drafts only', 'Only after I say yes', 'Routine ones, show me first'] },
    ],
  },
  {
    id: 'night-recap', title: 'Night recap',
    line: 'Each night it reviews the day and lines up tomorrow.',
    icon: '🌙', groups: ['personal', 'business'], tools: ['gmail', 'gcal'],
    outward: false, heavy: false, category: 'Daily', channel: 'night-recap', popular: false,
    ask: [
      { id: 'notes', label: 'Anything specific to review?', type: 'text', optional: true },
    ],
  },
  {
    id: 'phone-brief', title: 'Phone call briefing',
    line: 'It rings you and reads out your day.',
    icon: '📞', groups: ['personal'], tools: ['gcal', 'gmail'],
    outward: true, heavy: false, category: 'Daily', channel: 'phone-brief', popular: true,
    ask: [
      { id: 'time', label: 'What time should it ring?', type: 'chips', options: ['6:30am', '7am', '7:30am', '8am'] },
      { id: 'days', label: 'Which days?', type: 'chips', multiple: true, options: ['Every day', 'Weekdays', 'Weekends'] },
    ],
  },
  {
    id: 'habit-check', title: 'Habit check ins',
    line: 'A friendly daily nudge about your streaks.',
    icon: '🔁', groups: ['personal', 'projects'], tools: ['none'],
    outward: false, heavy: false, category: 'Daily', channel: 'habit-check', popular: false,
    ask: [
      { id: 'habits', label: 'Which habits?', type: 'chips', multiple: true, options: ['Exercise', 'Read more', 'Write it down', 'Less screen time'] },
      { id: 'time', label: 'Check in at what time?', type: 'chips', options: ['7am', '12pm', '6pm', '9pm'] },
      { id: 'style', label: 'What style of nudge?', type: 'chips', options: ['Cheerful', 'Tough love', 'Quiet'] },
    ],
  },
  {
    id: 'group-digest', title: 'Group chat cliff notes',
    line: 'Boils your busiest chats down to the lines that matter.',
    icon: '🗞️', groups: ['business', 'personal'], tools: ['whatsapp', 'messenger'],
    outward: false, heavy: false, category: 'Daily', channel: 'group-digest', popular: false,
    ask: [
      { id: 'which', label: 'Which chats?', type: 'chips', multiple: true, options: ['Work', 'Trades', 'Community', 'Family'] },
      { id: 'often', label: 'How often?', type: 'chips', options: ['Twice a day', 'Daily', 'Weekly'] },
    ],
  },
  {
    id: 'keep-in-touch', title: 'Never lose touch',
    line: 'Tracks who you last spoke to and nudges you to follow up.',
    icon: '🤝', groups: ['personal', 'business'], tools: ['gmail', 'outlook'],
    outward: false, heavy: false, category: 'Daily', channel: 'keep-in-touch', popular: true,
    ask: [
      { id: 'how-often', label: 'How often should it prompt you?', type: 'chips', options: ['Weekly', 'Monthly', 'Only for big things'] },
    ],
  },
  {
    id: 'founder-boss', title: 'Your daily boss',
    line: 'Three tasks each morning and it keeps the big picture straight.',
    icon: '🎯', groups: ['newbiz', 'business'], tools: ['notion', 'trello'],
    outward: false, heavy: false, category: 'Daily', channel: 'founder-boss', popular: false,
    ask: [
      { id: 'goal', label: 'The one goal this quarter?', type: 'text', optional: true },
      { id: 'nudge', label: 'How direct should it be?', type: 'chips', options: ['Gentle', 'Direct', 'Blunt'] },
    ],
  },
  {
    id: 'voice-notes', title: 'Voice notes to text',
    line: 'Send a voice note, get back a tidy written version.',
    icon: '🎙️', groups: ['personal', 'business'], tools: ['none'],
    outward: false, heavy: false, category: 'Daily', channel: 'voice-notes', popular: true,
    ask: [],
  },
  // ---- Learning and remembering ----
  {
    id: 'learns-from-mistakes', title: 'Learns from mistakes',
    line: 'It writes down its slip ups and gets better over time.',
    icon: '🧠', groups: ['personal', 'business'], tools: ['none'],
    outward: false, heavy: false, category: 'Learning', channel: 'learns-from-mistakes', popular: true,
    ask: [],
  },
  {
    id: 'second-brain', title: 'Your memory book',
    line: 'Text it anything worth keeping and it files it for later.',
    icon: '🧺', groups: ['personal', 'projects'], tools: ['notion', 'gdrive'],
    outward: false, heavy: false, category: 'Learning', channel: 'memory-book', popular: true,
    ask: [
      { id: 'recall', label: 'How should it bring things back?', type: 'chips', options: ['Search when asked', 'Surface them weekly', 'Both'] },
    ],
  },
  {
    id: 'research-digest', title: 'Research digest',
    line: 'Watches your sources and sends one short digest each day.',
    icon: '🔎', groups: ['projects', 'personal', 'business'], tools: ['website'],
    outward: false, heavy: false, category: 'Learning', channel: 'research-digest', popular: false,
    ask: [
      { id: 'sources', label: 'Which sources should it watch?', type: 'text', optional: true },
      { id: 'length', label: 'How long should the digest be?', type: 'chips', options: ['Five bullets', 'One page', 'Two pages'] },
    ],
  },
  {
    id: 'study-helper', title: 'Study helper',
    line: 'Reads papers and books with you and files your notes.',
    icon: '📚', groups: ['projects', 'personal'], tools: ['gdrive', 'sheets'],
    outward: false, heavy: false, category: 'Learning', channel: 'study-helper', popular: false,
    ask: [
      { id: 'field', label: 'What are you studying?', type: 'text', optional: true },
    ],
  },
  // ---- Home and life admin ----
  {
    id: 'family-calendar', title: 'Family calendar',
    line: 'All household calendars in one view, with conflicts spotted early.',
    icon: '🏠', groups: ['personal'], tools: ['gcal', 'icloud', 'whatsapp'],
    outward: true, heavy: false, category: 'Home', channel: 'family-calendar', popular: true,
    ask: [
      { id: 'which', label: 'Which calendars?', type: 'chips', multiple: true, options: ['School', 'Work', 'Sport', 'Social'] },
      { id: 'time', label: 'Morning announcement at what time?', type: 'chips', options: ['6:30am', '7am', '8am'] },
    ],
  },
  {
    id: 'schedule-help', title: 'Scheduling concierge',
    line: 'Books and moves appointments and answers invites, always with your nod.',
    icon: '📅', groups: ['personal'], tools: ['gcal', 'outlook', 'gmail'],
    outward: true, heavy: false, category: 'Home', channel: 'schedule-help', popular: false,
    ask: [
      { id: 'rules', label: 'Any booking rules?', type: 'chips', multiple: true, options: ['No sport conflicts', 'Deep work mornings', 'Fridays are light'] },
      { id: 'auto', label: 'Should it answer invites for you?', type: 'chips', options: ['Always ask me', 'Accept routine ones', 'Decline the bad ones, ask about the rest'] },
    ],
  },
  {
    id: 'meal-planner', title: 'Weekly meal planner',
    line: 'Plans meals and builds the shopping list from your chats.',
    icon: '🥗', groups: ['personal'], tools: ['whatsapp', 'gdrive'],
    outward: false, heavy: false, category: 'Home', channel: 'meal-planner', popular: false,
    ask: [
      { id: 'heads', label: 'How many mouths?', type: 'chips', options: ['1', '2', '3', '4 or more'] },
      { id: 'rules', label: 'Any dietary rules?', type: 'text', optional: true },
    ],
  },
  {
    id: 'budget-helper', title: 'Family budget helper',
    line: 'Sorts spending and tells you what is left in each pot.',
    icon: '💸', groups: ['personal'], tools: ['bank', 'whatsapp', 'sheets'],
    outward: true, heavy: false, category: 'Money', channel: 'budget-helper', popular: true,
    ask: [
      { id: 'cycle', label: 'When does the budget month start?', type: 'chips', options: ['The 1st', 'My billing date', 'The 15th'] },
      { id: 'alerts', label: 'When should it alert?', type: 'chips', multiple: true, options: ['Over budget', 'Big charge', 'Weekly summary'] },
      { id: 'who', label: 'Who may ask it about money?', type: 'chips', multiple: true, options: ['Just me', 'Partner', 'The whole household'] },
    ],
  },
  {
    id: 'travel-watch', title: 'Travel price watcher',
    line: 'Watches flight prices and tells you when they drop.',
    icon: '✈️', groups: ['personal'], tools: ['gmail', 'website'],
    outward: false, heavy: false, category: 'Home', channel: 'travel-watch', popular: false,
    ask: [
      { id: 'routes', label: 'Which routes or dates?', type: 'text', optional: true },
      { id: 'alerts', label: 'Alert me on?', type: 'chips', multiple: true, options: ['Price drop', 'Cheap seats', 'A new route'] },
    ],
  },
  {
    id: 'parcel-track', title: 'Parcel tracking',
    line: 'Reads shipping emails and tells you what arrives when.',
    icon: '📦', groups: ['personal'], tools: ['gmail'],
    outward: false, heavy: false, category: 'Home', channel: 'parcel-track', popular: false,
    ask: [],
  },
  {
    id: 'seat-hunter', title: 'Seat finder',
    line: 'Keeps checking sold out shows and asks you before it books.',
    icon: '🎟️', groups: ['personal'], tools: ['website'],
    outward: false, heavy: false, category: 'Home', channel: 'seat-hunter', popular: true,
    ask: [
      { id: 'notes', label: 'What should it watch for?', type: 'text', optional: true },
    ],
  },
  {
    id: 'guest-calls', title: 'Guest confirmation calls',
    line: 'Calls your guest list one by one and writes you a summary.',
    icon: '✅', groups: ['personal', 'business'], tools: ['none'],
    outward: true, heavy: false, category: 'Home', channel: 'guest-calls', popular: false,
    ask: [
      { id: 'when', label: 'When should it call?', type: 'chips', options: ['A week out', 'Three days out', 'The day before'] },
    ],
  },
  {
    id: 'family-docs', title: 'Family document filing',
    line: 'Send a photo of a document and it files it away.',
    icon: '🗂️', groups: ['personal', 'business'], tools: ['gdrive', 'dropbox'],
    outward: false, heavy: true, category: 'Home', channel: 'family-files', popular: false,
    ask: [
      { id: 'what', label: 'What kind of documents?', type: 'chips', multiple: true, options: ['Insurance', 'IDs', 'Certificates', 'Receipts'] },
    ],
  },
  {
    id: 'kid-profile', title: 'Kids get their own',
    line: 'Your kids get their own helper with its own rules.',
    icon: '🧒', groups: ['personal'], tools: ['gcal'],
    outward: false, heavy: false, category: 'Home', channel: 'kids-profile', popular: false,
    ask: [
      { id: 'ages', label: 'Ages?', type: 'chips', multiple: true, options: ['Under 8', '8 to 12', 'Teens'] },
    ],
  },
  // ---- Business admin ----
  {
    id: 'trades-desk', title: 'Admin from the truck',
    line: 'Quotes, invoices, and job records done from the cab.',
    icon: '🔧', groups: ['business'], tools: ['xero', 'myob', 'gmail'],
    outward: true, heavy: false, category: 'Business', channel: 'truck-admin', popular: true,
    ask: [
      { id: 'docs', label: 'Which documents?', type: 'chips', multiple: true, options: ['Quotes', 'Invoices', 'Job sheets'] },
      { id: 'acct', label: 'Accounting package?', type: 'chips', options: ['Xero', 'MYOB', 'Sheets', 'None yet'] },
      { id: 'who', label: 'Who approves a send?', type: 'text', optional: true },
    ],
  },
  {
    id: 'quote-maker', title: 'Quotes in ninety seconds',
    line: 'Say one line and a branded quote is ready to send.',
    icon: '⚡', groups: ['business'], tools: ['canva', 'gmail'],
    outward: true, heavy: false, category: 'Customers', channel: 'fast-quotes', popular: true,
    ask: [
      { id: 'notes', label: 'Anything else to include?', type: 'text', optional: true },
    ],
  },
  {
    id: 'invoice-drafter', title: 'Invoice drafter',
    line: 'Drafts invoices from finished work, you always press send.',
    icon: '🧾', groups: ['business', 'newbiz'], tools: ['xero', 'myob', 'gmail', 'sheets'],
    outward: false, heavy: false, category: 'Money', channel: 'invoice-drafts', popular: true,
    ask: [
      { id: 'from', label: 'Drafts from what?', type: 'chips', multiple: true, options: ['Timesheets', 'Job lists', 'Your notes'] },
    ],
  },
  {
    id: 'bookkeeping', title: 'Bookkeeping helper',
    line: 'Matches payments to invoices and flags what does not fit.',
    icon: '🧮', groups: ['business'], tools: ['xero', 'myob', 'bank', 'sheets'],
    outward: false, heavy: false, category: 'Money', channel: 'bookkeeping-help', popular: false,
    ask: [
      { id: 'truth', label: 'Which is the source of truth?', type: 'chips', options: ['Xero', 'MYOB', 'My sheet', 'The bank'] },
      { id: 'mismatch', label: 'When things mismatch, should it?', type: 'chips', options: ['Just flag it', 'Fix the small ones', 'Fix and log it'] },
    ],
  },
  {
    id: 'ops-brief', title: 'Daily business brief',
    line: "Yesterday's numbers, today's jobs, and anything needing you.",
    icon: '📊', groups: ['business', 'newbiz'], tools: ['square', 'xero', 'gmail', 'sheets'],
    outward: false, heavy: false, category: 'Business', channel: 'daily-ops-brief', popular: false,
    ask: [
      { id: 'numbers', label: 'Which numbers matter most?', type: 'chips', multiple: true, options: ['Sales', 'Cash', 'Jobs booked', 'Open quotes'] },
      { id: 'time', label: 'What time each morning?', type: 'chips', options: ['6am', '7am', '8am'] },
    ],
  },
  {
    id: 'office-docs', title: 'Office file editing',
    line: 'Edits Word, Excel, and PDF files when you ask.',
    icon: '📄', groups: ['personal', 'business', 'projects'], tools: ['sheets', 'gdrive', 'canva', 'website'],
    outward: false, heavy: false, category: 'Business', channel: 'office-files', popular: true,
    ask: [],
  },
  {
    id: 'idea-validator', title: 'Test your idea first',
    line: 'Checks the market before you spend time or money building.',
    icon: '🧪', groups: ['newbiz'], tools: ['website'],
    outward: false, heavy: false, category: 'Business', channel: 'idea-check', popular: false,
    ask: [
      { id: 'who', label: 'Who could buy it?', type: 'text', optional: true },
      { id: 'time', label: 'Hours a week can you give it?', type: 'chips', options: ['5', '10', '20', 'Full time'] },
    ],
  },
  {
    id: 'meeting-prep', title: 'Meeting prep briefs',
    line: 'Get the brief before a big meeting or a cold call.',
    icon: '🗒️', groups: ['business'], tools: ['website', 'gcal'],
    outward: false, heavy: false, category: 'Business', channel: 'meeting-prep', popular: false,
    ask: [
      { id: 'notes', label: 'Anything else to dig up?', type: 'text', optional: true },
    ],
  },
  // ---- Customers ----
  {
    id: 'lead-desk', title: 'Lead desk',
    line: 'Watches your message inboxes and lines each lead up for you.',
    icon: '📨', groups: ['business', 'newbiz'], tools: ['messenger', 'facebook', 'whatsapp'],
    outward: true, heavy: false, category: 'Customers', channel: 'lead-desk', popular: true,
    ask: [
      { id: 'inboxes', label: 'Where do leads land?', type: 'chips', multiple: true, options: ['Messenger', 'Email', 'Texts', 'The shop phone'] },
      { id: 'fast', label: 'How fast should it flag them?', type: 'chips', options: ['Within 15 min', 'Hourly', 'Twice a day'] },
      { id: 'more', label: 'Anything else it should watch?', type: 'text', optional: true },
    ],
  },
  {
    id: 'helpdesk', title: 'Customer answers',
    line: 'Answers common questions and brings the tricky ones to you.',
    icon: '🆘', groups: ['business', 'newbiz'], tools: ['messenger', 'facebook', 'whatsapp', 'gmail'],
    outward: true, heavy: false, category: 'Customers', channel: 'customer-answers', popular: false,
    ask: [
      { id: 'topics', label: 'The top questions?', type: 'text', optional: true },
      { id: 'never', label: 'What may it never promise?', type: 'text', optional: true },
    ],
  },
  {
    id: 'outreach-queue', title: 'Outreach queue',
    line: 'Researches prospects and drafts each message. You approve every send.',
    icon: '📣', groups: ['newbiz', 'business'], tools: ['gmail', 'sheets'],
    outward: true, heavy: false, category: 'Customers', channel: 'outreach-queue', popular: false,
    ask: [
      { id: 'who', label: 'Who is your ideal customer?', type: 'text', optional: true },
      { id: 'cap', label: 'Daily cap on drafts?', type: 'chips', options: ['5', '10', '20'] },
    ],
  },
  // ---- Content ----
  {
    id: 'launch-kit', title: 'Launch content kit',
    line: 'One post becomes a thread, a caption, and a newsletter item.',
    icon: '🚀', groups: ['newbiz', 'business'], tools: ['instagram', 'facebook', 'website'],
    outward: true, heavy: false, category: 'Content', channel: 'launch-kit', popular: false,
    ask: [
      { id: 'voice', label: 'Anything to never claim?', type: 'text', optional: true },
      { id: 'cadence', label: 'Posting pace?', type: 'chips', options: ['Daily', '3 a week', 'Weekly'] },
    ],
  },
  {
    id: 'content-pipeline', title: 'Content pipeline',
    line: 'Research, drafts, and keeps your content calendar moving.',
    icon: '🏭', groups: ['projects', 'business'], tools: ['canva', 'website', 'gdrive'],
    outward: true, heavy: false, category: 'Content', channel: 'content-pipeline', popular: false,
    ask: [
      { id: 'standards', label: 'Any editorial rules?', type: 'text', optional: true },
      { id: 'cadence', label: 'How often should it draft?', type: 'chips', options: ['Daily', 'Weekly', 'Fortnightly'] },
    ],
  },
  {
    id: 'video-edits', title: 'Video edits by chat',
    line: 'Trims and edits videos by chat, no timeline needed.',
    icon: '🎬', groups: ['personal', 'business'], tools: ['gdrive', 'dropbox'],
    outward: false, heavy: true, category: 'Content', channel: 'video-edits', popular: false,
    ask: [
      { id: 'kind', label: 'What kind of video?', type: 'chips', multiple: true, options: ['Reels', 'Podcast clips', 'How tos'] },
    ],
  },
  // ---- Projects ----
  {
    id: 'overnight-builder', title: 'Wakes up built',
    line: 'Sleep on a wish list, wake to it half built.',
    icon: '🌃', groups: ['projects', 'personal', 'newbiz'], tools: ['website', 'gdrive'],
    outward: false, heavy: false, category: 'Projects', channel: 'overnight-build', popular: true,
    ask: [
      { id: 'what', label: 'First thing to try?', type: 'text', optional: true },
    ],
  },
  {
    id: 'code-partner', title: 'Code project partner',
    line: 'Files tasks, writes code, and keeps the docs current for you.',
    icon: '🐙', groups: ['projects', 'business'], tools: ['website'],
    outward: false, heavy: false, category: 'Projects', channel: 'code-partner', popular: false,
    ask: [
      { id: 'review', label: 'May anything merge without you?', type: 'chips', options: ['Never', 'Docs only', 'Small fixes'] },
    ],
  },
  {
    id: 'resume-maker', title: 'Tailored resume maker',
    line: 'Reshapes your resume to fit each job ad, honestly.',
    icon: '🪪', groups: ['personal', 'projects'], tools: ['sheets', 'gdrive'],
    outward: false, heavy: false, category: 'Projects', channel: 'resume-maker', popular: false,
    ask: [],
  },
];

export const APPS = [
  { id: 'telegram', title: 'Telegram', line: 'Easy and free, about five minutes.', icon: '📲' },
  { id: 'discord', title: 'Discord', line: 'Great for groups and channels.', icon: '💜' },
  { id: 'whatsapp', title: 'WhatsApp', line: 'The app you already use.', icon: '💬' },
  { id: 'signal', title: 'Signal', line: 'Most private, a bit harder to set up.', icon: '🔒' },
  { id: 'web', title: 'A private web app', line: 'Coming soon.', icon: '🖥️', soon: true },
  { id: 'unsure', title: 'Not sure, help me pick', line: 'Answer a few things and we choose for you.', icon: '🤔' },
];
