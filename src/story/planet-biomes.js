/**
 * AstroBit 7 Unique Planet Biomes, Global Journey Regions & AAA Orbital LOD Telemetry.
 * 100% pure, DOM-free data & transition math.
 * World 1 models an iconic global spaceflight route (Brazil -> USA -> Europe -> Africa -> China -> Japan)
 * while Worlds 2-7 each feature distinct thematic regions and live 60fps biome visuals.
 */

export const PLANET_BIOMES = {
  1: {
    world: 1,
    kind: 'earth-orbit',
    atmosphereColor: '#38bdf8',
    reentryColor: '#fb923c',
    aaaTipPt: '⚡ AAA LOD 0 · Continentes e nuvens carregados em alta definição!',
    aaaTipEn: '⚡ AAA LOD 0 · Continents & clouds streamed in full detail!',
    regions: [
      { id: 'w1-1', flag: '🇧🇷', shortPt: 'Brasil', shortEn: 'Brazil', hubPt: 'Base Alcântara (Brasil)', hubEn: 'Alcântara Base (Brazil)' },
      { id: 'w1-2', flag: '🇺🇸', shortPt: 'EUA', shortEn: 'USA', hubPt: 'Cabo Canaveral (EUA)', hubEn: 'Cape Canaveral (USA)' },
      { id: 'w1-3', flag: '🇪🇺', shortPt: 'Europa', shortEn: 'Europe', hubPt: 'Estação Europa', hubEn: 'Europe Station' },
      { id: 'w1-4', flag: '🌍', shortPt: 'África', shortEn: 'Africa', hubPt: 'Saara Estelar (África)', hubEn: 'Star Sahara (Africa)' },
      { id: 'w1-5', flag: '🇨🇳', shortPt: 'China', shortEn: 'China', hubPt: 'Vale Dragão (China)', hubEn: 'Dragon Valley (China)' },
      { id: 'w1-6', flag: '🇯🇵', shortPt: 'Japão', shortEn: 'Japan', hubPt: 'Torre Lunar (Japão)', hubEn: 'Lunar Tower (Japan)' },
    ],
  },
  2: {
    world: 2,
    kind: 'clockwork-gears',
    atmosphereColor: '#fbbf24',
    reentryColor: '#f97316',
    aaaTipPt: '⚡ AAA Instancing · Engrenagens girando juntas em 60 FPS!',
    aaaTipEn: '⚡ AAA Instancing · Interlocking gears spinning at 60 FPS!',
    regions: [
      { id: 'w2-1', flag: '⚙️', shortPt: 'Pêndulo', shortEn: 'Pendulum', hubPt: 'Oficina do Pêndulo', hubEn: 'Pendulum Workshop' },
      { id: 'w2-2', flag: '🔩', shortPt: 'Molas', shortEn: 'Springs', hubPt: 'Vale das Molas', hubEn: 'Spring Valley' },
      { id: 'w2-3', flag: '🏭', shortPt: 'Turbo', shortEn: 'Turbo', hubPt: 'Fábrica Turbo', hubEn: 'Turbo Foundry' },
      { id: 'w2-4', flag: '🕰️', shortPt: 'Relógio', shortEn: 'Clock', hubPt: 'Torre do Relógio', hubEn: 'Clock Tower' },
      { id: 'w2-5', flag: '🌉', shortPt: 'Cobre', shortEn: 'Copper', hubPt: 'Ponte de Cobre', hubEn: 'Copper Bridge' },
      { id: 'w2-6', flag: '👑', shortPt: 'Núcleo', shortEn: 'Core', hubPt: 'Coração Mecânico', hubEn: 'Clockwork Core' },
    ],
  },
  3: {
    world: 3,
    kind: 'laser-belt',
    atmosphereColor: '#f472b6',
    reentryColor: '#fb7185',
    aaaTipPt: '⚡ AAA Ray Casting · Feixes de laser calculados em tempo real!',
    aaaTipEn: '⚡ AAA Ray Casting · Real-time laser beam intersection!',
    regions: [
      { id: 'w3-1', flag: '☄️', shortPt: 'Alfa', shortEn: 'Alpha', hubPt: 'Posto Asteroide Alfa', hubEn: 'Alpha Asteroid Outpost' },
      { id: 'w3-2', flag: '🔴', shortPt: 'Rubi', shortEn: 'Ruby', hubPt: 'Anel Rubi', hubEn: 'Ruby Ring' },
      { id: 'w3-3', flag: '🛡️', shortPt: 'Plasma', shortEn: 'Plasma', hubPt: 'Escudo de Plasma', hubEn: 'Plasma Shield' },
      { id: 'w3-4', flag: '📡', shortPt: 'Ômega', shortEn: 'Omega', hubPt: 'Satélite Ômega', hubEn: 'Omega Satellite' },
      { id: 'w3-5', flag: '⚡', shortPt: 'Cânion', shortEn: 'Canyon', hubPt: 'Cânion de Lasers', hubEn: 'Laser Canyon' },
      { id: 'w3-6', flag: '💎', shortPt: 'Prisma', shortEn: 'Prism', hubPt: 'Núcleo Prismático', hubEn: 'Prismatic Core' },
    ],
  },
  4: {
    world: 4,
    kind: 'function-station',
    atmosphereColor: '#34d399',
    reentryColor: '#22d3ee',
    aaaTipPt: '⚡ AAA Streaming · Módulos espaciais carregados sob demanda!',
    aaaTipEn: '⚡ AAA Streaming · Orbital modules streamed on demand!',
    regions: [
      { id: 'w4-1', flag: '🛰️', shortPt: 'Doca', shortEn: 'Dock', hubPt: 'Doca Modular', hubEn: 'Modular Dock' },
      { id: 'w4-2', flag: '⚡', shortPt: 'Chip F1', shortEn: 'Chip F1', hubPt: 'Setor Chip F1', hubEn: 'Chip F1 Sector' },
      { id: 'w4-3', flag: '🌟', shortPt: 'Lab F2', shortEn: 'Lab F2', hubPt: 'Laboratório F2', hubEn: 'F2 Laboratory' },
      { id: 'w4-4', flag: '🔋', shortPt: 'Solar', shortEn: 'Solar', hubPt: 'Matriz Solar', hubEn: 'Solar Array' },
      { id: 'w4-5', flag: '🔭', shortPt: 'Radar', shortEn: 'Radar', hubPt: 'Observatório Orbital', hubEn: 'Orbital Observatory' },
      { id: 'w4-6', flag: '🚀', shortPt: 'Comando', shortEn: 'Bridge', hubPt: 'Ponte de Comando', hubEn: 'Command Bridge' },
    ],
  },
  5: {
    world: 5,
    kind: 'engineer-nebula',
    atmosphereColor: '#c084fc',
    reentryColor: '#facc15',
    aaaTipPt: '⚡ AAA Volumetric FX · Nebulosa cósmica e Farol Solar ativos!',
    aaaTipEn: '⚡ AAA Volumetric FX · Cosmic nebula & Solar Beacon live!',
    regions: [
      { id: 'w5-1', flag: '✨', shortPt: 'Poeira', shortEn: 'Stardust', hubPt: 'Mar de Poeira Estelar', hubEn: 'Stardust Sea' },
      { id: 'w5-2', flag: '🐛', shortPt: 'Bugs', shortEn: 'Bug Nest', hubPt: 'Ninho dos Bugs', hubEn: 'Bug Nest' },
      { id: 'w5-3', flag: '🌀', shortPt: 'Espiral', shortEn: 'Spiral', hubPt: 'Espiral Violeta', hubEn: 'Violet Spiral' },
      { id: 'w5-4', flag: '💫', shortPt: 'Portal', shortEn: 'Gate', hubPt: 'Portão da Nebulosa', hubEn: 'Nebula Gate' },
      { id: 'w5-5', flag: '🏛️', shortPt: 'Câmara', shortEn: 'Chamber', hubPt: 'Antecâmara Solar', hubEn: 'Solar Antechamber' },
      { id: 'w5-6', flag: '☀️', shortPt: 'Farol', shortEn: 'Beacon', hubPt: 'Farol Solar da Terra', hubEn: 'Earth Solar Beacon' },
    ],
  },
  6: {
    world: 6,
    kind: 'wormhole-vortex',
    atmosphereColor: '#e879f9',
    reentryColor: '#38bdf8',
    aaaTipPt: '⚡ AAA Portal Culling · Só renderizamos as ilhas visíveis!',
    aaaTipEn: '⚡ AAA Portal Culling · Rendering only visible warp islands!',
    regions: [
      { id: 'w6-1', flag: '🟣', shortPt: 'Vórtice 1', shortEn: 'Vortex 1', hubPt: 'Ilha do Vórtice 1', hubEn: 'Vortex Island 1' },
      { id: 'w6-2', flag: '🔷', shortPt: 'Escada', shortEn: 'Stairs', hubPt: 'Escada Quântica', hubEn: 'Quantum Stairs' },
      { id: 'w6-3', flag: '🟠', shortPt: 'Triângulo', shortEn: 'Triangle', hubPt: 'Triângulo de Dobra', hubEn: 'Warp Triangle' },
      { id: 'w6-4', flag: '📡', shortPt: 'Radar', shortEn: 'Radar', hubPt: 'Radar Dimensional', hubEn: 'Dimensional Radar' },
      { id: 'w6-5', flag: '🪞', shortPt: 'Espelho', shortEn: 'Mirror', hubPt: 'Ilha Espelho', hubEn: 'Mirror Island' },
      { id: 'w6-6', flag: '👑', shortPt: 'Coração', shortEn: 'Heart', hubPt: 'Coração Quântico', hubEn: 'Quantum Heart' },
    ],
  },
  7: {
    world: 7,
    kind: 'frozen-aurora',
    atmosphereColor: '#7dd3fc',
    reentryColor: '#a5f3fc',
    aaaTipPt: '⚡ AAA Particle Physics · Aurora Boreal e neve em 60 FPS!',
    aaaTipEn: '⚡ AAA Particle Physics · Aurora Borealis & snowfall at 60 FPS!',
    regions: [
      { id: 'w7-1', flag: '⛸️', shortPt: 'Ártico', shortEn: 'Arctic', hubPt: 'Pista Ártica', hubEn: 'Arctic Rink' },
      { id: 'w7-2', flag: '🔋', shortPt: 'Geleira', shortEn: 'Glacier', hubPt: 'Base Geleira', hubEn: 'Glacier Base' },
      { id: 'w7-3', flag: '🥌', shortPt: 'Curling', shortEn: 'Curling', hubPt: 'Arena Curling', hubEn: 'Curling Arena' },
      { id: 'w7-4', flag: '🏔️', shortPt: 'Pico', shortEn: 'Peak', hubPt: 'Pico Polar', hubEn: 'Polar Peak' },
      { id: 'w7-5', flag: '🌉', shortPt: 'Cristal', shortEn: 'Crystal', hubPt: 'Ponte de Cristal', hubEn: 'Crystal Bridge' },
      { id: 'w7-6', flag: '❄️', shortPt: 'Coração', shortEn: 'Heart', hubPt: 'Coração de Gelo', hubEn: 'Heart of Ice' },
    ],
  },
};

