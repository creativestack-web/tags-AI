/* ================================================================
   TAGSAI - MAIN JAVASCRIPT
   YouTube Tags + Description Generator
   API key Vercel environment variable mein safe hai
   FILE: script.js
   ================================================================ */

'use strict';

/* ================================================================
   CONFIG
   API key yahan nahi — Vercel par safe hai
   ================================================================ */
const CONFIG = {
  // Vercel serverless function endpoint
  API_ENDPOINT:          '/api/generate',
  DESCRIPTION_MAX_CHARS: 5000,
  DESCRIPTION_SAFE_LIMIT: 4500,
};

/* ================================================================
   DOM REFERENCES
   ================================================================ */
const DOM = {
  videoInput:      document.getElementById('videoInput'),
  charCount:       document.getElementById('charCount'),
  inputHint:       document.getElementById('inputHint'),
  clearInputBtn:   document.getElementById('clearInputBtn'),
  generateBtn:     document.getElementById('generateBtn'),
  generateBtnText: document.querySelector('.btn-text'),
  generateBtnLoad: document.querySelector('.btn-loading'),
  loadingState:    document.getElementById('loadingState'),
  errorState:      document.getElementById('errorState'),
  errorMessage:    document.getElementById('errorMessage'),
  errorCloseBtn:   document.getElementById('errorCloseBtn'),
  emptyState:      document.getElementById('emptyState'),
  resultsSection:  document.getElementById('resultsSection'),
  tagsContainer:   document.getElementById('tagsContainer'),
  tagCountBadge:   document.getElementById('tagCountBadge'),
  copyAllBtn:      document.getElementById('copyAllBtn'),
  copyAllText:     document.querySelector('.copy-all-text'),
  descSection:     document.getElementById('descSection'),
  descText:        document.getElementById('descText'),
  descCharCount:   document.getElementById('descCharCount'),
  copyDescBtn:     document.getElementById('copyDescBtn'),
  copyDescText:    document.querySelector('.copy-desc-text'),
  copyNotification: document.getElementById('copyNotification'),
  copyNotifText:   document.getElementById('copyNotificationText'),
  navToggle:       document.getElementById('navToggle'),
  navMenu:         document.getElementById('navMenu'),
  currentYear:     document.getElementById('currentYear'),
};

/* ================================================================
   STATE
   ================================================================ */
const State = {
  isGenerating:    false,
  currentTags:     [],
  currentDesc:     '',
  copyAllTimeout:  null,
  copyDescTimeout: null,
  notifTimeout:    null,
  tagCopyTimers:   {},
};

/* ================================================================
   INIT
   ================================================================ */
function init() {
  if (DOM.currentYear) {
    DOM.currentYear.textContent = new Date().getFullYear();
  }
  attachEventListeners();
}

/* ================================================================
   EVENT LISTENERS
   ================================================================ */
function attachEventListeners() {
  DOM.videoInput.addEventListener('input', handleInputChange);

  DOM.videoInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  });

  DOM.clearInputBtn.addEventListener('click', clearInput);
  DOM.generateBtn.addEventListener('click', handleGenerate);
  DOM.copyAllBtn.addEventListener('click', copyAllTags);
  DOM.copyDescBtn.addEventListener('click', copyDescription);
  DOM.errorCloseBtn.addEventListener('click', hideError);
  DOM.navToggle.addEventListener('click', toggleMobileNav);

  document.querySelectorAll('.navbar__link, .navbar__cta').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  document.addEventListener('click', handleSmoothScroll);
}

/* ================================================================
   INPUT HANDLING
   ================================================================ */
function handleInputChange() {
  const value  = DOM.videoInput.value;
  const length = value.length;
  const maxLen = parseInt(DOM.videoInput.getAttribute('maxlength'), 10) || 2000;

  DOM.charCount.textContent = `${length} / ${maxLen}`;
  DOM.charCount.classList.remove('is-warning', 'is-danger');

  if (length > maxLen * 0.9) {
    DOM.charCount.classList.add('is-danger');
  } else if (length > maxLen * 0.75) {
    DOM.charCount.classList.add('is-warning');
  }

  DOM.clearInputBtn.style.display = length > 0 ? 'flex' : 'none';

  if (length > 0 && DOM.errorState.style.display !== 'none') {
    hideError();
  }
}

