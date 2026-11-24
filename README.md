# 🚀 AstroBit

[![License: MIT](https://img.shields.io/badge/License-MIT-e3b341?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-3fb950?style=for-the-badge)](#architecture)
[![Tests](https://img.shields.io/badge/Node_Tests-42%2F42_Passing-2ea043?style=for-the-badge)](#local-development--tests)
[![Live Demo](https://img.shields.io/badge/Play_Online-GitHub_Pages-2f81f7?style=for-the-badge&logo=github)](https://lucasvalequeiroz.github.io/astrobit/)

An open-source **educational space coding puzzle game** built to teach young learners (ages 5–10+) computational thinking — from visual **interlocking SVG jigsaw blocks** all the way to **loops**, **conditional sensors**, **reusable functions (`F1`/`F2`)**, **multi-portal wormholes**, **"Bug Hunt!" debugging**, and live **JavaScript / Python** code previews.

> Built with **zero runtime dependencies** (native ES Modules + HTML5 Canvas 2D + procedural Web Audio API soundtrack & SFX + `node --test`) so it loads instantly on any computer, tablet, or phone directly from GitHub Pages.

![AstroBit Social Preview](assets/og-preview.svg)

---

## ✨ Key Features

- **📖 Story Campaign — *"Operação: Luz da Terra!"* (PT-BR & EN):**
  - 3-scene animated **Intro Cinematic**, per-world **Planet Arrival Briefings**, custom story hooks and triumph lines for all **36 bases**, and a **Grand Finale Ending Cinematic** with an Official Space Engineer Medal!
- **🗺️ 60fps Animated Galaxy & Planet Journey Map:**
  - Fly **Starship Estrela-1** across **6 worlds and 36 planetary bases** along curved Bezier star trails with **⚡ interactive Turbo Boost**, **🌌 Hyperspace Warp** jumps between planets, and plasma exhaust trails.
- **🧩 Physical SVG Interlocking Jigsaw Puzzle Editor + Tactile Mouse & Touch DnD:**
  - Tactile 4-direction **Compass Palette** (`⬆️ ⬇️ ⬅️ ➡️`), true male/female SVG jigsaw connectors, C-shaped `🔁 Repeat` and `🔎 If (sensor)` clamps, reusable `⚡ F1` / `🌟 F2` stacks, magnetic mouse & touch drag-and-drop with floating ghost + glowing snap rails, live dotted path preview, and keyboard shortcuts (`Space`, `S`, `R`, `Ctrl+Z`).
- **🌌 6 Progressive Worlds · 36 Mathematically Proven Levels (⭐ 108 Stars):**
  1. 🌙 **Moon of Crystals** — Sequences & 4-direction planning
  2. ⚙️ **Gear Planet** — Loops (`Repeat N×`) & nested loops
  3. ⚡ **Laser Belt** — Switches, retractable bridges, paired portals & conditional sensors (`If`)
  4. 🛰️ **Function Station** — Decomposition & reusable subroutines (`F1`, `F2`)
  5. 🌌 **Engineer Nebula** — 3 interactive **"🐛 Bug Hunt!"** debugging puzzles & Grand Finale
  6. 🌀 **Wormhole Dimension (Bonus)** — 6 multi-portal chain levels (`1`–`4` portal pairs) with rotating vortex & quantum warp beam FX!
- **🔥 Daily Space Mission & Streak + 🏆 13 Space Medals:**
  - Deterministic daily puzzle generator (100 consecutive days mathematically proven `3★`) with **Daily Streak 🔥** tracking, plus **13 unlockable Space Medals** (including **🧪 AAA Game Engineer**) with animated videogame unlock toasts and fanfare!
- **🧪 AAA Game Engineering Lab (7 Interactive 60fps Simulators):**
  - Hands-on visual playground teaching how blockbuster games run inside strict **Memory, CPU/GPU, and Energy** budgets — with a live **FPS Profiler Sparkline**, **ON/OFF optimization toggle**, and **Quick-Challenge Quizzes**:
    1. 🔦 **Frustum & Occlusion Culling**
    2. 🔺 **Dynamic Level of Detail (LOD)**
    3. 📦 **Open-World Data Streaming (VRAM / SSD Prefetch)**
    4. 🧠 **Layered AI (AI LOD & ECS Boids)**
    5. 🌊 **Hybrid Fluid Mesh (FFT Waves + Local Hull Physics)**
    6. ✨ **Ray Tracing & BVH Acceleration**
    7. 🤖 **AI Temporal Upscaling (DLSS / FSR / PSSR Split-Screen)**
- **🎵 Interactive Procedural Space Soundtrack (Web Audio API):**
  - 6 unique planet themes synthesized in real time (zero audio files!) that dynamically accelerate BPM in **Turbo** mode and pulse during execution, with independent **🎵 Music** and **🔊 SFX** toggles.
- **👀 Visual Step-by-Step Debugger & Live JS / Python Code Peek:**
  - Step one piece at a time (`⏭️`), see the exact piece causing a bump, and watch your puzzle transpile line-by-line into real **JavaScript** or **Python**.
- **🛠️ Creative Level Workshop (`?custom=...`):**
  - Paint custom space puzzles with click or touch-drag (including all 4 portal pairs and 4 starter templates), test immediately, save a local family library, and share playable links via compact URL-safe Base64 — **zero backend required**!
- **🎨 Robot Garage:**
  - Unlock **7 animated robot skins** (from *Explorador Azul* to *Engenheiro Estelar* at `45★` and *🌀 AstroQuântico* at `75★`) with a live star progress bar.

---

## 🧪 Local Development & Tests

Requires only **Node.js 20+** (zero `npm install` needed):

```bash
git clone https://github.com/LucasValeQueiroz/astrobit.git
cd astrobit

# Run all 34 engine, interpreter, transpiler, daily challenge, badges, music, story, workshop, and 36-level solvability tests
node --test tests/*.test.mjs

# Preview locally
python -m http.server 8080
```

---

## 🏗️ Architecture

```text
assets/
└── og-preview.svg     # 1200×630 vector OpenGraph social preview
src/
├── engine/            # Pure DOM-free grid, AST interpreter, JS/Python transpiler, validator, daily generator & custom-level codec
├── levels/            # 6-world / 36-level campaign with mathematically verified 3★ reference solutions
├── story/             # Bilingual narrative bible ("Operação: Luz da Terra!") & scenic flight coordinates
├── renderer/          # 60fps HTML5 Canvas 2D space renderer, wormhole vortex FX, 7 expressive robot skins & particles
├── audio/             # Zero-asset Web Audio API SFX synth + 6-theme interactive procedural soundtrack
├── ui/                # SVG jigsaw workspace, magnetic touch/mouse DnD, 60fps flight cinema, workshop, medals & PT/EN i18n
└── storage/           # Local progress, stars, 12 space medals, daily streak, skins & custom level library (localStorage)
```

---

## 📄 License

Released under the [MIT License](LICENSE).
