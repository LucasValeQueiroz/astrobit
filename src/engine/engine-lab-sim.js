/**
 * AstroBit AAA Game Engineering Lab — Pure Math & Simulation Engine (DOM-free).
 * Powers interactive visual playgrounds that teach kids (and devs!) how modern
 * blockbuster games stay fast inside strict Memory, CPU/GPU, and Energy budgets.
 */

export const ENGINE_LAB_TOPICS = [
  {
    id: 'culling',
    num: 1,
    icon: '🔦',
    term: 'Frustum & Occlusion Culling',
    titlePt: 'Corte de Visão',
    titleEn: 'Field-of-View Culling',
    kidPt: 'A nave só desenha o que está dentro do farol da câmera — e ignora o que está escondido atrás da lua!',
    kidEn: 'The ship only draws what is inside the camera flashlight — and skips anything hidden behind the moon!',
    proPt: 'Frustum Culling testa os 6 planos da câmera; Occlusion Culling evita overdraw de objetos escondidos.',
    proEn: 'Frustum Culling tests the 6 camera planes; Occlusion Culling skips hidden objects to prevent overdraw.',
    tipPt: '🎮 Mexa o mouse (ou dedo) no espaço para girar a câmera!',
    tipEn: '🎮 Move your mouse (or finger) in space to aim the camera!',
  },
  {
    id: 'lod',
    num: 2,
    icon: '🔺',
    term: 'Level of Detail (LOD)',
    titlePt: 'Detalhe Dinâmico',
    titleEn: 'Dynamic Level of Detail',
    kidPt: 'De perto o planeta tem muitos detalhes; de longe ele usa bem menos peças e parece igualzinho!',
    kidEn: 'Up close the planet has tons of details; far away it uses far fewer pieces and still looks identical!',
    proPt: 'LOD ajusta a densidade de polígonos/meshlets conforme o tamanho projetado na tela e carga da GPU.',
    proEn: 'LOD adapts polygon/meshlet density to screen-space size and GPU load, saving massive vertex work.',
    tipPt: '🎮 Arraste para a esquerda/direita no espaço para aproximar ou afastar o planeta!',
    tipEn: '🎮 Drag left/right in space to move the planet closer or farther!',
  },
  {
    id: 'streaming',
    num: 3,
    icon: '📦',
    term: 'Open-World Data Streaming',
    titlePt: 'Streaming de Mundo',
    titleEn: 'World Data Streaming',
    kidPt: 'Um universo inteiro não cabe na memória! A nave carrega os setores à frente e guarda os antigos!',
    kidEn: 'A whole universe cannot fit in RAM! The ship pre-loads sectors ahead and unloads old ones behind!',
    proPt: 'Streaming assíncrono prevê células futuras pelo vetor de velocidade e libera setores antigos da VRAM.',
    proEn: 'Async streaming predicts upcoming map cells from velocity vectors and evicts old sectors from VRAM.',
    tipPt: '🎮 Mexa o mouse (ou dedo) para pilotar a nave pela galáxia infinita!',
    tipEn: '🎮 Move your mouse (or finger) to pilot the ship across the open galaxy!',
  },
  {
    id: 'ai_lod',
    num: 4,
    icon: '🧠',
    term: 'AI LOD & ECS Boids',
    titlePt: 'IA em Camadas',
    titleEn: 'Layered AI (AI LOD)',
    kidPt: 'Robôs perto do AstroBit pensam sozinhos (desviam e planejam rotas); os de longe voam em bando leve!',
    kidEn: 'Robots close to AstroBit think individually (pathfinding); far ones fly in a lightweight flock!',
    proPt: 'AI LOD usa árvores de comportamento + A* perto do jogador e ECS / flow fields / boids com baixa taxa de tick à distância.',
    proEn: 'AI LOD runs full behavior trees + A* near the player and lightweight ECS/boids flow fields at lower tick rates afar.',
    tipPt: '🎮 Mexa o AstroBit no mapa para ver os robôs mudarem de enxame para IA completa!',
    tipEn: '🎮 Move AstroBit around to watch bots switch from flock mode to full AI!',
  },
  {
    id: 'fluids',
    num: 5,
    icon: '🌊',
    term: 'Hybrid Fluid Mesh (FFT + Local)',
    titlePt: 'Fluidos Híbridos',
    titleEn: 'Hybrid Fluid Mesh',
    kidPt: 'O oceano inteiro usa ondas matemáticas super leves — e só perto do barco a física real cria espuma e rastro!',
    kidEn: 'The whole ocean uses super-light math waves — real splash physics only wakes up right around the boat!',
    proPt: 'Ondas macro via seno/FFT em vertex shaders combinadas com simulação local de partículas/altura ao redor da embarcação.',
    proEn: 'Macro waves via periodic/FFT vertex shaders blended with localized particle & wake physics near the hull.',
    tipPt: '🎮 Deslize o mouse (ou dedo) sobre o mar espacial para navegar e criar espuma!',
    tipEn: '🎮 Slide your mouse (or finger) across the space ocean to steer and splash!',
  },
];

