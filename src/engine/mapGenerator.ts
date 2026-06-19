import { GameMap, Position, Team, TileType } from '../types';
import { findPath } from './pathfinding';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateMapInternal(width: number, height: number, rng: () => number): GameMap {
  const tiles: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      if (x < 2 || x >= width - 2) {
        row.push('plain');
      } else {
        const roll = rng();
        if (roll < 0.15) {
          row.push('wall');
        } else if (roll < 0.20) {
          row.push('water');
        } else {
          row.push('plain');
        }
      }
    }
    tiles.push(row);
  }

  return { width, height, tiles };
}

function hasPathFromLeftToRight(map: GameMap): boolean {
  for (let startY = 0; startY < map.height; startY++) {
    if (map.tiles[startY][0] === 'wall' || map.tiles[startY][0] === 'water') continue;

    for (let endY = 0; endY < map.height; endY++) {
      if (map.tiles[endY][map.width - 1] === 'wall' || map.tiles[endY][map.width - 1] === 'water')
        continue;

      const path = findPath(
        map,
        { x: 0, y: startY },
        { x: map.width - 1, y: endY },
        []
      );
      if (path.length > 0) return true;
    }
  }
  return false;
}

export function generateMap(width: number, height: number, seed?: number): GameMap {
  const baseSeed = seed ?? Date.now();
  let attempt = 0;

  while (attempt < 100) {
    const rng = seededRandom(baseSeed + attempt);
    const map = generateMapInternal(width, height, rng);

    if (hasPathFromLeftToRight(map)) {
      return map;
    }

    attempt++;
  }

  const tiles: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      row.push('plain');
    }
    tiles.push(row);
  }
  return { width, height, tiles };
}

export function getSpawnPositions(map: GameMap, team: Team, count: number): Position[] {
  const positions: Position[] = [];
  const startX = team === 'blue' ? 0 : map.width - 2;
  const endX = team === 'blue' ? 1 : map.width - 1;

  for (let x = startX; x <= endX; x++) {
    for (let y = 0; y < map.height; y++) {
      if (map.tiles[y][x] === 'plain') {
        positions.push({ x, y });
      }
    }
  }

  const selected: Position[] = [];
  const used = new Set<string>();

  const midY = Math.floor(map.height / 2);
  const sorted = positions.sort((a, b) => {
    const distA = Math.abs(a.y - midY);
    const distB = Math.abs(b.y - midY);
    return distA - distB;
  });

  for (const pos of sorted) {
    if (selected.length >= count) break;
    const key = `${pos.x},${pos.y}`;
    if (!used.has(key)) {
      selected.push(pos);
      used.add(key);
    }
  }

  return selected;
}
