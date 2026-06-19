import { GameMap, Position } from '../types';

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function isPassable(map: GameMap, pos: Position, occupied: Position[]): boolean {
  if (pos.x < 0 || pos.x >= map.width || pos.y < 0 || pos.y >= map.height) {
    return false;
  }
  const tile = map.tiles[pos.y][pos.x];
  if (tile === 'wall' || tile === 'water') {
    return false;
  }
  if (occupied.some((o) => o.x === pos.x && o.y === pos.y)) {
    return false;
  }
  return true;
}

const DIRECTIONS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function findPath(
  map: GameMap,
  start: Position,
  end: Position,
  occupiedPositions: Position[]
): Position[] {
  if (start.x === end.x && start.y === end.y) {
    return [start];
  }

  if (!isPassable(map, end, [])) {
    return [];
  }

  const openSet: Set<string> = new Set();
  const closedSet: Set<string> = new Set();
  const gScore: Map<string, number> = new Map();
  const fScore: Map<string, number> = new Map();
  const cameFrom: Map<string, string> = new Map();

  const startKey = posKey(start);
  openSet.add(startKey);
  gScore.set(startKey, 0);
  fScore.set(startKey, manhattan(start, end));

  let iterations = 0;
  const maxIterations = 1000;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    let currentKey = '';
    let currentF = Infinity;
    for (const key of openSet) {
      const f = fScore.get(key) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        currentKey = key;
      }
    }

    const [cx, cy] = currentKey.split(',').map(Number);
    const currentPos: Position = { x: cx, y: cy };

    if (cx === end.x && cy === end.y) {
      const path: Position[] = [];
      let traceKey: string | undefined = currentKey;
      while (traceKey !== undefined) {
        const [tx, ty] = traceKey.split(',').map(Number);
        path.unshift({ x: tx, y: ty });
        traceKey = cameFrom.get(traceKey);
      }
      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    for (const dir of DIRECTIONS) {
      const neighbor: Position = { x: cx + dir.x, y: cy + dir.y };
      const neighborKey = posKey(neighbor);

      if (closedSet.has(neighborKey)) {
        continue;
      }

      if (!isPassable(map, neighbor, occupiedPositions)) {
        continue;
      }

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

      if (!openSet.has(neighborKey)) {
        openSet.add(neighborKey);
      } else if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
        continue;
      }

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeG);
      fScore.set(neighborKey, tentativeG + manhattan(neighbor, end));
    }
  }

  return [];
}
