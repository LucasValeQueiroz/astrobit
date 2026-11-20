/**
 * World 4: Function Station (Estação das Funções) — 6 levels.
 * Introduces reusable F1 & F2 sub-routine stacks, calling functions inside Repeat loops,
 * combining conditional sensors with functions, and dual-channel station orchestration.
 */

const W4_F1_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat', 'call_f1'];
const W4_F1_SENSOR_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat', 'if', 'call_f1'];
const W4_ALL_BLOCKS = [
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

export const WORLD_4_LEVELS = [
  {
    id: 'w4-1',
    world: 4,
    index: 1,
    titlePt: 'Minha Primeira Função',
    titleEn: 'My First Function',
    hintPt: 'Os dois corredores têm o mesmo desenho! Clique no chapéu ⚡ Função F1, monte o padrão uma vez e chame ⚡ F1 duas vezes!',
    hintEn: 'Both corridors share the exact same pattern! Click ⚡ Function F1, build it once, and call ⚡ F1 twice!',
    firstBlockHint: 'call_f1',
    allowedBlocks: W4_F1_BLOCKS,
    rows: [
      '##########',
      '#>*.*#####',
      '####.#####',
      '####.*.*G#',
      '##########',
    ],
    starThresholds: { parBlocks: 10, goodBlocks: 13 },
    referenceSolution: {
      functions: {
        F1: [
          { id: 'f1', type: 'move_right' },
          { id: 'f2', type: 'collect' },
          { id: 'f3', type: 'move_right' },
          { id: 'f4', type: 'move_right' },
          { id: 'f5', type: 'collect' },
        ],
        F2: [],
      },
      main: [
        { id: 'm1', type: 'call', fn: 'F1' },
        { id: 'm2', type: 'down' },
        { id: 'm3', type: 'down' },
        { id: 'm4', type: 'call', fn: 'F1' },
        { id: 'm5', type: 'move_right' },
      ],
    },
  },
  {
    id: 'w4-2',
    world: 4,
    index: 2,
    titlePt: 'F1 Dentro do Repetir',
    titleEn: 'Looping a Function',
    hintPt: 'Crie um degrau em ⚡ F1 (⬆️, ➡️, 💎, ➡️). Use 🔁 Repetir 2× chamando ⚡ F1, aperte o botão A e chame ⚡ F1 de novo!',
    hintEn: 'Build one step inside ⚡ F1 (⬆️, ➡️, 💎, ➡️). Loop ⚡ F1 twice, press button A, then call ⚡ F1 once more!',
    firstBlockHint: 'repeat',
    allowedBlocks: W4_F1_BLOCKS,
    rows: [
      '#########',
      '#####A*G#',
      '###.*a###',
      '#.*.#####',
      '#>#######',
      '#########',
    ],
    starThresholds: { parBlocks: 8, goodBlocks: 11 },
    referenceSolution: {
      functions: {
        F1: [
          { id: 'f1', type: 'up' },
          { id: 'f2', type: 'move_right' },
          { id: 'f3', type: 'collect' },
          { id: 'f4', type: 'move_right' },
        ],
        F2: [],
      },
      main: [
        {
          id: 'm1',
          type: 'repeat',
          times: 2,
          body: [{ id: 'm2', type: 'call', fn: 'F1' }],
        },
        { id: 'm3', type: 'collect' },
        { id: 'm4', type: 'call', fn: 'F1' },
      ],
    },
  },
  {
    id: 'w4-3',
    world: 4,
    index: 3,
    titlePt: 'Sensor na Função',
    titleEn: 'Smart Function',
    hintPt: 'Coloque 🔎 Se (🚧 Bloqueado?) → ⬇️ Baixo, ➡️ Direita e 💎 Coletar dentro da ⚡ F1! Repita 3×, aperte o botão A e repita 3×!',
    hintEn: 'Put 🔎 If (🚧 Blocked?) → ⬇️ Down, ➡️ Right, and 💎 Collect inside ⚡ F1! Repeat 3×, press button A, then repeat 3×!',
    firstBlockHint: 'repeat',
    allowedBlocks: W4_F1_SENSOR_BLOCKS,
    rows: [
      '##########',
      '#>*#a.*###',
      '##.*.#.AG#',
      '##########',
    ],
    starThresholds: { parBlocks: 11, goodBlocks: 14 },
    referenceSolution: {
      functions: {
        F1: [
          {
            id: 'f1',
            type: 'if',
            sensor: 'path_blocked',
            then: [{ id: 'f2', type: 'down' }],
          },
          { id: 'f3', type: 'move_right' },
          { id: 'f4', type: 'collect' },
        ],
        F2: [],
      },
      main: [
        {
          id: 'm1',
          type: 'repeat',
          times: 3,
          body: [{ id: 'm2', type: 'call', fn: 'F1' }],
        },
        { id: 'm3', type: 'up' },
        { id: 'm4', type: 'collect' },
        { id: 'm5', type: 'move_right' },
        {
          id: 'm6',
          type: 'repeat',
          times: 3,
          body: [{ id: 'm7', type: 'call', fn: 'F1' }],
        },
      ],
    },
  },
  {
    id: 'w4-4',
    world: 4,
    index: 4,
    titlePt: 'Duas Funções: F1 e F2',
    titleEn: 'Twin Functions: F1 & F2',
    hintPt: 'Ensine ⚡ F1 a subir a montanha (Repetir 2×: ⬆️, ➡️, 💎) e 🌟 F2 a descer (Repetir 2×: ⬇️, ➡️, 💎)! Aperte o botão A no meio!',
    hintEn: 'Teach ⚡ F1 to climb up (Repeat 2×: ⬆️, ➡️, 💎) and 🌟 F2 to climb down (Repeat 2×: ⬇️, ➡️, 💎)! Press button A in the middle!',
    firstBlockHint: 'call_f1',
    allowedBlocks: W4_ALL_BLOCKS,
    rows: [
      ' .*   .*  ',
      '.*.* A*.* ',
      '>  .*a  .G',
    ],
    starThresholds: { parBlocks: 14, goodBlocks: 18 },
    referenceSolution: {
      functions: {
        F1: [
          {
            id: 'f1',
            type: 'repeat',
            times: 2,
            body: [
              { id: 'f2', type: 'up' },
              { id: 'f3', type: 'move_right' },
              { id: 'f4', type: 'collect' },
            ],
          },
        ],
        F2: [
          {
            id: 'g1',
            type: 'repeat',
            times: 2,
            body: [
              { id: 'g2', type: 'down' },
              { id: 'g3', type: 'move_right' },
              { id: 'g4', type: 'collect' },
            ],
          },
        ],
      },
      main: [
        { id: 'm1', type: 'call', fn: 'F1' },
        { id: 'm2', type: 'call', fn: 'F2' },
        { id: 'm3', type: 'move_right' },
        { id: 'm4', type: 'collect' },
        { id: 'm5', type: 'call', fn: 'F1' },
        { id: 'm6', type: 'call', fn: 'F2' },
      ],
    },
  },
  {
    id: 'w4-5',
    world: 4,
    index: 5,
    titlePt: 'Estação dos Botões',
    titleEn: 'Switch Station',
    hintPt: 'As estações A e B são gêmeas! Monte em ⚡ F1 a rotina que aperta o botão de cima e atravessa a ponte + laser, depois chame ⚡ F1 duas vezes!',
    hintEn: 'Stations A and B are twins! Build one routine in ⚡ F1 that hits the button above and crosses the bridge + laser, then call ⚡ F1 twice!',
    firstBlockHint: 'call_f1',
    allowedBlocks: W4_ALL_BLOCKS,
    bridges: { '7,2': 'B' },
    rows: [
      '###########',
      '##a###b####',
      '#>.=A*.=BG#',
      '###########',
    ],
    starThresholds: { parBlocks: 9, goodBlocks: 13 },
    referenceSolution: {
      functions: {
        F1: [
          { id: 'f1', type: 'move_right' },
          { id: 'f2', type: 'up' },
          { id: 'f3', type: 'collect' },
          { id: 'f4', type: 'down' },
          {
            id: 'f5',
            type: 'repeat',
            times: 3,
            body: [{ id: 'f6', type: 'move_right' }],
          },
          { id: 'f7', type: 'collect' },
        ],
        F2: [],
      },
      main: [
        { id: 'm1', type: 'call', fn: 'F1' },
        { id: 'm2', type: 'call', fn: 'F1' },
      ],
    },
  },
  {
    id: 'w4-6',
    world: 4,
    index: 6,
    titlePt: 'Arquiteto Orbital',
    titleEn: 'Orbital Architect',
    hintPt: 'Chefe do Mundo 4! ⚡ F1 pega 2 cristais (Repetir 2×: ➡️, 💎) e 🌟 F2 aperta o botão acima e avança (⬆️, 💎, ⬇️, ➡️). Combine com 🔁 Repetir 2×!',
    hintEn: 'World 4 Boss! ⚡ F1 grabs 2 crystals (Repeat 2×: ➡️, 💎) and 🌟 F2 hits the switch above and steps right (⬆️, 💎, ⬇️, ➡️). Loop them 2×!',
    firstBlockHint: 'repeat',
    allowedBlocks: W4_ALL_BLOCKS,
    bridges: { '4,4': 'B' },
    rows: [
      '#########',
      '###a#####',
      '#>**1####',
      '###b#####',
      '#1**=AG##',
      '#########',
    ],
    starThresholds: { parBlocks: 12, goodBlocks: 16 },
    referenceSolution: {
      functions: {
        F1: [
          {
            id: 'f1',
            type: 'repeat',
            times: 2,
            body: [
              { id: 'f2', type: 'move_right' },
              { id: 'f3', type: 'collect' },
            ],
          },
        ],
        F2: [
          { id: 'g1', type: 'up' },
          { id: 'g2', type: 'collect' },
          { id: 'g3', type: 'down' },
          { id: 'g4', type: 'move_right' },
        ],
      },
      main: [
        {
          id: 'm1',
          type: 'repeat',
          times: 2,
          body: [
            { id: 'm2', type: 'call', fn: 'F1' },
            { id: 'm3', type: 'call', fn: 'F2' },
          ],
        },
        { id: 'm4', type: 'move_right' },
        { id: 'm5', type: 'move_right' },
      ],
    },
  },
];
