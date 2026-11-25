/**
 * AstroBit Campaign Story Bible — "Operação: Luz da Terra!" (PT-BR & EN).
 * Provides the full narrative arc across 5 worlds and 30 bases:
 * Intro cinematic, Planet Arrival briefings, per-mission story hooks & victory reactions,
 * scenic spaceship flight coordinates per world, and the Grand Finale ending!
 */

export const INTRO_SCENES = [
  {
    id: 'intro-1',
    visual: 'earth-alert',
    badgePt: '🚨 TRANSMISSÃO URGENTE DA TERRA',
    badgeEn: '🚨 URGENT TRANSMISSION FROM EARTH',
    titlePt: 'O Farol Solar se Apagou!',
    titleEn: 'The Solar Beacon Went Dark!',
    textPt:
      'Uma chuva de meteoros atingiu o Farol Solar que protege a Terra — e espalhou todos os Cristais de Energia por 5 mundos distantes da galáxia!',
    textEn:
      'A meteor shower struck the Solar Beacon protecting Earth — scattering its Energy Crystals across 5 distant worlds of the galaxy!',
    speakerPt: 'Comandante da Estação Terra',
    speakerEn: 'Earth Station Commander',
  },
  {
    id: 'intro-2',
    visual: 'ship-ready',
    badgePt: '🚀 NAVE ESTRELA-1 PRONTA',
    badgeEn: '🚀 STARSHIP ESTRELA-1 READY',
    titlePt: 'AstroBit Precisa de Você!',
    titleEn: 'AstroBit Needs You!',
    textPt:
      'O robô AstroBit já está a bordo da nave Estrela-1! Mas ele só sabe voar e explorar as bases se VOCÊ montar o quebra-cabeça de comandos dele.',
    textEn:
      'AstroBit is already aboard starship Estrela-1! But he can only explore each planet base if YOU snap his coding puzzle pieces together.',
    speakerPt: 'AstroBit',
    speakerEn: 'AstroBit',
  },
  {
    id: 'intro-3',
    visual: 'galaxy-route',
    badgePt: '🌌 OPERAÇÃO: LUZ DA TERRA',
    badgeEn: '🌌 OPERATION: LIGHT OF EARTH',
    titlePt: 'Salve a Humanidade em 5 Mundos!',
    titleEn: 'Save Humanity Across 5 Worlds!',
    textPt:
      'Voe de base em base pela Lua, Planeta das Engrenagens, Cinturão de Lasers, Estação das Funções e Nebulosa do Engenheiro para religar o Farol Solar!',
    textEn:
      'Fly from base to base across 5 worlds — mastering loops, sensors, functions, and bug hunting — to power the Solar Beacon back up!',
    speakerPt: 'AstroBit',
    speakerEn: 'AstroBit',
  },
];

export const ENDING_SCENES = [
  {
    id: 'ending-1',
    visual: 'beacon-lit',
    badgePt: '⚡ NÚCLEO REATIVADO!',
    badgeEn: '⚡ CORE REACTIVATED!',
    titlePt: 'O Farol Solar Acendeu!!',
    titleEn: 'The Solar Beacon Is Lit!!',
    textPt:
      'O último cristal encaixou no reator da Nebulosa! Um feixe gigante de luz dourada cruzou toda a galáxia de volta para o nosso planeta!',
    textEn:
      'The final crystal locked into the Nebula reactor! A giant beam of golden starlight raced across the galaxy straight back to Earth!',
  },
  {
    id: 'ending-2',
    visual: 'earth-saved',
    badgePt: '🌍 A HUMANIDADE ESTÁ SALVA!',
    badgeEn: '🌍 HUMANITY IS SAVED!',
    titlePt: 'A Terra Brilha de Novo!',
    titleEn: 'Earth Shines Bright Again!',
    textPt:
      'O céu da Terra voltou a ficar azul e brilhante! Pessoas do mundo inteiro olham para o espaço comemorando o retorno heroico da Nave Estrela-1!',
    textEn:
      'Earth’s skies are bright and safe again! People around the whole planet look up and cheer for the heroic crew of starship Estrela-1!',
  },
  {
    id: 'ending-3',
    visual: 'engineer-medal',
    badgePt: '🏆 MEDALHA OFICIAL DA GALÁXIA',
    badgeEn: '🏆 OFFICIAL GALAXY MEDAL',
    titlePt: 'Parabéns, Engenheiro(a) Espacial!',
    titleEn: 'Congratulations, Space Engineer!',
    textPt:
      'Você e o AstroBit dominaram Sequências, Loops, Sensores, Funções e Caça ao Bug — e salvaram a humanidade usando o poder da programação!',
    textEn:
      'You and AstroBit mastered Sequences, Loops, Sensors, Functions, and Bug Hunting — saving humanity with the superpower of coding!',
  },
];

