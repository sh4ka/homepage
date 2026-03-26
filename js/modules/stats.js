import { Storage } from '../storage.js';

let statsContainer = null;
let statsInterval = null;

export async function renderStats(container) {
  statsContainer = container;

  try {
    const currentStats = await Storage.get('stats', { installDate: null, tabsOpened: 0 });
    await Storage.set('stats', {
      ...currentStats,
      tabsOpened: (currentStats.tabsOpened || 0) + 1,
      installDate: currentStats.installDate || Date.now()
    });
  } catch (err) {
    console.error('[~/page Stats] Counter error:', err);
  }

  await updateStats(container);
  statsInterval = setInterval(() => updateStats(container), 30000);
}

export function refreshStats() {
  if (statsContainer) updateStats(statsContainer);
}

async function updateStats(container) {
  container.innerHTML = '';

  const data = await gatherStats();
  const lines = buildStatLines(data);

  const pre = document.createElement('pre');
  pre.className = 'stats-block font-body';

  const width = 36;
  const topBorder = '┌─── SYSTEM ' + '─'.repeat(width - 13) + '┐';
  const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';

  let output = topBorder + '\n';
  lines.forEach(({ label, value, colorClass }) => {
    const paddedLabel = label.padEnd(11);
    const line = `│ ${paddedLabel}// ${value}`;
    const paddedLine = line.padEnd(width - 1) + '│';
    output += paddedLine + '\n';
  });
  output += bottomBorder;

  pre.textContent = output;

  // Apply colors by rebuilding with spans
  container.appendChild(buildColoredStats(lines, width));
}

function buildColoredStats(lines, width) {
  const pre = document.createElement('pre');
  pre.className = 'stats-block font-body';

  const topBorder2 = '┌─── SYSTEM ' + '─'.repeat(width - 13) + '┐\n';
  pre.appendChild(document.createTextNode(topBorder2));

  lines.forEach(({ label, value, colorClass }) => {
    const labelStr = `│ ${label.padEnd(11)}// `;
    pre.appendChild(document.createTextNode(labelStr));

    const valueSpan = document.createElement('span');
    valueSpan.className = colorClass || 'text-green';
    const paddedValue = value;
    valueSpan.textContent = paddedValue;
    pre.appendChild(valueSpan);

      const lineLength = labelStr.length + paddedValue.length;
    const padding = Math.max(0, width - 1 - lineLength);
    pre.appendChild(document.createTextNode(' '.repeat(padding) + '│\n'));
  });

  const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';
  pre.appendChild(document.createTextNode(bottomBorder));

  return pre;
}

async function gatherStats() {
  const results = {
    uptime: '---',
    tabs: '---',
    windows: '---',
    bookmarks: '---',
    feeds: '---',
    sessions: '---',
    storage: '---',
  };

  try {
    const stats = await Storage.get('stats', { installDate: null, tabsOpened: 0 });
    if (stats.installDate) {
      const diffMs = Date.now() - stats.installDate;
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      results.uptime = `${days}d ${hours}h ${mins}m`;
    }
    results.sessions = String(stats.tabsOpened || 0);
  } catch (err) {
    console.error('[~/page Stats] uptime:', err);
  }

  try {
    const tabs = await browser.tabs.query({});
    results.tabs = String(tabs.length);
  } catch (err) {
    results.tabs = 'N/A';
  }

  try {
    const windows = await browser.windows.getAll();
    results.windows = String(windows.length);
  } catch (err) {
    results.windows = 'N/A';
  }

  try {
    const tree = await browser.bookmarks.getTree();
    results.bookmarks = String(countBookmarks(tree));
  } catch (err) {
    results.bookmarks = 'N/A';
  }

  try {
    const feeds = await Storage.get('feeds', []);
    results.feeds = String(feeds.length);
  } catch (err) {
    results.feeds = '0';
  }

  try {
    if (browser.storage.local.getBytesInUse) {
      const bytes = await browser.storage.local.getBytesInUse(null);
      results.storage = formatBytes(bytes);
    } else {
      const all = await Storage.getAll();
      const bytes = new TextEncoder().encode(JSON.stringify(all)).length;
      results.storage = formatBytes(bytes);
    }
  } catch (err) {
    results.storage = 'N/A';
  }

  return results;
}

function buildStatLines(data) {
  return [
    { label: 'UPTIME',    value: data.uptime,    colorClass: 'text-green' },
    { label: 'TABS',      value: data.tabs,      colorClass: 'text-green' },
    { label: 'WINDOWS',   value: data.windows,   colorClass: 'text-green' },
    { label: 'BOOKMARKS', value: data.bookmarks, colorClass: 'text-green' },
    { label: 'FEEDS',     value: data.feeds,     colorClass: 'text-green' },
    { label: 'SESSIONS',  value: data.sessions,  colorClass: 'text-green' },
    { label: 'STORAGE',   value: data.storage,   colorClass: 'text-green' },
    { label: 'CPU/RAM',   value: 'ACCESS DENIED', colorClass: 'text-magenta' },
  ];
}

function countBookmarks(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.url) count++;
    if (node.children) count += countBookmarks(node.children);
  }
  return count;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export { updateStats };
