// ── Early access form submission ──
const scriptURL = 'https://script.google.com/macros/s/AKfycbwybXoEFvzodbpr_FocEZKBeQ62YUG_KJze-jiZyaE_r4F_zTWwu1oO1lLHQmBYvIM/exec';
const form = document.querySelector('#early-access-form');
const btn = document.querySelector('#submit-btn');
const successState = document.querySelector('#waitlist-success');
const addAnotherEntryBtn = document.querySelector('#add-another-entry-btn');
const userTypeSelect = document.querySelector('#user-type');
const otherUserTypeWrapper = document.querySelector('#user-type-other-wrapper');
const otherUserTypeInput = document.querySelector('#user-type-other');
const defaultButtonHTML = btn.innerHTML;
const loadingButtonHTML = '<svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path></svg> Sending...';

const setSubmittingState = isSubmitting => {
  btn.disabled = isSubmitting;
  btn.innerHTML = isSubmitting ? loadingButtonHTML : defaultButtonHTML;
};

const toggleOtherUserType = () => {
  const isOther = userTypeSelect.value.toLowerCase() === 'other';
  otherUserTypeWrapper.classList.toggle('is-open', isOther);
  otherUserTypeInput.required = isOther;

  if (!isOther) {
    otherUserTypeInput.value = '';
  }
};

userTypeSelect.addEventListener('change', toggleOtherUserType);

form.addEventListener('submit', e => {
  e.preventDefault();
  successState.classList.add('hidden');
  document.querySelector('#add-another-entry-wrapper').classList.add('hidden');
  const selectedUserType = userTypeSelect.value;
  const customUserType = otherUserTypeInput.value.trim();
  const isOtherSelected = selectedUserType.toLowerCase() === 'other';

  if (isOtherSelected && !customUserType) {
    showToast('Please specify your role before submitting.');
    otherUserTypeInput.focus();
    return;
  }

  setSubmittingState(true);
  const payload = {
    fullName: document.querySelector('#full-name').value.trim(),
    phone: document.querySelector('#phone-number').value.trim(),
    email: document.querySelector('#email-address').value.trim(),
    userType: isOtherSelected ? customUserType : selectedUserType
  };
  fetch(scriptURL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(async response => {
    const responseText = await response.text();
    let responseData = {};

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      responseData = {};
    }

    if (!response.ok || responseData.result !== 'success') {
      throw new Error(responseText || 'Submission failed');
    }

    form.reset();
    toggleOtherUserType();
    successState.classList.remove('hidden');
    successState.innerHTML = '<div class="flex items-center justify-center gap-2 text-tea-dark"><svg class="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span class="text-sm font-medium">You are added to the early access queue. We will contact you shortly.</span></div>';
    document.querySelector('#add-another-entry-wrapper').classList.remove('hidden');
    setSubmittingState(false);
  })
  .catch(error => {
    console.error('Error!', error.message);
    showToast('Submission failed. Please try again or email info@syncqtech.com.');
    setSubmittingState(false);
  });
});

const addAnotherEntryWrapper = document.querySelector('#add-another-entry-wrapper');
addAnotherEntryBtn.addEventListener('click', () => {
  successState.classList.add('hidden');
  addAnotherEntryWrapper.classList.add('hidden');
  form.classList.remove('hidden');
  form.reset();
  toggleOtherUserType();
});




// ── View Toggle ──
const organizerView = document.getElementById('view-organizer');
const attendeeView = document.getElementById('view-attendee');
const organizerToggleBtn = document.getElementById('toggle-organizer');
const attendeeToggleBtn = document.getElementById('toggle-attendee');

function setToggleButtonState(activeBtn, inactiveBtn) {
  activeBtn.classList.add('bg-bark', 'text-ivory', 'active');
  activeBtn.classList.remove('text-bark-lighter', 'inactive');
  inactiveBtn.classList.remove('bg-bark', 'text-ivory', 'active');
  inactiveBtn.classList.add('text-bark-lighter', 'inactive');
}

function switchView(view) {
  if (view === 'organizer') {
    organizerView.classList.remove('hidden');
    attendeeView.classList.add('hidden');
    setToggleButtonState(organizerToggleBtn, attendeeToggleBtn);
  } else {
    organizerView.classList.add('hidden');
    attendeeView.classList.remove('hidden');
    setToggleButtonState(attendeeToggleBtn, organizerToggleBtn);
  }
  lucide.createIcons();
}




// ── Interactive layer ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// Hero phone 3D tilt
const heroZone = document.getElementById('hero-phone-zone');
const heroPhone = document.getElementById('hero-phone');
if (heroZone && heroPhone && !prefersReducedMotion) {
  heroPhone.style.transition = 'transform 0.15s ease-out';
  heroZone.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = heroPhone.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    heroPhone.style.transform = `rotateY(${(dx * 8).toFixed(2)}deg) rotateX(${(dy * -8).toFixed(2)}deg)`;
  });
  heroZone.addEventListener('pointerleave', () => {
    heroPhone.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    heroPhone.style.transform = 'rotateY(0deg) rotateX(0deg)';
    setTimeout(() => { heroPhone.style.transition = 'transform 0.15s ease-out'; }, 600);
  });
}

