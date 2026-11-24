/* PRINCIPIA Study With Me — persistent corner player with accessible controls. */
(() => {
  'use strict';

  const PLAYER_SELECTOR = '#principiaProMastery #ppmVideo';
  let observer = null;
  let activePlayer = null;
  let homePlaceholder = null;
  let reopenButton = null;

  function styles() {
    if (document.getElementById('principiaStudyPlayerStyles')) return;
    const style = document.createElement('style');
    style.id = 'principiaStudyPlayerStyles';
    style.textContent = [
      '#ppmVideo.pps-floating{position:fixed!important;right:14px!important;bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;width:380px;max-width:min(90vw,600px);z-index:2147483300;padding:9px;background:var(--card,#171e30);border:1px solid var(--line,#65729a);border-radius:15px;box-shadow:0 18px 48px #000a;resize:both;overflow:auto;color:var(--txt,#eef4ff)}',
      '#ppmVideo .pps-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
      '#ppmVideo .pps-toolbar button{font:600 11px/1.2 system-ui;padding:7px 9px;border:1px solid var(--line,#65729a);border-radius:9px;background:#ffffff0b;color:inherit;cursor:pointer}',
      '#ppmVideo .pps-toolbar button:focus-visible,#pps-reopen:focus-visible{outline:2px solid #a995ff;outline-offset:3px}',
      '#ppmVideo .pps-toolbar .pps-width{width:88px;max-width:24vw}',
      '#ppmVideo iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:9px}',
      '#ppmVideo.pps-minimized{height:auto!important;min-height:0;resize:none}',
      '#ppmVideo.pps-minimized iframe{display:none!important}',
      '#ppmVideo .pps-title{margin-right:auto;font-size:11px;font-weight:800;letter-spacing:.04em}',
      '#pps-reopen{position:fixed;right:14px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483301;padding:10px 13px;border:1px solid #a995ff88;border-radius:12px;background:#171d36;color:#fff;box-shadow:0 10px 28px #0008;font:600 12px system-ui}',
      '#principiaProMastery .pps-pinned-note{padding:12px;border:1px dashed var(--line,#65729a);border-radius:12px;color:var(--muted,#9aabc9);font-size:12px}',
      '@media(max-width:600px){#ppmVideo.pps-floating{right:8px!important;bottom:calc(145px + env(safe-area-inset-bottom,0px))!important;width:88vw;max-width:88vw;max-height:48vh}#ppmVideo.pps-floating iframe{max-height:30vh}#pps-reopen{right:8px;bottom:calc(145px + env(safe-area-inset-bottom,0px))}}',
      '@media(prefers-reduced-motion:reduce){#ppmVideo.pps-floating,#pps-reopen{scroll-behavior:auto}}'
    ].join('');
    document.head.appendChild(style);
  }

  function button(label, action) {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = label;
    node.dataset.ppsAction = action;
    return node;
  }

  function getPlayer() {
    if (activePlayer?.isConnected) return activePlayer;
    activePlayer = document.querySelector(PLAYER_SELECTOR);
    return activePlayer;
  }

  function pinnedNotice() {
    const notice = document.createElement('div');
    notice.className = 'pps-pinned-note';
    notice.textContent = 'Study With Me đang được ghim ở góc màn hình. Dùng nút điều khiển nổi để mở lại hoặc bỏ ghim.';
    return notice;
  }

  function ensureReopenButton() {
    if (reopenButton?.isConnected) return;
    reopenButton = button('▶ Mở Study With Me', 'reopen');
    reopenButton.id = 'pps-reopen';
    reopenButton.addEventListener('click', () => {
      const player = getPlayer();
      if (!player) return;
      player.hidden = false;
      reopenButton.remove();
      reopenButton = null;
      player.querySelector('[data-pps-action="hide"]')?.focus();
    });
    document.body.appendChild(reopenButton);
  }

  function setPinned(player, pinned) {
    if (pinned) {
      if (!homePlaceholder && player.parentNode) {
        homePlaceholder = document.createComment('PRINCIPIA Study With Me home position');
        player.parentNode.insertBefore(homePlaceholder, player);
      }
      styles();
      document.body.appendChild(player);
      player.classList.add('pps-floating');
      player.hidden = false;
      player.style.width = player.querySelector('.pps-width')?.value + 'px' || '380px';
      player.querySelector('[data-pps-action="pin"]').textContent = 'Bỏ ghim';
      document.querySelectorAll('#principiaProMastery #ppmVideo').forEach(duplicate => {
        if (duplicate !== player) duplicate.replaceWith(pinnedNotice());
      });
      return;
    }
    player.classList.remove('pps-floating', 'pps-minimized');
    player.style.width = '';
    player.style.height = '';
    const iframe = player.querySelector('iframe');
    if (iframe) iframe.style.display = '';
    if (homePlaceholder?.parentNode) homePlaceholder.parentNode.insertBefore(player, homePlaceholder);
    else {
      const notice = document.querySelector('#principiaProMastery .pps-pinned-note');
      if (notice) notice.replaceWith(player);
      else document.querySelector('#principiaProMastery .ppm-content')?.append(player);
    }
    homePlaceholder?.remove();
    homePlaceholder = null;
    player.querySelector('[data-pps-action="pin"]').textContent = 'Ghim góc';
    reopenButton?.remove();
    reopenButton = null;
  }

  function ensureControls() {
    const player = getPlayer();
    if (!player) return;
    const iframe = player.querySelector('iframe');
    if (!iframe) return;
    styles();
    if (!player.querySelector('.pps-toolbar')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'pps-toolbar';
      const title = document.createElement('span');
      title.className = 'pps-title';
      title.textContent = 'STUDY WITH ME';
      const pin = button('Ghim góc', 'pin');
      const minimize = button('Thu nhỏ', 'minimize');
      const mute = button('Tắt tiếng', 'mute');
      const hide = button('Ẩn', 'hide');
      const width = document.createElement('input');
      width.className = 'pps-width';
      width.type = 'range'; width.min = '260'; width.max = '600'; width.step = '10'; width.value = '380';
      width.title = 'Chiều rộng cửa sổ video'; width.setAttribute('aria-label', 'Chiều rộng cửa sổ video');
      toolbar.append(title, pin, minimize, mute, hide, width);
      player.prepend(toolbar);
      pin.addEventListener('click', () => setPinned(player, !player.classList.contains('pps-floating')));
      minimize.addEventListener('click', () => {
        if (!player.classList.contains('pps-floating')) setPinned(player, true);
        const minimized = player.classList.toggle('pps-minimized');
        iframe.style.display = minimized ? 'none' : '';
        minimize.textContent = minimized ? 'Mở rộng' : 'Thu nhỏ';
      });
      mute.addEventListener('click', () => {
        const muted = mute.dataset.muted !== 'true';
        try {
          iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] }), 'https://www.youtube-nocookie.com');
          mute.dataset.muted = String(muted);
          mute.textContent = muted ? 'Bật tiếng' : 'Tắt tiếng';
        } catch (_) {
          mute.textContent = 'Không hỗ trợ';
        }
      });
      hide.addEventListener('click', () => {
        if (!player.classList.contains('pps-floating')) setPinned(player, true);
        player.hidden = true;
        ensureReopenButton();
      });
      width.addEventListener('input', () => {
        if (player.classList.contains('pps-floating')) player.style.width = width.value + 'px';
      });
    }
    if (player.classList.contains('pps-floating')) {
      player.querySelector('[data-pps-action="pin"]').textContent = 'Bỏ ghim';
      document.querySelectorAll('#principiaProMastery #ppmVideo').forEach(duplicate => {
        if (duplicate !== player) duplicate.replaceWith(pinnedNotice());
      });
    }
  }

  function init() {
    if (observer || !document.body) return;
    observer = new MutationObserver(ensureControls);
    observer.observe(document.body, { childList: true, subtree: true });
    ensureControls();
    window.addEventListener('pagehide', () => observer?.disconnect(), { once: true });
  }

  window.PrincipiaStudyPlayer = Object.freeze({
    pin() { const player = getPlayer(); if (player) setPinned(player, true); },
    unpin() { const player = getPlayer(); if (player) setPinned(player, false); },
    hide() { const player = getPlayer(); if (player) { player.hidden = true; ensureReopenButton(); } }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
