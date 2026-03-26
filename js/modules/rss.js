import { Storage } from '../storage.js';

let rssContainer = null;

export async function renderRSS(container) {
  rssContainer = container;

  const feedCache = await Storage.get('feedCache', {});
  const refreshMinutes = await Storage.get('feedRefreshMinutes', 30);
  const urls = Object.keys(feedCache);

  if (urls.length > 0) {
    const oldestFetch = Math.min(...urls.map(url => feedCache[url].lastFetched || 0));
    const ageMs = Date.now() - oldestFetch;
    if (ageMs > refreshMinutes * 60 * 1000) {
      try {
        const response = await browser.runtime.sendMessage({ action: 'refreshFeeds' });
        if (response?.cache) {
          renderFeedDOM(container, response.cache);
          return;
        }
      } catch (err) {
        // Background may not be running — fall through to cached data
      }
    }
  }

  renderFeedDOM(container, feedCache);
}

export async function refreshRSS() {
  if (!rssContainer) return;
  try {
    const response = await browser.runtime.sendMessage({ action: 'refreshFeeds' });
    rssContainer.innerHTML = '';
    renderFeedDOM(rssContainer, response?.cache || await Storage.get('feedCache', {}));
  } catch (err) {
    console.error('[~/page RSS]', err);
  }
}

function renderFeedDOM(container, feedCache) {
  container.innerHTML = '';
  const urls = Object.keys(feedCache || {});

  const topSep = document.createElement('div');
  topSep.className = 'rss-separator text-dim';
  topSep.textContent = '── RSS FEEDS ' + '─'.repeat(22);
  container.appendChild(topSep);

  if (urls.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'rss-empty text-dim';
    empty.textContent = 'NO FEEDS CONFIGURED // Press , to open settings';
    container.appendChild(empty);
  } else {
    urls.forEach(url => {
      const feedData = feedCache[url];
      renderFeedSection(container, feedData);
    });
  }

  const bottomSep = document.createElement('div');
  bottomSep.className = 'rss-separator text-dim';
  bottomSep.textContent = '── END FEEDS ' + '─'.repeat(21);
  container.appendChild(bottomSep);

  // Listen for 'r' shortcut dispatched by ShortcutManager
  document.addEventListener('hackpage:refresh-rss', async () => {
    await refreshRSS();
  }, { once: false });
}

function renderFeedSection(container, feedData) {
  const section = document.createElement('div');
  section.className = 'rss-feed-section';

  const header = document.createElement('div');
  header.className = 'rss-feed-header';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'rss-feed-title text-yellow';
  titleSpan.textContent = '▸ ' + (feedData.title || feedData.url);

  const timeSpan = document.createElement('span');
  timeSpan.className = 'rss-feed-time text-dim';
  timeSpan.textContent = feedData.lastFetched
    ? '[' + relativeTime(feedData.lastFetched) + ']'
    : '[never]';

  if (feedData.error === 'FEED OFFLINE') {
    const offlineSpan = document.createElement('span');
    offlineSpan.className = 'rss-offline text-magenta';
    offlineSpan.textContent = ' [OFFLINE]';
    titleSpan.appendChild(offlineSpan);
  } else if (feedData.error === 'PERMISSION_NEEDED') {
    const permSpan = document.createElement('span');
    permSpan.className = 'rss-no-permission text-magenta';
    permSpan.textContent = ' [NO PERMISSION]';
    titleSpan.appendChild(permSpan);
  }

  header.appendChild(titleSpan);
  header.appendChild(timeSpan);
  section.appendChild(header);

  const items = (feedData.items || []).slice(0, 5);
  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'rss-item';

    const link = document.createElement('a');
    link.href = item.link || '#';
    link.className = 'rss-item-link text-cyan';
    if (feedData.error === 'FEED OFFLINE') {
      link.className += ' rss-item-offline';
    }
    link.textContent = '  → ' + (item.title || '(no title)');

    itemEl.appendChild(link);
    section.appendChild(itemEl);
  });

  container.appendChild(section);
}

function relativeTime(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}