export function getPlanetBiome(worldNumber = 1) {
  return PLANET_BIOMES[worldNumber] || PLANET_BIOMES[1];
}

export function getRegionForLevel(worldNumber, levelId, indexFallback = 0) {
  const biome = getPlanetBiome(worldNumber);
  return biome.regions.find((r) => r.id === levelId) || biome.regions[indexFallback] || biome.regions[0];
}

/**
 * Computes AAA Engine orbital transition telemetry for educational immersion:
 *  - 'liftoff': leaving planet surface (LOD 0 -> LOD 3, altitude 0 -> 420 km)
 *  - 'descent': entering planet atmosphere (LOD 3 -> LOD 0, altitude 420 -> 0 km)
 *  - 'surface': landed on planet map (LOD 0, 6/6 chunks streamed)
 */
export function computeOrbitalTransitionState(phase = 'surface', progress = 1) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));

  if (phase === 'liftoff') {
    const altitudeKm = Math.round(t * 420);
    const lodTier = t < 0.35 ? 'LOD 0' : t < 0.7 ? 'LOD 1' : 'LOD 3';
    const chunksLoaded = Math.max(1, Math.round(6 * (1 - t * 0.85)));
    return { phase, progress: t, altitudeKm, lodTier, chunksLoaded, totalChunks: 6 };
  }

  if (phase === 'descent') {
    const altitudeKm = Math.round((1 - t) * 420);
    const lodTier = t < 0.3 ? 'LOD 3' : t < 0.65 ? 'LOD 1' : 'LOD 0';
    const chunksLoaded = Math.min(6, Math.max(1, Math.round(1 + t * 5)));
    return { phase, progress: t, altitudeKm, lodTier, chunksLoaded, totalChunks: 6 };
  }

  return {
    phase: 'surface',
    progress: 1,
    altitudeKm: 0,
    lodTier: 'LOD 0',
    chunksLoaded: 6,
    totalChunks: 6,
  };
}
