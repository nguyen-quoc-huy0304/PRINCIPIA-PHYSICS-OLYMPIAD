const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');

test('admin policy trusts only the authenticated Firebase user, never localStorage identity', () => {
  const policy = read('assets/js/core/permissions.js');
  assert.match(policy, /authenticatedUser\(\)/);
  assert.match(policy, /w\\.firebase\\?\\.auth\(\)\.currentUser/);
  assert.match(policy, /String\(user\.email\|\|''\)\.toLowerCase\(\)===OWNER_EMAIL/);
  assert.doesNotMatch(policy, /function isOwner\(\)\{const a=account\(\)/);
  assert.match(policy, /function role\(\)\{return isOwner\(\)\?'admin':'viewer'\}/);
});

test('all content editors use the centralized Firebase owner policy', () => {
  const app = read('assets/js/app-part-03.js');
  const site = read('assets/js/principia-site-editor.js');
  const welcome = read('assets/js/principia-welcome-editor.js');
  const canva = read('assets/js/principia-canva-editor.js');
  for (const source of [app, site, welcome, canva]) {
    assert.match(source, /PrincipiaAccess\?\.isOwner\?\.\(\)/);
  }
  assert.doesNotMatch(site + welcome + canva, /account\.uid===window\.PRINCIPIA_OWNER_UID_PUBLIC/);
});

test('companion WebGL failure path can access and dispose its renderer safely', () => {
  const source = read('assets/js/principia-living-companion.js');
  assert.match(source, /let renderer=null;\s*renderer=new T\.WebGLRenderer/);
  assert.match(source, /catch\(err\)\{console\.warn\('\[PRINCIPIA Companion\] 3D unavailable',err\);renderer\?\.dispose\(\);return false\}/);
  assert.equal((source.match(/function restorePosition\(el\)/g) || []).length, 1);
  assert.match(source, /typeof p\.left==='string'&&typeof p\.top==='string'/);
});

test('browser cache versions are bumped for every corrected module', () => {
  const html = read('index.html');
  for (const version of [
    'core/permissions.js?v=20261124-auth-policy3',
    'app-part-03.js?v=20261124-auth-policy3',
    'principia-site-editor.js?v=20261124-auth-policy3',
    'principia-canva-editor.js?v=20261124-auth-policy3',
    'principia-welcome-editor.js?v=20261124-auth-policy3',
    'principia-living-companion.js?v=20261124-three-cdn-fix2'
  ]) assert.ok(html.includes(version), 'missing cache version: ' + version);
});


test('admin tools refresh after Firebase restores or clears the authenticated session', () => {
  const auth = read('assets/js/app-part-03.js');
  const site = read('assets/js/principia-site-editor.js');
  const welcome = read('assets/js/principia-welcome-editor.js');
  const canva = read('assets/js/principia-canva-editor.js');
  assert.match(auth, /principia:auth-state-changed/);
  for (const source of [site, welcome, canva]) {
    assert.match(source, /addEventListener\('principia:auth-state-changed'/);
  }
});
