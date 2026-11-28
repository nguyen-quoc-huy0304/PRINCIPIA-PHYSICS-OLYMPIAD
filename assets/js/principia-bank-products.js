(function (root) {
  'use strict';

  const STORAGE_KEY = 'principia:bank-products:v1';
  const MAX_RECORDS = 1000;
  const DAY_MS = 86400000;

  function positiveInteger(value, label) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(label + ' phải là số nguyên dương.');
    }
    return value;
  }

  function validDate(value, label) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError(label + ' không hợp lệ.');
    return date;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialState() {
    return { version: 1, walletIdentity: null, deposits: [], loans: [], ledger: [] };
  }

  function sanitizeState(raw) {
    const state = initialState();
    if (!raw || raw.version !== 1) return state;
    state.walletIdentity = typeof raw.walletIdentity === 'string' ? raw.walletIdentity : null;
    state.deposits = Array.isArray(raw.deposits) ? raw.deposits.filter(item =>
      item && typeof item.id === 'string' && Number.isSafeInteger(item.principal) &&
      item.principal > 0 && Number.isFinite(item.annualRate) &&
      item.annualRate >= 0 && item.annualRate <= 0.3 &&
      Number.isFinite(Date.parse(item.openedAt)) && Number.isFinite(Date.parse(item.maturesAt)) &&
      Number.isSafeInteger(item.accruedInterest) && item.accruedInterest >= 0 &&
      typeof item.status === 'string' && ['active', 'matured', 'closed'].includes(item.status)
    ).slice(-100) : [];
    state.loans = Array.isArray(raw.loans) ? raw.loans.filter(item =>
      item && typeof item.id === 'string' && Number.isSafeInteger(item.principal) &&
      item.principal > 0 && Number.isSafeInteger(item.remaining) &&
      item.remaining >= 0 && item.remaining <= item.principal &&
      Number.isFinite(item.annualRate) && item.annualRate >= 0 && item.annualRate <= 0.5 &&
      Number.isSafeInteger(item.termMonths) && item.termMonths >= 1 &&
      Number.isFinite(Date.parse(item.startedAt))
    ).slice(-100) : [];
    state.ledger = Array.isArray(raw.ledger) ? raw.ledger.filter(item =>
      item && typeof item.id === 'string' && typeof item.type === 'string' &&
      Number.isSafeInteger(item.amount) && item.amount >= 0 &&
      Number.isFinite(Date.parse(item.at))
    ).slice(-MAX_RECORDS) : [];
    return state;
  }

  function createBankEngine(options) {
    if (!options || !options.wallet ||
        typeof options.wallet.debit !== 'function' ||
        typeof options.wallet.credit !== 'function') {
      throw new TypeError('Cần ví mô phỏng có debit(amount) và credit(amount).');
    }
    const storage = options.storage || root.localStorage;
    const wallet = options.wallet;
    const clock = typeof options.now === 'function' ? options.now : () => new Date();
    let state;
    try {
      state = sanitizeState(JSON.parse(storage && storage.getItem(STORAGE_KEY) || 'null'));
    } catch (_) {
      state = initialState();
    }

    const walletIdentity = wallet.type + ':' + wallet.id;
    if (state.walletIdentity && state.walletIdentity !== walletIdentity) {
      throw new Error('Sổ ngân hàng đã liên kết với ví mô phỏng khác.');
    }
    if (!state.walletIdentity && (state.deposits.length || state.loans.length || state.ledger.length)) {
      throw new Error('Sổ ngân hàng có dữ liệu cũ chưa gắn ví; cần xử lý dữ liệu cũ trước khi liên kết.');
    }
    state.walletIdentity = walletIdentity;

    function persist() {
      if (!storage) return;
      try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Không thể lưu sản phẩm ngân hàng.'); }
    }

    function record(type, amount, reference, at) {
      state.ledger.push({
        id: 'bank-' + at.getTime().toString(36) + '-' + state.ledger.length,
        type, amount, reference, at: at.toISOString()
      });
      if (state.ledger.length > MAX_RECORDS) state.ledger.shift();
    }

    function snapshot() { return clone(state); }

    function openTermDeposit(amount, annualRate, termDays) {
      positiveInteger(amount, 'Tiền gửi');
      positiveInteger(termDays, 'Kỳ hạn');
      if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 0.3 ||
          termDays > 3650) throw new RangeError('Lãi suất hoặc kỳ hạn không hợp lệ.');
      const now = validDate(clock(), 'Ngày mở sổ');
      const maturesAt = new Date(now.getTime() + termDays * DAY_MS);
      wallet.debit(amount);
      const account = {
        id: 'td-' + now.getTime().toString(36) + '-' + (state.deposits.length + 1),
        principal: amount, annualRate, termDays,
        openedAt: now.toISOString(), maturesAt: maturesAt.toISOString(),
        accruedInterest: 0, lastAccruedAt: now.toISOString(), status: 'active'
      };
      state.deposits.push(account);
      record('term-deposit-open', amount, account.id, now);
      persist();
      return snapshot();
    }

    function accrueDeposit(deposit, now) {
      const last = validDate(deposit.lastAccruedAt, 'Ngày tính lãi gần nhất');
      const elapsedDays = Math.max(0, Math.floor((now - last) / DAY_MS));
      if (!elapsedDays) return 0;
      const dailyRate = Math.pow(1 + deposit.annualRate, 1 / 365) - 1;
      const base = deposit.principal + deposit.accruedInterest;
      const interest = Math.max(0, Math.round(base * (Math.pow(1 + dailyRate, elapsedDays) - 1)));
      deposit.accruedInterest += interest;
      deposit.lastAccruedAt = now.toISOString();
      if (now >= new Date(deposit.maturesAt)) deposit.status = 'matured';
      return interest;
    }

    function settleTermDeposit(depositId, earlyWithdrawal) {
      const deposit = state.deposits.find(item => item.id === depositId && item.status !== 'closed');
      if (!deposit) throw new Error('Không tìm thấy sổ tiết kiệm đang hoạt động.');
      const now = validDate(clock(), 'Ngày tất toán');
      accrueDeposit(deposit, now);
      const matured = now >= new Date(deposit.maturesAt);
      if (!matured && earlyWithdrawal !== true) throw new Error('Sổ chưa đến hạn; cần xác nhận tất toán trước hạn.');
      const interest = matured ? deposit.accruedInterest : Math.round(
        deposit.principal * (Math.pow(1 + 0.001 / 365, Math.max(0, Math.floor((now - new Date(deposit.openedAt)) / DAY_MS))) - 1)
      );
      const payout = deposit.principal + interest;
      wallet.credit(payout);
      deposit.status = 'closed';
      record(matured ? 'term-deposit-maturity' : 'term-deposit-early-close', payout, deposit.id, now);
      persist();
      return { state: snapshot(), payout, interest, early: !matured };
    }

    function createLoan(principal, annualRate, termMonths) {
      positiveInteger(principal, 'Khoản vay');
      positiveInteger(termMonths, 'Thời hạn vay');
      if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 0.5 ||
          termMonths > 600) throw new RangeError('Lãi suất hoặc thời hạn vay không hợp lệ.');
      const now = validDate(clock(), 'Ngày giải ngân');
      const monthlyRate = annualRate / 12;
      const payment = monthlyRate === 0
        ? Math.ceil(principal / termMonths)
        : Math.ceil(principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths)));
      const loan = {
        id: 'loan-' + now.getTime().toString(36) + '-' + (state.loans.length + 1),
        principal, remaining: principal, annualRate, termMonths, monthlyPayment: payment,
        paymentsMade: 0, startedAt: now.toISOString(), status: 'active'
      };
      wallet.credit(principal);
      state.loans.push(loan);
      record('loan-disbursement', principal, loan.id, now);
      persist();
      return snapshot();
    }

    function repayLoan(loanId, amount) {
      positiveInteger(amount, 'Số tiền trả nợ');
      const loan = state.loans.find(item => item.id === loanId && item.remaining > 0);
      if (!loan) throw new Error('Không tìm thấy khoản vay còn dư nợ.');
      const now = validDate(clock(), 'Ngày trả nợ');
      const interestDue = Math.round(loan.remaining * loan.annualRate / 12);
      const due = Math.min(loan.remaining + interestDue, amount);
      if (due !== amount) throw new RangeError('Số tiền trả vượt tổng dư nợ và lãi kỳ này.');
      wallet.debit(due);
      const interestPaid = Math.min(interestDue, due);
      loan.remaining = Math.max(0, loan.remaining - (due - interestPaid));
      loan.paymentsMade += 1;
      if (loan.remaining === 0) loan.status = 'paid';
      record('loan-repayment', due, loan.id, now);
      persist();
      return { state: snapshot(), principalPaid: due - interestPaid, interestPaid };
    }

    return Object.freeze({
      getState: snapshot, openTermDeposit, settleTermDeposit, createLoan, repayLoan
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createBankEngine, sanitizeState, STORAGE_KEY };
  }
  root.PrincipiaBankProducts = Object.freeze({ createBankEngine });
})(typeof window !== 'undefined' ? window : globalThis);
