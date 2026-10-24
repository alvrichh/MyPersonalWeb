/** Fortress: data-only foundation. Not wired into the live game yet.
 * Keep saveable state independent of device orientation and rendering.
 */
export const FORTRESS_WORLDS = [
  'backlog', 'inferno', 'freeze', 'mud', 'jungle', 'arena', 'forge', 'haunted', 'core',
] as const;
export type FortressWorld = typeof FORTRESS_WORLDS[number];

export const FORTRESS_MVP_BUILDINGS = [
  'core-hall', 'gold-mine', 'gold-storage', 'energy-collector', 'energy-storage',
  'cannon', 'archer-tower', 'mortar', 'barracks', 'wall',
] as const;
export type FortressBuildingType = typeof FORTRESS_MVP_BUILDINGS[number];
export type FortressOrientation = 'landscape' | 'portrait';
export type FortressScene = 'home' | 'edit' | 'raid' | 'result';
export type FortressGridPoint = Readonly<{ x: number; y: number }>;

export type FortressBuilding = {
  id: string;
  kind: FortressBuildingType;
  at: FortressGridPoint;
  level: number;
  worldStyle: FortressWorld;
};

export type FortressResources = {
  gold: number;
  energy: number;
};

/** Initial save shape: no timings, enemies, monetization or online state yet. */
export type FortressSaveV1 = {
  schemaVersion: 1;
  activeWorldStyle: FortressWorld;
  resources: FortressResources;
  buildings: FortressBuilding[];
};

/** Render-only viewport, deliberately excluded from persistent base data. */
export type FortressViewport = {
  orientation: FortressOrientation;
  zoom: number;
  camera: FortressGridPoint;
  scene: FortressScene;
};
