/**
 * World 2: Gear Planet (Planeta das Engrenagens) — 6 levels.
 * Introduces C-block Repeat loops with 4-direction puzzle pieces!
 */

const W2_BLOCKS = ['up', 'down', 'move_left', 'move_right', 'collect', 'repeat'];

export const WORLD_2_LEVELS = [
  {
    id: 'w2-1',
    world: 2,
    index: 1,
    titlePt: 'A Mágica do Repetir',
    titleEn: 'The Magic of Repeat',
    hintPt: 'Encaixe ➡️ Direita dentro do bloco 🔁 Repetir 5× para andar rápido e ganhar 3★!',
    hintEn: 'Snap ➡️ Right inside a 🔁 Repeat 5× block to zoom across and earn 3★!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '########',
      '#>....*G',
      '########',
    ],
    starThresholds: { parBlocks: 4, goodBlocks: 7 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 5,
        body: [{ id: 'r2', type: 'move_right' }],
      },
      { id: 'r3', type: 'collect' },
      { id: 'r4', type: 'move_right' },
    ],
  },
  {
    id: 'w2-2',
    world: 2,
    index: 2,
    titlePt: 'Colheita em Série',
    titleEn: 'Crystal Harvest',
    hintPt: 'Coloque ➡️ Direita E 💎 Coletar juntos dentro do mesmo 🔁 Repetir 4×!',
    hintEn: 'Snap both ➡️ Right AND 💎 Collect inside the same 🔁 Repeat 4× block!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '########',
      '#>****G#',
      '########',
    ],
    starThresholds: { parBlocks: 4, goodBlocks: 8 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 4,
        body: [
          { id: 'r2', type: 'move_right' },
          { id: 'r3', type: 'collect' },
        ],
      },
      { id: 'r4', type: 'move_right' },
    ],
  },
  {
    id: 'w2-3',
    world: 2,
    index: 3,
    titlePt: 'Escadinha Espacial',
    titleEn: 'Space Staircase',
    hintPt: 'Cada degrau faz o mesmo padrão: ➡️ Direita, 💎 Coletar, ⬇️ Baixo! Coloque no 🔁 Repetir 3×!',
    hintEn: 'Each stair repeats the same pattern: ➡️ Right, 💎 Collect, ⬇️ Down! Put it in 🔁 Repeat 3×!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '#####',
      '>*###',
      '#.*##',
      '##.*#',
      '###G#',
    ],
    starThresholds: { parBlocks: 4, goodBlocks: 8 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 3,
        body: [
          { id: 'r2', type: 'move_right' },
          { id: 'r3', type: 'collect' },
          { id: 'r4', type: 'down' },
        ],
      },
    ],
  },
  {
    id: 'w2-4',
    world: 2,
    index: 4,
    titlePt: 'Dois Corredores',
    titleEn: 'Twin Corridors',
    hintPt: 'Use um 🔁 Repetir indo para a ➡️ Direita e depois outro 🔁 Repetir descendo ⬇️!',
    hintEn: 'Use one 🔁 Repeat going ➡️ Right and a second 🔁 Repeat heading ⬇️ Down!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '######',
      '#>***.',
      '#####*',
      '#####*',
      '#####G',
    ],
    starThresholds: { parBlocks: 8, goodBlocks: 12 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 3,
        body: [
          { id: 'r2', type: 'move_right' },
          { id: 'r3', type: 'collect' },
        ],
      },
      { id: 'r4', type: 'move_right' },
      {
        id: 'r5',
        type: 'repeat',
        times: 2,
        body: [
          { id: 'r6', type: 'down' },
          { id: 'r7', type: 'collect' },
        ],
      },
      { id: 'r8', type: 'down' },
    ],
  },
  {
    id: 'w2-5',
    world: 2,
    index: 5,
    titlePt: 'Retorno Orbital',
    titleEn: 'Orbital Return',
    hintPt: 'Vá até o fundo pegando cristais para a ➡️ Direita, desça e volte para a ⬅️ Esquerda!',
    hintEn: 'Collect crystals going ➡️ Right, step down, and loop back ⬅️ Left!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '######',
      '#>***#',
      '####.#',
      '#G***#',
      '######',
    ],
    starThresholds: { parBlocks: 10, goodBlocks: 14 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 3,
        body: [
          { id: 'r2', type: 'move_right' },
          { id: 'r3', type: 'collect' },
        ],
      },
      { id: 'r4', type: 'down' },
      { id: 'r5', type: 'down' },
      { id: 'r6', type: 'collect' },
      {
        id: 'r7',
        type: 'repeat',
        times: 2,
        body: [
          { id: 'r8', type: 'move_left' },
          { id: 'r9', type: 'collect' },
        ],
      },
      { id: 'r10', type: 'move_left' },
    ],
  },
  {
    id: 'w2-6',
    world: 2,
    index: 6,
    titlePt: 'Mestre das Engrenagens',
    titleEn: 'Gear Master',
    hintPt: 'Segredo ninja: coloque um 🔁 Repetir 2× DENTRO de outro 🔁 Repetir 3× para fazer a super escada com 3★!',
    hintEn: 'Pro secret: put a 🔁 Repeat 2× INSIDE a 🔁 Repeat 3× for the mega-staircase 3★!',
    firstBlockHint: 'repeat',
    allowedBlocks: W2_BLOCKS,
    rows: [
      '########',
      '>.*#####',
      '##..*###',
      '####..*#',
      '######G#',
    ],
    starThresholds: { parBlocks: 5, goodBlocks: 9 },
    referenceSolution: [
      {
        id: 'r1',
        type: 'repeat',
        times: 3,
        body: [
          {
            id: 'r2',
            type: 'repeat',
            times: 2,
            body: [{ id: 'r3', type: 'move_right' }],
          },
          { id: 'r4', type: 'collect' },
          { id: 'r5', type: 'down' },
        ],
      },
    ],
  },
];
