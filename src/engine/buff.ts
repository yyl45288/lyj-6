import { Buff, BuffType, Unit } from '../types';

export function applyBuff(unit: Unit, buff: Buff): void {
  const existing = unit.buffs.find((b) => b.name === buff.name);
  if (existing) {
    if (buff.stacks > 0) {
      existing.stacks += buff.stacks;
      existing.remainingTurns = Math.max(existing.remainingTurns, buff.remainingTurns);
      existing.value += buff.value;
    } else {
      existing.remainingTurns = buff.remainingTurns;
      if (existing.value < buff.value) {
        existing.value = buff.value;
      }
    }
  } else {
    unit.buffs.push({ ...buff });
  }
}

export function tickBuffs(unit: Unit): {
  dotDamage: number;
  hotHeal: number;
  removed: string[];
} {
  let dotDamage = 0;
  let hotHeal = 0;
  const removed: string[] = [];

  for (let i = unit.buffs.length - 1; i >= 0; i--) {
    const buff = unit.buffs[i];

    if (buff.type === 'dot') {
      dotDamage += buff.value * buff.stacks;
    } else if (buff.type === 'hot') {
      hotHeal += buff.value * buff.stacks;
    }

    buff.remainingTurns -= 1;

    if (buff.remainingTurns <= 0) {
      removed.push(buff.name);
      unit.buffs.splice(i, 1);
    }
  }

  return { dotDamage, hotHeal, removed };
}

export function getBuffModifier(unit: Unit, type: 'atk' | 'def' | 'speed'): number {
  let modifier = 0;
  const buffTypeMap: Record<string, BuffType[]> = {
    atk: ['atkUp', 'atkDown'],
    def: ['defUp', 'defDown'],
    speed: ['slow'],
  };

  const relevantTypes = buffTypeMap[type] ?? [];

  for (const buff of unit.buffs) {
    if (!relevantTypes.includes(buff.type)) continue;

    const totalValue = buff.value * buff.stacks;
    if (buff.type === 'atkUp' || buff.type === 'defUp') {
      modifier += totalValue;
    } else if (buff.type === 'atkDown' || buff.type === 'defDown' || buff.type === 'slow') {
      modifier -= totalValue;
    }
  }

  return modifier;
}

export function hasBuff(unit: Unit, buffName: string): boolean {
  return unit.buffs.some((b) => b.name === buffName);
}

export function removeBuff(unit: Unit, buffName: string): void {
  const index = unit.buffs.findIndex((b) => b.name === buffName);
  if (index !== -1) {
    unit.buffs.splice(index, 1);
  }
}
