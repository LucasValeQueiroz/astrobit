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
    quiz: {
      qPt: 'O que o Corte de Visão (Culling) faz para deixar o jogo rápido?',
      qEn: 'What does Field-of-View Culling do to keep games fast?',
      optsPt: ['Só desenha o que está visível na câmera', 'Diminui o brilho da tela', 'Apaga o jogo inteiro'],
      optsEn: ['Only draws what the camera can see', 'Dims the screen brightness', 'Deletes the whole game'],
      correctIdx: 0,
    },
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
    quiz: {
      qPt: 'Quando um planeta está bem LONGE, qual nível de detalhe (LOD) a GPU usa?',
      qEn: 'When a planet is FAR away, which Level of Detail (LOD) does the GPU pick?',
      optsPt: ['Mais triângulos (LOD0)', 'Menos triângulos (LOD2) para economizar GPU', 'Nenhum planeta'],
      optsEn: ['More triangles (LOD0)', 'Fewer triangles (LOD2) to save GPU work', 'No planet at all'],
      correctIdx: 1,
    },
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
    quiz: {
      qPt: 'Como jogos de mundo aberto cabem na memória (VRAM) do videogame?',
      qEn: 'How do huge open-world games fit inside console VRAM?',
      optsPt: ['Carregam setores à frente e liberam os antigos', 'Carregam o universo inteiro de uma vez', 'Usam apenas 1 fase pequena'],
      optsEn: ['Pre-load sectors ahead and unload old ones', 'Load the entire universe at once', 'Use only one tiny room'],
      correctIdx: 0,
    },
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
    quiz: {
      qPt: 'Por que os robôs distantes usam regras simples de bando (Boids) em vez de A*?',
      qEn: 'Why do distant bots use lightweight flock rules (Boids) instead of full A*?',
      optsPt: ['Para economizar muita CPU mantendo o mundo vivo', 'Porque esqueceram o caminho', 'Para o jogo ficar mais lento'],
      optsEn: ['To save huge CPU while keeping the world alive', 'Because they forgot the map', 'To make the game slower'],
      correctIdx: 0,
    },
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
    quiz: {
      qPt: 'Onde o motor ativa a simulação pesada de espuma e física real da água?',
      qEn: 'Where does the engine run heavy splash and wake physics?',
      optsPt: ['No oceano inteiro de ponta a ponta', 'Só na área bem perto do barco/personagem', 'Em lugar nenhum'],
      optsEn: ['Across the entire ocean at once', 'Only in the local zone around the boat/player', 'Nowhere at all'],
      correctIdx: 1,
    },
  },
  {
    id: 'raytracing',
    num: 6,
    icon: '✨',
    term: 'Ray Tracing & BVH Tree',
    titlePt: 'Ray Tracing (BVH)',
    titleEn: 'Ray Tracing & BVH',
    kidPt: 'Em vez de testar cada pedacinho do espaço, caixas mágicas (BVH) pulam áreas vazias e refletem a luz rapidinho!',
    kidEn: 'Instead of testing every tiny piece of space, magic boxes (BVH) skip empty areas and bounce light fast!',
    proPt: 'Árvores BVH (Bounding Volume Hierarchy) descartam milhões de triângulos por raio em ray tracing híbrido + denoisers.',
    proEn: 'BVH trees discard millions of triangles per ray for real-time hybrid ray tracing + reflections + denoisers.',
    tipPt: '🎮 Mexa o mouse (ou dedo) para mirar o raio de luz nos espelhos e caixas BVH!',
    tipEn: '🎮 Move your mouse (or finger) to aim the light ray across BVH boxes and mirrors!',
    quiz: {
      qPt: 'Qual é o superpoder da árvore BVH no Ray Tracing?',
      qEn: 'What is the superpower of a BVH tree in Ray Tracing?',
      optsPt: ['Pular caixas inteiras que o raio não toca', 'Aumentar o número de testes de triângulos', 'Desligar todas as luzes'],
      optsEn: ['Skip entire bounding boxes the ray misses', 'Increase triangle tests', 'Turn off all lights'],
      correctIdx: 0,
    },
  },
  {
    id: 'upscaling',
    num: 7,
    icon: '🤖',
    term: 'AI Temporal Upscaling (DLSS/FSR)',
    titlePt: 'Reconstrução por IA',
    titleEn: 'AI Upscaling (DLSS/FSR)',
    kidPt: 'A placa desenha um quadro menor (4× mais rápido!) e a IA usa vetores de movimento para reconstruir em 4K nítido!',
    kidEn: 'The GPU renders a smaller frame (4× faster!) and AI uses motion vectors to reconstruct razor-sharp 4K!',
    proPt: 'Inferência temporal (DLSS/FSR/PSSR) combina resolução interna menor + motion vectors + histórico de quadros em 4K.',
    proEn: 'Temporal neural upscaling (DLSS/FSR/PSSR) blends lower internal res + motion vectors + frame history into crisp 4K.',
    tipPt: '🎮 Arraste para a esquerda/direita na tela para comparar Baixa Res vs IA 4K!',
    tipEn: '🎮 Drag left/right across the screen to compare Low-Res vs AI 4K!',
    quiz: {
      qPt: 'Como DLSS / FSR / PSSR entregam 4K nítido gastando muito menos energia?',
      qEn: 'How do DLSS / FSR / PSSR deliver crisp 4K using far less GPU power?',
      optsPt: ['Renderizam em resolução menor e a IA reconstrói em 4K', 'Desenham cada pixel 4 vezes mais devagar', 'Usam apenas preto e branco'],
      optsEn: ['Render at lower resolution and AI reconstructs 4K', 'Draw every pixel 4× slower', 'Use black and white only'],
      correctIdx: 0,
    },
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

/**
 * 2D Ray vs Axis-Aligned Bounding Box (slab method) for BVH acceleration demo.
 */
function intersectRayAabb(ox, oy, dx, dy, box) {
  const invX = dx !== 0 ? 1 / dx : Infinity;
  const invY = dy !== 0 ? 1 / dy : Infinity;
  const t1 = (box.x - ox) * invX;
  const t2 = (box.x + box.w - ox) * invX;
  const t3 = (box.y - oy) * invY;
  const t4 = (box.y + box.h - oy) * invY;
  const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
  const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
  if (tmax < 0 || tmin > tmax) return null;
  const tHit = tmin >= 0 ? tmin : tmax;
  return { t: tHit, x: ox + dx * tHit, y: oy + dy * tHit };
}

/**
 * Evaluates a single light ray against BVH bounding boxes (each holding `triangles` geometry).
 * When `bvhEnabled` is true, only intersected BVH boxes have their triangles tested!
 */
export function evaluateRayTracingBvh({
  originX = 64,
  originY = 155,
  rayAngle = 0,
  boxes = [],
  bvhEnabled = true,
}) {
  const dx = Math.cos(rayAngle);
  const dy = Math.sin(rayAngle);
  let closestHit = null;
  let triangleTests = 0;
  let boxesHit = 0;

  const evaluatedBoxes = boxes.map((box) => {
    const hit = intersectRayAabb(originX, originY, dx, dy, box);
    const tris = Number(box.triangles) || 400;
    if (hit) {
      boxesHit += 1;
      triangleTests += tris;
      if (!closestHit || hit.t < closestHit.t) {
        closestHit = { ...hit, box };
      }
    } else if (!bvhEnabled) {
      triangleTests += tris;
    }
    return { ...box, hit: Boolean(hit), testedTriangles: hit || !bvhEnabled ? tris : 0 };
  });

  const totalTriangles = boxes.reduce((s, b) => s + (Number(b.triangles) || 400), 0);
  const ratio = totalTriangles > 0 ? triangleTests / totalTriangles : 0;
  const fps = bvhEnabled ? Math.round(60 - ratio * 10) : 14;
  const gpuPct = bvhEnabled ? Math.round(24 + ratio * 40) : 98;
  const energyPct = bvhEnabled ? Math.round(28 + ratio * 34) : 96;

  return {
    boxes: evaluatedBoxes,
    closestHit,
    stats: {
      boxesTotal: boxes.length,
      boxesHit,
      triangleTests,
      totalTriangles,
      fps,
      gpuPct,
      energyPct,
    },
  };
}

/**
 * Evaluates AI Temporal Upscaling (DLSS / FSR / PSSR) metrics vs Native 4K rendering.
 */
export function evaluateAiUpscaling({ upscalingEnabled = true } = {}) {
  if (upscalingEnabled) {
    return {
      internalRes: '1080p',
      outputRes: '4K (AI)',
      shadedMillions: 2.07,
      fps: 60,
      gpuPct: 38,
      energyPct: 40,
    };
  }
  return {
    internalRes: '4K Native',
    outputRes: '4K Native',
    shadedMillions: 8.29,
    fps: 23,
    gpuPct: 97,
    energyPct: 94,
  };
}
