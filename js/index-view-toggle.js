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
  window.switchView = function(v){ switchView(v); };

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