// Hero phone live notifications
const phoneNotif = document.getElementById('phone-notif');
if (phoneNotif) {
  const notifTitle = document.getElementById('phone-notif-title');
  const notifBody = document.getElementById('phone-notif-body');
  const notifs = [
    ['Pizza has arrived!', 'South Lawn — first 300 people'],
    ['Keynote moved to 2:15 PM', 'Main Stage — seating opens early'],
    ['Workshop Hall A is filling up', '12 seats left — head over now'],
    ['New photos in the gallery', '48 photos added by attendees']
  ];
  let notifIndex = 0;
  const cycleNotif = () => {
    const [title, body] = notifs[notifIndex % notifs.length];
    notifIndex++;
    notifTitle.textContent = title;
    notifBody.textContent = body;
    phoneNotif.classList.add('show');
    setTimeout(() => phoneNotif.classList.remove('show'), 3200);
  };
  setTimeout(cycleNotif, 1800);
  setInterval(cycleNotif, 6500);
}

// Animated stat counters
const counterEls = document.querySelectorAll('[data-count]');
if (counterEls.length && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString('en-US') + suffix;
        return;
      }
      const start = performance.now();
      const dur = 1400;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counterEls.forEach((el) => counterObserver.observe(el));
}

// Chart bars grow on scroll
const chart = document.getElementById('checkin-chart');
if (chart && 'IntersectionObserver' in window && !prefersReducedMotion) {
  Array.from(chart.children).forEach((bar, i) => {
    bar.classList.add('chart-bar');
    bar.style.transitionDelay = (i * 55) + 'ms';
  });
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        chart.classList.add('chart-live');
        chartObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });
  chartObserver.observe(chart);
}

// White-label live customizer
const wlPhone = document.getElementById('wl-phone');
if (wlPhone) {
  const wlNameInput = document.getElementById('wl-name');
  const wlPhoneName = document.getElementById('wl-phone-name');
  const wlLogo = document.getElementById('wl-logo');
  wlNameInput.addEventListener('input', () => {
    const value = wlNameInput.value.trim() || 'Your Event';
    wlPhoneName.textContent = value;
    wlLogo.textContent = value.charAt(0).toUpperCase();
  });
  const swatches = document.querySelectorAll('#wl-swatches .wl-swatch');
  swatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      wlPhone.style.setProperty('--wl', btn.dataset.brand);
      swatches.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });
  const radiusBtns = document.querySelectorAll('.wl-radius-btn');
  radiusBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      wlPhone.style.setProperty('--wl-r', btn.dataset.radius);
      radiusBtns.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });
}

// Live announcements feed
const annFeed = document.getElementById('announcement-feed');
if (annFeed) {
  const annPool = [
    { tone: 'terra', tag: 'Food Update', msg: 'Coffee counter restocked at Refreshment Cafe', sub: 'Espresso and filter both available.' },
    { tone: 'gold', tag: 'Schedule Change', msg: 'Panel Q&A extended by 15 minutes', sub: 'Hall A — audience questions still open.' },
    { tone: 'tea', tag: 'Venue Info', msg: 'Charging stations added near West Gate', sub: '20 fast-charge points, first come first serve.' },
    { tone: 'gold', tag: 'Crowd Alert', msg: 'Main Stage at 95% capacity', sub: 'Overflow seating in Workshop Hall B with live stream.' },
    { tone: 'terra', tag: 'Food Update', msg: 'Dessert stall opens in 10 minutes', sub: 'South Lawn — next to the juice counter.' },
    { tone: 'tea', tag: 'Lost & Found', msg: 'Black backpack found near Hall A', sub: 'Collect at the help desk with ID.' }
  ];
  const toneDot = { terra: 'bg-terra', gold: 'bg-gold', tea: 'bg-tea' };
  const toneText = { terra: 'text-terra-light', gold: 'text-gold-light', tea: 'text-tea-light' };
  let annIndex = 0;
  let annTimer = null;

  const relTime = (ts) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    return mins < 1 ? 'just now' : mins + 'm ago';
  };

  const pushAnnouncement = () => {
    const a = annPool[annIndex % annPool.length];
    annIndex++;
    const card = document.createElement('div');
    card.className = 'ann-card ann-enter glass-card rounded-2xl p-6 hover:-translate-y-1';
    card.dataset.ts = Date.now();
    card.innerHTML = `
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2 h-2 ${toneDot[a.tone]} rounded-full animate-pulse"></span>
        <span class="text-[10px] ${toneText[a.tone]} font-medium uppercase tracking-wider">${a.tag}</span>
        <span class="ml-auto text-[10px] text-white/50 ann-ts">just now</span>
      </div>
      <p class="text-white/90 text-sm font-medium leading-relaxed">${a.msg}</p>
      <p class="text-white/55 text-xs mt-2">${a.sub}</p>`;
    annFeed.prepend(card);
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('ann-enter')));
    if (annFeed.children.length > 6) {
      const last = annFeed.lastElementChild;
      last.classList.add('ann-exit');
      setTimeout(() => last.remove(), 500);
    }
    annFeed.querySelectorAll('[data-ts]').forEach((c) => {
      const label = c.querySelector('.ann-ts');
      if (label) label.textContent = relTime(Number(c.dataset.ts));
    });
  };

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const feedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !annTimer) {
          annTimer = setInterval(pushAnnouncement, 4500);
        } else if (!entry.isIntersecting && annTimer) {
          clearInterval(annTimer);
          annTimer = null;
        }
      });
    }, { threshold: 0.3 });
    feedObserver.observe(annFeed);
  }
}

// Magnetic buttons
if (!prefersReducedMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = 'translate(0px, 0px)'; });
  });
}
