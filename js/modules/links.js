import { Storage } from '../storage.js';

let linksContainer = null;

export async function renderLinks(container) {
  linksContainer = container;

  try {
    const links = await Storage.get('links', []);
    const linksGrid = await Storage.get('linksGrid', { cols: 3, rows: 2 });
    renderLinksDOM(container, links, linksGrid);
  } catch (err) {
    console.error('[~/page Links]', err);
    container.textContent = 'ERROR LOADING LINKS';
  }
}

export async function refreshLinks() {
  if (!linksContainer) return;
  linksContainer.innerHTML = '';
  await renderLinks(linksContainer);
}

function renderLinksDOM(container, links, linksGrid) {
  if (!links || links.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'links-empty text-dim';
    emptyMsg.textContent = 'NO LINKS CONFIGURED // Press , to open settings';
    container.appendChild(emptyMsg);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'links-grid';
  grid.style.setProperty('--link-cols', linksGrid.cols || 3);

  const maxLinks = Math.min(links.length, 12);

  links.slice(0, maxLinks).forEach((link, index) => {
    const keyNum = index === 9 ? '0' : String(index + 1);
    const domain = extractDomain(link.url);

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.className = 'link-item';
    anchor.dataset.index = String(index);

    const indexSpan = document.createElement('span');
    indexSpan.className = 'link-index text-magenta';
    indexSpan.textContent = `[${keyNum}]`;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'link-label text-cyan';
    labelSpan.textContent = link.label || domain;

    const urlSpan = document.createElement('span');
    urlSpan.className = 'link-url text-dim';
    urlSpan.textContent = domain;

    anchor.appendChild(indexSpan);
    anchor.appendChild(labelSpan);
    anchor.appendChild(urlSpan);
    grid.appendChild(anchor);
  });

  container.appendChild(grid);

  // ShortcutManager dispatches hackpage:open-link with { detail: { index: N } } for number key shortcuts
  document.addEventListener('tildepage:open-link', (e) => {
    const idx = e.detail.index;
    if (idx >= 0 && idx < links.length) {
      window.location.href = links[idx].url;
    }
  }, { once: false });
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
