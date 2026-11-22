/* PRINCIPIA CORE RUNTIME — migration foundation. Legacy features remain active during phased migration. */
(function (global) {
  'use strict';
  if (global.PrincipiaCore) return;

  const listeners = new Map();
  const modules = new Map();
  const started = new Set();

  function on(type, handler, options) {
    if (typeof handler !== 'function') return function () {};
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
    if (options && options.signal) {
      options.signal.addEventListener('abort', () => off(type, handler), { once: true });
    }
    return () => off(type, handler);
  }

  function off(type, handler) {
    const group = listeners.get(type);
    if (!group) return;
    group.delete(handler);
    if (!group.size) listeners.delete(type);
  }

  function emit(type, detail) {
    const group = listeners.get(type);
    if (!group) return;
    [...group].forEach(handler => {
      try { handler(detail); }
      catch (error) { reportError(error, 'event:' + type); }
    });
  }

  function reportError(error, source) {
    const detail = { error, source: source || 'core', time: Date.now() };
    emit('core:error', detail);
    if (global.console && typeof global.console.error === 'function') {
      global.console.error('[PRINCIPIA]', detail.source, error);
    }
  }

  function register(name, factory) {
    if (!name || typeof factory !== 'function') throw new TypeError('Invalid PRINCIPIA module');
    if (modules.has(name)) throw new Error('Duplicate PRINCIPIA module: ' + name);
    modules.set(name, factory);
    return api;
  }

  function start(name, context) {
    if (started.has(name)) return started.get(name);
    const factory = modules.get(name);
    if (!factory) throw new Error('Unknown PRINCIPIA module: ' + name);
    try {
      const instance = factory(context || api) || {};
      started.add(name);
      started.set(name, instance);
      emit('core:module-started', { name });
      return instance;
    } catch (error) {
      reportError(error, 'module:' + name);
      throw error;
    }
  }

  function storage(area) {
    let target;
    try { target = global[area || 'localStorage']; } catch (_) {}
    return {
      get(key, fallback) {
        try {
          const value = target && target.getItem(key);
          return value == null ? fallback : JSON.parse(value);
        } catch (_) { return fallback; }
      },
      set(key, value) {
        try { target.setItem(key, JSON.stringify(value)); return true; }
        catch (error) { reportError(error, 'storage:set:' + key); return false; }
      },
      remove(key) {
        try { target.removeItem(key); return true; }
        catch (error) { reportError(error, 'storage:remove:' + key); return false; }
      }
    };
  }

  const api = Object.freeze({
    version: '1.0.0',
    on, off, emit, register, start, storage,
    reportError,
    getModuleNames: () => [...modules.keys()]
  });

  global.PrincipiaCore = api;
  global.dispatchEvent(new CustomEvent('principia:core-ready', { detail: { version: api.version } }));
})(window);
