/**
 * ~/page First-Run Onboarding Flow
 * Full-screen overlay shown on first extension install
 */

import { Storage } from './storage.js';

/**
 * Check if this is the first run and show onboarding if needed
 * @returns {Promise<void>}
 */
export async function checkFirstRun() {
  const complete = await Storage.get('onboardingComplete', false);
  if (complete) return;
  await showOnboarding();
}

/**
 * Display the onboarding overlay
 * @returns {Promise<void>}
 */
async function showOnboarding() {
  const overlay = createOverlay();
  document.body.appendChild(overlay);

  // Focus the handle input after a brief delay
  setTimeout(() => {
    const handleInput = overlay.querySelector('#onboarding-handle');
    if (handleInput) handleInput.focus();
  }, 300);

  // Handle Escape to skip
  function handleEscape(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handleEscape);
      skipOnboarding(overlay);
    }
  }
  document.addEventListener('keydown', handleEscape);

  // Return a promise that resolves when onboarding completes
  return new Promise(resolve => {
    const initBtn = overlay.querySelector('#onboarding-init-btn');
    initBtn.addEventListener('click', async () => {
      document.removeEventListener('keydown', handleEscape);
      await completeOnboarding(overlay);
      resolve();
    });
  });
}

/**
 * Create the onboarding overlay DOM structure
 * @returns {HTMLElement}
 */
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.className = 'onboarding-overlay';

  const box = document.createElement('div');
  box.className = 'onboarding-box font-body';

  // Build content using safe DOM methods
  const header = document.createElement('div');
  header.className = 'onboarding-header text-cyan glow-cyan font-display';
  header.textContent = '~/page // SYSTEM INITIALIZATION';

  const divider = document.createElement('div');
  divider.className = 'onboarding-divider text-dim';
  divider.textContent = '─'.repeat(46);

  // Typewriter lines
  const line1 = createTypewriterLine('> Establishing identity...');
  
  // Handle input
  const handleGroup = document.createElement('div');
  handleGroup.className = 'onboarding-field-group';
  const handleLabel = document.createElement('label');
  handleLabel.className = 'onboarding-label text-dim';
  handleLabel.htmlFor = 'onboarding-handle';
  handleLabel.textContent = '  HANDLE: ';
  const handleInput = document.createElement('input');
  handleInput.type = 'text';
  handleInput.id = 'onboarding-handle';
  handleInput.className = 'onboarding-input';
  handleInput.placeholder = 'operator';
  handleInput.maxLength = 32;
  handleGroup.appendChild(handleLabel);
  handleGroup.appendChild(handleInput);

  const line2 = createTypewriterLine('> Configuring primary links...');
  const linkNote = createDimLine('  Add up to 3 starter links (optional):');

  // Link fields (3)
  const linksGroup = document.createElement('div');
  linksGroup.className = 'onboarding-links-group';
  for (let i = 1; i <= 3; i++) {
    const row = document.createElement('div');
    row.className = 'onboarding-link-row';
    
    const numSpan = document.createElement('span');
    numSpan.className = 'text-magenta';
    numSpan.textContent = `  [${i}] `;
    
    const lblInput = document.createElement('input');
    lblInput.type = 'text';
    lblInput.className = 'onboarding-input onboarding-link-label';
    lblInput.placeholder = 'Label';
    lblInput.dataset.linkIndex = String(i - 1);
    lblInput.maxLength = 50;
    
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.className = 'onboarding-input onboarding-link-url';
    urlInput.placeholder = 'https://...';
    urlInput.dataset.linkIndex = String(i - 1);
    
    row.appendChild(numSpan);
    row.appendChild(lblInput);
    row.appendChild(urlInput);
    linksGroup.appendChild(row);
  }

  const line3 = createTypewriterLine('> RSS feed configuration (optional)...');
  const feedGroup = document.createElement('div');
  feedGroup.className = 'onboarding-field-group';
  const feedLabel = document.createElement('label');
  feedLabel.className = 'onboarding-label text-dim';
  feedLabel.htmlFor = 'onboarding-feed';
  feedLabel.textContent = '  Feed URL: ';
  const feedInput = document.createElement('input');
  feedInput.type = 'url';
  feedInput.id = 'onboarding-feed';
  feedInput.className = 'onboarding-input onboarding-feed-url';
  feedInput.placeholder = 'https://example.com/feed.xml';
  feedGroup.appendChild(feedLabel);
  feedGroup.appendChild(feedInput);

  const spacer = document.createElement('div');
  spacer.className = 'onboarding-spacer';

  const initBtn = document.createElement('button');
  initBtn.id = 'onboarding-init-btn';
  initBtn.className = 'onboarding-btn text-green';
  initBtn.textContent = '■ INITIALIZE SYSTEM';

  const escapeHint = document.createElement('div');
  escapeHint.className = 'onboarding-escape text-dim';
  escapeHint.textContent = '[Esc] skip with defaults';

  box.appendChild(header);
  box.appendChild(divider);
  box.appendChild(line1);
  box.appendChild(handleGroup);
  box.appendChild(line2);
  box.appendChild(linkNote);
  box.appendChild(linksGroup);
  box.appendChild(line3);
  box.appendChild(feedGroup);
  box.appendChild(spacer);
  box.appendChild(initBtn);
  box.appendChild(escapeHint);

  overlay.appendChild(box);
  return overlay;
}

