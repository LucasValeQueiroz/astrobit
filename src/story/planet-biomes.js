/**
 * AstroBit 7 Unique Planet Biomes, Iconic World Landmarks, Real Space/CS Fun Facts,
 * and 3-Act AAA Orbital Transition Telemetry (Liftoff -> 3D Globe Approach -> Atmospheric Re-entry).
 * 100% pure, DOM-free data & transition math.
 */

export const PLANET_BIOMES = {
  1: {
    world: 1,
    kind: 'earth-orbit',
    atmosphereColor: '#38bdf8',
    reentryColor: '#fb923c',
    planetCore: '#1d4ed8',
    planetRim: '#7dd3fc',
    aaaTipPt: '⚡ AAA LOD 0 · Continentes, luzes de cidades e nuvens em 60 FPS!',
    aaaTipEn: '⚡ AAA LOD 0 · Continents, city lights & clouds live at 60 FPS!',
    regions: [
      {
        id: 'w1-1',
        flag: '🇧🇷',
        landmark: '🚀',
        shortPt: 'Brasil',
        shortEn: 'Brazil',
        hubPt: 'Base Alcântara (Brasil)',
        hubEn: 'Alcântara Base (Brazil)',
        factPt: '🇧🇷 Alcântara (MA) fica pertinho da Linha do Equador: foguetes lançados ali economizam até 30% de combustível graças à rotação da Terra!',
        factEn: '🇧🇷 Alcântara sits right near the Equator: rockets launched there save up to 30% fuel using Earth’s spin!',
      },
      {
        id: 'w1-2',
        flag: '🇺🇸',
        landmark: '🗽',
        shortPt: 'EUA',
        shortEn: 'USA',
        hubPt: 'Cabo Canaveral (EUA)',
        hubEn: 'Cape Canaveral (USA)',
        factPt: '🇺🇸 Foi de Cabo Canaveral que o foguete Saturn V decolou levando os primeiros astronautas até a Lua!',
        factEn: '🇺🇸 Cape Canaveral launched the mighty Saturn V rocket that carried the first astronauts to the Moon!',
      },
      {
        id: 'w1-3',
        flag: '🇪🇺',
        landmark: '🗼',
        shortPt: 'Europa',
        shortEn: 'Europe',
        hubPt: 'Estação Europa (Paris/ESA)',
        hubEn: 'Europe Station (ESA)',
        factPt: '🇪🇺 Os telescópios da Agência Espacial Europeia mapeiam bilhões de estrelas usando algoritmos super rápidos!',
        factEn: '🇪🇺 European Space Agency telescopes map billions of stars using ultra-fast software algorithms!',
      },
      {
        id: 'w1-4',
        flag: '🌍',
        landmark: '🔺',
        shortPt: 'África',
        shortEn: 'Africa',
        hubPt: 'Saara Estelar (África)',
        hubEn: 'Star Sahara (Africa)',
        factPt: '🌍 O céu limpo da África abriga alguns dos maiores radiotelescópios do mundo ouvindo sinais da galáxia!',
        factEn: '🌍 Africa’s clear skies host some of the largest radio telescopes on Earth listening to deep space!',
      },
      {
        id: 'w1-5',
        flag: '🇨🇳',
        landmark: '🏯',
        shortPt: 'China',
        shortEn: 'China',
        hubPt: 'Vale Dragão (China)',
        hubEn: 'Dragon Valley (China)',
        factPt: '🇨🇳 A sonda chinesa Chang’e foi a primeira da história a pousar no lado oculto da Lua usando navegação autônoma!',
        factEn: '🇨🇳 China’s Chang’e lander was the first spacecraft ever to land on the far side of the Moon autonomously!',
      },
      {
        id: 'w1-6',
        flag: '🇯🇵',
        landmark: '🗻',
        shortPt: 'Japão',
        shortEn: 'Japan',
        hubPt: 'Torre Lunar (Japão)',
        hubEn: 'Lunar Tower (Japan)',
        factPt: '🇯🇵 A missão japonesa Hayabusa2 pousou num asteroide a 300 milhões de km e trouxe poeira espacial para casa!',
        factEn: '🇯🇵 Japan’s Hayabusa2 mission touched down on an asteroid 300 million km away and brought samples home!',
      },
    ],
  },
  2: {
    world: 2,
    kind: 'clockwork-gears',
    atmosphereColor: '#fbbf24',
    reentryColor: '#f97316',
    planetCore: '#92400e',
    planetRim: '#fde047',
    aaaTipPt: '⚡ AAA GPU Instancing · 1 modelo de engrenagem desenhado várias vezes!',
    aaaTipEn: '⚡ AAA GPU Instancing · 1 gear mesh instanced across the planet!',
    regions: [
      { id: 'w2-1', flag: '⚙️', landmark: '⚙️', shortPt: 'Pêndulo', shortEn: 'Pendulum', hubPt: 'Oficina do Pêndulo', hubEn: 'Pendulum Workshop', factPt: '⚙️ Loops (Repetir) funcionam como engrenagens: um único comando faz o robô repetir o ritmo sem cansar!', factEn: '⚙️ Repeat loops work like gears: one instruction keeps the robot moving in rhythm!' },
      { id: 'w2-2', flag: '🔩', landmark: '🔩', shortPt: 'Molas', shortEn: 'Springs', hubPt: 'Vale das Molas', hubEn: 'Spring Valley', factPt: '🔩 Em games AAA, GPU Instancing repete milhares de parafusos e árvores sem travar o computador!', factEn: '🔩 In AAA games, GPU Instancing repeats thousands of bolts and trees smoothly!' },
      { id: 'w2-3', flag: '🏭', landmark: '🏭', shortPt: 'Turbo', shortEn: 'Turbo', hubPt: 'Fábrica Turbo', hubEn: 'Turbo Foundry', factPt: '🏭 Robôs de fábrica usam loops para montar carros com precisão de milímetros!', factEn: '🏭 Factory robots use loops to assemble spacecraft with millimeter precision!' },
      { id: 'w2-4', flag: '🕰️', landmark: '🕰️', shortPt: 'Relógio', shortEn: 'Clock', hubPt: 'Torre do Relógio', hubEn: 'Clock Tower', factPt: '🕰️ O loop principal de um game roda 60 vezes por segundo (60 FPS) — igual um relógio super veloz!', factEn: '🕰️ A game’s main loop ticks 60 times every second (60 FPS) — like a super-fast clock!' },
      { id: 'w2-5', flag: '🌉', landmark: '🌉', shortPt: 'Cobre', shortEn: 'Copper', hubPt: 'Ponte de Cobre', hubEn: 'Copper Bridge', factPt: '🌉 Pontes retráteis usam sinais elétricos 0 (desligado) e 1 (ligado): a base da computação binária!', factEn: '🌉 Retractable bridges use 0 (OFF) and 1 (ON) signals — the foundation of binary code!' },
      { id: 'w2-6', flag: '👑', landmark: '👑', shortPt: 'Núcleo', shortEn: 'Core', hubPt: 'Coração Mecânico', hubEn: 'Clockwork Core', factPt: '👑 Combinando loops dentro de padrões, seu código fica curtinho e elegante como o de um engenheiro sênior!', factEn: '👑 Combining loops with smart patterns keeps your code short and elegant!' },
    ],
  },
  3: {
    world: 3,
    kind: 'laser-belt',
    atmosphereColor: '#f472b6',
    reentryColor: '#fb7185',
    planetCore: '#831843',
    planetRim: '#f472b6',
    aaaTipPt: '⚡ AAA Ray Casting · Feixes de laser e colisões testados em 60 FPS!',
    aaaTipEn: '⚡ AAA Ray Casting · Laser beams & collisions tested at 60 FPS!',
    regions: [
      { id: 'w3-1', flag: '☄️', landmark: '☄️', shortPt: 'Alfa', shortEn: 'Alpha', hubPt: 'Posto Asteroide Alfa', hubEn: 'Alpha Asteroid Outpost', factPt: '☄️ Sondas espaciais usam sensores "Se" para desviar de rochas sem esperar ordens da Terra!', factEn: '☄️ Space probes use "If" sensors to dodge rocks without waiting for Earth!' },
      { id: 'w3-2', flag: '🔴', landmark: '⚡', shortPt: 'Rubi', shortEn: 'Ruby', hubPt: 'Anel Rubi', hubEn: 'Ruby Ring', factPt: '⚡ Em Ray Tracing, o computador dispara milhões de "lasers invisíveis" para criar reflexos perfeitos!', factEn: '⚡ In Ray Tracing, GPUs shoot millions of invisible laser rays for realistic reflections!' },
      { id: 'w3-3', flag: '🛡️', landmark: '🛡️', shortPt: 'Plasma', shortEn: 'Plasma', hubPt: 'Escudo de Plasma', hubEn: 'Plasma Shield', factPt: '🛡️ Condicionais (Se / Senão) são o cérebro que permite ao robô tomar decisões inteligentes sozinho!', factEn: '🛡️ Conditionals (If / Else) are the brain that lets robots make smart decisions!' },
      { id: 'w3-4', flag: '📡', landmark: '📡', shortPt: 'Ômega', shortEn: 'Omega', hubPt: 'Satélite Ômega', hubEn: 'Omega Satellite', factPt: '📡 O sinal de rádio entre a Terra e Marte demora até 22 minutos — por isso robôs precisam de sensores!', factEn: '📡 Radio signals between Earth and Mars take up to 22 minutes — that is why rovers need sensors!' },
      { id: 'w3-5', flag: '⚡', landmark: '⚡', shortPt: 'Cânion', shortEn: 'Canyon', hubPt: 'Cânion de Lasers', hubEn: 'Laser Canyon', factPt: '⚡ Sensores LIDAR medem distâncias com pulsos de luz em carros autônomos e naves!', factEn: '⚡ LIDAR sensors measure distance using light pulses on autonomous rovers!' },
      { id: 'w3-6', flag: '💎', landmark: '💎', shortPt: 'Prisma', shortEn: 'Prism', hubPt: 'Núcleo Prismático', hubEn: 'Prismatic Core', factPt: '💎 Juntar Loops + Sensores cria uma IA simples capaz de resolver labirintos inteiros!', factEn: '💎 Combining Loops + Sensors creates a smart AI capable of solving entire mazes!' },
    ],
  },
  4: {
    world: 4,
    kind: 'function-station',
    atmosphereColor: '#34d399',
    reentryColor: '#22d3ee',
    planetCore: '#065f46',
    planetRim: '#34d399',
    aaaTipPt: '⚡ AAA World Streaming · Módulos espaciais carregados sob demanda!',
    aaaTipEn: '⚡ AAA World Streaming · Orbital modules streamed on demand!',
    regions: [
      { id: 'w4-1', flag: '🛰️', landmark: '🛰️', shortPt: 'Doca', shortEn: 'Dock', hubPt: 'Doca Modular', hubEn: 'Modular Dock', factPt: '🛰️ A Estação Espacial Internacional foi montada em módulos reutilizáveis — igual às Funções F1 e F2!', factEn: '🛰️ The International Space Station was built from reusable modules — just like F1 and F2 functions!' },
      { id: 'w4-2', flag: '⚡', landmark: '⚡', shortPt: 'Chip F1', shortEn: 'Chip F1', hubPt: 'Setor Chip F1', hubEn: 'Chip F1 Sector', factPt: '⚡ Funções evitam copiar e colar: você escreve a receita uma vez e chama quantas vezes quiser!', factEn: '⚡ Functions avoid copy-pasting: write a recipe once and call it anywhere!' },
      { id: 'w4-3', flag: '🌟', landmark: '🌟', shortPt: 'Lab F2', shortEn: 'Lab F2', hubPt: 'Laboratório F2', hubEn: 'F2 Laboratory', factPt: '🌟 Uma função pode chamar outra função — é assim que jogos gigantes são organizados!', factEn: '🌟 One function can call another — that is how massive video games stay organized!' },
      { id: 'w4-4', flag: '🔋', landmark: '🔋', shortPt: 'Solar', shortEn: 'Solar', hubPt: 'Matriz Solar', hubEn: 'Solar Array', factPt: '🔋 Painéis solares no espaço giram automaticamente para acompanhar o Sol e gerar energia limpa!', factEn: '🔋 Solar panels in orbit rotate automatically to track the Sun for clean power!' },
      { id: 'w4-5', flag: '🔭', landmark: '🔭', shortPt: 'Radar', shortEn: 'Radar', hubPt: 'Observatório Orbital', hubEn: 'Orbital Observatory', factPt: '🔭 O Telescópio James Webb fica a 1,5 milhão de km da Terra protegido por um escudo gigante!', factEn: '🔭 The James Webb Telescope orbits 1.5 million km from Earth behind a giant sunshield!' },
      { id: 'w4-6', flag: '🚀', landmark: '🚀', shortPt: 'Comando', shortEn: 'Bridge', hubPt: 'Ponte de Comando', hubEn: 'Command Bridge', factPt: '🚀 Dividir um problema gigante em peças pequenas (F1 e F2) se chama Decomposição em Engenharia!', factEn: '🚀 Splitting a huge challenge into small pieces (F1 & F2) is called Decomposition!' },
    ],
  },
  5: {
    world: 5,
    kind: 'engineer-nebula',
    atmosphereColor: '#c084fc',
    reentryColor: '#facc15',
    planetCore: '#4c1d95',
    planetRim: '#c084fc',
    aaaTipPt: '⚡ AAA Volumetric FX · Nebulosa cósmica e Farol Solar ativos!',
    aaaTipEn: '⚡ AAA Volumetric FX · Cosmic nebula & Solar Beacon live!',
    regions: [
      { id: 'w5-1', flag: '✨', landmark: '✨', shortPt: 'Poeira', shortEn: 'Stardust', hubPt: 'Mar de Poeira Estelar', hubEn: 'Stardust Sea', factPt: '✨ Nebulosas são berçários cósmicos onde nascem novas estrelas e planetas!', factEn: '✨ Nebulas are giant cosmic nurseries where brand-new stars and planets are born!' },
      { id: 'w5-2', flag: '🐛', landmark: '🐛', shortPt: 'Bugs', shortEn: 'Bug Nest', hubPt: 'Ninho dos Bugs', hubEn: 'Bug Nest', factPt: '🐛 O primeiro "bug" de computador em 1947 foi uma mariposa de verdade presa num relé!', factEn: '🐛 The first computer "bug" in 1947 was a real moth found inside a computer relay!' },
      { id: 'w5-3', flag: '🌀', landmark: '🌀', shortPt: 'Espiral', shortEn: 'Spiral', hubPt: 'Espiral Violeta', hubEn: 'Violet Spiral', factPt: '🌀 Testar passo a passo com ⏭️ 1 Passo é exatamente como engenheiros usam Debuggers profissionais!', factEn: '🌀 Stepping with ⏭️ Step is exactly how pro engineers use real Debuggers!' },
      { id: 'w5-4', flag: '💫', landmark: '💫', shortPt: 'Portal', shortEn: 'Gate', hubPt: 'Portão da Nebulosa', hubEn: 'Nebula Gate', factPt: '💫 Nossas estrelas da Via Láctea giram em espiral a mais de 800.000 km/h!', factEn: '💫 Stars in our Milky Way swirl around the galaxy at over 800,000 km/h!' },
      { id: 'w5-5', flag: '🏛️', landmark: '🏛️', shortPt: 'Câmara', shortEn: 'Chamber', hubPt: 'Antecâmara Solar', hubEn: 'Solar Antechamber', factPt: '🏛️ Cada linha de blocos do AstroBit vira código real em JavaScript e Python!', factEn: '🏛️ Every AstroBit block compiles into real JavaScript and Python code!' },
      { id: 'w5-6', flag: '☀️', landmark: '☀️', shortPt: 'Farol', shortEn: 'Beacon', hubPt: 'Farol Solar da Terra', hubEn: 'Earth Solar Beacon', factPt: '☀️ A luz do Sol leva apenas 8 minutos e 20 segundos para viajar 150 milhões de km até a Terra!', factEn: '☀️ Sunlight takes just 8 minutes 20 seconds to travel 150 million km to Earth!' },
    ],
  },
  6: {
    world: 6,
    kind: 'wormhole-vortex',
    atmosphereColor: '#e879f9',
    reentryColor: '#38bdf8',
    planetCore: '#581c87',
    planetRim: '#e879f9',
    aaaTipPt: '⚡ AAA Portal Culling · Só desenhamos as ilhas visíveis nos portais!',
    aaaTipEn: '⚡ AAA Portal Culling · Rendering only visible warp islands!',
    regions: [
      { id: 'w6-1', flag: '🟣', landmark: '🌀', shortPt: 'Vórtice 1', shortEn: 'Vortex 1', hubPt: 'Ilha do Vórtice 1', hubEn: 'Vortex Island 1', factPt: '🌀 Na física de Einstein, um buraco de minhoca seria um atalho dobrando o espaço-tempo!', factEn: '🌀 In Einstein’s physics, a wormhole is a shortcut folding space-time!' },
      { id: 'w6-2', flag: '🔷', landmark: '🌀', shortPt: 'Escada', shortEn: 'Stairs', hubPt: 'Escada Quântica', hubEn: 'Quantum Stairs', factPt: '🔷 Em games de portal, o motor usa Portal Culling para economizar GPU sem perder 60 FPS!', factEn: '🔷 Portal games use Portal Culling to save GPU power while staying at 60 FPS!' },
      { id: 'w6-3', flag: '🟠', landmark: '🌀', shortPt: 'Triângulo', shortEn: 'Triangle', hubPt: 'Triângulo de Dobra', hubEn: 'Warp Triangle', factPt: '🟠 Portais em pares funcionam como ponteiros na memória de um computador!', factEn: '🟠 Paired portals work just like pointers linking locations in computer memory!' },
      { id: 'w6-4', flag: '📡', landmark: '📡', shortPt: 'Radar', shortEn: 'Radar', hubPt: 'Radar Dimensional', hubEn: 'Dimensional Radar', factPt: '📡 Combinar portais + sensores exige pensar vários passos à frente — puro pensamento computacional!', factEn: '📡 Combining portals + sensors trains multi-step computational thinking!' },
      { id: 'w6-5', flag: '🪞', landmark: '🪞', shortPt: 'Espelho', shortEn: 'Mirror', hubPt: 'Ilha Espelho', hubEn: 'Mirror Island', factPt: '🪞 Computadores quânticos usam qubits que podem explorar caminhos em paralelo!', factEn: '🪞 Quantum computers use qubits to explore possibilities in parallel!' },
      { id: 'w6-6', flag: '👑', landmark: '👑', shortPt: 'Coração', shortEn: 'Heart', hubPt: 'Coração Quântico', hubEn: 'Quantum Heart', factPt: '👑 4 pares de portais, ponte de luz e laser: desafio digno de uma Lenda Quântica!', factEn: '👑 4 portal pairs, light bridge & laser: a challenge worthy of a Quantum Legend!' },
    ],
  },
  7: {
    world: 7,
    kind: 'frozen-aurora',
    atmosphereColor: '#7dd3fc',
    reentryColor: '#a5f3fc',
    planetCore: '#0369a1',
    planetRim: '#7dd3fc',
    aaaTipPt: '⚡ AAA Particle Physics · Aurora Boreal, neve e física de atrito zero!',
    aaaTipEn: '⚡ AAA Particle Physics · Aurora Borealis, snow & zero-friction ice!',
    regions: [
      { id: 'w7-1', flag: '⛸️', landmark: '🏔️', shortPt: 'Ártico', shortEn: 'Arctic', hubPt: 'Pista Ártica', hubEn: 'Arctic Rink', factPt: '⛸️ Sem atrito no gelo, a 1ª Lei de Newton (Inércia) mantém o AstroBit deslizando até encontrar um obstáculo!', factEn: '⛸️ With zero ice friction, Newton’s 1st Law (Inertia) keeps AstroBit gliding until an obstacle!' },
      { id: 'w7-2', flag: '🔋', landmark: '📦', shortPt: 'Geleira', shortEn: 'Glacier', hubPt: 'Base Geleira', hubEn: 'Glacier Base', factPt: '🔋 Europa, lua de Júpiter, é coberta por uma crosta gigante de gelo com um oceano escondido embaixo!', factEn: '🔋 Jupiter’s moon Europa is covered in thick ice hiding a giant ocean underneath!' },
      { id: 'w7-3', flag: '🥌', landmark: '🥌', shortPt: 'Curling', shortEn: 'Curling', hubPt: 'Arena Curling', hubEn: 'Curling Arena', factPt: '🥌 No Curling Espacial você transfere momento linear do robô para a bateria deslizar até o botão!', factEn: '🥌 In Space Curling you transfer momentum from robot to crate so it glides onto the switch!' },
      { id: 'w7-4', flag: '🏔️', landmark: '🏔️', shortPt: 'Pico', shortEn: 'Peak', hubPt: 'Pico Polar', hubEn: 'Polar Peak', factPt: '🏔️ Auroras Boreais acontecem quando ventos solares encontram o campo magnético de um planeta!', factEn: '🏔️ Auroras happen when solar winds collide with a planet’s magnetic field!' },
      { id: 'w7-5', flag: '🌉', landmark: '🌉', shortPt: 'Cristal', shortEn: 'Crystal', hubPt: 'Ponte de Cristal', hubEn: 'Crystal Bridge', factPt: '🌉 Motores AAA simulam gelo mudando apenas 1 número: o coeficiente de fricção (friction = 0.0)!', factEn: '🌉 AAA physics engines simulate ice by changing 1 number: friction = 0.0!' },
      { id: 'w7-6', flag: '❄️', landmark: '❄️', shortPt: 'Coração', shortEn: 'Heart', hubPt: 'Coração de Gelo', hubEn: 'Heart of Ice', factPt: '❄️ Gelo, curling de bateria, portal e laser juntos: você dominou física + programação!', factEn: '❄️ Ice, battery curling, portal & laser together: you mastered physics + coding!' },
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
 * Computes 3-Act AAA Engine orbital transition telemetry:
 *  - 'liftoff': leaving planet surface (LOD 0 -> LOD 3, altitude 0 -> 420 km, shrinking to 3D globe)
 *  - 'descent': 3D globe approach + atmospheric re-entry (LOD 3 -> LOD 2 -> LOD 1 -> LOD 0, heat shield peak 1650°C!)
 *  - 'surface': landed on planet map (LOD 0, 6/6 chunks streamed, ambient 24°C)
 */
export function computeOrbitalTransitionState(phase = 'surface', progress = 1) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));

  if (phase === 'liftoff') {
    const altitudeKm = Math.round(t * 420);
    const lodTier = t < 0.3 ? 'LOD 0' : t < 0.65 ? 'LOD 1' : 'LOD 3';
    const chunksLoaded = Math.max(1, Math.round(6 * (1 - t * 0.85)));
    const globeRadiusFactor = Math.max(0.18, 1 - t * 0.82);
    const shieldTempC = Math.round(24 + Math.sin(t * Math.PI) * 520);
    return {
      phase,
      progress: t,
      altitudeKm,
      lodTier,
      chunksLoaded,
      totalChunks: 6,
      globeRadiusFactor,
      shieldTempC,
    };
  }

  if (phase === 'descent') {
    const altitudeKm = Math.round((1 - t) * 420);
    const lodTier = t < 0.25 ? 'LOD 3' : t < 0.52 ? 'LOD 2' : t < 0.78 ? 'LOD 1' : 'LOD 0';
    const chunksLoaded = Math.min(6, Math.max(1, Math.round(1 + t * 5)));
    const globeRadiusFactor = Math.min(1, 0.16 + t * 0.84);
    // Realistic re-entry thermal shield peak at mid-atmosphere (~1650 °C), cooling smoothly to 24 °C at touchdown
    const shieldTempC = Math.round(24 + Math.sin(t * Math.PI) * 1626);
    return {
      phase,
      progress: t,
      altitudeKm,
      lodTier,
      chunksLoaded,
      totalChunks: 6,
      globeRadiusFactor,
      shieldTempC,
    };
  }

  return {
    phase: 'surface',
    progress: 1,
    altitudeKm: 0,
    lodTier: 'LOD 0',
    chunksLoaded: 6,
    totalChunks: 6,
    globeRadiusFactor: 1,
    shieldTempC: 24,
  };
}
