/* ================================================================
   TAGSAI - MAIN JAVASCRIPT
   YouTube Tags Generator powered by Groq AI

   FILE: script.js
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   ★★★ API CONFIGURATION ★★★

   GROQ API KEY YAHAN LAGAO:
   1. https://console.groq.com par jao
   2. API Keys section mein nai key banao
   3. Neeche apni key paste karo

   ► Security Warning:
     Ye key frontend mein hai — koi bhi dekh sakta hai.
     Personal use ke liye theek hai.
     Public website ke liye backend use karo.
   ---------------------------------------------------------------- */
const CONFIG = {

  // ★ APNI NAYI GROQ API KEY YAHAN PASTE KARO ★
  API_KEY: "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",

  // Groq API endpoint — mat badlo
  API_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions",

  // Free Groq model
  MODEL: "openai/gpt-oss-120b",

  // Maximum tokens
  MAX_TOKENS: 600,
};

/* ================================================================
   DOM ELEMENT REFERENCES
   ================================================================ */
const DOM = {
  videoInput:       document.getElementById('videoInput'),
  charCount:        document.getElementById('charCount'),
  inputHint:        document.getElementById('inputHint'),
  clearInputBtn:    document.getElementById('clearInputBtn'),
  generateBtn:      document.getElementById('generateBtn'),
  generateBtnText:  document.querySelector('.btn-text'),
  generateBtnLoad:  document.querySelector('.btn-loading'),
  loadingState:     document.getElementById('loadingState'),
  errorState:       document.getElementById('errorState'),
  errorMessage:     document.getElementById('errorMessage'),
  errorCloseBtn:    document.getElementById('errorCloseBtn'),
  emptyState:       document.getElementById('emptyState'),
  resultsSection:   document.getElementById('resultsSection'),
  tagsContainer:    document.getElementById('tagsContainer'),
  tagCountBadge:    document.getElementById('tagCountBadge'),
  copyAllBtn:       document.getElementById('copyAllBtn'),
  copyAllText:      document.querySelector('.copy-all-text'),
  copyNotification: document.getElementById('copyNotification'),
  copyNotifText:    document.getElementById('copyNotificationText'),
  navToggle:        document.getElementById('navToggle'),
  navMenu:          document.getElementById('navMenu'),
  currentYear:      document.getElementById('currentYear'),
};

/* ================================================================
   APPLICATION STATE
   ================================================================ */
const State = {
  isGenerating:   false,
  currentTags:    [],
  copyAllTimeout: null,
  notifTimeout:   null,
  tagCopyTimers:  {},
};

/* ================================================================
   INITIALIZATION
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
      handleGenerateTags();
    }
  });

  DOM.clearInputBtn.addEventListener('click', clearInput);
  DOM.generateBtn.addEventListener('click', handleGenerateTags);
  DOM.copyAllBtn.addEventListener('click', copyAllTags);
  DOM.errorCloseBtn.addEventListener('click', hideError);
  DOM.navToggle.addEventListener('click', toggleMobileNav);

  const navLinks = document.querySelectorAll('.navbar__link, .navbar__cta');
  navLinks.forEach(link => {
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
   MOBILE NAVIGATION
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

  const navbarHeight = 70;
  const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

  window.scrollTo({
    top:      targetTop,
    behavior: 'smooth',
  });
}

/* ================================================================
   GENERATE TAGS — MAIN HANDLER
   ================================================================ */
async function handleGenerateTags() {

  if (State.isGenerating) return;

  const userInput = DOM.videoInput.value.trim();

  // Input validate karo
  if (!userInput) {
    showError('Please enter a video title, topic, keywords or description before generating tags.');
    DOM.videoInput.focus();
    return;
  }

  if (userInput.length < 3) {
    showError('Your input is too short. Please enter at least 3 characters.');
    DOM.videoInput.focus();
    return;
  }

  // API key check karo
  if (
    !CONFIG.API_KEY ||
    CONFIG.API_KEY.trim() === '' ||
    CONFIG.API_KEY === 'APNI_GROQ_KEY_YAHAN_PASTE_KARO' ||
    CONFIG.API_KEY.length < 20
  ) {
    showError(
      'API key nahi lagi hai. script.js file kholo aur CONFIG mein ' +
      'APNI_GROQ_KEY_YAHAN_PASTE_KARO ki jagah apni Groq API key paste karo.'
    );
    return;
  }

  startLoadingState();
  hideError();

  try {
    const tags = await fetchTagsFromAI(userInput);
    displayTags(tags);
    scrollToResults();
  } catch (err) {
    handleAPIError(err);
  } finally {
    stopLoadingState();
  }
}