/**
 * 5 World Narrative Acts + custom scenic flight coordinates (inside 760x280 SVG viewport).
 */
export const WORLD_STORIES = {
  1: {
    world: 1,
    galaxyPos: { x: 145, y: 120 },
    sectorPt: 'Setor 1 · Órbita da Terra',
    sectorEn: 'Sector 1 · Earth Orbit',
    actPt: 'Ato 1 — O Primeiro Sinal',
    actEn: 'Act 1 — The First Signal',
    planetColor: '#38bdf8',
    planetDark: '#1d4ed8',
    ringColor: '#7dd3fc',
    arrivalPt:
      'A nave Estrela-1 chegou à Lua dos Cristais! Os primeiros cristais do Farol Solar caíram nestas 6 bases lunares. Vamos recarregar os propulsores da nave!',
    arrivalEn:
      'Starship Estrela-1 reached the Moon of Crystals! The first Solar Beacon crystals landed across 6 lunar bases. Let’s fuel our thrusters!',
    completedPt:
      'Propulsores lunares carregados! A Estrela-1 agora tem força para saltar até o Planeta das Engrenagens!',
    completedEn:
      'Lunar thrusters charged! Estrela-1 now has enough power to warp to Gear Planet!',
    upgradePt: '🔥 Propulsor Lunar Ativado',
    upgradeEn: '🔥 Lunar Thruster Unlocked',
    baseCoords: [
      { x: 85, y: 195 },
      { x: 195, y: 120 },
      { x: 315, y: 185 },
      { x: 435, y: 105 },
      { x: 560, y: 175 },
      { x: 675, y: 100 },
    ],
  },
  2: {
    world: 2,
    galaxyPos: { x: 265, y: 65 },
    sectorPt: 'Setor 2 · Anel Mecânico',
    sectorEn: 'Sector 2 · Mechanical Ring',
    actPt: 'Ato 2 — O Motor de Dobra',
    actEn: 'Act 2 — The Warp Engine',
    planetColor: '#fbbf24',
    planetDark: '#b45309',
    ringColor: '#fde68a',
    arrivalPt:
      'Bem-vindo ao Planeta das Engrenagens! Para atravessar a galáxia mais rápido, precisamos montar o Chip 🔁 Repetir no motor da Estrela-1!',
    arrivalEn:
      'Welcome to Gear Planet! To travel deeper into the galaxy, we need to build the 🔁 Repeat Chip for Estrela-1’s warp engine!',
    completedPt:
      'Motor de dobra 100% turbinado! Próxima parada: o perigoso Cinturão de Lasers!',
    completedEn:
      'Warp engine fully supercharged! Next stop: the thrilling Laser Belt!',
    upgradePt: '⚙️ Motor de Dobra 🔁 Instalado',
    upgradeEn: '⚙️ 🔁 Warp Engine Installed',
    baseCoords: [
      { x: 80, y: 120 },
      { x: 195, y: 205 },
      { x: 320, y: 115 },
      { x: 445, y: 195 },
      { x: 565, y: 105 },
      { x: 680, y: 165 },
    ],
  },
  3: {
    world: 3,
    galaxyPos: { x: 390, y: 130 },
    sectorPt: 'Setor 3 · Fronteira de Plasma',
    sectorEn: 'Sector 3 · Plasma Frontier',
    actPt: 'Ato 3 — O Escudo Descontrolado',
    actEn: 'Act 3 — The Haywire Shield',
    planetColor: '#f472b6',
    planetDark: '#be185d',
    ringColor: '#fbcfe8',
    arrivalPt:
      'Alerta no radar! A chuva de meteoros deixou lasers, pontes de luz e portais fora de controle! Use botões e o novo Radar 🔎 Se do AstroBit!',
    arrivalEn:
      'Radar alert! The meteor storm scrambled defense lasers, light bridges, and portals! Use switches and AstroBit’s new 🔎 If Sensor!',
    completedPt:
      'Cinturão atravessado com sucesso! Os escudos da Estrela-1 estão prontos para a Estação das Funções!',
    completedEn:
      'Laser Belt cleared! Estrela-1’s shields are locked in for Function Station!',
    upgradePt: '🔎 Radar de Sensores Instalado',
    upgradeEn: '🔎 Smart Sensor Radar Installed',
    baseCoords: [
      { x: 85, y: 205 },
      { x: 200, y: 145 },
      { x: 305, y: 85 },
      { x: 440, y: 155 },
      { x: 560, y: 205 },
      { x: 675, y: 100 },
    ],
  },
  4: {
    world: 4,
    galaxyPos: { x: 515, y: 68 },
    sectorPt: 'Setor 4 · Núcleo Orbital',
    sectorEn: 'Sector 4 · Orbital Core',
    actPt: 'Ato 4 — O Supercomputador',
    actEn: 'Act 4 — The Supercomputer',
    planetColor: '#34d399',
    planetDark: '#047857',
    ringColor: '#a7f3d0',
    arrivalPt:
      'Chegamos à gigante Estação das Funções! Ela guarda o mapa da Nebulosa do Farol Solar. Crie Super-Chips ⚡ F1 e 🌟 F2 para reativar os geradores!',
    arrivalEn:
      'We’ve docked at Function Station! It holds the route to the Solar Beacon Nebula. Program ⚡ F1 and 🌟 F2 Super-Chips to reboot the generators!',
    completedPt:
      'Supercomputador online! As coordenadas da Nebulosa do Engenheiro apareceram no painel da nave!',
    completedEn:
      'Supercomputer online! Coordinates for Engineer Nebula just locked onto our flight computer!',
    upgradePt: '⚡ Super-Chips F1/F2 Ativados',
    upgradeEn: '⚡ F1/F2 Super-Chips Online',
    baseCoords: [
      { x: 85, y: 105 },
      { x: 205, y: 175 },
      { x: 330, y: 105 },
      { x: 455, y: 185 },
      { x: 575, y: 120 },
      { x: 680, y: 175 },
    ],
  },
  5: {
    world: 5,
    galaxyPos: { x: 635, y: 122 },
    sectorPt: 'Setor 5 · Galáxia do Farol',
    sectorEn: 'Sector 5 · Beacon Galaxy',
    actPt: 'Ato Final — Salvando a Terra!',
    actEn: 'Final Act — Saving Earth!',
    planetColor: '#c084fc',
    planetDark: '#6d28d9',
    ringColor: '#e9d5ff',
    arrivalPt:
      'A nave Estrela-1 entrou na Nebulosa do Engenheiro! Primeiro cace os 3 bugs de vírus espaciais (🐛) nos computadores da base — e depois religue o Farol Solar!',
    arrivalEn:
      'Starship Estrela-1 entered Engineer Nebula! First hunt down 3 space-virus bugs (🐛) in the base computers — then reignite the Solar Beacon!',
    completedPt:
      'VITÓRIA HISTÓRICA! O Farol Solar voltou a brilhar e a Terra inteira está salva!',
    completedEn:
      'HISTORIC VICTORY! The Solar Beacon shines again and all of Earth is saved!',
    upgradePt: '☀️ Farol Solar Restaurado!',
    upgradeEn: '☀️ Solar Beacon Restored!',
    baseCoords: [
      { x: 85, y: 195 },
      { x: 195, y: 115 },
      { x: 315, y: 185 },
      { x: 440, y: 105 },
      { x: 560, y: 180 },
      { x: 680, y: 95 },
    ],
  },
  6: {
    world: 6,
    galaxyPos: { x: 735, y: 78 },
    sectorPt: 'Setor Bônus · Dimensão Quântica',
    sectorEn: 'Bonus Sector · Quantum Dimension',
    actPt: 'Ato Bônus — Dimensão dos Portais',
    actEn: 'Bonus Act — Portal Dimension',
    planetColor: '#e879f9',
    planetDark: '#7e22ce',
    ringColor: '#38bdf8',
    arrivalPt:
      'Uau!! O brilho do Farol Solar abriu um Buraco de Minhoca secreto cheio de portais coloridos (1, 2, 3 e 4)! Encadeie saltos quânticos e domine os portais!',
    arrivalEn:
      'Whoa!! The Solar Beacon’s light opened a secret Wormhole full of colorful paired portals (1, 2, 3, and 4)! Chain quantum leaps and master the portals!',
    completedPt:
      'MESTRE DO BURACO DE MINHOCA! Você dobrou o espaço-tempo com perfeição absoluta!',
    completedEn:
      'WORMHOLE MASTER! You folded space-time with absolute precision!',
    upgradePt: '🌀 Dobrador de Portais Quânticos',
    upgradeEn: '🌀 Quantum Portal Warper',
    baseCoords: [
      { x: 85, y: 175 },
      { x: 205, y: 100 },
      { x: 330, y: 195 },
      { x: 455, y: 115 },
      { x: 575, y: 185 },
      { x: 685, y: 105 },
    ],
  },
  7: {
    world: 7,
    galaxyPos: { x: 690, y: 245 },
    sectorPt: 'Setor Polar · Planeta Congelado',
    sectorEn: 'Polar Sector · Frozen Planet',
    actPt: 'Ato Polar — Física de Gelo & Baterias',
    actEn: 'Polar Act — Ice & Energy Crates',
    planetColor: '#7dd3fc',
    planetDark: '#0369a1',
    ringColor: '#e0f2fe',
    arrivalPt:
      'Brrr!! Chegamos ao Planeta Congelado! No gelo 🧊 o AstroBit desliza sem parar até chão firme, e você pode empurrar Baterias 📦 para apertar botões de energia!',
    arrivalEn:
      'Brrr!! Welcome to the Frozen Planet! On ice 🧊 AstroBit glides smoothly until solid ground, and you can push Energy Crates 📦 onto power switches!',
    completedPt:
      'MESTRE GLACIAL!! Você dominou o gelo espacial e o curling de baterias como um verdadeiro engenheiro!',
    completedEn:
      'GLACIAL MASTER!! You conquered space ice and battery curling like a true engineer!',
    upgradePt: '❄️ Patinador Polar & Mestre de Física',
    upgradeEn: '❄️ Polar Skater & Physics Master',
    baseCoords: [
      { x: 85, y: 190 },
      { x: 200, y: 110 },
      { x: 325, y: 185 },
      { x: 450, y: 105 },
      { x: 575, y: 180 },
      { x: 690, y: 100 },
    ],
  },
};

