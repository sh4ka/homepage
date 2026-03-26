// Shortcut registry: Map<key, { handler, options }>
const shortcuts = new Map();

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable
  );
}

function init() {
  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(event) {
  // Only allow Escape when input is focused
  if (isInputFocused() && event.key !== 'Escape') return;

  const key = buildKeyString(event);
  const shortcut = shortcuts.get(key);
  if (!shortcut) return;

  if (shortcut.options.preventDefault !== false) {
    event.preventDefault();
  }
  shortcut.handler(event);
}

function buildKeyString(event) {
  // Build a canonical key string like "ctrl+k" or "/" or ","
  let key = event.key;
  if (event.ctrlKey && key !== 'Control') key = 'ctrl+' + key;
  if (event.shiftKey && key !== 'Shift') key = 'shift+' + key;
  if (event.altKey && key !== 'Alt') key = 'alt+' + key;
  return key;
}

function register(key, handler, options = {}) {
  shortcuts.set(key, {
    handler,
    options: {
      preventDefault: true,
      description: '',
      ...options
    }
  });
}

function unregister(key) {
  shortcuts.delete(key);
}

function getAll() {
  return Array.from(shortcuts.entries()).map(([key, { options }]) => ({
    key,
    description: options.description || key
  }));
}

// Register default shortcuts
// Note: actual handler implementations will be set by modules
// These are placeholder registrations that modules will override
register('/', () => {
  const searchInput = document.querySelector('.search-input');
  if (searchInput) searchInput.focus();
}, { description: 'Focus search bar' });

register('Escape', () => {
  if (document.activeElement) document.activeElement.blur();
  // Also close any open overlays
  const overlays = document.querySelectorAll('.overlay.visible');
  overlays.forEach(o => o.classList.remove('visible'));
}, { preventDefault: false, description: 'Blur input / close overlays' });

register(',', () => {
  window.location.href = 'settings.html';
}, { description: 'Open settings' });

register('?', () => {
  const helpOverlay = document.getElementById('help-overlay');
  if (helpOverlay) helpOverlay.classList.toggle('visible');
}, { description: 'Toggle shortcuts help' });

register('e', () => {
  // Will be overridden by export module
  const exportEvent = new CustomEvent('hackpage:export');
  document.dispatchEvent(exportEvent);
}, { description: 'Export data' });

register('r', () => {
  // Will be overridden by RSS module
  const refreshEvent = new CustomEvent('hackpage:refresh-rss');
  document.dispatchEvent(refreshEvent);
}, { description: 'Refresh RSS feeds' });

// Register number keys 1-9 and 0 for quick links
for (let i = 1; i <= 9; i++) {
  register(String(i), (event) => {
    const linkEvent = new CustomEvent('hackpage:open-link', { detail: { index: i - 1 } });
    document.dispatchEvent(linkEvent);
  }, { description: `Open link ${i}` });
}
register('0', () => {
  const linkEvent = new CustomEvent('hackpage:open-link', { detail: { index: 9 } });
  document.dispatchEvent(linkEvent);
}, { description: 'Open link 10' });

export const ShortcutManager = { init, register, unregister, getAll, isInputFocused };
