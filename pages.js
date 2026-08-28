/* ================================================================
   TAGSAI - PAGES JAVASCRIPT
   Shared script for: privacy.html, contact.html, about.html

   FILE: pages.js
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   INITIALIZATION
   ---------------------------------------------------------------- */
function initPages() {
  setCurrentYear();
  initMobileNav();
  initScrollEffect();
  initSmoothScroll();

  // Contact form (only runs on contact page)
  if (document.getElementById('contactForm')) {
    initContactForm();
  }
}

/* ----------------------------------------------------------------
   SET CURRENT YEAR IN FOOTER
   ---------------------------------------------------------------- */
function setCurrentYear() {
  const yearEls = document.querySelectorAll('.year');
  const currentYear = new Date().getFullYear();
  yearEls.forEach(function(el) {
    el.textContent = currentYear;
  });
}

/* ----------------------------------------------------------------
   MOBILE NAVIGATION
   ---------------------------------------------------------------- */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');

  if (!navToggle || !navMenu) return;

  navToggle.addEventListener('click', function() {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when any nav link is clicked
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', function(e) {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ----------------------------------------------------------------
   NAVBAR SCROLL EFFECT
   ---------------------------------------------------------------- */
function initScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
      navbar.style.background = 'rgba(15, 14, 23, 0.97)';
    } else {
      navbar.style.background = 'rgba(15, 14, 23, 0.85)';
    }
  }, { passive: true });
}

/* ----------------------------------------------------------------
   SMOOTH SCROLL
   ---------------------------------------------------------------- */
function initSmoothScroll() {
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();

    const navbarHeight = 80;
    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });
}

/* ================================================================
   CONTACT FORM
   ================================================================ */
function initContactForm() {
  const form         = document.getElementById('contactForm');
  const submitBtn    = document.getElementById('submitBtn');
  const formSuccess  = document.getElementById('formSuccess');
  const sendAnother  = document.getElementById('sendAnotherBtn');
  const messageField = document.getElementById('message');
  const messageCount = document.getElementById('messageCount');

  if (!form) return;

  // Character counter for message textarea
  if (messageField && messageCount) {
    messageField.addEventListener('input', function() {
      const len = messageField.value.length;
      const max = parseInt(messageField.getAttribute('maxlength'), 10) || 2000;
      messageCount.textContent = `${len} / ${max}`;
    });
  }

  // Real-time validation on blur
  const fields = ['firstName', 'lastName', 'email', 'subject', 'message'];
  fields.forEach(function(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.addEventListener('blur', function() {
      validateField(fieldId, el.value);
    });
    el.addEventListener('input', function() {
      // Clear error on input after it was shown
      if (el.classList.contains('is-invalid')) {
        validateField(fieldId, el.value);
      }
    });
  });

  // Form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    handleFormSubmit(form, submitBtn, formSuccess);
  });

  // "Send Another Message" button
  if (sendAnother) {
    sendAnother.addEventListener('click', function() {
      formSuccess.style.display = 'none';
      form.style.display        = 'flex';
      form.reset();
      if (messageCount) messageCount.textContent = '0 / 2000';
      // Clear all errors
      fields.forEach(function(fieldId) {
        clearFieldError(fieldId);
        const el = document.getElementById(fieldId);
        if (el) el.classList.remove('is-invalid');
      });
    });
  }
}

/* ----------------------------------------------------------------
   FORM VALIDATION
   ---------------------------------------------------------------- */

/**
 * Validate a single field.
 * Returns true if valid, false if invalid.
 */
function validateField(fieldId, value) {
  const trimmed = (value || '').trim();
  let errorMsg  = '';

  switch (fieldId) {
    case 'firstName':
      if (!trimmed) {
        errorMsg = 'First name is required.';
      } else if (trimmed.length < 2) {
        errorMsg = 'First name must be at least 2 characters.';
      }
      break;

    case 'lastName':
      if (!trimmed) {
        errorMsg = 'Last name is required.';
      } else if (trimmed.length < 2) {
        errorMsg = 'Last name must be at least 2 characters.';
      }
      break;

    case 'email':
      if (!trimmed) {
        errorMsg = 'Email address is required.';
      } else if (!isValidEmail(trimmed)) {
        errorMsg = 'Please enter a valid email address (e.g. name@example.com).';
      }
      break;

    case 'subject':
      if (!trimmed) {
        errorMsg = 'Please select a subject.';
      }
      break;

    case 'message':
      if (!trimmed) {
        errorMsg = 'Please enter your message.';
      } else if (trimmed.length < 10) {
        errorMsg = 'Message must be at least 10 characters.';
      }
      break;
  }

  if (errorMsg) {
    showFieldError(fieldId, errorMsg);
    return false;
  } else {
    clearFieldError(fieldId);
    return true;
  }
}

