# PRINCIPIA visual source integration

This visual layer is implemented as additive CSS and vanilla JavaScript so it can coexist with PRINCIPIA's existing DOM, page router, localStorage data, mobile navigation and branding. React/Tailwind-only packages are not injected into the current vanilla-JS app.

## Source map

| Reference | What it contributes to PRINCIPIA | Integration approach |
|---|---|---|
| [Animate UI](https://animate-ui.com/) | Interruptible, short ease-out transitions, animated primitives, reduced-motion behavior | CSS transitions and existing app controls; respects `prefers-reduced-motion` |
| [Kokonut UI](https://kokonutui.com/docs) | AI loading/thinking states, prompt/input patterns, compact cards and navigation | Existing AI state classes and reusable component batches |
| [Uiverse](https://uiverse.io/) | Layered press-state buttons and expressive small controls | Existing attributed Uiverse adaptation in `principia-uiverse-copy.css` |
| [Libraries.dev](https://libraries.dev/introduction) | Spotlight, border-beam, thinking-orb and AI visual patterns | Existing spotlight/beam adapters; no always-running shader is forced onto every page |
| [UI/UX Pro Max](https://devanshutak25.github.io/ui-ux-ref/) | Design tokens, hierarchy, responsive patterns, accessibility and performance guidance | Existing color/spacing tokens, component skins and responsive layouts |
| [FeralUI](https://feralui.dev/) | Physics-like spring response and playful interaction cues | Lightweight pointer/spring-style CSS response; no React runtime copied |
| [Anime.js](https://animejs.com/) | Timeline, stagger and transform animation engine | Existing locally hosted Anime.js runtime and motion adapter |
| [favico.js](https://lab.ejci.net/favico.js/) | Browser-tab favicon notification feedback | Existing local vendor copy and PRINCIPIA unread-count adapter |
| [Hairline](https://hairline.lucasmarkes.com/) | Fine SVG linework and pointer-reactive figures | Existing lightweight pointer-reactive SVG figure adapter |
| [Koboyo page-mascot](https://koboyo.com/page-mascot) | Cursor-aware mascot interaction and character presentation | Existing Living Companion and Mascot Studio; new mascot set remains separate until supplied/approved |
| [LucianLabs](https://lucianlabs.dev/en/) | Practical AI-tool interface patterns and workflow-oriented panels | Existing component batches and AI workspace patterns |
| [ThreeUI](https://threeui.com/browse) | 3D hero, spatial background and shader-inspired visual language | Existing Three.js atmosphere and dimensional-world modules |

## Current change

- Adds a dedicated desktop sidebar collapse controller in `assets/js/principia-sidebar-collapse.js`.
- Adds its isolated visual rules in `assets/css/principia-sidebar-collapse.css`.
- The default state remains expanded. The user can collapse/expand with the sidebar control or `Ctrl/Cmd + Shift + B`.
- The preference is stored under `principia_sidebar_collapsed_v1`; storage failures are handled without blocking navigation.
- The compact rail preserves the existing logo, navigation targets and icon controls. Navigation labels gain accessible names and hover titles.
- The controller only activates at desktop widths; the existing mobile navigation is untouched.
- Reduced-motion settings disable the new transitions.
- The main app structure, routes, content, existing localStorage keys and mascot assets are not replaced.

## Reuse and licensing

The current app is vanilla JavaScript, not a React + Tailwind project. React-only source is therefore treated as design reference unless its exact component can be adapted without adding a framework. Do not copy paid/proprietary snippets or assets without permission. Retain upstream notices for directly adapted code; see `THIRD_PARTY_NOTICES.md`.
