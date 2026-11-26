'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/principia-pro-mastery.js', 'utf8');
const progression = fs.readFileSync('assets/js/principia-progression-core.js', 'utf8');

test('Pro Mastery delegates study streak calculation to Rust activity calendar', () => {
  assert.match(source, /api\.streak\(days, new Date\(\)\)/);
  assert.match(source, /api\.dateKey\(new Date\(\)\)/);
  assert.match(source, /streakCache = \{ key, \.\.\.result \}/);
  assert.match(progression, /async function streak\(days,today=new Date\(\)\)/);
  assert.match(progression, /engine\.activityCalendar\(normalized,dateKey\(when\),recordToday\)/);
  assert.doesNotMatch(source, /while\(days\.has\(todayKey\(cursor\)\)\)/);
});

test('Pro Mastery validates Rust streak results and deduplicates concurrent requests', () => {
  assert.match(source, /if \(streakRequest\?\.key === key\) return streakRequest\.promise/);
  assert.match(source, /result\.longest < result\.current/);
  assert.match(source, /Rust Pro Mastery streak calculation failed/);
  assert.match(source, /streakRequest = \{ key, promise \}/);
});
