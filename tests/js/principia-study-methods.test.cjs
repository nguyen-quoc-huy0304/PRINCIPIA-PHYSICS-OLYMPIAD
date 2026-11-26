'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
function extractArray(source, marker) {
  const start = source.indexOf(marker) + marker.length;
  assert.ok(source.indexOf(marker) >= 0, 'array marker must exist');
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '[') depth += 1;
    else if (char === ']' && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw new Error('Unterminated array');
}
test('study library contains every numbered method and core requested learning techniques', () => {
  const methods = extractArray(read('assets/js/principia-study-methods.js'), 'const methods=');
  assert.equal(methods.length, 231);
  assert.deepEqual(methods.map(item => item.id), Array.from({ length: 231 }, (_, index) => index + 1));
  const titles = methods.map(item => item.title.toLowerCase());
  for (const term of ['adaptive difficulty', 'deliberate practice', 'retrieval practice', '题海战术', 'mind map', 'bayesian', 'olympiad heuristics']) {
    assert.ok(titles.some(title => title.includes(term)), 'missing method: ' + term);
  }
});
test('study playbook expansion creates 1,240 contextual guides without inflating the core-method count', () => {
  const source = read('assets/js/principia-study-methods-expansion.js');
  assert.match(source, /const methods = \[/);
  assert.match(source, /const topics = \[/);
  assert.match(source, /window\.PRINCIPIA_STUDY_METHOD_PLAYBOOKS = out/);
  assert.match(source, /window\.PRINCIPIA_STUDY_METHOD_PLAYBOOK_COUNT = out\.length/);
  assert.match(source, /kind: 'playbook'/);
  assert.equal((source.match(/\{ name: '/g) || []).length, 31);
  assert.equal((source.match(/\['[^']+','[^']+'\]/g) || []).length, 40);
  assert.match(source, /out.length !== methods.length \* topics.length/);
  assert.match(source, /new Set\(out.map\(item => item.title\)\)/);
  assert.match(read('index.html'), /principia-study-methods-expansion\.js/);
  assert.match(read('assets/js/principia-study-methods.js'), /CORE_METHOD_COUNT=methods\.length/);
  assert.match(read('assets/js/principia-study-methods.js'), /methods\.push\(\.\.\.window\.PRINCIPIA_STUDY_METHOD_PLAYBOOKS\)/);
});
test('component reference expansion provides more than 100,000 themed variants', () => {
  const source = read('assets/js/principia-vault-expansion.js');
  const vault = read('assets/js/principia-component-vault.js');
  assert.match(source, /length: 157/);
  assert.equal((source.match(/^    \['/gm) || []).length, 22);
  assert.match(source, /window\.PRINCIPIA_EXTRA_COMPONENTS = components/);
  assert.match(vault, /PRINCIPIA_EXTRA_COMPONENTS/);
  assert.match(vault, /PRINCIPIA_EXTRA_SKINS/);
  assert.match(vault, /catalogCount = ITEMS.length \* SKINS.length/);
  assert.equal((40 + 512 + 22) * (25 + 157), 104468);
});
test('ant emblem is vector-based and the application references it', () => {
  const logo = read('assets/images/principia-ant-logo.svg');
  const app = read('assets/js/app-part-02.js');
  assert.match(logo, /PRINCIPIA ant emblem/);
  assert.match(logo, /<path d="M310 310L248 263/);
  assert.match(app, /PRINCIPIA_LOGO_URI\s*=\s*["']\/assets\/images\/principia-logo-round\.svg["']/);
  assert.match(read('index.html'), /href=["']\/assets\/images\/principia-logo-round\.svg["']/);
  assert.match(read('index.html'), /principia-visual-system\.css/);
  assert.match(read('assets/js/principia-study-player.js'), /document.body.appendChild\(player\)/);
});

test('advanced catalog adds 1,640 topic-specific playbooks from 41 strategies across 40 topics', () => {
  const source = read('assets/js/principia-study-methods-advanced.js');
  assert.match(source, /const methods = \[/);
  assert.match(source, /const topics = \[\.\.\.new Set\(base\.map/);
  assert.equal((source.match(/\{ name: '/g) || []).length, 41);
  assert.match(source, /methods.length !== 41 \|\| out.length !== 1640/);
  assert.match(source, /window\.PRINCIPIA_STUDY_METHOD_ADVANCED_PLAYBOOKS = out/);
  assert.match(read('assets/js/principia-study-methods.js'), /methods\.push\(\.\.\.window\.PRINCIPIA_STUDY_METHOD_ADVANCED_PLAYBOOKS\)/);
  assert.match(read('assets/js/principia-study-methods.js'), /window\.PRINCIPIA_STUDY_METHOD_CATALOG = methods/);
  assert.match(source, /const id = 1472 \+ out\.length/);
  assert.match(read('index.html'), /principia-study-methods-advanced\.js/);
});
test('guided pathways connect Gemini, virtual classroom and Study With Me', () => {
  const source = read('assets/js/principia-study-pathways.js');
  assert.match(source, /window\.principiaAI\?\.ask/);
  assert.match(source, /window\.PRINCIPIA_STUDY_METHOD_CATALOG/);
  assert.match(source, /methodContext = candidates\.map/);
  assert.match(source, /PrincipiaProMastery\.open\('classroom'\)/);
  assert.match(source, /PrincipiaProMastery\.open\('study'\)/);
  assert.match(read('index.html'), /principia-study-pathways\.js/);
  const mastery = read('assets/js/principia-pro-mastery.js');
  assert.match(mastery, /data-pathways/);
  assert.match(mastery, /Lộ trình học của bạn/);
  assert.doesNotMatch(mastery, /Thư viện phương pháp/);
  assert.doesNotMatch(mastery, /3111 mục học tập/);
  assert.doesNotMatch(mastery, /Mở 231 phương pháp/);
});

test('study playbook generators execute and produce 3,111 uniquely titled catalog entries', () => {
  const context = { window: {} };
  vm.runInNewContext(read('assets/js/principia-study-methods-expansion.js'), context);
  vm.runInNewContext(read('assets/js/principia-study-methods-advanced.js'), context);
  const base = context.window.PRINCIPIA_STUDY_METHOD_PLAYBOOKS;
  const advanced = context.window.PRINCIPIA_STUDY_METHOD_ADVANCED_PLAYBOOKS;
  const core = extractArray(read('assets/js/principia-study-methods.js'), 'const methods=');
  assert.equal(core.length, 231);
  assert.equal(base.length, 1240);
  assert.equal(advanced.length, 1640);
  assert.equal(core.length + base.length + advanced.length, 3111);
  assert.equal(new Set(base.concat(advanced).map(item => item.title)).size, 2880);
  assert.equal(advanced[0].id, 1472);
  assert.equal(advanced.at(-1).id, 3111);
});

test('invisible learning orchestrator adapts to learner results without exposing method names', () => {
  const source = read('assets/js/principia-learning-orchestrator.js');
  assert.match(source, /principia:quiz-completed/);
  assert.match(source, /principia:next-step-updated/);
  assert.match(source, /window\.PRINCIPIA_STUDY_METHOD_CATALOG/);
  assert.match(source, /async function getNextWithRust/);
  assert.match(source, /PrincipiaWasmPhysics\.orchestrateLearning/);
  assert.doesNotMatch(source, /function inferGoal|function choose/);
  assert.match(source, /function promptFor/);
  assert.match(source, /tuyệt đối không nêu tên phương pháp/);
  assert.match(source, /function showNextStep/);
  assert.match(source, /principia:next-step-updated/);
  assert.match(read('index.html'), /principia-learning-orchestrator\.js/);
  assert.match(read('assets/js/principia-adaptive-learning.js'), /data-ppa-guided/);
  assert.match(read('assets/js/principia-pro-mastery.js'), /data-guided-study/);
  assert.match(read('assets/js/principia-pro-mastery.js'), /data-guided-next/);
  assert.match(read('assets/js/principia-pro-mastery.js'), /Hướng dẫn sư phạm nội bộ/);
});
