# PRINCIPIA visual and motion integrations

This repository is a static HTML/CSS/JavaScript application. The reference projects below use React, Tailwind, Three.js, SVG or standalone JavaScript in different combinations. PRINCIPIA adapts their interaction and visual patterns to its current runtime rather than introducing a second framework or copying entire packages.

## Reference mapping

| Reference | Adapted pattern in PRINCIPIA |
|---|---|
| [Animate UI](https://animate-ui.com/) | Short route transitions, transform/opacity motion, staggered entrances and reduced-motion behavior. |
| [Kokonut UI](https://kokonutui.com/docs) | Glass panels, AI-oriented surfaces, controls, responsive cards and layered backgrounds. |
| [Uiverse](https://uiverse.io/) | MIT button source pattern from Web-Potato is copied into `principia-uiverse-copy.css` and attached to main content actions. |
| [Libraries.dev](https://libraries.dev/introduction) | Border-beam surfaces and thinking-orb feedback; effects are implemented without its React-only package runtime. |
| [UI/UX Pro Max](https://devanshutak25.github.io/ui-ux-ref/) | Design tokens, color hierarchy, responsive layouts, typography and accessibility rules. |
| [FeralUI](https://feralui.dev/) | Magnetic pointer response and spring-like interaction on desktop; touch and reduced-motion fallbacks. |
| [Anime.js](https://animejs.com/) | Vendored Anime.js 4.5.0 UMD runtime used directly for route transitions and button press feedback. |
| [favico.js](https://lab.ejci.net/favico.js/) | Vendored favico.js 0.3.10 is used directly for animated notification badges, with the existing SVG fallback. |
| [Hairline](https://hairline.lucasmarkes.com/) | Pointer-responsive isometric SVG figure in the lab header, using native SVG/CSS. |
| [Koboyo page-mascot](https://koboyo.com/page-mascot) | Pointer gaze response is attached only to the existing PRINCIPIA bundled pose element; no character sheets are replaced. |
| [Lucian UX/UI Prompt](https://lucianlabs.dev/en/uxui-prompt/) | Interactive, self-contained workbench patterns, light/dark mapping and save/copy/export actions. |
| [ThreeUI](https://threeui.com/browse) | Procedural WebGL scene, pointer parallax, 3D surfaces and progressive visual enhancement. |

## Lab Code Studio

The new assets/js/principia-lab-code-studio.js mounts inside #principiaLabTools, which is part of the existing laboratory page. It provides HTML, CSS and JavaScript editors, a projectile-motion example, an isolated preview, console output, local draft saving and standalone HTML export.

The preview uses an iframe with sandbox=allow-scripts and no allow-same-origin. Its CSP blocks network connections and external resources. User-authored JavaScript runs only inside that sandbox and cannot access the PRINCIPIA DOM, account state or page storage.

## Runtime and compatibility

- No React or Tailwind migration.
- Anime.js 4.5.0 and favico.js 0.3.10 are vendored locally; no runtime CDN dependency.
- WebGL and pointer effects are progressive enhancements.
- Mobile layouts avoid hover-only controls.
- prefers-reduced-motion is respected.
- Existing three-button launcher, editor, M3E workspace, lab solvers and theme switch remain separate.
- The reference sites are design/behavior references; directly compatible open-source source is vendored, while React-only components are adapted rather than importing an incompatible framework stack.

## Directly vendored libraries

- `assets/vendor/anime-4.5.0.umd.min.js` — official Anime.js UMD bundle, MIT license. Loaded before `principia-kinetic-ui.js`; used for route entrance and press feedback.
- `assets/vendor/favico-0.3.10.min.js` — official favico.js bundle, MIT license. Loaded before `principia-experience-system.js`; used for animated unread badges.
- `assets/css/principia-uiverse-copy.css` and `assets/js/principia-uiverse-copy.js` — scoped Uiverse MIT button pattern by Web-Potato, adapted to PRINCIPIA action buttons. Source attribution and license notice are retained.

The React-only Animate UI, Kokonut UI and FeralUI components are not directly executable in this static vanilla-JS app. Their component patterns are adapted without introducing a full React/Tailwind migration. Devanshu UI/UX Pro Max is a design reference, not a runtime component package. Libraries.dev and LucianLabs are reference/collection sites rather than one drop-in browser script. Koboyo mascot behavior is limited to the existing PRINCIPIA character assets. ThreeUI-style spatial rendering remains in the existing WebGL scene system.

## Component Vault

The editor panel now contains a collapsible local Component Vault (`assets/js/principia-component-vault.js` and `assets/css/principia-component-vault.css`). It contains 40 base HTML/CSS patterns expanded across 25 named visual skins, for 1,000 selectable component variants. The Vault provides live search, category filtering, source links, live previews, copy HTML/CSS actions, and pagination (30 cards per page) to limit DOM work on mobile devices. All patterns are bundled locally and do not require runtime network access.

The 1,000 count refers to 40 base structures × 25 visual skins, not 1,000 independently authored upstream components. Uiverse's exact MIT button pattern is separately attributed in `principia-uiverse-copy.css`; the other examples are compatibility adaptations of the supplied libraries' documented interaction patterns. React/Next/Tailwind packages remain unsuitable for direct loading into the current static application without a framework migration. Upstream catalog counts are not equal to the number of components bundled in PRINCIPIA.