function normalizeAngle(rad) {
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Classifies entities against a 2D camera frustum cone and an occluder disc.
 * Returns each entity with status: 'visible' | 'occluded' | 'frustum_culled'.
 */
export function evaluateFrustumAndOcclusion({
  camX,
  camY,
  camAngle,
  fovRad = Math.PI / 3,
  maxDist = 360,
  occluder = null,
  entities = [],
  cullingEnabled = true,
}) {
  const halfFov = fovRad / 2;
  let visibleCount = 0;
  let frustumCulled = 0;
  let occludedCount = 0;

  const classified = entities.map((e) => {
    const dx = e.x - camX;
    const dy = e.y - camY;
    const dist = Math.hypot(dx, dy);
    const angleDiff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - camAngle));

    const insideFrustum = dist <= maxDist && angleDiff <= halfFov;
    let isOccluded = false;

    if (insideFrustum && occluder) {
      const odx = occluder.x - camX;
      const ody = occluder.y - camY;
      const oDist = Math.hypot(odx, ody);
      if (dist > oDist + occluder.r * 0.4) {
        const occAngle = Math.atan2(ody, odx);
        const occHalfSpan = Math.asin(Math.min(0.95, occluder.r / Math.max(occluder.r + 1, oDist)));
        const diffToOcc = Math.abs(normalizeAngle(Math.atan2(dy, dx) - occAngle));
        if (diffToOcc <= occHalfSpan) {
          isOccluded = true;
        }
      }
    }

    let status = 'visible';
    if (!insideFrustum) {
      status = 'frustum_culled';
      frustumCulled += 1;
    } else if (isOccluded) {
      status = 'occluded';
      occludedCount += 1;
    } else {
      visibleCount += 1;
    }

    const drawn = cullingEnabled ? status === 'visible' : true;
    return { ...e, status, drawn };
  });

  const drawnCount = cullingEnabled ? visibleCount : entities.length;
  const loadRatio = entities.length > 0 ? drawnCount / entities.length : 0;
  const fps = Math.round(cullingEnabled ? 60 - loadRatio * 6 : Math.max(18, 60 - loadRatio * 38));
  const gpuPct = Math.round(Math.min(100, 14 + loadRatio * 82));
  const energyPct = Math.round(Math.min(100, 18 + loadRatio * 76));

  return {
    entities: classified,
    stats: {
      total: entities.length,
      drawn: drawnCount,
      visible: visibleCount,
      frustumCulled,
      occluded: occludedCount,
      fps,
      gpuPct,
      energyPct,
    },
  };
}

/**
 * Selects the geometric Level of Detail (LOD0 High, LOD1 Medium, LOD2 Low)
 * based on normalized distance `distNorm` in [0..1] (0 = close, 1 = far).
 */
export function selectLodTier(distNorm, lodEnabled = true) {
  const d = Math.max(0, Math.min(1, Number(distNorm) || 0));
  if (!lodEnabled) {
    return {
      tier: 'LOD0',
      sides: 64,
      triangles: 4800,
      hasRingsDetail: true,
      hasGlowDetail: true,
      fps: 29,
      gpuPct: 92,
      energyPct: 88,
    };
  }
  if (d < 0.34) {
    return {
      tier: 'LOD0',
      sides: 64,
      triangles: 4800,
      hasRingsDetail: true,
      hasGlowDetail: true,
      fps: 58,
      gpuPct: 68,
      energyPct: 62,
    };
  }
  if (d < 0.68) {
    return {
      tier: 'LOD1',
      sides: 18,
      triangles: 960,
      hasRingsDetail: true,
      hasGlowDetail: false,
      fps: 60,
      gpuPct: 38,
      energyPct: 36,
    };
  }
  return {
    tier: 'LOD2',
    sides: 7,
    triangles: 140,
    hasRingsDetail: false,
    hasGlowDetail: false,
    fps: 60,
    gpuPct: 18,
    energyPct: 20,
  };
}

