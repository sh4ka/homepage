import { Storage } from '../storage.js';

const ENGINES = {
  duckduckgo: { label: 'DDG',    url: q => `https://duckduckgo.com/?q=${q}` },
  google:     { label: 'Google', url: q => `https://www.google.com/search?q=${q}` },
  brave:      { label: 'Brave',  url: q => `https://search.brave.com/search?q=${q}` },
  bing:       { label: 'Bing',   url: q => `https://www.bing.com/search?q=${q}` },
  kagi:       { label: 'Kagi',   url: q => `https://kagi.com/search?q=${q}` },
};

export const SEARCH_ENGINES = ENGINES;

export async function renderSearch(container) {
  const engineKey = await Storage.get('searchEngine', 'duckduckgo');
  const engine = ENGINES[engineKey] || ENGINES.duckduckgo;

  const wrapper = document.createElement('div');
  wrapper.className = 'search-container';

  const prompt = document.createElement('span');
  prompt.className = 'search-prompt text-dim';
  prompt.textContent = 'SEARCH //';

  const engineBadge = document.createElement('span');
  engineBadge.className = 'search-engine-badge text-magenta';
  engineBadge.textContent = engine.label;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  input.placeholder = 'type query...';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const hint = document.createElement('span');
  hint.className = 'search-hint text-dim';
  hint.textContent = '[/] focus  [Enter] search  [Esc] clear';

  wrapper.appendChild(prompt);
  wrapper.appendChild(engineBadge);
  wrapper.appendChild(input);
  wrapper.appendChild(hint);
  container.appendChild(wrapper);

  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        const key = await Storage.get('searchEngine', 'duckduckgo');
        const eng = ENGINES[key] || ENGINES.duckduckgo;
        window.location.href = eng.url(encodeURIComponent(query));
      }
    } else if (event.key === 'Escape') {
      input.value = '';
      input.blur();
    }
  });

  return wrapper;
}
