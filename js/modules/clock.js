let clockInterval = null;

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatHUD(date) {
  const day = DAYS[date.getDay()];
  const dateNum = pad(date.getDate());
  const month = MONTHS[date.getMonth()];
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  const secs = pad(date.getSeconds());
  return `${day} ${dateNum} ${month} // ${hours}:${mins}:${secs}`;
}

function updateClock(epochEl, isoEl, localEl) {
  const now = new Date();
  const epoch = Math.floor(Date.now() / 1000);
  epochEl.textContent = String(epoch);
  isoEl.textContent = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');
  localEl.textContent = formatHUD(now);
}

export function renderClock(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'clock-module';

  // EPOCH line
  const epochLine = document.createElement('div');
  epochLine.className = 'clock-line';
  const epochLabel = document.createElement('span');
  epochLabel.className = 'clock-label';
  epochLabel.textContent = 'EPOCH // ';
  const epochValue = document.createElement('span');
  epochValue.className = 'clock-value text-magenta';
  epochLine.appendChild(epochLabel);
  epochLine.appendChild(epochValue);

  // ISO line
  const isoLine = document.createElement('div');
  isoLine.className = 'clock-line';
  const isoLabel = document.createElement('span');
  isoLabel.className = 'clock-label';
  isoLabel.textContent = 'ISO   // ';
  const isoValue = document.createElement('span');
  isoValue.className = 'clock-value text-yellow';
  isoLine.appendChild(isoLabel);
  isoLine.appendChild(isoValue);

  // LOCAL/HUD line
  const localLine = document.createElement('div');
  localLine.className = 'clock-line';
  const localLabel = document.createElement('span');
  localLabel.className = 'clock-label';
  localLabel.textContent = 'LOCAL // ';
  const localValue = document.createElement('span');
  localValue.className = 'clock-value text-cyan glow-cyan';
  localValue.style.fontSize = '1.2em';
  localLine.appendChild(localLabel);
  localLine.appendChild(localValue);

  wrapper.appendChild(epochLine);
  wrapper.appendChild(isoLine);
  wrapper.appendChild(localLine);
  container.appendChild(wrapper);

  // Style the wrapper
  wrapper.style.fontFamily = 'var(--font-body)';

  // Initial update + set interval
  updateClock(epochValue, isoValue, localValue);
  clockInterval = setInterval(() => updateClock(epochValue, isoValue, localValue), 1000);

  return wrapper;
}

export function destroyClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
