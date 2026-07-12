const refreshIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
};

refreshIcons();

let lastScroll = 0;
let isMobileMenuOpen = false;
let faqIndexState = 'icon';
let faqIndexTimer = null;

window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  const navShell = document.getElementById('navbar-shell');
  const currentScroll = window.scrollY;

  if (isMobileMenuOpen) {
    nav.style.top = '16px';
    return;
  }

  if (currentScroll > 24) {
    navShell.classList.add('scrolled');
  } else {
    navShell.classList.remove('scrolled');
  }

  if (currentScroll > 100) {
    nav.style.top = currentScroll > lastScroll ? '-110px' : '16px';
  } else {
    nav.style.top = '16px';
  }

  lastScroll = currentScroll;
}, { passive: true });

const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

const setMobileMenuState = (isOpen) => {
  isMobileMenuOpen = isOpen;
  mobileMenu.classList.toggle('hidden', !isOpen);
  document.body.classList.toggle('overflow-hidden', isOpen);
  mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  mobileMenuBtn.innerHTML = isOpen
    ? '<i data-lucide="x" class="w-5 h-5"></i>'
    : '<i data-lucide="menu" class="w-5 h-5"></i>';
  document.getElementById('navbar').style.top = '16px';
  refreshIcons();
};

mobileMenuBtn.addEventListener('click', () => {
  setMobileMenuState(!isMobileMenuOpen);
});

document.querySelectorAll('#mobile-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    setMobileMenuState(false);
  });
});

const faqIndexShell = document.getElementById('faq-index-shell');
const faqIndexToggle = document.getElementById('faq-index-toggle');
const syncFaqIndexState = () => {
  const isDesktop = window.innerWidth >= 1024;
  faqIndexShell.dataset.state = isDesktop ? 'desktop' : faqIndexState;
  faqIndexToggle.setAttribute('aria-expanded', isDesktop ? 'true' : String(faqIndexState === 'open'));
  const chevron = faqIndexToggle.querySelector('[data-lucide="chevron-up"], [data-lucide="chevron-down"]');
  if (chevron) {
    chevron.style.transform = isDesktop || faqIndexState === 'open' ? 'rotate(0deg)' : 'rotate(180deg)';
  }
};

const clearFaqIndexTimer = () => {
  clearTimeout(faqIndexTimer);
  faqIndexTimer = null;
};

const scheduleFaqIndexTeaser = () => {
  clearFaqIndexTimer();
  if (window.innerWidth >= 1024) {
    return;
  }
  faqIndexState = 'teaser';
  syncFaqIndexState();
  faqIndexTimer = window.setTimeout(() => {
    faqIndexState = 'icon';
    syncFaqIndexState();
  }, 4000);
};

faqIndexToggle.addEventListener('click', () => {
  if (window.innerWidth >= 1024) {
    return;
  }
  clearFaqIndexTimer();
  faqIndexState = faqIndexState === 'open' ? 'icon' : 'open';
  syncFaqIndexState();
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    clearFaqIndexTimer();
    faqIndexState = 'icon';
  } else if (faqIndexState === 'desktop') {
    faqIndexState = 'icon';
    scheduleFaqIndexTeaser();
  }
  syncFaqIndexState();
});

document.addEventListener('click', (event) => {
  if (window.innerWidth >= 1024 || faqIndexState !== 'open') {
    return;
  }
  if (!faqIndexShell.contains(event.target)) {
    faqIndexState = 'icon';
    syncFaqIndexState();
  }
});

if (window.innerWidth < 1024) {
  scheduleFaqIndexTeaser();
} else {
  syncFaqIndexState();
}

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add('revealed'));
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

