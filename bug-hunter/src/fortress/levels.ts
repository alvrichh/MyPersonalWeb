import type { FortressBuildingType, FortressWorld } from './types';

/** Publicly addressable placeholder sprites, one transparent SVG per building.
 * These are new editable stand-ins, not crops of the earlier concept artwork.
 */
export const FORTRESS_ASSET_ROOT = '/images/game/fortress/backlog';
export const FORTRESS_ASSETS: Record<FortressBuildingType, string> = {
  'core-hall': 'core-hall.svg',
  'gold-mine': 'gold-mine.svg',
  'gold-storage': 'gold-storage.svg',
  'energy-collector': 'energy-collector.svg',
  'energy-storage': 'energy-storage.svg',
  'cannon': 'cannon.svg',
  'archer-tower': 'archer-tower.svg',
  'mortar': 'mortar.svg',
  'barracks': 'barracks.svg',
  'wall': 'wall.svg',
};
export const fortressAsset = (kind: FortressBuildingType): string =>
  `${FORTRESS_ASSET_ROOT}/${FORTRESS_ASSETS[kind]}`;

export type FortressLevelBuilding = Readonly<{
  type: FortressBuildingType;
  x: number;
  y: number;
}>;
export type FortressTestLevel = Readonly<{
  id: string;
  name: string;
  world: FortressWorld;
  grid: Readonly<{ columns: number; rows: number }>;
  buildings: readonly FortressLevelBuilding[];
  objective: string;
  difficulty: 'tutorial';
}>;

/** Small standalone layout fixtures for testing rendering, selection,
 * occupied cells and wall placement. No raid mechanics are implied yet.
 */
export const FORTRESS_TEST_LEVELS: readonly FortressTestLevel[] = [
  {
    id: 'fortress-01', name: 'First Core', world: 'backlog',
    grid: { columns: 10, rows: 8 }, difficulty: 'tutorial',
    buildings: [{ type: 'core-hall', x: 4, y: 2 }],
    objective: 'Select the Core Hall; test camera, portrait and landscape.',
  },
  {
    id: 'fortress-02', name: 'First Income', world: 'backlog',
    grid: { columns: 10, rows: 8 }, difficulty: 'tutorial',
    buildings: [
      { type: 'core-hall', x: 4, y: 2 },
      { type: 'gold-mine', x: 2, y: 5 },
      { type: 'gold-storage', x: 6, y: 5 },
    ],
    objective: 'Test three distinct buildings and non-overlapping placement.',
  },
  {
    id: 'fortress-03', name: 'First Walls', world: 'backlog',
    grid: { columns: 12, rows: 9 }, difficulty: 'tutorial',
    buildings: [
      { type: 'core-hall', x: 5, y: 2 },
      { type: 'cannon', x: 5, y: 5 },
      { type: 'wall', x: 3, y: 4 },
      { type: 'wall', x: 4, y: 4 },
      { type: 'wall', x: 5, y: 4 },
      { type: 'wall', x: 6, y: 4 },
      { type: 'wall', x: 7, y: 4 },
    ],
    objective: 'Test selecting an easy straight line of five walls.',
  },
];
