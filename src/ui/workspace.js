/**
 * AstroBit Block Workspace — Pure AST manipulation helpers + Touch/Mouse/DnD UI renderer.
 */

let nextBlockSeq = 1;

export function createBlock(type) {
  const id = `b${nextBlockSeq++}`;
  if (type === 'repeat') {
    return { id, type: 'repeat', times: 3, body: [] };
  }
  return { id, type };
}

export function cloneBlocks(blocks = []) {
  return JSON.parse(JSON.stringify(blocks));
}

/**
 * Appends `newBlock` either to the root list (targetId === null) or inside a nested repeat block.
 */
export function appendBlockToTarget(blocks, targetId, newBlock) {
  const copy = cloneBlocks(blocks);
  if (!targetId) {
    copy.push(newBlock);
    return copy;
  }

  const insertRecursive = (list) => {
    for (const item of list) {
      if (item.id === targetId && item.type === 'repeat') {
        item.body = Array.isArray(item.body) ? item.body : [];
        item.body.push(newBlock);
        return true;
      }
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (insertRecursive(item.body)) return true;
      }
    }
    return false;
  };

  if (!insertRecursive(copy)) {
    copy.push(newBlock);
  }
  return copy;
}

export function removeBlockById(blocks, blockId) {
  const copy = cloneBlocks(blocks);
  const removeRec = (list) => {
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx !== -1) {
      list.splice(idx, 1);
      return true;
    }
    for (const item of list) {
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (removeRec(item.body)) return true;
      }
    }
    return false;
  };
  removeRec(copy);
  return copy;
}

export function moveBlockInList(blocks, blockId, delta) {
  const copy = cloneBlocks(blocks);
  const moveRec = (list) => {
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx !== -1) {
      const target = idx + delta;
      if (target >= 0 && target < list.length) {
        const [item] = list.splice(idx, 1);
        list.splice(target, 0, item);
      }
      return true;
    }
    for (const item of list) {
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (moveRec(item.body)) return true;
      }
    }
    return false;
  };
  moveRec(copy);
  return copy;
}

export function updateRepeatTimes(blocks, blockId, delta) {
  const copy = cloneBlocks(blocks);
  const updateRec = (list) => {
    for (const item of list) {
      if (item.id === blockId && item.type === 'repeat') {
        const current = Number(item.times) || 2;
        item.times = Math.max(2, Math.min(9, current + delta));
        return true;
      }
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (updateRec(item.body)) return true;
      }
    }
    return false;
  };
  updateRec(copy);
  return copy;
}

export function findContainerExists(blocks, targetId) {
  if (!targetId) return true;
  for (const item of blocks) {
    if (item.id === targetId && item.type === 'repeat') return true;
    if (item.type === 'repeat' && Array.isArray(item.body)) {
      if (findContainerExists(item.body, targetId)) return true;
    }
  }
  return false;
}

export const BLOCK_META = {
  forward: { icon: '⬆️', category: 'move' },
  left: { icon: '↩️', category: 'move' },
  right: { icon: '↪️', category: 'move' },
  collect: { icon: '💎', category: 'action' },
  repeat: { icon: '🔁', category: 'control' },
};

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Renders the visual block palette filtered to the current level's unlocked blocks.
 */
export function renderPalette(container, allowedBlocks, { lang, t, onAddBlock }) {
  if (!container) return;
  container.innerHTML = allowedBlocks
    .filter((type) => BLOCK_META[type])
    .map((type) => {
      const meta = BLOCK_META[type];
      const label = t(lang, `blocks.${type}`);
      return `
        <button
          type="button"
          class="palette-btn cat-${meta.category}"
          data-block-type="${type}"
        >
          <span class="block-icon" aria-hidden="true">${meta.icon}</span>
          <span>${escapeHtml(label)}</span>
        </button>
      `;
    })
    .join('');

  container.onclick = (event) => {
    const btn = event.target.closest('.palette-btn');
    if (!btn) return;
    onAddBlock(btn.dataset.blockType);
  };
}

/**
 * Renders the interactive block program tree with tap-to-focus containers,
 * touch-friendly up/down/delete buttons, drag-and-drop, and live debugger highlights.
 */
