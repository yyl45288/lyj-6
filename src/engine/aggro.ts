import { Unit, UnitClass } from '../types';

export function updateAggroOnDamage(
  unit: Unit,
  attackerId: string,
  damage: number,
  attackerClass?: UnitClass
): void {
  let aggroGain = damage * 0.5;
  if (attackerClass === 'warrior') {
    aggroGain *= 1.5;
  }
  unit.aggroTable[attackerId] = (unit.aggroTable[attackerId] ?? 0) + aggroGain;
}

export function updateAggroOnHeal(unit: Unit, healerId: string, healAmount: number): void {
  const aggroGain = healAmount * 0.3;
  unit.aggroTable[healerId] = (unit.aggroTable[healerId] ?? 0) + aggroGain;
}

export function updateAggroProximity(unit: Unit, enemies: Unit[]): void {
  for (const enemy of enemies) {
    if (!enemy.isAlive) continue;
    const dist = Math.abs(unit.pos.x - enemy.pos.x) + Math.abs(unit.pos.y - enemy.pos.y);
    if (dist <= unit.attackRange) {
      unit.aggroTable[enemy.id] = (unit.aggroTable[enemy.id] ?? 0) + 2;
    }
  }
}

export function decayAggro(unit: Unit): void {
  for (const key of Object.keys(unit.aggroTable)) {
    unit.aggroTable[key] *= 0.95;
    if (unit.aggroTable[key] < 0.01) {
      delete unit.aggroTable[key];
    }
  }
}

export function getAggroTarget(unit: Unit, enemies: Unit[]): Unit | null {
  const aliveEnemies = enemies.filter((e) => e.isAlive);
  if (aliveEnemies.length === 0) return null;

  let maxAggro = 0;
  let target: Unit | null = null;

  for (const enemy of aliveEnemies) {
    const aggro = unit.aggroTable[enemy.id] ?? 0;
    if (aggro > maxAggro) {
      maxAggro = aggro;
      target = enemy;
    }
  }

  if (target) return target;

  let minDist = Infinity;
  for (const enemy of aliveEnemies) {
    const dist = Math.abs(unit.pos.x - enemy.pos.x) + Math.abs(unit.pos.y - enemy.pos.y);
    if (dist < minDist) {
      minDist = dist;
      target = enemy;
    }
  }

  return target;
}