function clearInput() {
  DOM.videoInput.value = '';
  DOM.charCount.textContent = '0 / 2000';
  DOM.charCount.classList.remove('is-warning', 'is-danger');
  DOM.clearInputBtn.style.display = 'none';
  DOM.videoInput.focus();
}

/* ================================================================
   MOBILE NAV
   ================================================================ */
function toggleMobileNav() {
  const isOpen = DOM.navMenu.classList.toggle('is-open');
  DOM.navToggle.setAttribute('aria-expanded', String(isOpen));
}

function closeMobileNav() {
  DOM.navMenu.classList.remove('is-open');
  DOM.navToggle.setAttribute('aria-expanded', 'false');
}

/* ================================================================
   SMOOTH SCROLL
   ================================================================ */
function handleSmoothScroll(e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute('href');
  if (!targetId || targetId === '#') return;

  const targetEl = document.querySelector(targetId);
  if (!targetEl) return;

  e.preventDefault();

  const top = targetEl.getBoundingClientRect().top + window.pageYOffset - 70;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ================================================================
   MAIN GENERATE HANDLER
   ================================================================ */
async function handleGenerate() {
  if (State.isGenerating) return;

  const userInput = DOM.videoInput.value.trim();

  if (!userInput) {
    showError('Please enter a video title, topic or description before generating.');
    DOM.videoInput.focus();
    return;
  }

  if (userInput.length < 3) {
    showError('Your input is too short. Please enter at least 3 characters.');
    DOM.videoInput.focus();
    return;
  }

  startLoadingState();
  hideError();

  try {
    const result = await fetchFromAPI(userInput);
    displayTags(result.tags);
    displayDescription(result.description);
    scrollToResults();
  } catch (err) {
    handleAPIError(err);
  } finally {
    stopLoadingState();
  }
}

/* ================================================================
   API CALL — Vercel Function Ko Call Karo
   ================================================================ */
async function fetchFromAPI(userInput) {

  let response;

  try {
    response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

  } catch (networkErr) {
    throw new Error('network_error');
  }

  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    const status    = response.status;
    const errMsg    = errorBody?.error || '';

    if (status === 401 || errMsg === 'invalid_key') {
      throw new Error('invalid_key');
    }
    if (status === 429 || errMsg === 'rate_limit') {
      throw new Error('rate_limit');
    }
    if (status === 500 || status === 503) {
      throw new Error('server_error');
    }

    throw new Error('api_error:' + (errMsg || `HTTP ${status}`));
  }

  const data = await safeParseJSON(response);

  if (!data) {
    throw new Error('parse_error');
  }

  if (!data.tags || data.tags.length === 0) {
    throw new Error('no_tags');
  }

  if (!data.description || data.description.length < 50) {
    throw new Error('no_description');
  }

  return {
    tags:        cleanTagArray(data.tags),
    description: data.description,
  };
}

/* ================================================================
   PARSE UTILITIES
   ================================================================ */
