# 🚀 AstroBit

[![License: MIT](https://img.shields.io/badge/License-MIT-e3b341?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-3fb950?style=for-the-badge)](#architecture)
[![Tests](https://img.shields.io/badge/Node_Tests-80%2F80_Passing-2ea043?style=for-the-badge)](#local-development--tests)
[![Live Demo](https://img.shields.io/badge/Play_Online-GitHub_Pages-2f81f7?style=for-the-badge&logo=github)](https://lucasvalequeiroz.github.io/astrobit/)

An open-source **educational space coding puzzle game** built to teach young learners (ages 5–10+) computational thinking — from visual **interlocking SVG jigsaw blocks** all the way to **loops**, **conditional sensors**, **reusable functions (`F1`/`F2`)**, **multi-portal wormholes**, **ice & energy-crate physics**, **"Bug Hunt!" debugging**, and live **JavaScript / Python** code previews.

> Built with **zero runtime dependencies** (native ES Modules + HTML5 Canvas 2D + procedural Web Audio API soundtrack & SFX + `node --test`) so it loads instantly on any computer, tablet, or phone directly from GitHub Pages.

![AstroBit Social Preview](assets/og-preview.svg)

---

## 📸 Live Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="assets/previews/lab-dlss-upscaling.png" alt="AAA Lab — AI Temporal Upscaling (DLSS/FSR Split-Screen)" />
      <br /><sub><strong>🧪 AAA Lab — AI Temporal Upscaling (DLSS / FSR Split-Screen + 60fps Profiler)</strong></sub>
    </td>
    <td align="center" width="50%">
      <img src="assets/previews/lab-raytracing-bvh.png" alt="AAA Lab — Ray Tracing & BVH Acceleration" />
      <br /><sub><strong>✨ AAA Lab — Ray Tracing &amp; BVH Tree Acceleration</strong></sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="assets/previews/puzzle-editor-code.png" alt="AstroBit — Puzzle Editor, 2D Canvas & Live JS/Python Code" />
      <br /><sub><strong>🧩 SVG Jigsaw Editor + 2D Canvas + Live JS / Python Code Peek</strong></sub>
    </td>
    <td align="center" width="50%">
      <img src="assets/previews/galaxy-map.png" alt="AstroBit — 60fps Animated Galaxy Map" />
      <br /><sub><strong>🗺️ 60fps Animated Galaxy &amp; Planet Biome Map (7 Worlds · 42 Levels)</strong></sub>
    </td>
  </tr>
</table>

---

## ✨ Key Features

- **📖 Story Campaign — *"Operação: Luz da Terra!"* (PT-BR & EN):**
  - 3-scene animated **Intro Cinematic**, per-world **Planet Arrival Briefings**, custom story hooks and triumph lines for all **36 bases**, and a **Grand Finale Ending Cinematic** with an Official Space Engineer Medal!
- **🗺️ 4-Act 60fps Interplanetary Galaxy Flight & 7 Unique Planet Biomes:**
  - Fly **Starship Estrela-1** across **7 worlds and 42 planetary hubs** (including the global Earth → Moon route: `🇧🇷 Brazil → 🇺🇸 USA → 🇪🇺 Europe → 🌍 Africa → 🇨🇳 China → 🇯🇵 Japan` with 42 real space/CS fun facts!), featuring **Vertical Orbital Liftoff → Milky Way Galaxy Cruise → 4.4× Destination Planet Zoom → 1,650 °C Thermal Re-entry** with live AAA LOD telemetry and **⚡ interactive Turbo Boost**!
- **⏪ Time Machine — Time-Travel Debugger:**
  - After any run, scrub a timeline (slider, ⏪/⏩, or ←/→ keys) to rewind AstroBit step by step: crystals reappear, buttons un-press, the running block glows in the editor and in live JS/Python, with a VHS `⏪ REWIND` flash and pitch-scaled scrub ticks. Emoji markers (💎 🔓 🌀 📦 💥 🏁) flag key moments, and editing the program creates a **new timeline** that shows a magenta echo of the old path plus a 🔀 marker at the exact step where history changed. Powered by a pure, immutable snapshot engine (`src/engine/time-machine.js`) proven lossless across all 42 reference solutions.
- **👆 Interactive Step-by-Step Kids Guided Tutorial + Live A\* Pathfinder & `⚡ Raio-X` AAA Overlay:**
  - Guides kids (6–12 yrs) step-by-step on Level 1-1 (`Step 1/3 → 2/3 → 3/3` with bouncing `👆` pointer & pulsing green `▶️ Run`), powered by a real-time **BFS/A\* Pathfinder Coach**, plus a 1-click **`⚡ Raio-X`** overlay showing live AABB colliders, A\* search frontier, Wayfinder breadcrumbs, FPS, quadratic camera trauma screen-shake, and floating action popups!
- **🧩 Physical SVG Interlocking Jigsaw Puzzle Editor + Tactile Mouse & Touch DnD:**
  - Tactile 4-direction **Compass Palette** (`⬆️ ⬇️ ⬅️ ➡️`), true male/female SVG jigsaw connectors, C-shaped `🔁 Repeat` and `🔎 If (sensor)` clamps, reusable `⚡ F1` / `🌟 F2` stacks, magnetic mouse & touch drag-and-drop with floating ghost + glowing snap rails, live dotted path preview, and keyboard shortcuts (`Space`, `S`, `R`, `Ctrl+Z`).
- **🌌 7 Progressive Worlds · 42 Mathematically Proven Levels (⭐ 126 Stars):**
  1. 🌙 **Moon of Crystals** — Sequences & 4-direction planning
  2. ⚙️ **Gear Planet** — Loops (`Repeat N×`) & nested loops
  3. ⚡ **Laser Belt** — Switches, retractable bridges, paired portals & conditional sensors (`If`)
  4. 🛰️ **Function Station** — Decomposition & reusable subroutines (`F1`, `F2`)
  5. 🌌 **Engineer Nebula** — 3 interactive **"🐛 Bug Hunt!"** debugging puzzles & Grand Finale
  6. 🌀 **Wormhole Dimension (Bonus)** — 6 multi-portal chain levels (`1`–`4` portal pairs) with rotating vortex & quantum warp beam FX!
  7. ❄️ **Frozen Planet (Bonus)** — 6 slippery ice-slide & pushable energy-crate physics puzzles!
- **🕹️ Endless Arcade Mode + 👻 Holographic Ghost Replay (`?ghost=`) + 🪪 Exportable PNG Passport:**
  - Infinite 3★-guaranteed escalating puzzles with **3 Shields ❤️❤️❤️** and **×1→×5 Combos**; race your own translucent cyan **Ghost Replay** (or share `?custom=...&ghost=...` block-count challenges in 1 click); and export a **900×520 Space Engineer Passport PNG** client-side!
- **☁️ Pilot Center (XP `Lv.1–25` · 6 Space Quests · 🏆 Global Top 20 Ranking · History · Google Cloud Sync):**
  - Earn Space XP & Level-Up toasts across 6 live quests, track your last 50 wins in the Flight Logbook, export/restore portable `.json` backups, or sign in with **Google (Firebase Auth + Firestore)** for conflict-free cross-device cloud sync and the kid-safe **Global Galaxy Hall of Fame**!
- **🔥 Daily Space Mission & Streak + 🏆 15 Space Medals:**
  - Deterministic daily puzzle generator (100 consecutive days mathematically proven `3★`) with **Daily Streak 🔥** tracking, plus **15 unlockable Space Medals** (including **❄️ Glacial Master**, **🕹️ Arcade Ace**, and **🧪 AAA Game Engineer**) with animated videogame unlock toasts and fanfare!
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
  - 7 unique planet themes synthesized in real time (zero audio files!) plus cinematic SFX (ice glide, battery curling, thermal re-entry, new record) that dynamically accelerate BPM in **Turbo** mode.
- **👀 Visual Step-by-Step Debugger & Live JS / Python Code Peek:**
  - Step one piece at a time (`⏭️`), see the exact piece causing a bump, and watch your puzzle transpile line-by-line into real **JavaScript** or **Python**.
- **🛠️ Creative Level Workshop (`?custom=...`):**
  - Paint custom space puzzles with click or touch-drag (including all 4 portal pairs, ice, energy crates, and 5 starter templates), test immediately, save a local family library, and share playable links via compact URL-safe Base64!
- **🎨 Robot Garage (8 Skins + 5 Collectible Companion Drones):**
  - Unlock **8 animated robot skins** (up to *🌀 AstroQuântico* `75★` and *❄️ AstroGlacial* `95★`) plus **5 floating Companion Drones** (`✨ Spark`, `🐱 Nebula Cat`, `🛸 Mini Probe`, `🦉 Comet Owl`, `🦊 Quantum Fox`) unlocked via Space Medals!

---

## 🧪 Local Development & Tests

Requires only **Node.js 20+** (zero `npm install` needed):

```bash
git clone https://github.com/LucasValeQueiroz/astrobit.git
cd astrobit

# Run all 80 engine, time-machine, interpreter, transpiler, daily challenge, arcade, badges, music, biomes, workshop, AAA Lab, and 42-level solvability tests
node --test tests/*.test.mjs

# Preview locally
python -m http.server 8080
```

---

## 🏗️ Architecture

```text
assets/
├── og-preview.svg     # 1200×630 vector OpenGraph social preview
└── previews/          # Real 1280×800 live screenshots (AAA Lab, Puzzle Editor, Galaxy Map)
src/
├── engine/            # Pure DOM-free grid, AST interpreter, JS/Python transpiler, validator, daily/arcade generators & custom-level codec
├── levels/            # 7-world / 42-level campaign with mathematically verified 3★ reference solutions
├── story/             # Bilingual narrative bible ("Operação: Luz da Terra!"), 7 planet biomes & orbital LOD transitions
├── renderer/          # 60fps HTML5 Canvas 2D space renderer, wormhole vortex FX, 7 expressive robot skins & particles
├── audio/             # Zero-asset Web Audio API SFX synth + 6-theme interactive procedural soundtrack
├── ui/                # SVG jigsaw workspace, magnetic touch/mouse DnD, 3-Act 3D orbital cinema, AAA Lab, workshop & PT/EN i18n
└── storage/           # Local progress, stars, space medals, daily streak, skins, drones & custom level library (localStorage)
```

---

## 📄 License

Released under the [MIT License](LICENSE).