export function renderWorkspace(
  container,
  blocks,
  {
    lang,
    t,
    activeContainerId,
    runningBlockId,
    failedBlockId,
    onSelectContainer,
    onMoveBlock,
    onRemoveBlock,
    onChangeRepeat,
    onDropIntoContainer,
  }
) {
  if (!container) return;

  const renderList = (list, depth = 0) => {
    if (!list || list.length === 0) {
      return depth === 0
        ? `<div class="workspace-empty">${escapeHtml(t(lang, 'workspaceEmpty'))}</div>`
        : `<div class="repeat-empty">+ ${escapeHtml(t(lang, 'addingHere'))}</div>`;
    }

    return list
      .map((block, idx) => {
        const meta = BLOCK_META[block.type] || { icon: '⬛', category: 'move' };
        const label = t(lang, `blocks.${block.type}`);
        const isRunning = runningBlockId && block.id === runningBlockId;
        const isFailed = failedBlockId && block.id === failedBlockId;
        const stateClass = isFailed ? 'block-error' : isRunning ? 'block-active' : '';
        const upDisabled = idx === 0 ? 'disabled' : '';
        const downDisabled = idx === list.length - 1 ? 'disabled' : '';

        if (block.type === 'repeat') {
          const isFocused = activeContainerId === block.id;
          return `
            <div
              class="ws-block ws-repeat cat-control ${stateClass} ${isFocused ? 'container-focused' : ''}"
              data-block-id="${block.id}"
              draggable="true"
            >
              <div class="ws-block-head">
                <div class="ws-block-title">
                  <span class="block-icon">${meta.icon}</span>
                  <span>${escapeHtml(label)}</span>
                  <div class="repeat-stepper">
                    <button type="button" class="mini-btn" data-action="rep-dec" data-id="${block.id}" aria-label="-">−</button>
                    <span class="repeat-count">${block.times}×</span>
                    <button type="button" class="mini-btn" data-action="rep-inc" data-id="${block.id}" aria-label="+">+</button>
                  </div>
                </div>
                <div class="ws-block-actions">
                  <button type="button" class="mini-btn" data-action="up" data-id="${block.id}" ${upDisabled} title="↑">↑</button>
                  <button type="button" class="mini-btn" data-action="down" data-id="${block.id}" ${downDisabled} title="↓">↓</button>
                  <button type="button" class="mini-btn danger" data-action="remove" data-id="${block.id}" title="✕">✕</button>
                </div>
              </div>
              <div
                class="ws-repeat-body ${isFocused ? 'body-focused' : ''}"
                data-container-id="${block.id}"
              >
                ${isFocused ? `<span class="focus-tag">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
                ${renderList(block.body, depth + 1)}
              </div>
            </div>
          `;
        }

        return `
          <div
            class="ws-block cat-${meta.category} ${stateClass}"
            data-block-id="${block.id}"
            draggable="true"
          >
            <div class="ws-block-head">
              <div class="ws-block-title">
                <span class="block-icon">${meta.icon}</span>
                <span>${escapeHtml(label)}</span>
              </div>
              <div class="ws-block-actions">
                <button type="button" class="mini-btn" data-action="up" data-id="${block.id}" ${upDisabled} title="↑">↑</button>
                <button type="button" class="mini-btn" data-action="down" data-id="${block.id}" ${downDisabled} title="↓">↓</button>
                <button type="button" class="mini-btn danger" data-action="remove" data-id="${block.id}" title="✕">✕</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const rootFocused = activeContainerId === null;
  container.innerHTML = `
    <div class="workspace-target-bar">
      <button type="button" class="target-pill ${rootFocused ? 'active' : ''}" data-select-root="true">
        📋 ${escapeHtml(t(lang, 'targetMain'))}
        ${rootFocused ? `<span class="target-dot">●</span>` : ''}
      </button>
    </div>
    <div class="ws-root-list ${rootFocused ? 'root-focused' : ''}" data-container-id="">
      ${renderList(blocks, 0)}
    </div>
  `;

  container.onclick = (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn) {
      event.stopPropagation();
      const { action, id } = actionBtn.dataset;
      if (action === 'up') onMoveBlock(id, -1);
      else if (action === 'down') onMoveBlock(id, 1);
      else if (action === 'remove') onRemoveBlock(id);
      else if (action === 'rep-inc') onChangeRepeat(id, 1);
      else if (action === 'rep-dec') onChangeRepeat(id, -1);
      return;
    }

    const rootBtn = event.target.closest('[data-select-root]');
    if (rootBtn) {
      onSelectContainer(null);
      return;
    }

    const repeatBody = event.target.closest('.ws-repeat-body');
    if (repeatBody) {
      event.stopPropagation();
      onSelectContainer(repeatBody.dataset.containerId || null);
      return;
    }

    if (event.target.closest('.ws-root-list') && !event.target.closest('.ws-repeat')) {
      onSelectContainer(null);
    }
  };

  // Smooth drag-and-drop for moving blocks into Repeat containers
  let draggedBlockId = null;
  container.ondragstart = (event) => {
    const el = event.target.closest('.ws-block');
    if (!el) return;
    event.stopPropagation();
    draggedBlockId = el.dataset.blockId;
    el.classList.add('dragging');
    event.dataTransfer?.setData('text/plain', draggedBlockId);
  };

  container.ondragend = (event) => {
    const el = event.target.closest('.ws-block');
    el?.classList.remove('dragging');
    draggedBlockId = null;
  };

  container.ondragover = (event) => {
    if (!draggedBlockId) return;
    const dropZone = event.target.closest('.ws-repeat-body, .ws-root-list');
    if (dropZone) {
      event.preventDefault();
    }
  };

  container.ondrop = (event) => {
    if (!draggedBlockId) return;
    const dropZone = event.target.closest('.ws-repeat-body, .ws-root-list');
    if (!dropZone) return;
    event.preventDefault();
    event.stopPropagation();
    const targetId = dropZone.dataset.containerId || null;
    if (targetId !== draggedBlockId) {
      onDropIntoContainer(draggedBlockId, targetId);
    }
    draggedBlockId = null;
  };
}