async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function cleanTagArray(rawTags) {
  const seen    = new Set();
  const cleaned = [];

  for (const tag of rawTags) {
    if (typeof tag !== 'string') continue;

    const clean = tag
      .toLowerCase()
      .replace(/[^a-z0-9\s\-']/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length < 2)  continue;
    if (clean.length > 80) continue;
    if (seen.has(clean))   continue;

    seen.add(clean);
    cleaned.push(clean);

    if (cleaned.length >= 20) break;
  }

  return cleaned;
}

/* ================================================================
   DISPLAY TAGS
   ================================================================ */
function displayTags(tags) {
  State.currentTags           = tags;
  DOM.tagsContainer.innerHTML = '';

  DOM.tagCountBadge.textContent = `${tags.length} tag${tags.length !== 1 ? 's' : ''}`;

  tags.forEach(function(tag, index) {
    DOM.tagsContainer.appendChild(createTagChip(tag, index));
  });

  DOM.emptyState.style.display     = 'none';
  DOM.resultsSection.style.display = 'block';
}

function createTagChip(tag, index) {
  const button = document.createElement('button');
  button.type  = 'button';
  button.setAttribute('role', 'listitem');
  button.setAttribute('aria-label', `Copy tag: ${tag}`);
  button.className            = 'tag-chip';
  button.style.animationDelay = `${index * 0.04}s`;

  const iconSVG = `<svg class="tag-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

  button.innerHTML = `${iconSVG}<span>${escapeHTML(tag)}</span>`;
  button.addEventListener('click', function() {
    copyIndividualTag(tag, button);
  });

  return button;
}

/* ================================================================
   DISPLAY DESCRIPTION
   ================================================================ */
function displayDescription(description) {
  State.currentDesc    = description;
  DOM.descText.textContent = description;

  updateDescCharCount(description.length);

  DOM.descSection.style.display = 'block';
}

function updateDescCharCount(length) {
  const max     = CONFIG.DESCRIPTION_MAX_CHARS;
  const counter = DOM.descCharCount;

  counter.textContent = `${length.toLocaleString()} / ${max.toLocaleString()} characters`;
  counter.classList.remove('desc-count--warning', 'desc-count--danger');

  if (length > max * 0.95) {
    counter.classList.add('desc-count--danger');
  } else if (length > max * 0.80) {
    counter.classList.add('desc-count--warning');
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ================================================================
   COPY FUNCTIONS
   ================================================================ */
function copyIndividualTag(tag, chipElement) {
  const tagIndex = State.currentTags.indexOf(tag);

  writeToClipboard(tag)
    .then(function() {
      chipElement.classList.add('is-copied');
      chipElement.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span>Copied!</span>`;
      chipElement.setAttribute('aria-label', `Copied: ${tag}`);

      showNotification(`"${tag}" copied!`);

      const timerId = setTimeout(function() {
        chipElement.classList.remove('is-copied');
        chipElement.innerHTML = `<svg class="tag-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>${escapeHTML(tag)}</span>`;
        chipElement.setAttribute('aria-label', `Copy tag: ${tag}`);
      }, 2000);

      if (tagIndex >= 0) {
        if (State.tagCopyTimers[tagIndex]) {
          clearTimeout(State.tagCopyTimers[tagIndex]);
        }
        State.tagCopyTimers[tagIndex] = timerId;
      }
    })
    .catch(function() {
      showNotification('Could not copy. Please copy manually.');
    });
}

function copyAllTags() {
  if (State.currentTags.length === 0) return;

  writeToClipboard(State.currentTags.join(', '))
    .then(function() {
      DOM.copyAllText.textContent      = 'Copied!';
      DOM.copyAllBtn.style.borderColor = 'var(--color-success)';
      DOM.copyAllBtn.style.color       = 'var(--color-success)';

      showNotification(`All ${State.currentTags.length} tags copied!`);

      if (State.copyAllTimeout) clearTimeout(State.copyAllTimeout);
      State.copyAllTimeout = setTimeout(function() {
        DOM.copyAllText.textContent      = 'Copy All Tags';
        DOM.copyAllBtn.style.borderColor = '';
        DOM.copyAllBtn.style.color       = '';
      }, 2500);
    })
    .catch(function() {
      showError('Could not copy. Please select tags manually and press Ctrl+C.');
    });
}

