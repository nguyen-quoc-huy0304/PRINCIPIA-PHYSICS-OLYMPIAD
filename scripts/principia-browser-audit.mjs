import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.PRINCIPIA_URL || 'https://principia-physics-olympiad-pro.pages.dev';
const outDir = path.resolve('artifacts/principia-browser-audit');
await fs.mkdir(outDir, { recursive: true });

const report = {
  target: baseUrl,
  startedAt: new Date().toISOString(),
  environments: [],
  note: 'Screenshots and diagnostics are collected from real Chromium pages running on a GitHub-hosted runner.'
};

const browser = await chromium.launch({ headless: true });
let hasFailure = false;

for (const device of [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
]) {
  const context = await browser.newContext({
    viewport: device.viewport,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [] };

  page.on('console', msg => {
    if (msg.type() === 'error') events.consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => events.pageErrors.push(error.stack || error.message));
  page.on('requestfailed', request => events.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText || 'request failed'
  }));
  page.on('response', response => {
    if (response.status() >= 400) events.badResponses.push({
      status: response.status(),
      url: response.url()
    });
  });

  let navigationError = null;
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(12000);
  } catch (error) {
    navigationError = error.stack || error.message;
    hasFailure = true;
  }

  let pageState = {};
  try {
    pageState = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      readyState: document.readyState,
      bodyText: (document.body?.innerText || '').slice(0, 12000),
      appChildCount: document.getElementById('app')?.childElementCount ?? null,
      appText: (document.getElementById('app')?.innerText || '').slice(0, 8000),
      startupError: document.getElementById('principiaStartupError')?.innerText || null,
      scripts: [...document.scripts].map(s => s.src).filter(Boolean)
    }));
    const learningCheck = await page.evaluate(() => {
      const logo = document.querySelector('.brand-logo-img,.principia-top-logo,.account-brand-logo');
      const vault = window.PrincipiaComponentVault;
      const expansion = window.PRINCIPIAVaultExpansion;
      return {
        studyMethodCount: window.principiaStudyMethodsCount?.().total ?? null,
        vaultVariants: vault?.count ?? null,
        vaultStructures: vault?.structures ?? null,
        vaultSkins: vault?.skins ?? null,
        expansionComponents: expansion?.components ?? null,
        expansionSkins: expansion?.skins ?? null,
        principiaLogo: Boolean(logo && /principia-logo-round\.svg/.test(logo.getAttribute('src') || '')),
        motionPolishLoaded: [...document.styleSheets].some(sheet => sheet.href?.includes('principia-reference-polish.css')),
        proMasteryReady: typeof window.PrincipiaProMastery?.open === 'function',
        studyPlayerReady: typeof window.PrincipiaStudyPlayer?.pin === 'function'
      };
    });
    pageState.learningCheck = learningCheck;
    if (learningCheck.studyMethodCount !== 231 || learningCheck.vaultVariants !== 105378 ||
        learningCheck.vaultStructures !== 579 || learningCheck.vaultSkins !== 182 ||
        learningCheck.expansionComponents !== 22 || learningCheck.expansionSkins !== 157 ||
        !learningCheck.principiaLogo || !learningCheck.motionPolishLoaded || !learningCheck.proMasteryReady || !learningCheck.studyPlayerReady) {
      hasFailure = true;
    }

    const runtimeCheck = await page.evaluate(async () => {
      if (typeof window.principiaLaunchGame !== 'function') {
        return { available: false, reason: 'principiaLaunchGame is not loaded' };
      }
      await window.principiaLaunchGame();
      const saved = JSON.parse(localStorage.getItem('principia_game_physics_v1') || '{}');
      const lastShot = Array.isArray(saved.history) ? saved.history.at(-1) : null;
      const wasmResource = performance.getEntriesByType('resource')
        .find(entry => entry.name.includes('/assets/wasm/pkg/principia_core_bg.wasm'));
      return {
        available: true,
        backend: lastShot?.backend || null,
        score: lastShot?.points ?? null,
        rangeM: lastShot?.rangeM ?? null,
        wasmResourceLoaded: Boolean(wasmResource),
        wasmResourceUrl: wasmResource?.name || null
      };
    });
    pageState.runtimeCheck = runtimeCheck;
    if (!runtimeCheck.available || runtimeCheck.backend !== 'Rust/WASM' || !runtimeCheck.wasmResourceLoaded) {
      hasFailure = true;
    }
  } catch (error) {
    pageState = { evaluationError: error.message };
    hasFailure = true;
  }

  const screenshot = path.join(outDir, `${device.name}.png`);
  try {
    await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled', timeout: 30000 });
  } catch (error) {
    events.screenshotError = error.message;
    hasFailure = true;
  }

  if (navigationError || pageState.startupError || pageState.appChildCount === 0 ||
      events.pageErrors.length || events.badResponses.length) hasFailure = true;

  report.environments.push({
    device: device.name,
    viewport: device.viewport,
    navigationError,
    pageState,
    events,
    screenshot
  });
  await context.close();
}

await browser.close();
report.finishedAt = new Date().toISOString();
report.result = hasFailure ? 'issues-detected' : 'no-browser-errors-detected';
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (hasFailure) process.exitCode = 1;
