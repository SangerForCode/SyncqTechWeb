// Shared site behavior: navbar, mobile menu, scroll reveal, progress bar, toasts.
(function () {
  if (window.lucide) window.lucide.createIcons();

  // Scroll progress bar
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }, { passive: true });
  }

  // Navbar hide-on-scroll
  const nav = document.getElementById('navbar');
  const navShell = document.getElementById('navbar-shell');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  let lastScroll = 0;
  let isMobileMenuOpen = false;

  if (nav && navShell) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (isMobileMenuOpen) {
        nav.style.top = '16px';
        return;
      }
      navShell.classList.toggle('scrolled', currentScroll > 24);
      nav.style.top = (currentScroll > 100 && currentScroll > lastScroll) ? '-110px' : '16px';
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // Mobile menu with Escape-to-close and focus handoff
  if (mobileMenu && mobileMenuBtn) {
    const setMobileMenuState = (isOpen) => {
      isMobileMenuOpen = isOpen;
      mobileMenu.classList.toggle('hidden', !isOpen);
      document.body.classList.toggle('overflow-hidden', isOpen);
      mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenuBtn.innerHTML = isOpen
        ? '<i data-lucide="x" class="w-5 h-5"></i>'
        : '<i data-lucide="menu" class="w-5 h-5"></i>';
      if (nav) nav.style.top = '16px';
      if (window.lucide) window.lucide.createIcons();
      if (isOpen) {
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        mobileMenuBtn.focus();
      }
    };
    mobileMenuBtn.addEventListener('click', () => setMobileMenuState(!isMobileMenuOpen));
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenuState(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setMobileMenuState(false);
    });
  }

  // Scroll reveal (also animates gold dividers)
  const revealElements = document.querySelectorAll('.reveal, .gold-divider');
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

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// Basic toast; pages with richer toast systems (careers) override this global.
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-enter flex items-center gap-3 bg-bark text-ivory text-sm px-5 py-3.5 rounded-xl shadow-xl shadow-bark/20 transition-transform duration-300 max-w-sm';
  toast.innerHTML = '<svg class="w-4 h-4 text-tea shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>' + message + '</span>';
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.classList.remove('toast-enter'); toast.classList.add('toast-show'); });
  });
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-enter');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Mouse-tracking spotlight glow on cards
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    });
  });
}
