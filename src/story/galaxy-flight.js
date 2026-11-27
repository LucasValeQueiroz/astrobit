/**
 * AstroBit Galaxy Interplanetary Flight Math — 100% pure, DOM-free.
 * Computes curved spacecraft flight paths across the 7-planet galaxy map,
 * distance telemetry, and the smooth camera zoom into the destination planet!
 */

export const GALAXY_PLANETS = [
  { world: 1, x: 0.09, y: 0.62, r: 15, icon: '🌙', color: '#38bdf8', dark: '#1d4ed8', ring: '#7dd3fc' },
  { world: 2, x: 0.21, y: 0.36, r: 16, icon: '⚙️', color: '#fbbf24', dark: '#92400e', ring: '#fde047' },
  { world: 3, x: 0.33, y: 0.66, r: 15, icon: '⚡', color: '#f472b6', dark: '#831843', ring: '#fbcfe8' },
  { world: 4, x: 0.45, y: 0.34, r: 16, icon: '🛰️', color: '#34d399', dark: '#065f46', ring: '#a7f3d0' },
  { world: 5, x: 0.57, y: 0.64, r: 18, icon: '🌌', color: '#c084fc', dark: '#4c1d95', ring: '#facc15' },
  { world: 6, x: 0.69, y: 0.32, r: 16, icon: '🌀', color: '#e879f9', dark: '#581c87', ring: '#38bdf8' },
  { world: 7, x: 0.81, y: 0.62, r: 17, icon: '🧊', color: '#7dd3fc', dark: '#0369a1', ring: '#e0f2fe' },
  { world: 8, x: 0.92, y: 0.36, r: 17, icon: '🤝', color: '#f472b6', dark: '#701a75', ring: '#38bdf8' },
];

export function getGalaxyPlanet(worldNumber = 1) {
  return GALAXY_PLANETS.find((p) => p.world === Number(worldNumber)) || GALAXY_PLANETS[0];
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInQuad(t) {
  return t * t;
}

/**
 * Samples the spacecraft position, heading, camera focus/zoom, and AAA telemetry
 * during an interplanetary galaxy flight from `fromWorld` to `toWorld` at progress t in [0, 1].
 *  - [0.00 .. 0.68]: 'cruise' — spacecraft flies along curved galaxy route from origin -> destination.
 *  - [0.68 .. 1.00]: 'approach' — camera zooms smoothly into the destination planet (1.0x -> 4.4x)!
 */
export function sampleGalaxyFlight(fromWorld, toWorld, progress = 0) {
  const t = Math.max(0, Math.min(1, Number(progress) || 0));
  const origin = getGalaxyPlanet(fromWorld);
  const dest = getGalaxyPlanet(toWorld);

  const samePlanet = origin.world === dest.world;
  const midX = (origin.x + dest.x) / 2;
  const midY = Math.max(0.14, Math.min(0.84, (origin.y + dest.y) / 2 - (samePlanet ? 0.24 : 0.18)));

  const cruiseEnd = 0.68;
  const flightT = easeInOutCubic(Math.min(1, t / cruiseEnd));
  const inv = 1 - flightT;

  let shipX;
  let shipY;
  let dx;
  let dy;

  if (samePlanet) {
    // Graceful orbital loop around the planet when replaying Re-entry on the same world
    const angle = -Math.PI * 0.8 + flightT * Math.PI * 1.4;
    const loopR = 0.11;
    shipX = origin.x + Math.cos(angle) * loopR;
    shipY = origin.y + Math.sin(angle) * loopR * 1.25;
    dx = -Math.sin(angle);
    dy = Math.cos(angle) * 1.25;
  } else {
    shipX = inv * inv * origin.x + 2 * inv * flightT * midX + flightT * flightT * dest.x;
    shipY = inv * inv * origin.y + 2 * inv * flightT * midY + flightT * flightT * dest.y;
    dx = 2 * inv * (midX - origin.x) + 2 * flightT * (dest.x - midX);
    dy = 2 * inv * (midY - origin.y) + 2 * flightT * (dest.y - midY);
  }

  const angleRad = Math.hypot(dx, dy) > 0.0001 ? Math.atan2(dy, dx) : 0;
  const stage = t < cruiseEnd ? 'cruise' : 'approach';

  const zoomT = stage === 'approach' ? easeInQuad((t - cruiseEnd) / (1 - cruiseEnd)) : 0;
  const cameraZoom = 1 + zoomT * 3.4; // 1.0x -> 4.4x dive into destination planet!
  const cameraFocusX = 0.5 + (dest.x - 0.5) * zoomT;
  const cameraFocusY = 0.5 + (dest.y - 0.5) * zoomT;

  const totalDistKm = Math.max(12000, Math.abs(dest.world - origin.world) * 18500);
  const distanceKm = Math.max(0, Math.round(totalDistKm * (1 - flightT)));
  const lodTier = stage === 'cruise' ? 'LOD 3' : zoomT < 0.55 ? 'LOD 2' : 'LOD 1';

  return {
    progress: t,
    stage,
    origin,
    dest,
    ctrl: { x: midX, y: midY },
    shipX,
    shipY,
    angleRad,
    cameraZoom,
    cameraFocusX,
    cameraFocusY,
    distanceKm,
    lodTier,
  };
}
