/**
 * AstroBit Tactile Magnetic Drag & Drop Controller (Pointer Events for Touch & Pen + Snap Helpers).
 * Enables dragging puzzle pieces from the palette into any slot or C-clamp and reordering
 * existing pieces with a floating magnetic ghost and glowing drop-rail indicator on tablets/phones.
 */

const DRAG_THRESHOLD_PX = 10;

/**
 * Resolves the exact drop target metadata given an element under the pointer and clientY.
 */
export function resolveDropTarget(elementUnderPointer, clientY, existingId = null) {
  if (!elementUnderPointer || typeof elementUnderPointer.closest !== 'function') return null;

  const workspace = elementUnderPointer.closest('#block-workspace');
  if (!workspace) return null;

  const targetPiece = elementUnderPointer.closest('.puzzle-piece');
  const targetClampBody = elementUnderPointer.closest('.puzzle-clamp-body');
  const targetSection = elementUnderPointer.closest('.puzzle-section');
  const isChildPieceInClamp = Boolean(
    targetClampBody && targetPiece && targetClampBody.contains(targetPiece)
  );

  const targetScope =
    targetClampBody?.dataset?.scope ||
    targetPiece?.dataset?.scope ||
    targetSection?.dataset?.scope ||
    'main';

  if (targetClampBody && !isChildPieceInClamp) {
    return {
      highlightEl: targetClampBody,
      highlightClass: 'drop-inside',
      meta: {
        mode: 'append',
        scope: targetScope,
        containerId: targetClampBody.dataset?.containerId || null,
      },
    };
  }

  if (targetPiece && targetPiece.dataset?.blockId !== existingId) {
    const rect = targetPiece.getBoundingClientRect();
    const position = clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    return {
      highlightEl: targetPiece,
      highlightClass: position === 'before' ? 'drop-before' : 'drop-after',
      meta: {
        mode: 'relative',
        scope: targetScope,
        anchorId: targetPiece.dataset?.blockId,
        position,
        containerId: null,
      },
    };
  }

  if (targetClampBody) {
    return {
      highlightEl: targetClampBody,
      highlightClass: 'drop-inside',
      meta: {
        mode: 'append',
        scope: targetScope,
        containerId: targetClampBody.dataset?.containerId || null,
      },
    };
  }

  return {
    highlightEl: targetSection || workspace,
    highlightClass: 'drop-inside',
    meta: {
      mode: 'append',
      scope: targetScope,
      containerId: null,
    },
  };
}

/**
 * Installs touch/pen magnetic drag-and-drop listeners on palette & workspace containers.
 */
export function installTactilePointerDnD({
  paletteEl,
  workspaceEl,
  onDropNewFromPalette,
  onDropExisting,
}) {
  if (!paletteEl || !workspaceEl || typeof document === 'undefined') return () => {};

  let drag = null;

  const clearHighlights = () => {
    workspaceEl
      .querySelectorAll('.drop-before, .drop-after, .drop-inside')
      .forEach((el) => el.classList.remove('drop-before', 'drop-after', 'drop-inside'));
  };

  const cleanup = () => {
    if (drag?.ghostEl) drag.ghostEl.remove();
    if (drag?.sourceEl) drag.sourceEl.classList.remove('dragging');
    clearHighlights();
    drag = null;
  };

  const startCandidate = (event, payload, sourceEl) => {
    // Only take over for touch/pen so desktop HTML5 drag-and-drop & quick clicks remain native
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (event.target.closest('select, button[data-action]')) return;

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      payload,
      sourceEl,
      ghostEl: null,
      lastTarget: null,
    };
  };

  const onPalettePointerDown = (event) => {
    const btn = event.target.closest('[data-block-type]');
    if (!btn) return;
    startCandidate(event, { kind: 'new', blockType: btn.dataset.blockType }, btn);
  };

  const onWorkspacePointerDown = (event) => {
    const piece = event.target.closest('.puzzle-piece');
    if (!piece) return;
    startCandidate(
      event,
      { kind: 'existing', id: piece.dataset.blockId, scope: piece.dataset.scope || 'main' },
      piece
    );
  };

  const onPointerMove = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      drag.active = true;
      drag.sourceEl.classList.add('dragging');
      const ghost = document.createElement('div');
      ghost.className = 'magnetic-drag-ghost';
      ghost.textContent = drag.sourceEl.textContent.trim().slice(0, 28) || '🧩';
      document.body.appendChild(ghost);
      drag.ghostEl = ghost;
    }

    event.preventDefault();
    if (drag.ghostEl) {
      drag.ghostEl.style.left = `${event.clientX}px`;
      drag.ghostEl.style.top = `${event.clientY}px`;
    }

    clearHighlights();
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const resolved = resolveDropTarget(
      under,
      event.clientY,
      drag.payload.kind === 'existing' ? drag.payload.id : null
    );
    drag.lastTarget = resolved;
    if (resolved?.highlightEl) {
      resolved.highlightEl.classList.add(resolved.highlightClass);
    }
  };

  const onPointerUp = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const wasActive = drag.active;
    const payload = drag.payload;
    const target = drag.lastTarget;
    cleanup();

    if (!wasActive || !target) return;
    if (payload.kind === 'new') {
      onDropNewFromPalette?.(payload.blockType, target.meta);
    } else if (payload.kind === 'existing') {
      onDropExisting?.({ id: payload.id, scope: payload.scope }, target.meta);
    }
  };

  paletteEl.addEventListener('pointerdown', onPalettePointerDown);
  workspaceEl.addEventListener('pointerdown', onWorkspacePointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cleanup);

  return () => {
    cleanup();
    paletteEl.removeEventListener('pointerdown', onPalettePointerDown);
    workspaceEl.removeEventListener('pointerdown', onWorkspacePointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', cleanup);
  };
}
