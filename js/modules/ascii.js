const ASCII_ART = '~/page';

export function renderAsciiHeader(container) {
  const pre = document.createElement('pre');
  pre.className = 'ascii-header glow-cyan';
  pre.textContent = ASCII_ART;
  pre.dataset.text = ASCII_ART;
  container.appendChild(pre);
  return pre;
}
