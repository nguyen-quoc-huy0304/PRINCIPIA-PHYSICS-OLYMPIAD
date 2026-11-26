const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const bridge = fs.readFileSync(path.join(root, 'assets/js/principia-wasm-physics.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets/js/app-part-02.js'), 'utf8');
const rust = fs.readFileSync(path.join(root, 'rust/src/authorization.rs'), 'utf8');
const wasm = fs.readFileSync(path.join(root, 'rust/src/wasm_physics.rs'), 'utf8');

test('authorization grant validation is implemented in Rust and exported to WASM', () => {
  assert.match(rust, /pub fn validate_grant\(/);
  assert.match(rust, /GrantError::OwnerCannotBeGranted/);
  assert.match(rust, /matches!\(role, "viewer" \| "editor" \| "media"\)/);
  assert.match(wasm, /pub fn authorization_grant_json\(/);
  assert.match(bridge, /case 'authorizationGrant':\s*return JSON\.parse\(wasm\.authorization_grant_json/);
  assert.match(bridge, /authorizeGrant:\(email,role,ownerEmail\)=>compute\('authorizationGrant'/);
});

test('account grant mutations delegate validation to Rust after owner gate', () => {
  const grantStart = app.indexOf('async function setGrantedRole');
  const revokeStart = app.indexOf('async function revokeGrantedRole');
  const accountStart = app.indexOf('let accountMode', revokeStart);
  assert.ok(grantStart >= 0 && revokeStart > grantStart && accountStart > revokeStart);
  const mutations = app.slice(grantStart, accountStart);
  assert.equal((mutations.match(/PrincipiaWasmPhysics\.authorizeGrant\(/g) || []).length, 2);
  assert.match(mutations, /if\(!isPrincipiaOwner\(\)\)/);
  assert.match(mutations, /localStorage\.setItem\('principia_role_map'/);
});

test('grant decisions cannot accept an owner grant or an unknown role', () => {
  assert.match(rust, /if normalized == owner_email\.trim\(\)\.to_ascii_lowercase\(\)/);
  assert.match(rust, /InvalidRole/);
  assert.match(rust, /normalized\.len\(\) > 254/);
});
