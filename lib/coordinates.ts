/**
 * LILA BLACK — World to Map Coordinate Transformations
 * 
 * AUTHORITATIVE COORDINATE RULES:
 * 1. 2D map coordinates use x (world X) and z (world Z).
 * 2. y represents vertical elevation and MUST NOT be used for horizontal map positioning.
 * 3. UV calculation:
 *      u = (x - origin_x) / scale
 *      v = (z - origin_z) / scale
 * 4. Image/Canvas pixel conversion:
 *      pixelX = u * actualImageWidth
 *      pixelY = (1 - v) * actualImageHeight  (V is inverted because screen Y increases downward)
 * 5. Reusable across the entire application to ensure pixel-perfect alignment.
 */

export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export interface MapConfig {
  name: string;
  scale: number;
  origin_x: number;
  origin_z: number;
  image: string;
  width: number;
  height: number;
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  AmbroseValley: {
    name: 'Ambrose Valley',
    scale: 900.0,
    origin_x: -370.0,
    origin_z: -473.0,
    image: '/minimaps/AmbroseValley.webp',
    width: 2048,
    height: 2048,
  },
  GrandRift: {
    name: 'Grand Rift',
    scale: 581.0,
    origin_x: -290.0,
    origin_z: -290.0,
    image: '/minimaps/GrandRift.webp',
    width: 2048,
    height: 2048,
  },
  Lockdown: {
    name: 'Lockdown',
    scale: 1000.0,
    origin_x: -500.0,
    origin_z: -500.0,
    image: '/minimaps/Lockdown.webp',
    width: 2048,
    height: 2048,
  },
};

/**
 * Converts in-game World coordinates (x, z) to normalized UV coordinates (0.0 to 1.0)
 */
export function worldToUV(mapId: MapId, x: number, z: number): { u: number; v: number } {
  const config = MAP_CONFIGS[mapId];
  if (!config) {
    throw new Error(`Unknown mapId: ${mapId}`);
  }
  const u = (x - config.origin_x) / config.scale;
  const v = (z - config.origin_z) / config.scale;
  return { u, v };
}

/**
 * Converts normalized UV coordinates to screen/canvas pixel coordinates
 */
export function uvToPixel(
  u: number,
  v: number,
  displayWidth: number,
  displayHeight: number
): { pixelX: number; pixelY: number } {
  return {
    pixelX: u * displayWidth,
    pixelY: (1 - v) * displayHeight,
  };
}

/**
 * Reusable single function to convert World coordinates directly to canvas/screen pixels
 */
export function worldToMapPixel(
  mapId: MapId,
  x: number,
  z: number,
  actualImageWidth: number,
  actualImageHeight: number
): { pixelX: number; pixelY: number } {
  const { u, v } = worldToUV(mapId, x, z);
  return uvToPixel(u, v, actualImageWidth, actualImageHeight);
}

/**
 * Converts canvas/screen pixels back to World coordinates (useful for hover/click tooltips)
 */
export function mapPixelToWorld(
  mapId: MapId,
  pixelX: number,
  pixelY: number,
  displayWidth: number,
  displayHeight: number
): { x: number; z: number } {
  const config = MAP_CONFIGS[mapId];
  const u = pixelX / displayWidth;
  const v = 1 - pixelY / displayHeight;
  const x = u * config.scale + config.origin_x;
  const z = v * config.scale + config.origin_z;
  return { x, z };
}

/**
 * Explicit unit test verifying coordinate transforms against the README benchmark.
 * Ambrose Valley: x = -301.45, z = -355.55
 * Expected UV: u ≈ 0.0762, v ≈ 0.1305
 * 1024x1024 Pixel check: pixel_x ≈ 78, pixel_y ≈ 890
 */
export function validateCoordinateMappingBenchmark(): {
  success: boolean;
  u: number;
  v: number;
  pixel1024: { pixelX: number; pixelY: number };
  error?: string;
} {
  const sample = { x: -301.45, z: -355.55 };
  const { u, v } = worldToUV('AmbroseValley', sample.x, sample.z);
  const pixel1024 = uvToPixel(u, v, 1024, 1024);

  const uOk = Math.abs(u - 0.0762) < 0.0005;
  const vOk = Math.abs(v - 0.1305) < 0.0005;
  const pxOk = Math.abs(pixel1024.pixelX - 78) < 0.5;
  const pyOk = Math.abs(pixel1024.pixelY - 890) < 0.5;

  const success = uOk && vOk && pxOk && pyOk;

  return {
    success,
    u,
    v,
    pixel1024,
    error: success ? undefined : `Benchmark check failed: u=${u}, v=${v}, px=${pixel1024.pixelX}, py=${pixel1024.pixelY}`,
  };
}
