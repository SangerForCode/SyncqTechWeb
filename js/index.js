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
const attendeeNewBadge = document.getElementById('attendee-new-badge');

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
    if (attendeeNewBadge) attendeeNewBadge.classList.add('hidden');
    initAttendeeViewPanels();
  }
  lucide.createIcons();
}

function initAttendeeViewPanels() {
  if (!attendeeView || attendeeView.dataset.dynamicReady === 'true') return;

  const cards = Array.from(attendeeView.querySelectorAll('[data-attendee-card]'));

  const setCardState = (card, expanded) => {
    const key = card.getAttribute('data-panel');
    const panel = card.querySelector(`[data-attendee-panel="${key}"]`);
    const chevron = card.querySelector('[data-lucide="chevron-down"]');
    if (!panel) return;

    if (expanded) {
      panel.classList.remove('max-h-0', 'opacity-0', 'pb-0');
      panel.classList.add('opacity-100');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
      panel.style.maxHeight = '0px';
      panel.classList.add('max-h-0', 'opacity-0', 'pb-0');
      panel.classList.remove('opacity-100');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  };

  cards.forEach((card) => {
    setCardState(card, false);
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-panel');
      const panel = card.querySelector(`[data-attendee-panel="${key}"]`);
      const isOpen = panel && panel.style.maxHeight && panel.style.maxHeight !== '0px';

      cards.forEach((otherCard) => setCardState(otherCard, false));
      if (!isOpen) setCardState(card, true);
    });
  });

  const liveNode = attendeeView.querySelector('#attendee-network-live');
  if (liveNode) {
    const statuses = [
      'Aarav Kapoor is now 10m away near Hall A.',
      'Meera Iyer just checked in at Main Stage.',
      '2 more attendees are nearby in Food Zone.'
    ];
    let statusIndex = 0;
    setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      liveNode.textContent = statuses[statusIndex];
    }, 2800);
  }

  attendeeView.dataset.dynamicReady = 'true';
}

initAttendeeViewPanels();


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

// ── Attendee view auto-switch (hover/visibility) ──
(function(){
  // Track whether the user has manually interacted to disable auto behaviors
  // Flags are section-scoped so a manual interaction only disables that section's auto behavior
  let userInteracted = { whiteLabel: false, viewToggle: false };
  // suppressUserMark is used to avoid marking an auto-triggered click as a manual interaction
  let suppressUserMark = { viewToggle: false };

  // View toggle and attendee hover/long-press
  const btnAtt = document.getElementById('toggle-attendee');
  const btnOrg = document.getElementById('toggle-organizer');
  const viewOrg = document.getElementById('view-organizer');
  const viewAtt = document.getElementById('view-attendee');
  let hoverTimer = null;

  function triggerAttendeeAutoSwitch(){
    if(btnAtt){
      suppressUserMark.viewToggle = true;
      btnAtt.click();
      // clear suppress shortly after the click handler runs
      setTimeout(()=>{ suppressUserMark.viewToggle = false; }, 50);
    } else {
      switchView('attendee');
    }
  }

  function switchView(to){
    // only mark as user interaction when this was a real user action
    if(!suppressUserMark.viewToggle){ userInteracted.viewToggle = true; }
    if(to === 'attendee'){
      if(viewOrg) viewOrg.classList.add('hidden');
      if(viewAtt) viewAtt.classList.remove('hidden');
      if(btnOrg) { btnOrg.classList.remove('active'); btnOrg.classList.add('inactive'); }
      if(btnAtt) { btnAtt.classList.add('active'); btnAtt.classList.remove('inactive'); }
    } else {
      if(viewAtt) viewAtt.classList.add('hidden');
      if(viewOrg) viewOrg.classList.remove('hidden');
      if(btnAtt) { btnAtt.classList.remove('active'); btnAtt.classList.add('inactive'); }
      if(btnOrg) { btnOrg.classList.add('active'); btnOrg.classList.remove('inactive'); }
    }
  }
  
  function startHoverTimer(e){
    if(userInteracted.viewToggle) return;
    if(hoverTimer) clearTimeout(hoverTimer);
    const isTouch = (e && (e.pointerType === 'touch' || e.type.startsWith('touch')));
    hoverTimer = setTimeout(triggerAttendeeAutoSwitch, 2000);
    if(isTouch){
      const cancel = ()=>{ if(hoverTimer){ clearTimeout(hoverTimer); hoverTimer = null; } window.removeEventListener('pointerup', cancel); window.removeEventListener('pointercancel', cancel); window.removeEventListener('pointermove', cancel); };
      window.addEventListener('pointerup', cancel);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('pointermove', cancel);
    }
  }
  function cancelHoverTimer(){ if(hoverTimer){ clearTimeout(hoverTimer); hoverTimer = null; } }

  if(btnAtt){
    btnAtt.addEventListener('pointerenter', startHoverTimer);
    btnAtt.addEventListener('pointerleave', cancelHoverTimer);
    btnAtt.addEventListener('pointerdown', startHoverTimer);
    btnAtt.addEventListener('pointerup', cancelHoverTimer);
    btnAtt.addEventListener('pointercancel', cancelHoverTimer);
    // any interaction inside features section disables auto and hands control to user
    const featuresSection = document.getElementById('features');
    if(featuresSection){
      // visibility-based auto-switch to attendee after 2.5s when section appears
      let featuresTimer = null;
      const featuresObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting && !userInteracted.viewToggle){
            if(featuresTimer) clearTimeout(featuresTimer);
            featuresTimer = setTimeout(()=>{
              triggerAttendeeAutoSwitch();
              featuresTimer = null;
            }, 2500);
          } else {
            if(featuresTimer){ clearTimeout(featuresTimer); featuresTimer = null; }
          }
        });
      }, { threshold: 0.5, rootMargin: '0px 0px -20% 0px' });
      featuresObserver.observe(featuresSection);

      // cancel auto-switch on explicit interactions (no mousemove to avoid accidental cancels)
      ['pointerdown','touchstart','click'].forEach(ev=>{
        featuresSection.addEventListener(ev, ()=>{ userInteracted.viewToggle = true; if(featuresTimer){ clearTimeout(featuresTimer); featuresTimer = null; } });
      });
    }
  }

  // ensure icons refresh
  document.addEventListener('DOMContentLoaded', ()=>{ if(window.lucide) window.lucide.replace(); });

})();
