# AstroBit Engineering & Quality Rules

These rules apply automatically to every conversation working inside `C:\000 - AstroBit`.

## Core Principles
- **Zero runtime dependencies:** Keep AstroBit 100% vanilla ES Modules + HTML5 Canvas 2D + Web Audio API + `node --test` so it loads instantly on GitHub Pages with zero build step.
- **Mathematical solvability proof:** Every campaign level and daily challenge generator MUST pass `node --test` (all levels proven `3★` via `validateLevel`). Never merge a PR with failing tests.
- **Kid-first UX & 1-screen desktop fit:** Keep the main game fitting cleanly in `1280x800` desktop (`100dvh`) with tactile mouse + touch support, playful audio/visual feedback, and bilingual PT-BR / EN support.
- **Cache-busting on GitHub Pages:** Whenever changing CSS or ES module entrypoints, bump `?v=` query strings in `index.html` and affected module imports so returning browsers immediately see the new version.
- **Live Browser QA:** After major UI changes, verify live on `https://lucasvalequeiroz.github.io/astrobit/` (0 console errors, 0 failed network requests, zero layout clipping).
- **HQ Sync:** After shipping major milestones, update `c:\000 - Achievements\HQ.md` (and `C:\000 - SPEC-ASTROBIT\ESTADO.md`) so the Central HQ chat stays in sync.
