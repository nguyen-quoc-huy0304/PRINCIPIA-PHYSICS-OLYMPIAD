/* PRINCIPIA Error Log — local diagnostics with privacy-aware redaction. */
(() => {
  'use strict';
  if (window.PrincipiaErrorLog) return;
  const STORE = 'principia_error_log_v1', MAX_ENTRIES = 100, DEDUPE_MS = 10000;
  const SECRET_QUERY = /([?&](?:access[_-]?token|refresh[_-]?token|session[_-]?token|api[_-]?key|apikey|client[_-]?secret|private[_-]?key|secret|password|authorization|auth|cookie|key=)[^&#\s]*/gi;
  const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
  const SECRET_ASSIGNMENT = /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?token|client[_-]?secret|private[_-]?key|password|secret|authorization|cookie)\s*[:=]\s*["']?[^\s,;"']+/gi;
  const SECRET_JSON_STRING = /((?:["'])(?:access[_-]?token|refresh[_-]?token|session[_-]?token|api[_-]?key|apikey|client[_-]?secret|private[_-]?key|secret|password|authorization|auth|cookie)(?:["'])\s*:\s*)(["'])(?:\\.|(?!\2)[^\\])*\2/gi;
  const SECRET_JSON_SCALAR = /((?:["'])(?:access[_-]?token|refresh[_-]?token|session[_-]?token|api[_-]?key|apikey|client[_-]?secret|private[_-]?key|secret|password|authorization|auth|cookie)(?:["'])\s*:\s*)(?:null|true|false|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/gi;
  const bounded = (value, limit) => String(value == null ? '' : value).slice(0, limit);
  function redact(value, limit = 3000) {
    return bounded(value, limit).replace(SECRET_QUERY, '$1[REDACTED]').replace(BEARER, 'Bearer [REDACTED]').replace(SECRET_JSON_STRING, (_match, prefix, quote) => prefix + quote + '[REDACTED]' + quote).replace(SECRET_JSON_SCALAR, '$1[REDACTED]').replace(SECRET_ASSIGNMENT, match => match.replace(/([:=]\s*["']?)[^\s,;"']+$/, '$1[REDACTED]'));
  }
  function errorMessage(error) {
    if (error && typeof error === 'object') {
      const message = error.message ?? error.reason ?? error.error ?? '';
      if (message !== '') return String(message);
    }
    return String(error == null ? 'Unknown error' : error);
  }
  function normalize(error, source = 'unknown', metadata = {}) {
    const message = redact(errorMessage(error), 1200);
    const stack = redact(error && typeof error === 'object' ? error.stack || '' : '', 4000);
    const filename = metadata.filename || error?.filename || '';
    return {
      id: '', fingerprint: '', kind: bounded(metadata.kind || 'error', 32),
      message: message || 'Unknown error',
      source: redact(source || filename || 'unknown', 600),
      stack,
      filename: redact(filename, 600),
      line: Number.isSafeInteger(metadata.line) && metadata.line > 0 ? metadata.line : null,
      column: Number.isSafeInteger(metadata.column) && metadata.column > 0 ? metadata.column : null,
      time: Number.isFinite(metadata.time) ? metadata.time : Date.now(),
      lastSeen: Number.isFinite(metadata.time) ? metadata.time : Date.now(),
      count: 1
    };
  }
  function fingerprint(entry) {
    const input = [entry.kind, entry.message, entry.source, entry.stack.split('\n').slice(0, 3).join('\n')].join('|');
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16);
  }
  function read() {
    try {
      const raw = localStorage.getItem(STORE), value = raw ? JSON.parse(raw) : [];
      return Array.isArray(value) ? value.filter(item => item && typeof item.message === 'string' && typeof item.fingerprint === 'string').slice(0, MAX_ENTRIES).map(item => {
        const time = Number.isFinite(item.time) ? item.time : Date.now();
        return { id: bounded(item.id, 100), fingerprint: bounded(item.fingerprint, 100), kind: bounded(item.kind || 'error', 32), message: redact(item.message, 1200), source: redact(item.source || 'unknown', 600), stack: redact(item.stack || '', 4000), filename: redact(item.filename || '', 600), line: Number.isSafeInteger(item.line) && item.line > 0 ? item.line : null, column: Number.isSafeInteger(item.column) && item.column > 0 ? item.column : null, time, lastSeen: Number.isFinite(item.lastSeen) ? item.lastSeen : time, count: Number.isSafeInteger(item.count) && item.count > 0 ? Math.min(999999, item.count) : 1 };
      }) : [];
    } catch (_) { return []; }
  }
  let entries = read(), panel = null, listNode = null, searchNode = null, previousFocus = null;
  function persist() { try { localStorage.setItem(STORE, JSON.stringify(entries)); } catch (error) { console.warn('[PRINCIPIA Error Log] Local storage unavailable', error); } }
  function report(error, source, metadata = {}) {
    const entry = normalize(error, source, metadata); entry.fingerprint = fingerprint(entry);
    const previous = entries[0];
    if (previous && previous.fingerprint === entry.fingerprint && entry.time >= previous.lastSeen && entry.time - previous.lastSeen <= DEDUPE_MS) {
      entries[0] = { ...previous, lastSeen: entry.time, count: Math.min(999999, previous.count + 1) };
    } else {
      entry.id = entry.fingerprint + '-' + entry.time.toString(36);
      entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    }
    persist(); if (panel && !panel.hidden) render();
    return entries[0];
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function render() {
    if (!listNode) return;
    const query = String(searchNode?.value || '').trim().toLocaleLowerCase();
    const filtered = entries.filter(entry => !query || (entry.message + ' ' + entry.source + ' ' + entry.filename).toLocaleLowerCase().includes(query));
    listNode.replaceChildren();
    if (!filtered.length) { listNode.appendChild(element('p', 'pr-error-empty', entries.length ? 'Không có lỗi phù hợp.' : 'Chưa ghi nhận lỗi nào.')); return; }
    filtered.forEach(entry => {
      const card = element('article', 'pr-error-entry');
      const head = element('div', 'pr-error-head');
      const title = element('strong', '', entry.message); title.title = entry.message;
      const time = element('time', '', new Date(entry.lastSeen).toLocaleString());
      head.append(title, time); card.appendChild(head);
      const meta = element('div', 'pr-error-meta', entry.source + (entry.count > 1 ? ' · ' + entry.count + ' lần' : '')); card.appendChild(meta);
      if (entry.filename) card.appendChild(element('div', 'pr-error-meta', entry.filename + (entry.line ? ':' + entry.line + (entry.column ? ':' + entry.column : '') : '')));
      if (entry.stack) { const details = element('details'); details.appendChild(element('summary', '', 'Stack trace')); details.appendChild(element('pre', 'pr-error-stack', entry.stack)); card.appendChild(details); }
      listNode.appendChild(card);
    });
  }
  function ensurePanel() {
    if (panel) return panel;
    const style = element('style'); style.textContent = '#principiaErrorLog{position:fixed;inset:0;z-index:2147483600;background:#050712dd;backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:12px;color:var(--text,#f7f7ff);font:inherit}#principiaErrorLog[hidden]{display:none}#principiaErrorLog .pr-error-dialog{width:min(960px,100%);max-height:92vh;display:flex;flex-direction:column;border:1px solid var(--line,#475569);border-radius:16px;background:var(--card,#111827);box-shadow:0 24px 80px #0009;overflow:hidden}#principiaErrorLog header,#principiaErrorLog footer{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line,#475569)}#principiaErrorLog footer{border-bottom:0;border-top:1px solid var(--line,#475569);justify-content:flex-end;flex-wrap:wrap}#principiaErrorLog header h2{margin:0;flex:1;font-size:18px}#principiaErrorLog button{font:inherit;cursor:pointer;border:1px solid var(--line,#475569);border-radius:9px;padding:8px 11px;background:transparent;color:inherit}#principiaErrorLog input{font:inherit;padding:10px 12px;border:1px solid var(--line,#475569);border-radius:10px;background:transparent;color:inherit;margin:12px 14px}#principiaErrorLog .pr-error-list{overflow:auto;padding:0 14px 14px;min-height:120px}#principiaErrorLog .pr-error-entry{padding:12px;border:1px solid var(--line,#475569);border-radius:12px;margin:8px 0;overflow-wrap:anywhere}#principiaErrorLog .pr-error-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}#principiaErrorLog .pr-error-head strong{flex:1}#principiaErrorLog time,#principiaErrorLog .pr-error-meta{font-size:12px;opacity:.7}#principiaErrorLog .pr-error-meta{margin-top:6px}#principiaErrorLog pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;max-height:240px;overflow:auto}#principiaErrorLog summary{cursor:pointer;margin-top:8px}#principiaErrorLog .pr-error-empty{padding:28px;text-align:center;opacity:.7}@media(max-width:600px){#principiaErrorLog{padding:0}#principiaErrorLog .pr-error-dialog{height:100%;max-height:100vh;border-radius:0}#principiaErrorLog .pr-error-head{display:block}}';
    document.head.appendChild(style);
    panel = element('div'); panel.id = 'principiaErrorLog'; panel.hidden = true;
    const dialog = element('section', 'pr-error-dialog'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-label', 'Nhật ký lỗi PRINCIPIA');
    const header = element('header'); header.appendChild(element('h2', '', 'Nhật ký lỗi · PRINCIPIA'));
    const closeButton = element('button', '', 'Đóng'); closeButton.type = 'button'; closeButton.addEventListener('click', close); header.appendChild(closeButton);
    searchNode = element('input'); searchNode.type = 'search'; searchNode.placeholder = 'Lọc theo lỗi, nguồn…'; searchNode.setAttribute('aria-label', 'Lọc nhật ký lỗi'); searchNode.addEventListener('input', render);
    listNode = element('div', 'pr-error-list');
    const footer = element('footer');
    const exportButton = element('button', '', 'Xuất JSON'); exportButton.type = 'button'; exportButton.addEventListener('click', exportJSON);
    const clearButton = element('button', '', 'Xóa nhật ký'); clearButton.type = 'button'; clearButton.addEventListener('click', () => { if (window.confirm('Xóa toàn bộ nhật ký lỗi trên thiết bị này?')) clear(); });
    footer.append(exportButton, clearButton);
    dialog.append(header, searchNode, listNode, footer); panel.appendChild(dialog);
    panel.addEventListener('click', event => { if (event.target === panel) close(); }); document.body.appendChild(panel);
    return panel;
  }
  function open() { const root = ensurePanel(); previousFocus = document.activeElement; root.hidden = false; render(); searchNode.focus(); }
  function close() { if (panel) panel.hidden = true; if (previousFocus?.isConnected) previousFocus.focus(); }
  function clear() { entries = []; persist(); render(); }
  function exportJSON() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = element('a'); link.href = url; link.download = 'principia-error-log.json'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  window.addEventListener('error', event => report(event.error || event.message, 'window:error', { filename: event.filename, line: event.lineno, column: event.colno, kind: 'error' }));
  window.addEventListener('unhandledrejection', event => report(event.reason, 'unhandledrejection', { kind: 'unhandledrejection' }));
  let coreBound = false;
  function bindCore() {
    if (coreBound || !window.PrincipiaCore || typeof window.PrincipiaCore.on !== 'function') return;
    coreBound = true;
    window.PrincipiaCore.on('core:error', detail => report(detail?.error, detail?.source || 'core', { time: detail?.time, kind: 'core:error' }));
  }
  bindCore();
  window.addEventListener('principia:core-ready', bindCore, { once: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel && !panel.hidden) close(); });
  window.PrincipiaErrorLog = Object.freeze({ report, list: () => entries.slice(), clear, open, close, exportJSON, normalize, redact, fingerprint });
})();