/**
 * World 6 (Bonus): Wormhole Dimension (Buraco de Minhoca) — 6 levels.
 * Masterclass in multi-portal chains (up to 4 portal pairs: 1, 2, 3, 4),
 * portal loops, quantum switches, and warp functions!
 */

const W6_LOOP_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat'];
const W6_SENSOR_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat', 'if'];
const W6_ALL_BLOCKS = [
  'up',
  'down',
  'move_left',
  'move_right',
  'collect',
  'repeat',
  'if',
  'call_f1',
  'call_f2',
];

export const WORLD_6_LEVELS = [
  {
    id: 'w6-1',
    world: 6,
    index: 1,
    titlePt: 'Salto Duplo',
    titleEn: 'Double Warp',
    hintPt: 'Bem-vindo ao Buraco de Minhoca! Salte pelo portal roxo (1) e depois pelo portal azul (2) para cruzar 3 ilhas espaciais!',
    hintEn: 'Welcome to the Wormhole! Leap through the purple portal (1) and then the blue portal (2) to cross 3 floating islands!',
    firstBlockHint: 'move_right',
    allowedBlocks: W6_LOOP_BLOCKS,
    rows: [
      '         ',
      '>*1  1*2 ',
      '     2*G ',
    ],
    starThresholds: { parBlocks: 6, goodBlocks: 9 },
    // Wait: let's trace carefully!
    // Start (0,1) '>': right -> (1,1) '*', collect, right -> (2,1) '1' -> teleports to (5,1) '1'
    // right -> (6,1) '*', collect, right -> (7,1) '2' -> teleports to (5,2) '2'
    // right -> (6,2) '*', collect, right -> (7,2) 'G' -> WIN!
    // With repeat 3x [move_right, collect, move_right]: Wait — on 3rd iter, after collect at (6,2), move_right -> (7,2) 'G' = WIN!
    // Total blocks: repeat(1) + move_right(1) + collect(1) + move_right(1) = 4 blocks!!
    referenceSolution: [
      {
        id: 'w6-1-r1',
        type: 'repeat',
        times: 3,
        body: [
          { id: 'w6-1-r2', type: 'move_right' },
          { id: 'w6-1-r3', type: 'collect' },
          { id: 'w6-1-r4', type: 'move_right' },
        ],
      },
    ],
  },
  {
    id: 'w6-2',
    world: 6,
    index: 2,
    titlePt: 'Escada Quântica',
    titleEn: 'Quantum Staircase',
    hintPt: 'Cada ilha faz um degrau para baixo antes do portal! Monte 1 ciclo dentro de 🔁 Repetir 3× para fazer 3★!',
    hintEn: 'Each island steps down before the next portal! Build 1 cycle inside 🔁 Repeat 3× for 3★!',
    firstBlockHint: 'repeat',
    allowedBlocks: W6_LOOP_BLOCKS,
    rows: [
      '>*   1*   ',
      ' 1    2   ',
      '          ',
      '   2*     ',
      '    G     ',
    ],
    starThresholds: { parBlocks: 5, goodBlocks: 9 },
    // Trace:
    // Start (0,0): right -> (1,0) '*', collect, down -> (1,1) '1' -> teleports to (5,0) '1'
    // right -> (6,0) '*', collect, down -> (6,1) '2' -> teleports to (3,3) '2'
    // right -> (4,3) '*', collect, down -> (4,4) 'G' -> WIN!
    // 4 blocks total!
    referenceSolution: [
      {
        id: 'w6-2-r1',
        type: 'repeat',
        times: 3,
        body: [
          { id: 'w6-2-r2', type: 'move_right' },
          { id: 'w6-2-r3', type: 'collect' },
          { id: 'w6-2-r4', type: 'down' },
        ],
      },
    ],
  },
  {
    id: 'w6-3',
    world: 6,
    index: 3,
    titlePt: 'Triângulo dos Portais',
    titleEn: 'Portal Triangle',
    hintPt: 'Três cores de portais (roxo, azul e laranja)! Atravesse todos, aperte o botão A e desative o laser até ★!',
    hintEn: 'Three portal colors (purple, blue, and orange)! Warp through all of them, press button A, and drop the laser to ★!',
    firstBlockHint: 'move_right',
    allowedBlocks: W6_LOOP_BLOCKS,
    rows: [
      '##########',
      '#>1#1*2#.#',
      '####.##2*#',
      '#3A*G###a#',
      '########3#',
      '##########',
    ],
    starThresholds: { parBlocks: 11, goodBlocks: 15 },
    // Trace:
    // Start (1,1): right -> (2,1) '1' -> teleports to (4,1) '1'
    // right -> (5,1) '*', collect, right -> (6,1) '2' -> teleports to (7,2) '2'
    // right -> (8,2) '*', collect, down -> (8,3) 'a', collect (toggles A OFF!)
    // down -> (8,4) '3' -> teleports to (1,3) '3'
    // right -> (2,3) 'A' (OFF!), right -> (3,3) '*', collect, right -> (4,3) 'G' -> WIN!
    // Wait: let's count blocks with a repeat for the 3-step finale or direct:
    // r1: right (1->1)
    // r2: right (*), collect
    // r3: right (2->2)
    // r4: right (*), collect
    // r5: down (a), collect
    // r6: down (3->3)
    // r7: right (A), right (*), collect, right (G) -> 13 blocks direct, or with repeat 2x [right, right, collect] -> 10 blocks!
    referenceSolution: [
      {
        id: 'w6-3-r1',
        type: 'repeat',
        times: 2,
        body: [
          { id: 'w6-3-r2', type: 'move_right' },
          { id: 'w6-3-r3', type: 'move_right' },
          { id: 'w6-3-r4', type: 'collect' },
        ],
      },
      { id: 'w6-3-r5', type: 'down' },
      { id: 'w6-3-r6', type: 'collect' },
      { id: 'w6-3-r7', type: 'down' },
      { id: 'w6-3-r8', type: 'move_right' },
      { id: 'w6-3-r9', type: 'move_right' },
      { id: 'w6-3-r10', type: 'collect' },
      { id: 'w6-3-r11', type: 'move_right' },
    ],
  },
  {
    id: 'w6-4',
    world: 6,
    index: 4,
    titlePt: 'Radar no Vórtice',
    titleEn: 'Vortex Radar',
    hintPt: 'Combine 🔎 Se (💎 Cristal aqui?) com portais! Repita 6×: avance ➡️ e use 🔎 Se (💎 Cristal aqui?) → 💎 Coletar!',
    hintEn: 'Combine 🔎 If (💎 Crystal here?) with portals! Repeat 6×: go ➡️ and use 🔎 If (💎 Crystal here?) → 💎 Collect!',
    firstBlockHint: 'repeat',
    allowedBlocks: W6_SENSOR_BLOCKS,
    rows: [
      '         ',
      '>*1  1.2 ',
      '     2*G ',
    ],
    starThresholds: { parBlocks: 5, goodBlocks: 8 },
    // Trace:
    // Start (0,1):
    // i=1: right -> (1,1) '*', if crystal_here -> collect!
    // i=2: right -> (2,1) '1' -> teleports to (5,1) '1', if crystal_here (false)
    // i=3: right -> (6,1) '.', if crystal_here (false)
    // i=4: right -> (7,1) '2' -> teleports to (5,2) '2', if crystal_here (false)
    // i=5: right -> (6,2) '*', if crystal_here -> collect!
    // i=6: right -> (7,2) 'G' -> WIN!
    // Total blocks: repeat(1) + move_right(1) + if(1) + collect(1) = 4 blocks!!
    referenceSolution: [
      {
        id: 'w6-4-r1',
        type: 'repeat',
        times: 6,
        body: [
          { id: 'w6-4-r2', type: 'move_right' },
          {
            id: 'w6-4-r3',
            type: 'if',
            sensor: 'crystal_here',
            then: [{ id: 'w6-4-r4', type: 'collect' }],
            else: [],
          },
        ],
      },
    ],
  },
  {
    id: 'w6-5',
    world: 6,
    index: 5,
    titlePt: 'Super-Chip de Dobra',
    titleEn: 'Warp Super-Chip',
    hintPt: 'Programe em ⚡ F1 o salto de ilha (➡️, 💎, ⬇️, 💎, ➡️)! Chame ⚡ F1 três vezes para atravessar 3 buracos de minhoca!',
    hintEn: 'Program the island hop in ⚡ F1 (➡️, 💎, ⬇️, 💎, ➡️)! Call ⚡ F1 three times to leap across 3 wormholes!',
    firstBlockHint: 'call_f1',
    allowedBlocks: W6_ALL_BLOCKS,
    rows: [
      '>*  1*  2* ',
      ' *1  *2  *G',
    ],
    starThresholds: { parBlocks: 8, goodBlocks: 12 },
    // Trace with F1 = [move_right, collect, down, collect, move_right]:
    // Start (0,0):
    // Call 1: right (1,0)*, collect, down (1,1)*, collect, right (2,1) '1' -> teleports to (4,0) '1'
    // Call 2: right (5,0)*, collect, down (5,1)*, collect, right (6,1) '2' -> teleports to (8,0) '2'
    // Call 3: right (9,0)*, collect, down (9,1)*, collect, right (10,1) 'G' -> WIN!
    // Main = repeat 3x [call F1] (2 blocks) + F1 (5 blocks) = 7 blocks total!!
    referenceSolution: {
      main: [
        {
          id: 'w6-5-m1',
          type: 'repeat',
          times: 3,
          body: [{ id: 'w6-5-m2', type: 'call', fn: 'F1' }],
        },
      ],
      functions: {
        F1: [
          { id: 'w6-5-f1', type: 'move_right' },
          { id: 'w6-5-f2', type: 'collect' },
          { id: 'w6-5-f3', type: 'down' },
          { id: 'w6-5-f4', type: 'collect' },
          { id: 'w6-5-f5', type: 'move_right' },
        ],
        F2: [],
      },
    },
  },
  {
    id: 'w6-6',
    world: 6,
    index: 6,
    titlePt: 'Coração do Buraco de Minhoca',
    titleEn: 'Heart of the Wormhole',
    hintPt: '👑 Chefão dos Portais! Todos os 4 portais (1, 2, 3, 4)! Em ⚡ F1 faça (➡️, 💎, ➡️) e repita 4× — depois cruze a ponte até ★!',
    hintEn: '👑 Portal Boss! All 4 portal pairs (1, 2, 3, 4)! Put (➡️, 💎, ➡️) in ⚡ F1, repeat 4×, then cross the light bridge to ★!',
    firstBlockHint: 'call_f1',
    allowedBlocks: W6_ALL_BLOCKS,
    rows: [
      '>*1  1*2  ',
      '          ',
      '2a3  3*4  ',
      '          ',
      '4*===A*G  ',
    ],
    bridges: {
      '2,4': 'A',
      '3,4': 'A',
      '4,4': 'A',
    },
    starThresholds: { parBlocks: 11, goodBlocks: 15 },
    // Trace carefully!
    // F1 = [move_right, collect, move_right] (3 blocks)
    // Main:
    // Repeat 4x [call F1]:
    //   1: (0,0) -> right (1,0)*, collect, right (2,0)'1' -> teleports to (5,0)'1'
    //   2: (5,0) -> right (6,0)*, collect, right (7,0)'2' -> teleports to (0,2)'2'
    //   3: (0,2) -> right (1,2)'a', collect (turns bridge A ON & laser A OFF!), right (2,2)'3' -> teleports to (5,2)'3'
    //   4: (5,2) -> right (6,2)*, collect, right (7,2)'4' -> teleports to (0,4)'4'
    // Now at (0,4)!
    // Call F1 once more: right (1,4)*, collect, right (2,4)'=' (bridge ON!)
    // Actually Repeat 5x [call F1] lands at (2,4) with (1,4)* collected!!
    // Then Repeat 5x [move_right] -> (3,4)'=', (4,4)'=', (5,4)'A'(OFF!), (6,4)'*'... wait we need to collect (6,4)*!
    // So after Repeat 5x [call F1] (at 2,4):
    // Repeat 4x [move_right] -> (3,4), (4,4), (5,4), (6,4)*!
    // collect (6,4)*!
    // move_right -> (7,4)'G' -> WIN!
    // Block count:
    // F1: 3 blocks
    // Main: repeat(5) [call F1] (2) + repeat(4) [move_right] (2) + collect (1) + move_right (1) = 6 blocks
    // Total = 9 blocks! (<= parBlocks 10!)
    referenceSolution: {
      main: [
        {
          id: 'w6-6-m1',
          type: 'repeat',
          times: 5,
          body: [{ id: 'w6-6-m2', type: 'call', fn: 'F1' }],
        },
        {
          id: 'w6-6-m3',
          type: 'repeat',
          times: 4,
          body: [{ id: 'w6-6-m4', type: 'move_right' }],
        },
        { id: 'w6-6-m5', type: 'collect' },
        { id: 'w6-6-m6', type: 'move_right' },
      ],
      functions: {
        F1: [
          { id: 'w6-6-f1', type: 'move_right' },
          { id: 'w6-6-f2', type: 'collect' },
          { id: 'w6-6-f3', type: 'move_right' },
        ],
        F2: [],
      },
    },
  },
];
