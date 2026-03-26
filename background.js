// ~/page Background Service Worker
// MV3 non-persistent service worker — uses browser.alarms instead of setInterval

const ALARM_NAME = 'rss-refresh';
const MAX_ITEMS_PER_FEED = 10;

// === Storage helpers (can't import modules in MV3 service worker easily) ===
async function storageGet(key, defaultValue) {
  try {
    const result = await browser.storage.local.get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (err) {
    console.error('[~/page BG] Storage get error:', err);
    return defaultValue;
  }
}

async function storageSet(key, value) {
  try {
    await browser.storage.local.set({ [key]: value });
  } catch (err) {
    console.error('[~/page BG] Storage set error:', err);
  }
}

// === Install Handler ===
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[~/page BG] Installed:', details.reason);

  // Set install date if first install
  if (details.reason === 'install') {
    const stats = await storageGet('stats', { installDate: null, tabsOpened: 0 });
    if (!stats.installDate) {
      await storageSet('stats', { ...stats, installDate: Date.now() });
    }
  }

  // Create/recreate RSS alarm
  const refreshMinutes = await storageGet('feedRefreshMinutes', 30);
  await browser.alarms.create(ALARM_NAME, {
    periodInMinutes: refreshMinutes,
    delayInMinutes: 1
  });
  console.log('[~/page BG] RSS alarm created, period:', refreshMinutes, 'minutes');
});

// === Alarm Handler ===
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[~/page BG] RSS alarm triggered');
    await refreshAllFeeds();
  }
});

// === Message Handler ===
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshFeeds') {
    refreshAllFeeds().then(cache => sendResponse({ success: true, cache }));
    return true; // Keep message channel open for async response
  }

  if (message.action === 'requestFeedPermission') {
    const origin = getOrigin(message.url);
    if (!origin) {
      sendResponse({ success: false, error: 'Invalid URL' });
      return;
    }
    browser.permissions.request({ origins: [`${origin}/*`] })
      .then(granted => sendResponse({ success: granted }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// === RSS Refresh Logic ===
async function refreshAllFeeds() {
  const feeds = await storageGet('feeds', []);
  const feedCache = await storageGet('feedCache', {});

  if (!feeds || feeds.length === 0) {
    return feedCache;
  }

  const updatedCache = { ...feedCache };

  for (const feed of feeds) {
    if (!feed.url) continue;

    const origin = getOrigin(feed.url);
    if (!origin) continue;

    // Check host permission before fetching
    try {
      const hasPermission = await browser.permissions.contains({
        origins: [`${origin}/*`]
      });

      if (!hasPermission) {
        updatedCache[feed.url] = {
          ...(updatedCache[feed.url] || {}),
          url: feed.url,
          title: feed.title || feed.url,
          error: 'PERMISSION_NEEDED',
          lastFetched: updatedCache[feed.url]?.lastFetched || null,
          items: updatedCache[feed.url]?.items || [],
        };
        continue;
      }
    } catch (err) {
      console.error('[~/page BG] Permission check error:', err);
      continue;
    }

    // Fetch and parse feed
    try {
      const response = await fetch(feed.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const text = await response.text();
      const items = parseFeed(text, feed.url);

      updatedCache[feed.url] = {
        url: feed.url,
        title: feed.title || extractFeedTitle(text) || feed.url,
        lastFetched: Date.now(),
        items: items.slice(0, MAX_ITEMS_PER_FEED),
        error: null,
      };
    } catch (err) {
      console.error('[~/page BG] Feed fetch error:', feed.url, err.message);
      // Keep previous cache, add error flag
      updatedCache[feed.url] = {
        ...(updatedCache[feed.url] || {}),
        url: feed.url,
        title: feed.title || feed.url,
        error: 'FEED OFFLINE',
        lastFetched: updatedCache[feed.url]?.lastFetched || null,
        items: updatedCache[feed.url]?.items || [],
      };
    }
  }

  await storageSet('feedCache', updatedCache);
  return updatedCache;
}

// === XML Parsing ===
function parseFeed(xmlText, feedUrl) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // RSS 2.0: look for <item> elements
    const rssItems = doc.querySelectorAll('item');
    if (rssItems.length > 0) {
      return Array.from(rssItems).map(item => ({
        title: item.querySelector('title')?.textContent?.trim() || '(no title)',
        link: item.querySelector('link')?.textContent?.trim() || feedUrl,
        date: item.querySelector('pubDate')?.textContent?.trim() || null,
      }));
    }

    // Atom: look for <entry> elements
    const atomEntries = doc.querySelectorAll('entry');
    if (atomEntries.length > 0) {
      return Array.from(atomEntries).map(entry => ({
        title: entry.querySelector('title')?.textContent?.trim() || '(no title)',
        link: entry.querySelector('link')?.getAttribute('href') || feedUrl,
        date: entry.querySelector('updated')?.textContent?.trim() || null,
      }));
    }

    return [];
  } catch (err) {
    console.error('[~/page BG] Parse error:', err);
    return [];
  }
}

function extractFeedTitle(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    return doc.querySelector('channel > title, feed > title')?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function getOrigin(url) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return null;
  }
}