export const LEVEL_STORIES = {
  // WORLD 1: Moon of Crystals
  'w1-1': {
    briefPt: 'Base Alfa da Lua: o primeiro cristal caiu bem na entrada! Dê os primeiros comandos ao AstroBit.',
    briefEn: 'Lunar Base Alpha: the very first crystal landed right outside the airlock!',
    winPt: 'Primeiro cristal recuperado! A bateria da Estrela-1 já acendeu!',
    winEn: 'First crystal recovered! Estrela-1’s power gauge is glowing!',
  },
  'w1-2': {
    briefPt: 'Setor Cratera Sul: o corredor faz uma curva em L até o ponto de pouso.',
    briefEn: 'South Crater Sector: the hallway bends in an L-turn toward the landing pad.',
    winPt: 'Curva perfeita! O radar da base lunar já captou mais sinais!',
    winEn: 'Clean turn! Lunar base radar picked up more crystal signals!',
  },
  'w1-3': {
    briefPt: 'Escada Lunar: dois cristais brilhantes ficaram presos nos degraus de cima!',
    briefEn: 'Lunar Steps: two bright crystals rolled onto the upper ridge!',
    winPt: 'Dois cristais de uma vez! Os motores já estão roncando!',
    winEn: 'Two crystals grabbed! The engines are starting to purr!',
  },
  'w1-4': {
    briefPt: 'Rocha Gigante: um meteoro bloqueou o meio da pista — contorne por cima!',
    briefEn: 'Giant Boulder: a meteor blocked the center lane — route around the top!',
    winPt: 'Desvio de mestre! Nenhum meteoro para o AstroBit!',
    winEn: 'Master detour! No meteor can stop AstroBit!',
  },
  'w1-5': {
    briefPt: 'Passarela Estelar: esta ponte flutua no espaço — mantenha o robô firme nos pisos!',
    briefEn: 'Star Catwalk: this bridge floats over open space — stay on the lit tiles!',
    winPt: 'Travessia espacial impecável! Só falta a base principal da Lua!',
    winEn: 'Flawless spacewalk! Only the main lunar base remains!',
  },
  'w1-6': {
    briefPt: 'Torre Principal da Lua: recupere os últimos 3 cristais lunares para decolar rumo ao próximo planeta!',
    briefEn: 'Lunar Main Tower: recover the final 3 lunar crystals to launch to the next planet!',
    winPt: '🚀 DECOLAGEM AUTORIZADA! A Nave Estrela-1 partiu rumo ao Planeta das Engrenagens!',
    winEn: '🚀 CLEARED FOR LAUNCH! Starship Estrela-1 blasted off toward Gear Planet!',
  },

  // WORLD 2: Gear Planet
  'w2-1': {
    briefPt: 'Oficina das Engrenagens: uma pista longa! Teste o novo Chip 🔁 Repetir do motor.',
    briefEn: 'Gear Workshop: a long straight track! Test the new 🔁 Repeat engine chip.',
    winPt: 'Zuuuuum! O Chip Repetir deixou o AstroBit super veloz!',
    winEn: 'Zooooom! The Repeat chip made AstroBit super fast!',
  },
  'w2-2': {
    briefPt: 'Esteira de Cristais: 4 cristais alinhados na fábrica mecânica — colha tudo com 1 loop!',
    briefEn: 'Crystal Conveyor: 4 crystals lined up in the factory — harvest them in 1 loop!',
    winPt: 'Colheita turbo! As engrenagens da fábrica voltaram a girar!',
    winEn: 'Turbo harvest! The factory gears are spinning again!',
  },
  'w2-3': {
    briefPt: 'Escadaria de Bronze: cada degrau repete o mesmo movimento — perfeito para um loop!',
    briefEn: 'Bronze Staircase: every step repeats the exact same pattern — loop time!',
    winPt: 'Escada vencida em segundos! Você já pensa como um engenheiro!',
    winEn: 'Staircase conquered in seconds! You’re thinking like a real engineer!',
  },
  'w2-4': {
    briefPt: 'Tubos Gêmeos: um túnel vai para a direita e o outro desce até a turbina.',
    briefEn: 'Twin Tunnels: one pipe runs right, the other drops down to the turbine.',
    winPt: 'Turbinas carregadas! Só faltam dois setores no Planeta das Engrenagens!',
    winEn: 'Turbines charged! Only two sectors left on Gear Planet!',
  },
  'w2-5': {
    briefPt: 'Bumerangue Orbital: avance até o fundo da oficina e volte recolhendo os cristais de baixo!',
    briefEn: 'Orbital Boomerang: sweep across the top row and loop back along the bottom!',
    winPt: 'Manobra de retorno perfeita! O reator central está logo ali!',
    winEn: 'Perfect return sweep! The central reactor is right ahead!',
  },
  'w2-6': {
    briefPt: 'Coração das Engrenagens: use um Repetir dentro de outro para ligar o Motor de Dobra da nave!',
    briefEn: 'Heart of the Gears: nest a Repeat inside a Repeat to ignite the ship’s Warp Engine!',
    winPt: '🚀 MOTOR DE DOBRA LIGADO! A Estrela-1 saltou no hiperespaço rumo ao Cinturão de Lasers!',
    winEn: '🚀 WARP ENGINE LIT! Estrela-1 jumped to hyperspace toward the Laser Belt!',
  },

  // WORLD 3: Laser Belt
  'w3-1': {
    briefPt: 'Posto de Segurança A: um laser azul bloqueia o cristal! Desligue-o no botão A.',
    briefEn: 'Security Post A: a cyan laser guards the crystal! Shut it down with switch A.',
    winPt: 'Laser neutralizado! O escudo da base já está sob nosso controle!',
    winEn: 'Laser neutralized! Base security is back under our control!',
  },
  'w3-2': {
    briefPt: 'Abismo Cósmico: a ponte de energia está desligada! Aperte o botão A para ligá-la.',
    briefEn: 'Cosmic Chasm: the energy bridge is offline! Hit switch A to power it up.',
    winPt: 'Ponte de luz acesa! Que travessia incrível sobre o espaço!',
    winEn: 'Light bridge powered up! What a crossing over open space!',
  },
  'w3-3': {
    briefPt: 'Ilhas Partidas: o meteoro separou a base em duas ilhas — atravesse pelo portal roxo!',
    briefEn: 'Shattered Isles: a meteor split this base in two — jump through the purple portal!',
    winPt: 'Teletransporte perfeito! Os portais espaciais são demais!',
    winEn: 'Perfect teleport! Space portals are awesome!',
  },
  'w3-4': {
    briefPt: 'Estação de Defesa: salte pelo portal, aperte o botão no topo e volte para cruzar a ponte!',
    briefEn: 'Defense Outpost: warp to the upper deck, flip the switch, and warp back across!',
    winPt: 'Combo de portal e laser dominado! Radar inteligente desbloqueando...',
    winEn: 'Portal and laser combo mastered! Smart radar unlocking...',
  },
  'w3-5': {
    briefPt: 'Cânion Irregular: cada parede está em uma distância! Ligue o Radar 🔎 Se (Bloqueado?)!',
    briefEn: 'Jagged Canyon: every rock wall is at a different spot! Activate the 🔎 If (Blocked?) radar!',
    winPt: 'Uau!! O AstroBit tomou decisões sozinho com o Radar 🔎 Se!',
    winEn: 'Whoa!! AstroBit made smart decisions on its own with the 🔎 If radar!',
  },
  'w3-6': {
    briefPt: 'Fortaleza do Cinturão: desvie dos lasers com 🔎 Se, salte o portal e abra a saída do setor!',
    briefEn: 'Belt Fortress: dodge lasers with 🔎 If, jump the portal, and unlock the sector exit!',
    winPt: '🚀 CINTURÃO CONQUISTADO! A Nave Estrela-1 acoplou na Estação das Funções!',
    winEn: '🚀 LASER BELT CLEARED! Starship Estrela-1 docked at Function Station!',
  },

  // WORLD 4: Function Station
  'w4-1': {
    briefPt: 'Corredores Espelhados: ensine o padrão uma vez na Função ⚡ F1 e reuse duas vezes!',
    briefEn: 'Mirror Hallways: teach the pattern once inside ⚡ F1 and reuse it twice!',
    winPt: 'Primeiro Super-Chip ⚡ F1 gravado com sucesso! Muito elegante!',
    winEn: 'First ⚡ F1 Super-Chip programmed! Super clean engineering!',
  },
  'w4-2': {
    briefPt: 'Torre Modular: coloque ⚡ F1 dentro do 🔁 Repetir para escalar os andares da estação!',
    briefEn: 'Modular Tower: call ⚡ F1 inside 🔁 Repeat to climb the station decks!',
    winPt: 'Escalada modular concluída! O supercomputador está quase pronto!',
    winEn: 'Modular climb complete! The supercomputer is warming up!',
  },
  'w4-3': {
    briefPt: 'Laboratório Inteligente: combine o Radar 🔎 Se dentro da ⚡ F1 para cruzar os dois setores!',
    briefEn: 'Smart Lab: place your 🔎 If sensor inside ⚡ F1 to clear both sectors!',
    winPt: 'Função inteligente funcionando 100%! Chip 🌟 F2 desbloqueado!',
    winEn: 'Smart function running at 100%! 🌟 F2 chip unlocked!',
  },
  'w4-4': {
    briefPt: 'Montanhas Orbitais: programe ⚡ F1 para subir e 🌟 F2 para descer os picos de cristal!',
    briefEn: 'Orbital Peaks: program ⚡ F1 to climb up and 🌟 F2 to descend the crystal peaks!',
    winPt: 'Dupla imbatível! ⚡ F1 e 🌟 F2 trabalharam em perfeita harmonia!',
    winEn: 'Unstoppable duo! ⚡ F1 and 🌟 F2 worked in total harmony!',
  },
  'w4-5': {
    briefPt: 'Geradores A e B: os dois módulos são idênticos — resolva ambos com a mesma ⚡ F1!',
    briefEn: 'Generators A & B: both modules are twins — power them both with one ⚡ F1!',
    winPt: 'Geradores gêmeos ativados! Só falta o núcleo da Estação!',
    winEn: 'Twin generators online! Only the station core remains!',
  },
  'w4-6': {
    briefPt: 'Núcleo da Estação: orquestre ⚡ F1, 🌟 F2, portal e botões para liberar o mapa da Nebulosa!',
    briefEn: 'Station Core: orchestrate ⚡ F1, 🌟 F2, portal, and switches to unlock the Nebula map!',
    winPt: '🚀 ROTA FINAL DESBLOQUEADA! A Estrela-1 mergulhou na Nebulosa do Engenheiro!',
    winEn: '🚀 FINAL ROUTE UNLOCKED! Estrela-1 dove into Engineer Nebula!',
  },

  // WORLD 5: Engineer Nebula
  'w5-1': {
    briefPt: '🐛 Alerta de Vírus #1! Um bug trocou uma direção no computador da base — descubra e conserte!',
    briefEn: '🐛 Space Bug Alert #1! A glitch flipped a direction block — spot it and fix it!',
    winPt: 'Bug #1 eliminado! O painel de navegação voltou ao normal!',
    winEn: 'Bug #1 squashed! Navigation computer is back online!',
  },
  'w5-2': {
    briefPt: '🐛 Alerta de Vírus #2! O loop da colheitadeira está curto demais — ajuste o contador!',
    briefEn: '🐛 Space Bug Alert #2! The harvester loop stops too early — tune the counter!',
    winPt: 'Bug #2 eliminado! Os cristais da Nebulosa estão a salvo!',
    winEn: 'Bug #2 squashed! Nebula crystals secured!',
  },
  'w5-3': {
    briefPt: '🐛 Alerta de Vírus #3! O robô sobe no botão A mas esquece de apertá-lo — complete o código!',
    briefEn: '🐛 Space Bug Alert #3! AstroBit steps on switch A but forgets to press it — patch the code!',
    winPt: 'Todos os 3 vírus espaciais eliminados! Caminho livre para o Farol Solar!',
    winEn: 'All 3 space bugs squashed! Path clear to the Solar Beacon!',
  },
  'w5-4': {
    briefPt: 'Labirinto da Nebulosa: salte pelos dois portais (roxo e azul) para carregar o capacitor!',
    briefEn: 'Nebula Maze: leap through both purple and blue portals to charge the capacitor!',
    winPt: 'Capacitor carregado! O Farol Solar já está à vista no horizonte!',
    winEn: 'Capacitor charged! The Solar Beacon is right on the horizon!',
  },
  'w5-5': {
    briefPt: 'Antecâmara do Farol: um último teste de robótica autônoma com ⚡ F1 e sensores!',
    briefEn: 'Beacon Antechamber: one final autonomous robotics test with ⚡ F1 and sensors!',
    winPt: 'Portas do Núcleo abertas! Chegou a hora da MISSÃO FINAL para salvar a Terra!',
    winEn: 'Core doors open! It’s time for the FINAL MISSION to save Earth!',
  },
  'w5-6': {
    briefPt: '☀️ MISSÃO FINAL! Reúna tudo o que aprendeu (⚡ F1, 🌟 F2, 🔁 Repetir e 🔎 Se) para religar o Farol Solar e SALVAR A HUMANIDADE!',
    briefEn: '☀️ FINAL MISSION! Combine everything you mastered (⚡ F1, 🌟 F2, 🔁 Repeat & 🔎 If) to reignite the Solar Beacon and SAVE HUMANITY!',
    winPt: '🏆🌍 O FAROL SOLAR ACENDEU!! VOCÊ SALVOU A HUMANIDADE, ENGENHEIRO(A) ESPACIAL!!',
    winEn: '🏆🌍 THE SOLAR BEACON IS LIT!! YOU SAVED HUMANITY, SPACE ENGINEER!!',
  },
  // WORLD 6 (BONUS): Wormhole Dimension
  'w6-1': {
    briefPt: 'Ilhas Quânticas: atravesse o portal roxo (1) e o azul (2) com um único loop!',
    briefEn: 'Quantum Isles: hop through the purple (1) and blue (2) portals in one loop!',
    winPt: 'Zuuuuum! Salto duplo concluído em velocidade de dobra!',
    winEn: 'Whoooosh! Double warp cleared at lightspeed!',
  },
  'w6-2': {
    briefPt: 'Escada Quântica: cada ilha tem um degrau secreto que leva direto ao próximo portal!',
    briefEn: 'Quantum Staircase: each island drops one step into the next portal!',
    winPt: 'Que ritmo perfeito! O espaço-tempo obedece ao seu código!',
    winEn: 'Flawless rhythm! Space-time obeys your code!',
  },
  'w6-3': {
    briefPt: 'Triângulo dos Portais: combine 3 pares de portais, desligue o laser A e cruze até ★!',
    briefEn: 'Portal Triangle: chain 3 portal pairs, power down laser A, and zip to ★!',
    winPt: 'Três portais seguidos! Você já navega no Buraco de Minhoca como um craque!',
    winEn: 'Three portals in a row! You navigate the Wormhole like a pro!',
  },
  'w6-4': {
    briefPt: 'Radar no Vórtice: nem toda ilha tem cristal — use 🔎 Se (💎 Cristal aqui?) para não perder tempo!',
    briefEn: 'Vortex Radar: not every island has a crystal — use 🔎 If (💎 Crystal here?) to stay sharp!',
    winPt: 'Sensor quântico calibrado com 100% de precisão!',
    winEn: 'Quantum sensor calibrated with 100% accuracy!',
  },
  'w6-5': {
    briefPt: 'Super-Chip de Dobra: crie um único ⚡ F1 e chame 3× para limpar 3 ilhas ligadas por portais!',
    briefEn: 'Warp Super-Chip: craft one ⚡ F1 and call it 3× to clear 3 portal-linked islands!',
    winPt: 'Super-Chip de Dobra aprovado! O núcleo do Buraco de Minhoca está logo ali!',
    winEn: 'Warp Super-Chip approved! The Wormhole Core lies just ahead!',
  },
  'w6-6': {
    briefPt: '🌀👑 CHEFÃO DOS PORTAIS! Todos os 4 pares de portais (1, 2, 3, 4), ponte de luz e laser no desafio supremo!',
    briefEn: '🌀👑 PORTAL BOSS! All 4 portal pairs (1, 2, 3, 4), light bridge, and laser in the ultimate warp challenge!',
    winPt: '🌀🏆 LENDA QUÂNTICA!! VOCÊ DOMINOU O BURACO DE MINHOCA INTEIRO!!',
    winEn: '🌀🏆 QUANTUM LEGEND!! YOU CONQUERED THE ENTIRE WORMHOLE DIMENSION!!',
  },
  // WORLD 7 (BONUS): Frozen Planet
  'w7-1': {
    briefPt: 'Pista de Patinação: pise no gelo 🧊 e sinta o AstroBit deslizar sem parar até o cristal!',
    briefEn: 'Ice Rink: step onto the ice 🧊 and watch AstroBit glide straight to the crystal!',
    winPt: 'Weee!! Patinação espacial aprovada com nota 10!',
    winEn: 'Wheee!! Space ice skating approved with a perfect 10!',
  },
  'w7-2': {
    briefPt: 'Bateria Pesada: empurre a Bateria 📦 para cima do botão A para desligar o laser!',
    briefEn: 'Heavy Battery: push the Energy Crate 📦 onto button A to power down the laser!',
    winPt: 'Força e inteligência! A bateria segurou o botão certinho!',
    winEn: 'Strength and smarts! The battery held the switch down cleanly!',
  },
  'w7-3': {
    briefPt: 'Curling Espacial: dê 1 empurrão na Bateria 📦 sobre o gelo 🧊 para ela deslizar direto até o botão A!',
    briefEn: 'Space Curling: give the Energy Crate 📦 1 push across the ice 🧊 straight onto button A!',
    winPt: 'NA MOSCA!! Curling espacial de medalha de ouro!',
    winEn: 'BULLSEYE!! Gold-medal space curling shot!',
  },
  'w7-4': {
    briefPt: 'Zig-Zag Polar: cada patinada termina num cristal — use 🔁 Repetir 2× para gabaritar!',
    briefEn: 'Polar Zig-Zag: every slide ends on a crystal — use 🔁 Repeat 2× for 3★!',
    winPt: 'Que deslize sincronizado! Os cristais polares brilham demais!',
    winEn: 'Such smooth gliding! Those polar crystals shine bright!',
  },
  'w7-5': {
    briefPt: 'Ponte Glacial: deslize a Bateria 📦 no gelo para ligar a ponte 🌉 e atravesse patinando!',
    briefEn: 'Glacial Bridge: slide the Energy Crate 📦 across the ice to power the bridge 🌉 and glide across!',
    winPt: 'Ponte de luz ativada! Só falta o Coração de Gelo!',
    winEn: 'Light bridge energized! Only the Heart of Ice remains!',
  },
  'w7-6': {
    briefPt: '🧊👑 CHEFÃO POLAR! Combine Curling de Bateria, gelo escorregadio, portal quântico e laser!',
    briefEn: '🧊👑 POLAR BOSS! Combine battery curling, slippery ice, quantum portal, and laser!',
    winPt: '❄️🏆 MESTRE GLACIAL!! VOCÊ CONQUISTOU O PLANETA CONGELADO INTEIRO!!',
    winEn: '❄️🏆 GLACIAL MASTER!! YOU CONQUERED THE ENTIRE FROZEN PLANET!!',
  },
};

export function getWorldStory(worldNumber) {
  return WORLD_STORIES[worldNumber] || WORLD_STORIES[1];
}

export function getLevelStory(levelId) {
  return (
    LEVEL_STORIES[levelId] || {
      briefPt: 'Complete esta missão espacial coletando todos os cristais até ★!',
      briefEn: 'Complete this space mission by collecting all crystals and reaching ★!',
      winPt: 'Missão cumprida! Próxima base desbloqueada!',
      winEn: 'Mission complete! Next base unlocked!',
    }
  );
}
