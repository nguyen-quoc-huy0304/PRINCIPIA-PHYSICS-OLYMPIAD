# PRINCIPIA Component Source Inventory

Last reviewed: 2026-11-24

This inventory separates published source counts from components actually vendored or adapted into PRINCIPIA. Counts are not additive unique-component totals: collections overlap, some entries are templates or design references, and some sources include paid or license-restricted work.

| Source | Published count | Reuse / integration status |
|---|---:|---|
| Uiverse | 7,475 UI elements | HTML/CSS/React/Figma formats; inspect the individual creator/license notice before copying. |
| Kokonut UI | 116 public components; Pro is separate | React + Tailwind CSS v4 + shadcn; adapt component-by-component for this vanilla HTML/CSS/JS app. |
| Animate UI | 48 listed primitives/elements | React + Motion + Radix/Base UI/React Aria; not directly drop-in for this app. |
| Hairline UI | 224 components | React 19 + Tailwind v4 + shadcn; MIT according to its published page; requires a vanilla adapter. |
| Lucian UX/UI Prompt | 480 interactive elements | MIT; plain HTML/CSS/JS snippets are available; preserve the required source comment and inspect each snippet before integration. |
| ThreeUI | 51 UI elements | Includes PRO entries and Three.js/WebGL dependencies; import only items whose license/access permits. |
| FeralUI | 13 public components | License status not verified; do not redistribute source until confirmed. |
| Koboyo Page Mascot | 52 mascot designs | Character assets are not imported pending completion of the user's character submissions. |
| UI/UX Pro Max | 757 reference entries across listed categories | Design rules, styles, palettes, charts and UX guidance; not 757 copy-ready components. |
| Libraries.dev | 5 React effect libraries | Libraries/packages rather than a component gallery; React-targeted. |
| Anime.js | 1 animation library | Already vendored locally in PRINCIPIA. |
| favico.js | 1 favicon library | Already vendored locally in PRINCIPIA. |

## Existing PRINCIPIA vault

The vault now contains 537 base structures: 40 original/adapted PRINCIPIA patterns, all 480 Lucian UX/UI Prompt elements (001–480), and 17 vanilla-CSS Uiverse Galaxy elements. Each can be displayed with 25 selectable skins, for 13,575 selectable visual variants. The 13,575 figure is not 13,575 distinct source components. Imported Lucian source code retains its MIT attribution in the exported HTML. Live previews run in sandboxed iframes with scripts enabled but network access and same-origin access denied.

## Import policy

1. Do not bulk-copy source code without checking its license and required attribution.
2. Do not copy paid/PRO-only entries or sources with unclear reuse permission.
3. React/Tailwind components must be ported and tested; they cannot be loaded as plain script tags in this static app.
4. Keep source credits beside imported code.
5. Keep mascot assets out until the user confirms the character submission set is complete.
6. Import in batches, deduplicate, isolate CSS, preserve keyboard accessibility and reduced-motion behavior, and verify mobile layouts before calling an item integrated.


Uiverse import note: 17 components with embedded vanilla CSS were copied from the MIT-licensed `uiverse-io/galaxy` archive. Tailwind-only snippets and entries without self-contained CSS were excluded from this batch. Original creator comments and explicit Uiverse/MIT attribution are retained. The upstream live site advertises 7,475 community elements; that count is not the number imported into PRINCIPIA.

Additional Uiverse batch: 6 more self-contained HTML/CSS elements were imported from the MIT-licensed `uiverse-io/galaxy` archive. Items without embedded CSS, Tailwind-only snippets, and inaccessible source paths were skipped rather than guessed.
