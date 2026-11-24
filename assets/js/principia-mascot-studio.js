/* PRINCIPIA Mascot Studio — isolated controls for the 3D companion. */
(() => {
  'use strict';
  const PRESETS = [
    ['classic', 'Cổ điển'],
    ['round', 'Tròn'],
    ['slim', 'Thon'],
    ['cat', 'Tai mèo'],
    ['robot', 'Robot']
  ];
  let panel = null;

  function create(tag, attrs = {}, text = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') node.className = value;
      else node.setAttribute(key, String(value));
    });
    if (text) node.textContent = text;
    return node;
  }

  function ensurePanel() {
    if (panel?.isConnected) return panel;
    panel = create('section', { id: 'principiaMascotStudio', className: 'pr-mascot-studio', role: 'dialog', 'aria-label': 'Tùy chỉnh hình dáng nhân vật' });
    const heading = create('div', { className: 'pr-mascot-studio-heading' }, 'Tùy chỉnh nhân vật');
    const close = create('button', { type: 'button', 'aria-label': 'Đóng tùy chỉnh' }, '×');
    close.addEventListener('click', () => panel?.classList.remove('is-open'));
    heading.append(close);
    const description = create('p', { className: 'pr-mascot-studio-description' }, 'Chọn hình dáng 3D và kích thước. Thay đổi được áp dụng ngay cho nhân vật.');
    const choices = create('div', { className: 'pr-mascot-shape-choices' });
    PRESETS.forEach(([value, label]) => {
      const button = create('button', { type: 'button', 'data-shape-choice': value });
      button.textContent = label;
      button.addEventListener('click', () => {
        const api = window.principiaLivingCompanion;
        if (!api?.setShape?.(value)) return;
        choices.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      });
      choices.append(button);
    });
    const scaleLabel = create('label', { className: 'pr-mascot-scale' });
    const scaleText = create('span', {}, 'Kích thước nhân vật');
    const scale = create('input', { type: 'range', min: '.65', max: '1.4', step: '.05', 'aria-label': 'Kích thước nhân vật', 'data-mascot-scale': '' });
    scale.addEventListener('input', () => window.principiaLivingCompanion?.setScale?.(scale.value));
    scaleLabel.append(scaleText, scale);
    panel.append(heading, description, choices, scaleLabel);
    document.body.append(panel);
    return panel;
  }

  function open() {
    const api = window.principiaLivingCompanion;
    if (!api) return;
    const root = ensurePanel();
    const settings = api.getSettings?.() || {};
    root.querySelectorAll('[data-shape-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.shapeChoice === settings.shape));
    });
    const scale = root.querySelector('[data-mascot-scale]');
    if (scale) scale.value = String(settings.scale || 1);
    root.classList.add('is-open');
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-shape]')) {
      event.preventDefault();
      open();
      return;
    }
    if (panel?.classList.contains('is-open') && !panel.contains(event.target)) panel.classList.remove('is-open');
  });
  window.PrincipiaMascotStudio = Object.freeze({ open, close: () => panel?.classList.remove('is-open') });
})();