function sortSectionQuestions(section) {
  return [...(section.questions || [])].sort((a, b) => {
    const left = Number.isFinite(a.priority) ? a.priority : Number.MAX_SAFE_INTEGER;
    const right = Number.isFinite(b.priority) ? b.priority : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

function createQuestionMarkup(question, sectionIndex, questionIndex) {
  const item = document.createElement('article');
  item.className = 'faq-item rounded-[1.75rem] border border-bark/8 bg-white/60 shadow-lg shadow-bark/5 overflow-hidden';
  item.innerHTML = `
    <button class="w-full text-left px-6 py-5 md:px-7 md:py-6 flex items-start gap-4" type="button" aria-expanded="false">
      <div class="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center">
        <span class="text-[0.72rem] font-semibold tracking-[0.16em]">${String(questionIndex + 1).padStart(2, '0')}</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-lg md:text-xl font-medium text-bark leading-snug">${question.question}</p>
      </div>
      <i data-lucide="chevron-down" class="faq-chevron w-5 h-5 text-bark-lighter shrink-0 transition-transform duration-300"></i>
    </button>
    <div class="faq-answer">
      <div>
        <div class="px-6 pb-6 md:px-7 md:pb-7 pl-[5.5rem]">
          <div class="h-px bg-gradient-to-r from-gold/25 to-transparent mb-5"></div>
          <p class="text-sm md:text-base text-bark-lighter leading-relaxed">${question.answer}</p>
        </div>
      </div>
    </div>
  `;

  const button = item.querySelector('button');
  const shouldOpenByDefault = sectionIndex === 0 && questionIndex === 0;
  if (shouldOpenByDefault) {
    item.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
  }

  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    item.classList.toggle('open', !isOpen);
    button.setAttribute('aria-expanded', String(!isOpen));
  });

  return item;
}

function renderFAQ(data) {
  const sections = Array.isArray(data?.faqSections) ? data.faqSections : [];
  const navRoot = document.getElementById('faq-nav');
  const sectionsRoot = document.getElementById('faq-sections');
  const loading = document.getElementById('faq-loading');
  const error = document.getElementById('faq-error');

  loading.classList.add('hidden');
  error.classList.add('hidden');
  navRoot.innerHTML = '';
  sectionsRoot.innerHTML = '';

  if (!sections.length) {
    error.classList.remove('hidden');
    return;
  }

  const orderedSections = sections.map((section) => ({
    ...section,
    questions: sortSectionQuestions(section)
  }));

  orderedSections.forEach((section, sectionIndex) => {
    const navLink = document.createElement('a');
    navLink.href = `#${section.sectionId}`;
    navLink.className = 'block rounded-2xl border border-bark/8 bg-white/40 px-4 py-4 hover:bg-white/70 transition-colors';
    navLink.innerHTML = `
      <p class="text-sm font-medium text-bark">${section.sectionTitle}</p>
    `;
    navLink.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        faqIndexState = 'icon';
        syncFaqIndexState();
      }
    });
    navRoot.appendChild(navLink);

    const sectionNode = document.createElement('section');
    sectionNode.id = section.sectionId;
    sectionNode.className = 'scroll-mt-28';
    sectionNode.innerHTML = `
      <div class="mb-6">
        <h2 class="mt-3 font-serif text-3xl md:text-4xl font-light text-bark tracking-tight">${section.sectionTitle}</h2>
        <p class="mt-3 text-bark-lighter max-w-2xl font-light">${section.sectionSubtitle || ''}</p>
      </div>
    `;

    const questionsWrap = document.createElement('div');
    questionsWrap.className = 'space-y-4';

    section.questions.forEach((question, questionIndex) => {
      questionsWrap.appendChild(createQuestionMarkup(question, sectionIndex, questionIndex));
    });

    sectionNode.appendChild(questionsWrap);
    sectionsRoot.appendChild(sectionNode);
  });

  refreshIcons();
}

fetch('FAQ.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to load FAQ.json');
    }
    return response.json();
  })
  .then(renderFAQ)
  .catch((error) => {
    console.error(error);
    document.getElementById('faq-loading').classList.add('hidden');
    document.getElementById('faq-error').classList.remove('hidden');
  });

const faqSearchInput = document.getElementById('faq-search');
const faqSearchEmpty = document.getElementById('faq-search-empty');

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightQuestion = (item, query) => {
  const questionEl = item.querySelector('button p');
  if (!questionEl) return;
  if (questionEl.dataset.orig === undefined) questionEl.dataset.orig = questionEl.textContent;
  const orig = questionEl.dataset.orig;
  if (!query) {
    questionEl.textContent = orig;
    return;
  }
  const rx = new RegExp(escapeRegex(query), 'gi');
  questionEl.innerHTML = escapeHtml(orig).replace(rx, (m) => `<mark class="faq-hit">${m}</mark>`);
};

faqSearchInput.addEventListener('input', () => {
  const query = faqSearchInput.value.trim().toLowerCase();
  const sections = document.querySelectorAll('#faq-sections > section');
  let anyVisible = false;

  sections.forEach((section) => {
    let sectionHasMatch = false;
    section.querySelectorAll('.faq-item').forEach((item) => {
      const matches = !query || item.textContent.toLowerCase().includes(query);
      item.classList.toggle('hidden', !matches);
      highlightQuestion(item, matches ? query : '');
      if (matches) sectionHasMatch = true;
    });
    section.classList.toggle('hidden', !sectionHasMatch);
    const navLink = document.querySelector(`#faq-nav a[href="#${section.id}"]`);
    if (navLink) navLink.classList.toggle('hidden', !sectionHasMatch);
    if (sectionHasMatch) anyVisible = true;
  });

  faqSearchEmpty.classList.toggle('hidden', anyVisible || !query);
});

const faqProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  faqProgress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
}, { passive: true });