/**
 * Create a typewriter-styled text line
 * @param {string} text - The text content
 * @returns {HTMLElement}
 */
function createTypewriterLine(text) {
  const div = document.createElement('div');
  div.className = 'onboarding-typewriter text-green';
  div.textContent = text;
  return div;
}

/**
 * Create a dim-styled hint line
 * @param {string} text - The text content
 * @returns {HTMLElement}
 */
function createDimLine(text) {
  const div = document.createElement('div');
  div.className = 'onboarding-hint text-dim';
  div.textContent = text;
  return div;
}

/**
 * Complete the onboarding process and save user input
 * @param {HTMLElement} overlay - The overlay element
 * @returns {Promise<void>}
 */
async function completeOnboarding(overlay) {
  // Gather values
  const handleInput = overlay.querySelector('#onboarding-handle');
  const handle = (handleInput?.value || '').trim() || 'operator';

  // Gather links
  const links = [];
  const labelInputs = overlay.querySelectorAll('.onboarding-link-label');
  const urlInputs = overlay.querySelectorAll('.onboarding-link-url');
  for (let i = 0; i < 3; i++) {
    const label = labelInputs[i]?.value.trim();
    const url = urlInputs[i]?.value.trim();
    if (label && url) {
      try {
        new URL(url); // validate
        links.push({ label, url });
      } catch { /* skip invalid */ }
    }
  }

  // Gather feed
  const feeds = [];
  const feedInput = overlay.querySelector('.onboarding-feed-url');
  const feedUrl = feedInput?.value.trim();
  if (feedUrl) {
    try {
      new URL(feedUrl);
      feeds.push({ url: feedUrl, title: '' });
    } catch { /* skip invalid */ }
  }

  // Get existing stats or initialize
  const stats = await Storage.get('stats', { installDate: null, tabsOpened: 0 });
  
  // Save to storage
  await Storage.setMany({
    handle,
    greeting: { handle, quotes: true, timeAware: true },
    links,
    feeds,
    onboardingComplete: true,
  });

  // Update stats with install date if not already set
  await Storage.set('stats', { 
    ...stats, 
    installDate: stats.installDate || Date.now() 
  });

  dismissOverlay(overlay);
}

/**
 * Skip onboarding with default values
 * @param {HTMLElement} overlay - The overlay element
 * @returns {Promise<void>}
 */
async function skipOnboarding(overlay) {
  // Get existing stats or initialize
  const stats = await Storage.get('stats', { installDate: null, tabsOpened: 0 });
  
  await Storage.setMany({
    handle: 'operator',
    onboardingComplete: true,
  });
  
  // Update stats with install date if not already set
  await Storage.set('stats', { 
    ...stats, 
    installDate: stats.installDate || Date.now() 
  });
  
  dismissOverlay(overlay);
}

/**
 * Dismiss the overlay with fade-out animation
 * @param {HTMLElement} overlay - The overlay element
 */
function dismissOverlay(overlay) {
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    overlay.remove();
    // Reload page to show updated data
    window.location.reload();
  }, 500);
}