/**
 * Computes active, predicted (prefetch), and evicted map chunks for open-world streaming.
 */
export function computeStreamingChunks({
  cols = 7,
  rows = 5,
  shipCol = 3,
  shipRow = 2,
  velX = 0,
  velY = 0,
  streamingEnabled = true,
}) {
  const totalChunks = cols * rows;
  const predCol = Math.max(0, Math.min(cols - 1, shipCol + Math.sign(velX)));
  const predRow = Math.max(0, Math.min(rows - 1, shipRow + Math.sign(velY)));

  const cells = [];
  let loadedCount = 0;
  let prefetchCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let state = 'unloaded';
      if (!streamingEnabled) {
        state = 'loaded';
        loadedCount += 1;
      } else {
        const dist = Math.max(Math.abs(c - shipCol), Math.abs(r - shipRow));
        if (dist <= 1) {
          state = 'loaded';
          loadedCount += 1;
        } else if (Math.abs(c - predCol) <= 1 && Math.abs(r - predRow) <= 1) {
          state = 'prefetch';
          prefetchCount += 1;
        }
      }
      cells.push({ col: c, row: r, state });
    }
  }

  const vramPct = Math.round(((loadedCount + prefetchCount * 0.5) / totalChunks) * 100);
  const fps = streamingEnabled ? 60 : 21;
  const energyPct = streamingEnabled ? 34 : 94;

  return {
    cells,
    stats: {
      totalChunks,
      loadedCount,
      prefetchCount,
      vramPct,
      fps,
      energyPct,
    },
  };
}

/**
 * Evaluates AI LOD tiers: agents within `nearRadius` run full individual AI (A* / behavior tree);
 * distant agents run lightweight crowd/boid flow-field rules when `aiLodEnabled` is true.
 */
export function evaluateAiLodAgents({
  playerX,
  playerY,
  nearRadius = 110,
  agents = [],
  aiLodEnabled = true,
}) {
  let fullAiCount = 0;
  let crowdCount = 0;

  const classified = agents.map((a) => {
    const dist = Math.hypot(a.x - playerX, a.y - playerY);
    const tier = !aiLodEnabled || dist <= nearRadius ? 'full' : 'crowd';
    if (tier === 'full') fullAiCount += 1;
    else crowdCount += 1;
    return { ...a, dist, tier };
  });

  // Full AI costs ~10x more CPU than crowd boids
  const totalCost = fullAiCount * 10 + crowdCount * 1;
  const maxCost = Math.max(1, agents.length * 10);
  const cpuRatio = totalCost / maxCost;
  const cpuPct = Math.round(Math.min(100, 12 + cpuRatio * 84));
  const fps = Math.round(Math.max(19, 60 - cpuRatio * 36));
  const energyPct = Math.round(Math.min(100, 16 + cpuRatio * 78));

  return {
    agents: classified,
    stats: {
      total: agents.length,
      fullAiCount,
      crowdCount,
      cpuPct,
      fps,
      energyPct,
    },
  };
}

/**
 * Evaluates a 1D slice of the Hybrid Fluid Mesh: macro periodic/FFT wave + local hull wake physics.
 */
export function evaluateHybridFluidWave({
  samples = 48,
  width = 540,
  boatX = 270,
  localRadius = 78,
  time = 0,
  hybridEnabled = true,
}) {
  const points = [];
  let localPhysCount = 0;

  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * width;
    const macroY = Math.sin(x * 0.032 + time * 2.4) * 10 + Math.cos(x * 0.07 - time * 1.5) * 4;
    const dx = Math.abs(x - boatX);
    const inLocal = dx <= localRadius;
    const isPhysicsSample = !hybridEnabled || inLocal;
    if (isPhysicsSample) localPhysCount += 1;

    const wakeFactor = inLocal ? Math.cos((dx / localRadius) * (Math.PI / 2)) : 0;
    const wakeY = wakeFactor * Math.sin(dx * 0.25 - time * 9) * 11;
    points.push({ x, yOffset: macroY + wakeY, inLocal, isPhysicsSample });
  }

  const ratio = localPhysCount / Math.max(1, samples);
  const cpuPct = Math.round(Math.min(100, 14 + ratio * 84));
  const fps = hybridEnabled ? 60 : 17;
  const energyPct = hybridEnabled ? 28 : 95;

  return {
    points,
    stats: {
      samples,
      localPhysCount,
      macroOnlyCount: samples - localPhysCount,
      cpuPct,
      fps,
      energyPct,
    },
  };
}
