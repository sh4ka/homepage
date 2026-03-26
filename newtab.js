import { Storage } from './js/storage.js';
import { ShortcutManager } from './js/shortcuts.js';
import { renderAsciiHeader } from './js/modules/ascii.js';
import { renderClock } from './js/modules/clock.js';
import { renderLinks, refreshLinks } from './js/modules/links.js';
import { renderSearch } from './js/modules/search.js';
import { renderStats } from './js/modules/stats.js';
import { renderRSS, refreshRSS } from './js/modules/rss.js';
import { initExportShortcut } from './js/export.js';

const HACKER_QUOTES = [
  '"The only secure computer is one that\'s unplugged." — Wozniak',
  '"Information wants to be free." — Stewart Brand',
  '"We are all hackers now." — Wired',
  '"In the information age, the pen is a laser beam." — Anon',
  '"Privacy is not something that I\'m merely entitled to, it\'s an absolute prerequisite." — Marlon Brando',
  '"Security is always excessive until it\'s not enough." — Robbie Sinclair',
  '"The internet is becoming the town square." — Bill Gates',
  '"Any sufficiently advanced technology is indistinguishable from magic." — Clarke',
  '"Code is law." — Lawrence Lessig',
  '"One person\'s data is another person\'s privacy violation." — Anon',
];

const TIME_MESSAGES = {
  late_night: { text: 'Late night hack session...', cls: 'text-magenta' },
  morning:    { text: 'Morning boot sequence...', cls: 'text-yellow' },
  day:        { text: 'Systems operational.', cls: 'text-green' },
  evening:    { text: 'Evening protocol active.', cls: 'text-cyan' },
  night:      { text: 'Night mode engaged.', cls: 'text-magenta' },
};

function getTimeMessage(hour) {
  if (hour < 6) return TIME_MESSAGES.late_night;
  if (hour < 10) return TIME_MESSAGES.morning;
  if (hour < 18) return TIME_MESSAGES.day;
  if (hour < 22) return TIME_MESSAGES.evening;
  return TIME_MESSAGES.night;
}

async function renderGreeting(container) {
  const handle = await Storage.get('handle', 'operator');
  const greetingSettings = await Storage.get('greeting', { quotes: true, timeAware: true });
  const hour = new Date().getHours();

  const promptLine = document.createElement('div');
  promptLine.className = 'greeting-prompt text-green glow-green';
  promptLine.textContent = `root@${handle} ~ $`;
  container.appendChild(promptLine);

  if (greetingSettings.timeAware) {
    const msg = getTimeMessage(hour);
    const msgLine = document.createElement('div');
    msgLine.className = `greeting-message ${msg.cls}`;
    msgLine.textContent = msg.text;
    container.appendChild(msgLine);
  }

  if (greetingSettings.quotes) {
    const quote = HACKER_QUOTES[Math.floor(Math.random() * HACKER_QUOTES.length)];
    const quoteLine = document.createElement('div');
    quoteLine.className = 'greeting-quote text-dim';
    quoteLine.textContent = quote;
    container.appendChild(quoteLine);
  }
}

async function init() {
  await Storage.init();

  const onboardingComplete = await Storage.get('onboardingComplete', false);

  ShortcutManager.init();
  initExportShortcut();

  try {
    renderAsciiHeader(document.getElementById('ascii-header'));
  } catch (e) { console.error('[~/page] ascii error:', e); }

  try {
    await renderGreeting(document.getElementById('greeting'));
  } catch (e) { console.error('[~/page] greeting error:', e); }

  try {
    renderClock(document.getElementById('clock'));
  } catch (e) { console.error('[~/page] clock error:', e); }

  try {
    renderSearch(document.getElementById('search'));
  } catch (e) { console.error('[~/page] search error:', e); }

  try {
    await renderLinks(document.getElementById('links'));
  } catch (e) { console.error('[~/page] links error:', e); }

  try {
    await renderStats(document.getElementById('stats'));
  } catch (e) { console.error('[~/page] stats error:', e); }

  try {
    await renderRSS(document.getElementById('rss'));
  } catch (e) { console.error('[~/page] rss error:', e); }

  if (!onboardingComplete) {
    try {
      const { checkFirstRun } = await import('./js/onboarding.js');
      await checkFirstRun();
    } catch (e) { console.error('[~/page] onboarding error:', e); }
  }

  document.getElementById('main').focus();
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    refreshLinks();
    refreshRSS();
  }
});
