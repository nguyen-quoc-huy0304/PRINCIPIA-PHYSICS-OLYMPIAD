'use strict';

const MAX_ITEMS = 50000;
const MAX_TEXT = 256;

function validateItems(items) {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    throw new TypeError('items must be an array of at most 50000 entries');
  }
  if (items.some(item => item === null || typeof item !== 'object' || Array.isArray(item))) {
    throw new TypeError('each item must be an object');
  }
}

function normalizeText(value) {
  return String(value ?? '').slice(0, MAX_TEXT).toLocaleLowerCase();
}

function execute(payload) {
  const { operation, items, query, fields, key, direction } = payload || {};
  validateItems(items);
  if (operation === 'search') {
    const term = normalizeText(query).trim();
    if (!term) return items.slice();
    const selected = Array.isArray(fields) && fields.length
      ? fields.filter(field => typeof field === 'string' && /^[a-zA-Z0-9_.-]{1,64}$/.test(field))
      : null;
    return items.filter(item => {
      const values = selected ? selected.map(field => item[field]) : Object.values(item);
      return values.some(value => normalizeText(value).includes(term));
    });
  }
  if (operation === 'sort') {
    if (typeof key !== 'string' || !/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) {
      throw new TypeError('sort key is invalid');
    }
    const sign = direction === 'desc' ? -1 : 1;
    return items.map((item, index) => ({ item, index })).sort((a, b) => {
      const left = a.item[key];
      const right = b.item[key];
      let result = 0;
      if (typeof left === 'number' && typeof right === 'number') result = left - right;
      else result = String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true });
      return result === 0 ? a.index - b.index : result * sign;
    }).map(entry => entry.item);
  }
  throw new TypeError('unsupported background data operation');
}

self.addEventListener('message', event => {
  const message = event.data || {};
  const { id } = message;
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    self.postMessage({ id, ok: true, result: execute(message.payload) });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error && error.message || 'Background task failed') });
  }
});