function copyDescription() {
  if (!State.currentDesc) return;

  writeToClipboard(State.currentDesc)
    .then(function() {
      DOM.copyDescText.textContent      = 'Copied!';
      DOM.copyDescBtn.style.borderColor = 'var(--color-success)';
      DOM.copyDescBtn.style.color       = 'var(--color-success)';

      showNotification('Description copied to clipboard!');

      if (State.copyDescTimeout) clearTimeout(State.copyDescTimeout);
      State.copyDescTimeout = setTimeout(function() {
        DOM.copyDescText.textContent      = 'Copy Description';
        DOM.copyDescBtn.style.borderColor = '';
        DOM.copyDescBtn.style.color       = '';
      }, 2500);
    })
    .catch(function() {
      showError('Could not copy description. Please select it manually.');
    });
}

function writeToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function(resolve, reject) {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('tabindex', '-1');
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      ok ? resolve() : reject(new Error('copy failed'));
    } catch (err) {
      reject(err);
    }
  });
}

/* ================================================================
   NOTIFICATION
   ================================================================ */
function showNotification(message) {
  DOM.copyNotifText.textContent      = message;
  DOM.copyNotification.style.display = 'flex';

  if (State.notifTimeout) clearTimeout(State.notifTimeout);
  State.notifTimeout = setTimeout(function() {
    DOM.copyNotification.style.display = 'none';
  }, 3000);
}

/* ================================================================
   LOADING STATE
   ================================================================ */
function startLoadingState() {
  State.isGenerating = true;

  DOM.generateBtn.disabled          = true;
  DOM.generateBtnText.style.display = 'none';
  DOM.generateBtnLoad.style.display = 'flex';

  DOM.loadingState.style.display   = 'block';
  DOM.emptyState.style.display     = 'none';
  DOM.resultsSection.style.display = 'none';
  DOM.descSection.style.display    = 'none';
  DOM.errorState.style.display     = 'none';

  DOM.loadingState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function stopLoadingState() {
  State.isGenerating = false;

  DOM.generateBtn.disabled          = false;
  DOM.generateBtnText.style.display = 'flex';
  DOM.generateBtnLoad.style.display = 'none';
  DOM.loadingState.style.display    = 'none';
}

/* ================================================================
   ERROR HANDLING
   ================================================================ */
function showError(message) {
  DOM.errorMessage.textContent = message;
  DOM.errorState.style.display = 'flex';

  if (DOM.resultsSection.style.display === 'none') {
    DOM.emptyState.style.display = 'block';
  }

  DOM.errorState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  DOM.errorState.style.display = 'none';
}

function handleAPIError(err) {
  console.error('[TagsAI] Error:', err);

  const messages = {
    'network_error':  'Internet connection problem. Check your connection and try again.',
    'invalid_key':    'API key problem. Vercel environment variables check karo.',
    'rate_limit':     'Too many requests. Please wait 1 minute and try again.',
    'server_error':   'Server mein temporary problem. Thodi der baad try karo.',
    'empty_response': 'AI ne koi response nahi diya. Dobara Generate dabao.',
    'no_tags':        'Tags generate nahi hue. Thodi aur detail likho.',
    'no_description': 'Description generate nahi hui. Dobara try karo.',
    'parse_error':    'Response samajh nahi aaya. Dobara try karo.',
  };

  let userMessage = 'Something went wrong. Please try again.';

  if (err && err.message) {
    const msg = err.message;
    if (messages[msg]) {
      userMessage = messages[msg];
    } else if (msg.startsWith('api_error:')) {
      userMessage = 'API Error: ' + msg.replace('api_error:', '');
    }
  }

  showError(userMessage);

  if (DOM.resultsSection.style.display === 'none') {
    DOM.emptyState.style.display = 'block';
  }
}

/* ================================================================
   SCROLL TO RESULTS
   ================================================================ */
function scrollToResults() {
  setTimeout(function() {
    if (!DOM.resultsSection) return;
    const top = DOM.resultsSection.getBoundingClientRect().top
              + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 100);
}

/* ================================================================
   NAVBAR SCROLL
   ================================================================ */
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  navbar.style.background = window.scrollY > 20
    ? 'rgba(15, 14, 23, 0.97)'
    : 'rgba(15, 14, 23, 0.85)';
}, { passive: true });

/* ================================================================
   START
   ================================================================ */
init();