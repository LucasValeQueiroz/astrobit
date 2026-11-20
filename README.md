# 🚀 AstroBit

[![License: MIT](https://img.shields.io/badge/License-MIT-e3b341?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-3fb950?style=for-the-badge)](#architecture)
[![Live Demo](https://img.shields.io/badge/Play_Online-GitHub_Pages-2f81f7?style=for-the-badge&logo=github)](https://lucasvalequeiroz.github.io/astrobit/)

An open-source **educational space coding puzzle game** built to teach young learners computational thinking — from visual sequence blocks all the way to **loops**, **conditional sensors**, **reusable functions (`F1`/`F2`)**, **step-by-step debugging**, and live **JavaScript / Python** code previews.

> Built with **zero runtime dependencies** (native ES Modules + HTML5 Canvas 2D + Web Audio API) so it loads fast on any computer, tablet, or phone directly from GitHub Pages.

---

## ✨ Planned Features & Learning Curve

- **5 Progressive Worlds (30 Handcrafted Levels):**
  1. 🌙 **Moon of Crystals** — Sequences & spatial orientation
  2. ⚙️ **Gear Planet** — Loops (`Repeat N×`) & pattern recognition
  3. ⚡ **Laser Belt** — Switches, bridges, portals & conditional sensors (`If`)
  4. 🛰️ **Function Station** — Decomposition & reusable subroutines (`F1`, `F2`)
  5. 🌌 **Engineer Nebula** — Master challenges & **"Bug Hunt!"** debugging puzzles
- **Visual Step-by-Step Debugger:** Step one block at a time (`⏭️`), see the exact block causing a bump, and peek at the live **JavaScript / Python** equivalent highlighted line by line.
- **Mathematically Verified Levels:** Every level's reference solution is validated in automated `node --test` checks to guarantee solvability and 3-star parity.
- **Creative Workshop:** Build custom puzzles and share them via URL (`?custom=...`) — no backend or account required.

---

## 🧪 Local Development & Tests

Requires only **Node.js 20+** (no `npm install` needed):

```bash
git clone https://github.com/LucasValeQueiroz/astrobit.git
cd astrobit

# Run all engine, interpreter, transpiler, and level tests
node --test tests/*.test.mjs

# Preview locally
python -m http.server 8080
```

---

## 🏗️ Architecture

```text
src/
├── engine/      # 100% pure, DOM-free deterministic grid, AST interpreter, JS/Python transpiler & validator
├── levels/      # Progressive 5-world campaign with verified 3-star reference solutions
├── renderer/    # 60fps HTML5 Canvas 2D renderer, expressive robot & particle effects
├── audio/       # Zero-asset Web Audio API space sound synthesizer
├── ui/          # Touch + drag-and-drop block editor, code peek, workshop & garage
└── storage/     # Local progress, stars & unlocked robot skins (localStorage)
```

---

## 📄 License

Released under the [MIT License](LICENSE).