/**
 * Validate all form fields. Returns true if all are valid.
 */
function validateAllFields() {
  const fields  = ['firstName', 'lastName', 'email', 'subject', 'message'];
  let allValid  = true;
  let firstInvalidEl = null;

  fields.forEach(function(fieldId) {
    const el    = document.getElementById(fieldId);
    const value = el ? el.value : '';
    const valid = validateField(fieldId, value);

    if (!valid && !firstInvalidEl) {
      firstInvalidEl = el;
    }
    if (!valid) {
      allValid = false;
    }
  });

  // Focus the first invalid field
  if (firstInvalidEl) {
    firstInvalidEl.focus();
  }

  return allValid;
}

/**
 * Show an error for a specific field.
 */
function showFieldError(fieldId, message) {
  const el      = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');

  if (el) el.classList.add('is-invalid');
  if (errorEl) errorEl.textContent = message;
}

/**
 * Clear the error for a specific field.
 */
function clearFieldError(fieldId) {
  const el      = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');

  if (el) el.classList.remove('is-invalid');
  if (errorEl) errorEl.textContent = '';
}

/**
 * Basic email validation regex.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ----------------------------------------------------------------
   FORM SUBMISSION HANDLER
   ---------------------------------------------------------------- */
function handleFormSubmit(form, submitBtn, formSuccess) {

  // Check honeypot (spam protection)
  const honeypot = document.getElementById('website');
  if (honeypot && honeypot.value.trim() !== '') {
    // Silently reject spam bots — don't reveal the honeypot
    showFormSuccessState(form, formSuccess);
    return;
  }

  // Validate all fields
  if (!validateAllFields()) return;

  // Show loading state on submit button
  setSubmitLoading(submitBtn, true);

  // ----------------------------------------------------------------
  // NOTE FOR DEVELOPERS:
  // This contact form does NOT send emails by itself because it's a
  // frontend-only website. To make it actually send emails, you need
  // to connect it to one of these services:
  //
  // Option A: Formspree (free, no backend needed)
  //   1. Sign up at https://formspree.io
  //   2. Create a form and get your endpoint URL
  //   3. Change form action to: <form action="https://formspree.io/f/YOUR_ID" method="POST">
  //
  // Option B: EmailJS (free tier, send emails from browser)
  //   1. Sign up at https://emailjs.com
  //   2. Use their SDK to send the form data
  //
  // Option C: Netlify Forms (free if hosted on Netlify)
  //   1. Add attribute to form: <form netlify>
  //   2. Netlify automatically handles submission
  //
  // For now, we simulate a successful submission so you can see
  // how the UI looks. Replace the setTimeout below with a real
  // API call when you are ready.
  // ----------------------------------------------------------------

  // Simulate sending (replace this with a real API call)
  setTimeout(function() {
    setSubmitLoading(submitBtn, false);
    showFormSuccessState(form, formSuccess);
    console.log('[TagsAI Contact] Form submitted successfully (simulated). Connect to a real email service to send actual emails.');
  }, 1800);
}

/**
 * Show the success state and hide the form.
 */
function showFormSuccessState(form, formSuccess) {
  form.style.display         = 'none';
  formSuccess.style.display  = 'block';
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Toggle the submit button loading state.
 */
function setSubmitLoading(submitBtn, isLoading) {
  if (!submitBtn) return;

  const textEl    = submitBtn.querySelector('.submit-btn-text');
  const loadingEl = submitBtn.querySelector('.submit-btn-loading');

  submitBtn.disabled = isLoading;

  if (textEl)    textEl.style.display    = isLoading ? 'none'  : 'flex';
  if (loadingEl) loadingEl.style.display = isLoading ? 'flex'  : 'none';
}

/* ----------------------------------------------------------------
   START
   ---------------------------------------------------------------- */
initPages();