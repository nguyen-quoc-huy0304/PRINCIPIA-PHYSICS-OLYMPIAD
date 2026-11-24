/* PRINCIPIA Study With Me — pin, resize, mute and minimize controls. */
(function () {
  'use strict';

  const ROOT = '#principiaProMastery';
  let observer = null;

  function styles() {
    if (document.getElementById('principiaStudyPlayerStyles')) return;
    const style = document.createElement('style');
    style.id = 'principiaStudyPlayerStyles';
    style.textContent = '#ppmVideo.pps-pinned{position:fixed!important;right:14px!important;bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;width:380px;max-width:90vw;z-index:1200;padding:8px;background:var(--card,#171e30);border:1px solid var(--line,#39435b);border-radius:14px;box-shadow:0 12px 36px #0008;resize:both;overflow:auto}#ppmVideo.pps-pinned iframe{display:block;width:100%;aspect-ratio:16/9;border-radius:8px}#ppmVideo.pps-minimized{height:42px!important;min-height:42px;resize:none}#ppmVideo.pps-minimized iframe{display:none!important}#ppmVideo .pps-label{font-size:12px;font-weight:700;padding:5px 7px;display:none}#ppmVideo.pps-minimized .pps-label{display:block}@media(max-width:600px){#ppmVideo.pps-pinned{right:8px!important;bottom:calc(145px + env(safe-area-inset-bottom,0px))!important;width:88vw;max-width:88vw}}';
    document.head.appendChild(style);
  }
  function ensureControls() {
    const player = document.querySelector(ROOT + ' #ppmVideo');
    const iframe = player?.querySelector('iframe');
    const actions = player?.closest('section')?.querySelector('.ppm-actions');
    if (!player || !iframe || !actions) {
      actions?.querySelectorAll('[data-pps-control]').forEach(node => node.remove());
      return;
    }
    if (actions.querySelector('[data-pps-control="pin"]')) return;
    styles();
    player.insertAdjacentHTML('afterbegin', '<div class="pps-label">Study With Me · PRINCIPIA</div>');
    const pin = makeButton('Ghim góc', 'pin');
    const minimize = makeButton('Thu nhỏ', 'minimize');
    const mute = makeButton('Tắt tiếng', 'mute');
    const width = document.createElement('input');
    width.type = 'range'; width.min = '260'; width.max = '600'; width.step = '10'; width.value = '380';
    width.title = 'Điều chỉnh chiều rộng cửa sổ video';
    width.setAttribute('aria-label', 'Điều chỉnh chiều rộng video');
    width.dataset.ppsControl = 'width';
    width.style.cssText = 'width:100px;max-width:30vw;align-self:center';
    actions.append(pin, minimize, mute, width);

    pin.addEventListener('click', () => {
      const active = player.classList.toggle('pps-pinned');
      pin.textContent = active ? 'Bỏ ghim' : 'Ghim góc';
      if (active) player.style.width = width.value + 'px';
      else { player.style.width = ''; player.style.height = ''; player.classList.remove('pps-minimized'); minimize.textContent = 'Thu nhỏ'; iframe.style.display = ''; }
    });
    minimize.addEventListener('click', () => {
      if (!player.classList.contains('pps-pinned')) {
        player.classList.add('pps-pinned');
        pin.textContent = 'Bỏ ghim';
      }
      const active = player.classList.toggle('pps-minimized');
      iframe.style.display = active ? 'none' : '';
      minimize.textContent = active ? 'Mở rộng' : 'Thu nhỏ';
    });
    mute.addEventListener('click', () => {
      try {
        const url = new URL(iframe.src);
        const muted = url.searchParams.get('mute') !== '1';
        url.searchParams.set('mute', muted ? '1' : '0');
        iframe.src = url.toString();
        mute.textContent = muted ? 'Bật tiếng' : 'Tắt tiếng';
      } catch (_) { mute.textContent = 'Không hỗ trợ'; }
    });
    width.addEventListener('input', () => {
      if (player.classList.contains('pps-pinned')) player.style.width = width.value + 'px';
    });
  }
  function makeButton(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.ppsControl = action;
    button.style.cssText = 'font-size:12px;padding:7px 9px;border:1px solid var(--line,#39435b);border-radius:9px;background:transparent;color:inherit';
    return button;
  }
  function init() {
    if (observer || !document.body) return;
    observer = new MutationObserver(ensureControls);
    observer.observe(document.body, { childList: true, subtree: true });
    ensureControls();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();