/* ================================================================
   GROQ AI API CALL
   ================================================================ */
async function fetchTagsFromAI(userInput) {

  const prompt = `You are an expert YouTube SEO specialist. Generate exactly 20 highly relevant YouTube video tags for the following video.

Video Details:
"${userInput}"

Rules:
- Exactly 20 tags
- All tags relevant to the video topic
- Mix short-tail (1-2 words) and long-tail (3-5 words) tags
- Lowercase only
- No hashtags, quotes, or special characters
- No duplicate tags
- Return ONLY this exact JSON format, nothing else, no extra text:

{"tags":["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen","tag fourteen","tag fifteen","tag sixteen","tag seventeen","tag eighteen","tag nineteen","tag twenty"]}`;

  let response;

  try {
    response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + CONFIG.API_KEY,
      },
      body: JSON.stringify({
        model:       CONFIG.MODEL,
        max_tokens:  CONFIG.MAX_TOKENS,
        messages: [
          {
            role:    'user',
            content: prompt,
          }
        ],
        temperature: 0.7,
      }),
    });

  } catch (networkErr) {
    throw new Error('network_error');
  }

  // HTTP errors handle karo
  if (!response.ok) {
    const errorBody = await safeParseJSON(response);
    const status    = response.status;

    if (status === 401) {
      throw new Error('invalid_key');
    } else if (status === 429) {
      throw new Error('rate_limit');
    } else if (status === 500 || status === 503) {
      throw new Error('server_error');
    } else {
      const msg = errorBody?.error?.message || `HTTP ${status}`;
      throw new Error('api_error:' + msg);
    }
  }

  // Response parse karo
  const data    = await safeParseJSON(response);
  const rawText = data?.choices?.[0]?.message?.content?.trim();

  if (!rawText) {
    throw new Error('empty_response');
  }

  // Tags nikalo
  const tags = parseTagsFromText(rawText);

  if (!tags || tags.length === 0) {
    throw new Error('no_tags');
  }

  return tags;
}

/* ================================================================
   RESPONSE PARSING
   ================================================================ */

