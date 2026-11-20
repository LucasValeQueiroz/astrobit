/**
 * AstroBit Level Integrity & Solvability Validator.
 * Ensures every level is structurally valid, has paired portals, consistent star thresholds,
 * and a verified 3-star reference solution (plus non-winning starterProgram for Bug Hunt levels).
 */

import { createWorldState } from './grid.js';
import { executeProgram } from './interpreter.js';

/**
 * Validates a single level definition and verifies its referenceSolution.
 * @param {object} level
 */
export function validateLevel(level) {
  const errors = [];
  if (!level || typeof level !== 'object') {
    return { valid: false, errors: ['Level must be an object.'], referenceRun: null };
  }

  if (!level.id) errors.push('Level must define an `id`.');

  let state = null;
  try {
    state = createWorldState(level);
  } catch (err) {
    errors.push(`Invalid grid/start: ${err.message}`);
  }

  if (state) {
    if (state.totalCrystals === 0 && !state.hasGoal) {
      errors.push('Level must contain at least one crystal or a goal tile.');
    }
    for (const [portalId, coords] of state.portals.entries()) {
      if (coords.length !== 2) {
        errors.push(`Portal "${portalId}" must have exactly 2 endpoints (found ${coords.length}).`);
      }
    }
  }

  const par = level.starThresholds?.parBlocks;
  const good = level.starThresholds?.goodBlocks;
  if (!Number.isFinite(par) || !Number.isFinite(good) || par <= 0 || good < par) {
    errors.push('Level must define valid starThresholds with 0 < parBlocks <= goodBlocks.');
  }

  let referenceRun = null;
  if (!level.referenceSolution) {
    errors.push('Level must include a `referenceSolution` for automated solvability verification.');
  } else if (state) {
    referenceRun = executeProgram(level, level.referenceSolution);
    if (referenceRun.status !== 'won') {
      errors.push(
        `referenceSolution did not win (status=${referenceRun.status}, reason=${referenceRun.failureReason}).`
      );
    } else if (referenceRun.stars !== 3) {
      errors.push(
        `referenceSolution won with ${referenceRun.stars}★ instead of 3★ (used ${referenceRun.blockCount} blocks, parBlocks=${par}).`
      );
    }
  }

  if (level.starterProgram && state) {
    const starterRun = executeProgram(level, level.starterProgram);
    if (starterRun.status === 'won') {
      errors.push('Bug Hunt starterProgram already wins without any edits.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    referenceRun,
  };
}
