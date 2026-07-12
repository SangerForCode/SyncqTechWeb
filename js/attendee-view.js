function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

const tabButtons = Array.from(document.querySelectorAll('[data-attendee-tab-btn]'));
const tabPanels = Array.from(document.querySelectorAll('[data-attendee-tab-panel]'));
const chatLog = document.getElementById('attendee-chat-log');
const chatForm = document.getElementById('attendee-chat-form');
const chatInput = document.getElementById('attendee-chat-input');
const chatSuggestions = Array.from(document.querySelectorAll('[data-chat-suggestion]'));
const networkFab = document.getElementById('network-fab');
const networkFloat = document.getElementById('network-float');
const networkFloatClose = document.getElementById('network-float-close');
const askedQuestions = new Set();
let faqEntries = [
  { question: 'What makes SyncQ different from traditional event platforms?', answer: 'Unlike traditional event platforms focused only on registrations or ticketing, SyncQ is built as a real-time digital operating system for live events.' },
  { question: 'Do attendees need to install an app?', answer: 'No. SyncQ is completely no-install. Attendees simply scan a QR code or open a link to access the event instantly in their browser.' },
  { question: 'Can schedules update in real time?', answer: 'Yes. Organizers can update schedules live during the event.' },
  { question: 'Can maps show live crowd density and capacity?', answer: 'Yes. SyncQ supports live crowd-density and venue-capacity insights.' },
  { question: 'Can announcements target specific attendee groups?', answer: 'Yes. Organizers can target announcements to specific attendee cohorts such as VIPs, volunteers, or workshop attendees.' },
  { question: 'What types of events can use SyncQ Events?', answer: 'SyncQ Events is designed for college fests, conferences, hackathons, corporate events, weddings, cultural festivals, exhibitions, and any large-scale event requiring schedules, announcements, maps, and real-time coordination.' },
  { question: 'When does the keynote start?', answer: 'The keynote begins at 2:15 PM on the Main Stage.' },
  { question: 'Where is Workshop Hall A?', answer: 'Workshop Hall A is located in the north workshop zone. Follow the map directions from your current location.' }
];
let faqLoaded = false;
let networkTimer = null;

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(text) {
  return normalize(text).split(' ').filter((word) => word.length > 2);
}

function loadFaqEntries() {
  if (faqLoaded) return;
  faqLoaded = true;
  fetch('FAQ.json')
    .then((response) => {
      if (!response.ok) throw new Error('Failed to load FAQ.json');
      return response.json();
    })
    .then((data) => {
      const sections = Array.isArray(data?.faqSections) ? data.faqSections : [];
      const entries = [];
      sections.forEach((section) => {
        (section.questions || []).forEach((question) => {
          if (question?.question && question?.answer) entries.push({ question: question.question, answer: question.answer });
        });
      });
      if (entries.length) faqEntries = entries;
    })
    .catch(() => {});
}

function findBestFaqMatch(question) {
  const query = normalize(question);
  if (!query) return null;
  const queryTokens = tokens(question);
  let bestMatch = null;
  let bestScore = 0;

  faqEntries.forEach((entry) => {
    const entryQuestion = normalize(entry.question);
    const entryText = normalize(`${entry.question} ${entry.answer}`);
    let score = 0;
    if (entryText.includes(query) || query.includes(entryQuestion)) score += 4;
    const overlap = queryTokens.filter((token) => entryText.includes(token)).length;
    score += overlap / Math.max(queryTokens.length, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  });

  return bestScore >= 1 ? bestMatch : null;
}

function addChatBubble(role, text) {
  if (!chatLog) return;
  const row = document.createElement('div');
  row.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
  const bubble = document.createElement('div');
  bubble.className = role === 'user'
    ? 'max-w-[85%] rounded-2xl rounded-br-md bg-bark px-3 py-2 text-[10px] leading-relaxed text-ivory'
    : 'max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[10px] leading-relaxed text-bark border border-bark/8';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatLog.appendChild(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function askQuestion(question) {
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion) return;
  if (askedQuestions.has(normalizedQuestion)) {
    addChatBubble('assistant', 'You already asked that one. Try a different event question and I will answer from event knowledge.');
    return;
  }
  askedQuestions.add(normalizedQuestion);
  addChatBubble('user', question.trim());
  const match = findBestFaqMatch(question);
  if (match) {
    addChatBubble('assistant', match.answer);
  } else {
    addChatBubble('assistant', "I couldn't find that information. I've sent your question to the event organizers.");
  }
}

function setActiveTab(tab) {
  tabButtons.forEach((button) => {
    const active = button.getAttribute('data-tab') === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.getAttribute('data-attendee-tab-panel') !== tab);
  });
  if (tab === 'ai' && chatInput) {
    setTimeout(() => chatInput.focus({ preventScroll: true }), 0);
  }
  refreshIcons();
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.getAttribute('data-tab') || 'map'));
});

if (chatForm && chatInput) {
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    askQuestion(chatInput.value);
    chatInput.value = '';
  });
}

chatSuggestions.forEach((button) => {
  button.addEventListener('click', () => {
    const question = button.getAttribute('data-chat-suggestion') || '';
    askQuestion(question);
    if (chatInput) chatInput.value = '';
  });
});

const liveNode = document.getElementById('attendee-network-live');
if (liveNode) {
  const statuses = [
    'Aarav Kapoor is now 10m away near Hall A.',
    'Meera Iyer just checked in at Main Stage.',
    '2 more attendees are nearby in Food Zone.'
  ];
  let statusIndex = 0;
  networkTimer = setInterval(() => {
    statusIndex = (statusIndex + 1) % statuses.length;
    liveNode.textContent = statuses[statusIndex];
  }, 2800);
}

if (networkFab && networkFloat) {
  networkFab.addEventListener('click', () => {
    networkFloat.classList.toggle('hidden');
    refreshIcons();
  });
}

if (networkFloatClose && networkFloat) {
  networkFloatClose.addEventListener('click', () => {
    networkFloat.classList.add('hidden');
  });
}

loadFaqEntries();
setActiveTab('map');
refreshIcons();
