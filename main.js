/* ================================================================
   SRI HARI FITNESS – main.js
   Handles: mobile nav, sticky header, stat counter animation,
            scroll reveal, pricing tabs, plan selection, enquiry form
   ================================================================ */

'use strict';

// ---- LOADER ----
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 600);
});

// ---- MOBILE NAV ----
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('is-open');
    mobileNav.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('is-open');
      mobileNav.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

// ---- STICKY HEADER ----
const header = document.getElementById('header');
if (header) {
  const THRESHOLD = 60;
  const update = () => {
    header.style.background = window.scrollY > THRESHOLD
      ? 'rgba(13,13,13,0.97)'
      : 'rgba(13,13,13,0.9)';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---- STAT COUNTER ANIMATION ----
const animateCounts = () => {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

// Trigger counter once stats section is visible
const statsSection = document.querySelector('.stats');
if (statsSection) {
  let counted = false;
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      animateCounts();
      statsObserver.disconnect();
    }
  }, { threshold: 0.4 });
  statsObserver.observe(statsSection);
}

// ---- SCROLL REVEAL ----
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Apply reveal class dynamically to key elements
const revealSelectors = [
  '.section-headline',
  '.section-eyebrow',
  '.about__text',
  '.about__location',
  '.feature-card',
  '.program-card',
  '.contact__text',
  '.contact__details',
  '.contact__form-wrap',
  '.pricing__highlight',
];
revealSelectors.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${i * 0.07}s`;
    revealObserver.observe(el);
  });
});

// Observe pricing cards (already have .reveal in HTML)
document.querySelectorAll('.pricing-card.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.06}s`;
  revealObserver.observe(el);
});

// ---- PRICING TABS ----
const pricingTabs = document.querySelectorAll('.pricing-tab');
pricingTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    pricingTabs.forEach(t => {
      t.classList.remove('pricing-tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('pricing-tab--active');
    tab.setAttribute('aria-selected', 'true');

    document.querySelectorAll('.pricing-panel').forEach(p => p.classList.add('pricing-panel--hidden'));
    const panel = document.getElementById('tab-' + tab.dataset.tab);
    if (panel) panel.classList.remove('pricing-panel--hidden');
  });
});

// ---- PLAN SELECTION (from pricing cards → form autofill) ----
const planSelect   = document.getElementById('plan');
const planPill     = document.getElementById('selectedPlanPill');
const planPillName = document.getElementById('selectedPlanName');
const clearPlanBtn = document.getElementById('clearPlan');

window.selectPlan = function selectPlan(planName, price) {
  if (!planSelect) return;

  // Find matching option and select it
  const optionValue = `${planName} (${price})`;
  for (const opt of planSelect.options) {
    if (opt.value === optionValue) {
      planSelect.value = optionValue;
      break;
    }
  }

  // Show pill
  if (planPill && planPillName) {
    planPillName.textContent = `${planName} – ${price}`;
    planPill.hidden = false;
  }

  // Scroll to contact form
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '68', 10);
    const top = contactSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// Clear plan pill
if (clearPlanBtn) {
  clearPlanBtn.addEventListener('click', () => {
    if (planSelect) {
      planSelect.removeEventListener('change', onPlanChange);
      planSelect.value = '';
      planSelect.addEventListener('change', onPlanChange);
    }
    if (planPill) planPill.hidden = true;
  });
}

// Sync pill if user manually changes the select
function onPlanChange() {
  if (planSelect.value && planPill && planPillName) {
    planPillName.textContent = planSelect.selectedOptions[0].text;
    planPill.hidden = false;
  } else if (planPill) {
    planPill.hidden = true;
  }
}
if (planSelect) planSelect.addEventListener('change', onPlanChange);

// ---- ENQUIRY FORM ----
const form = document.getElementById('enquiryForm');
const successMsg = document.getElementById('formSuccess');

if (form) {
  const nameInput  = form.querySelector('#name');
  const phoneInput = form.querySelector('#phone');
  const nameError  = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');

  const validate = () => {
    let ok = true;

    if (!nameInput.value.trim()) {
      nameError.textContent = 'Please enter your name.';
      nameInput.classList.add('is-error');
      ok = false;
    } else {
      nameError.textContent = '';
      nameInput.classList.remove('is-error');
    }

    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length < 10) {
      phoneError.textContent = 'Please enter a valid 10-digit phone number.';
      phoneInput.classList.add('is-error');
      ok = false;
    } else {
      phoneError.textContent = '';
      phoneInput.classList.remove('is-error');
    }

    return ok;
  };

  [nameInput, phoneInput].forEach(input => input.addEventListener('input', validate));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const name    = nameInput.value.trim();
    const phone   = phoneInput.value.trim();
    const planEl  = form.querySelector('#plan');
    const message = form.querySelector('#message').value.trim();
    const planLabel = planEl && planEl.value ? planEl.selectedOptions[0].text : 'General Enquiry';

    const wa = `Hi, I'm ${name} (${phone}). I'm interested in: ${planLabel}${message ? '. ' + message : ''}`;

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      submitBtn.style.display = 'none';
      form.querySelector('.form-note').style.display = 'none';
      window.open(
        `https://wa.me/918639062100?text=${encodeURIComponent(wa)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }, 600);
  });
}

// ---- SMOOTH SCROLL for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '68', 10);
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
