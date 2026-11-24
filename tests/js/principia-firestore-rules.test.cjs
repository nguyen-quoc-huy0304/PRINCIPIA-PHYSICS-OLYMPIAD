const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Firestore rules enforce a verified single owner and deny unknown collections', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /request\.auth\.token\.email == 'huyquocnguyen03042011@gmail\.com'/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /allow write: if isOwner\(\)/);
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});

test('leaderboard writes are scoped to the authenticated user and validated', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  assert.match(rules, /request\.auth\.uid == userId/);
  assert.match(rules, /validLeaderboardEntry\(userId\)/);
  for (const field of ['uid', 'name', 'xp', 'streak', 'completedCount', 'updatedAt']) {
    assert.ok(rules.includes("'" + field + "'"), 'missing validated field: ' + field);
  }
});

test('Firebase CLI config points to the checked-in security rules', () => {
  const config = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  assert.equal(config.firestore.rules, 'firestore.rules');
});
