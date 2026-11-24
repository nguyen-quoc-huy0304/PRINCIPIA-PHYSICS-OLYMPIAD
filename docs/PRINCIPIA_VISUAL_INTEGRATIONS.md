# PRINCIPIA visual and motion integrations

This repository is a static HTML/CSS/JavaScript application. The reference projects below use React, Tailwind, Three.js, SVG or standalone JavaScript in different combinations. PRINCIPIA adapts their interaction and visual patterns to its current runtime rather than introducing a second framework or copying entire packages.

## Reference mapping

| Reference | Adapted pattern in PRINCIPIA |
|---|---|
| [Animate UI](https://animate-ui.com/) | Short route transitions, transform/opacity motion, staggered entrances and reduced-motion behavior. |
| [Kokonut UI](https://kokonutui.com/docs) | Glass panels, AI-oriented surfaces, controls, responsive cards and layered backgrounds. |
| [Uiverse](https://uiverse.io/) | Interactive button, input, status, hover and feedback treatments. |
| [Libraries.dev](https://libraries.dev/introduction) | Border-beam surfaces and thinking-orb feedback; effects are implemented without its React-only package runtime. |
| [UI/UX Pro Max](https://devanshutak25.github.io/ui-ux-ref/) | Design tokens, color hierarchy, responsive layouts, typography and accessibility rules. |
| [FeralUI](https://feralui.dev/) | Magnetic pointer response and spring-like interaction on desktop; touch and reduced-motion fallbacks. |
| [Anime.js](https://animejs.com/) | Timeline-like sequencing and easing using the browser Web Animations API; no second animation runtime. |
| [favico.js](https://lab.ejci.net/favico.js/) | Dynamic favicon badge/status API reuses PRINCIPIA’s existing SVG data-URI badge implementation. No favico.js package is bundled. |
| [Hairline](https://hairline.lucasmarkes.com/) | Pointer-responsive isometric SVG figure in the lab header, using native SVG/CSS. |
| [Koboyo page-mascot](https://koboyo.com/page-mascot) | Pointer gaze response is attached only to the existing PRINCIPIA bundled pose element; no character sheets are replaced. |
| [Lucian UX/UI Prompt](https://lucianlabs.dev/en/uxui-prompt/) | Interactive, self-contained workbench patterns, light/dark mapping and save/copy/export actions. |
| [ThreeUI](https://threeui.com/browse) | Procedural WebGL scene, pointer parallax, 3D surfaces and progressive visual enhancement. |

## Lab Code Studio

The new assets/js/principia-lab-code-studio.js mounts inside #principiaLabTools, which is part of the existing laboratory page. It provides HTML, CSS and JavaScript editors, a projectile-motion example, an isolated preview, console output, local draft saving and standalone HTML export.

The preview uses an iframe with sandbox=allow-scripts and no allow-same-origin. Its CSP blocks network connections and external resources. User-authored JavaScript runs only inside that sandbox and cannot access the PRINCIPIA DOM, account state or page storage.

## Runtime and compatibility

- No React or Tailwind migration.
- No new external runtime dependencies.
- WebGL and pointer effects are progressive enhancements.
- Mobile layouts avoid hover-only controls.
- prefers-reduced-motion is respected.
- Existing three-button launcher, editor, M3E workspace, lab solvers and theme switch remain separate.
- The reference sites are design/behavior references; not every upstream component or asset is imported.
