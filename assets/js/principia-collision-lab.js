(function () {
  'use strict';

  function collide1D(m1, u1, m2, u2, restitution) {
    const values = [m1, u1, m2, u2, restitution];
    if (!values.every(Number.isFinite)) throw new TypeError('All inputs must be finite numbers.');
    if (m1 <= 0 || m2 <= 0) throw new RangeError('Masses must be greater than zero.');
    if (restitution < 0 || restitution > 1) throw new RangeError('Coefficient of restitution must be between 0 and 1.');

    const totalMass = m1 + m2;
    const momentumBefore = m1 * u1 + m2 * u2;
    const relativeApproach = u1 - u2;
    const v1 = (m1 * u1 + m2 * u2 - m2 * restitution * relativeApproach) / totalMass;
    const v2 = (m1 * u1 + m2 * u2 + m1 * restitution * relativeApproach) / totalMass;
    const momentumAfter = m1 * v1 + m2 * v2;
    const kineticBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const kineticAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;

    return {
      v1, v2, momentumBefore, momentumAfter, momentumError: momentumAfter - momentumBefore,
      kineticBefore, kineticAfter, kineticChange: kineticAfter - kineticBefore,
      energyLoss: Math.max(0, kineticBefore - kineticAfter),
      restitution, totalMass
    };
  }

  const api = { collide1D };
  if (typeof window !== 'undefined') window.PrincipiaCollisionMath = api;
  if (typeof document === 'undefined') return;

  function init() {
    const root = document.getElementById('principia-collision-lab');
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    const ids = ['m1', 'u1', 'm2', 'u2', 'e'];
    const el = (id) => root.querySelector('[data-collision="' + id + '"]');
    const fmt = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 4 });
    const read = () => ids.map((id) => Number(el(id).value));
    function update() {
      try {
        const [m1, u1, m2, u2, e] = read();
        const r = collide1D(m1, u1, m2, u2, e);
        el('v1').textContent = fmt(r.v1) + ' m/s';
        el('v2').textContent = fmt(r.v2) + ' m/s';
        el('p-before').textContent = fmt(r.momentumBefore) + ' kg·m/s';
        el('p-after').textContent = fmt(r.momentumAfter) + ' kg·m/s';
        el('k-before').textContent = fmt(r.kineticBefore) + ' J';
        el('k-after').textContent = fmt(r.kineticAfter) + ' J';
        el('loss').textContent = fmt(r.energyLoss) + ' J';
        el('error').textContent = fmt(r.momentumError) + ' kg·m/s';
        el('status').textContent = e === 1 ? 'Va chạm đàn hồi lý tưởng: động năng được bảo toàn.' :
          e === 0 ? 'Va chạm mềm hoàn toàn: hai vật có cùng vận tốc sau va chạm.' :
          'Va chạm không đàn hồi một phần: động lượng bảo toàn, một phần động năng chuyển hóa.';
        const maxV = Math.max(1, Math.abs(u1), Math.abs(u2), Math.abs(r.v1), Math.abs(r.v2));
        el('before-a').style.left = (8 + 42 * (u1 / maxV + 1) / 2) + '%';
        el('before-b').style.left = (8 + 42 * (u2 / maxV + 1) / 2) + '%';
        el('after-a').style.left = (8 + 42 * (r.v1 / maxV + 1) / 2) + '%';
        el('after-b').style.left = (8 + 42 * (r.v2 / maxV + 1) / 2) + '%';
        el('error-note').textContent = Math.abs(r.momentumError) < 1e-10 ? 'Sai lệch số học gần 0 (sai số dấu phẩy động).' : 'Có sai lệch cần kiểm tra.';
      } catch (error) {
        el('status').textContent = error.message;
      }
    }
    ids.forEach((id) => el(id).addEventListener('input', update));
    el('reset').addEventListener('click', () => {
      const defaults = { m1: 1, u1: 3, m2: 2, u2: -1, e: 1 };
      ids.forEach((id) => { el(id).value = defaults[id]; });
      update();
    });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();