async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseTagsFromText(text) {

  // Strategy 1: Clean JSON parse
  try {
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.tags)) {
      return cleanTagArray(parsed.tags);
    }
  } catch {
    // Next strategy
  }

  // Strategy 2: JSON object dhundo text ke andar
  try {
    const jsonMatch = text.match(/\{[\s\S]*"tags"\s*:\s*\[[\s\S]*?\]\s*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && Array.isArray(parsed.tags)) {
        return cleanTagArray(parsed.tags);
      }
    }
  } catch {
    // Next strategy
  }

  // Strategy 3: Array dhundo
  try {
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return cleanTagArray(parsed);
      }
    }
  } catch {
    // Next strategy
  }

  // Strategy 4: Lines se split karo
  const lines = text
    .split(/[\n,]+/)
    .map(line => line.replace(/^[-•*\d.)"'\s]+|["'\s]+$/g, '').trim())
    .filter(line => line.length > 0 && line.length < 100);

  if (lines.length > 0) {
    return cleanTagArray(lines);
  }

  return [];
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
  State.currentTags        = tags;
  DOM.tagsContainer.innerHTML = '';

  DOM.tagCountBadge.textContent = `${tags.length} tag${tags.length !== 1 ? 's' : ''}`;

  tags.forEach(function(tag, index) {
    const chip = createTagChip(tag, index);
    DOM.tagsContainer.appendChild(chip);
  });

  DOM.emptyState.style.display     = 'none';
  DOM.resultsSection.style.display = 'block';
}

function createTagChip(tag, index) {
  const button = document.createElement('button');
  button.type  = 'button';
  button.setAttribute('role', 'listitem');
  button.setAttribute('aria-label', `Copy tag: ${tag}`);
  button.className = 'tag-chip';
  button.style.animationDelay = `${index * 0.04}s`;

  const iconSVG = `<svg class="tag-chip__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

  button.innerHTML = `${iconSVG}<span>${escapeHTML(tag)}</span>`;

  button.addEventListener('click', function() {
    copyIndividualTag(tag, button);
  });

  return button;
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

      showNotification(`"${tag}" copied to clipboard!`);

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
      showNotification('Could not copy. Please copy the tag manually.');
    });
}

function copyAllTags() {
  if (State.currentTags.length === 0) return;

  const allTagsText = State.currentTags.join(', ');

  writeToClipboard(allTagsText)
    .then(function() {
      DOM.copyAllText.textContent      = 'Copied!';
      DOM.copyAllBtn.style.borderColor = 'var(--color-success)';
      DOM.copyAllBtn.style.color       = 'var(--color-success)';

      showNotification(`All ${State.currentTags.length} tags copied to clipboard!`);

      if (State.copyAllTimeout) clearTimeout(State.copyAllTimeout);
      State.copyAllTimeout = setTimeout(function() {
        DOM.copyAllText.textContent      = 'Copy All Tags';
        DOM.copyAllBtn.style.borderColor = '';
        DOM.copyAllBtn.style.color       = '';
      }, 2500);
    })
    .catch(function() {
      showError(
        'Could not copy to clipboard. ' +
        'Please select the tags manually and press Ctrl+C.'
      );
    });
}

function writeToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function(resolve, reject) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left     = '-9999px';
      textArea.style.top      = '-9999px';
      textArea.style.opacity  = '0';
      textArea.setAttribute('aria-hidden', 'true');
      textArea.setAttribute('tabindex', '-1');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (success) {
        resolve();
      } else {
        reject(new Error('Copy failed'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

/* ================================================================
   NOTIFICATION TOAST
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
  DOM.errorState.style.display     = 'none';

  DOM.loadingState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function stopLoadingState() {
  State.isGenerating = false;

  DOM.generateBtn.disabled          = false;
  DOM.generateBtnText.style.display = 'flex';
  DOM.generateBtnLoad.style.display = 'none';

  DOM.loadingState.style.display = 'none';
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

  let userMessage = 'Something went wrong. Please try again.';

  if (err && err.message) {
    const msg = err.message;

    if (msg === 'network_error') {
      userMessage =
        'Internet connection problem. ' +
        'Please check your connection and try again. ' +
        'Note: Groq API works directly from browser — no proxy needed.';

    } else if (msg === 'invalid_key') {
      userMessage =
        'Groq API key galat hai. ' +
        'script.js mein CONFIG.API_KEY check karo. ' +
        'Nai key https://console.groq.com se banao.';

    } else if (msg === 'rate_limit') {
      userMessage =
        'Bohat zyada requests ho gayi hain. ' +
        'Please 1 minute wait karo aur dobara try karo.';

    } else if (msg === 'server_error') {
      userMessage =
        'Groq service mein temporary problem hai. ' +
        'Thodi der baad try karo.';

    } else if (msg === 'empty_response') {
      userMessage =
        'AI ne koi response nahi diya. ' +
        'Dobara Generate Tags dabao.';

    } else if (msg === 'no_tags') {
      userMessage =
        'Tags generate nahi hue. ' +
        'Apni video ka thoda aur detail likho aur try karo.';

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
    const resultsEl = DOM.resultsSection;
    if (!resultsEl) return;

    const navbarHeight = 80;
    const top = resultsEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

    window.scrollTo({ top: top, behavior: 'smooth' });
  }, 100);
}

/* ================================================================
   NAVBAR SCROLL EFFECT
   ================================================================ */
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  if (window.scrollY > 20) {
    navbar.style.background = 'rgba(15, 14, 23, 0.97)';
  } else {
    navbar.style.background = 'rgba(15, 14, 23, 0.85)';
  }
}, { passive: true });

/* ================================================================
   START THE APP
   ================================================================ */
init();