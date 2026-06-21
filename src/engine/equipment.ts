import { Buff, Equipment, Unit, UnitEquipment } from '../types';
import { applyBuff } from './buff';

export function getEquipmentList(unitEquipment: UnitEquipment): Equipment[] {
  const list: Equipment[] = [];
  if (unitEquipment.weapon) list.push(unitEquipment.weapon);
  if (unitEquipment.armor) list.push(unitEquipment.armor);
  if (unitEquipment.accessory) list.push(unitEquipment.accessory);
  return list;
}

export function getTotalStatBonus(unitEquipment: UnitEquipment): {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  critRate: number;
  critDmg: number;
  moveRange: number;
  attackRange: number;
} {
  const total = {
    maxHp: 0,
    maxMp: 0,
    atk: 0,
    def: 0,
    speed: 0,
    critRate: 0,
    critDmg: 0,
    moveRange: 0,
    attackRange: 0,
  };

  const equipments = getEquipmentList(unitEquipment);
  for (const eq of equipments) {
    if (eq.statBonuses.maxHp) total.maxHp += eq.statBonuses.maxHp;
    if (eq.statBonuses.maxMp) total.maxMp += eq.statBonuses.maxMp;
    if (eq.statBonuses.atk) total.atk += eq.statBonuses.atk;
    if (eq.statBonuses.def) total.def += eq.statBonuses.def;
    if (eq.statBonuses.speed) total.speed += eq.statBonuses.speed;
    if (eq.statBonuses.critRate) total.critRate += eq.statBonuses.critRate;
    if (eq.statBonuses.critDmg) total.critDmg += eq.statBonuses.critDmg;
    if (eq.statBonuses.moveRange) total.moveRange += eq.statBonuses.moveRange;
    if (eq.statBonuses.attackRange) total.attackRange += eq.statBonuses.attackRange;
  }

  return total;
}

export function applyEquipmentStats(unit: Unit, unitEquipment: UnitEquipment): void {
  const bonuses = getTotalStatBonus(unitEquipment);

  unit.maxHp += bonuses.maxHp;
  unit.hp += bonuses.maxHp;
  unit.maxMp += bonuses.maxMp;
  unit.mp += bonuses.maxMp;
  unit.atk += bonuses.atk;
  unit.def += bonuses.def;
  unit.speed += bonuses.speed;
  unit.critRate += bonuses.critRate;
  unit.critDmg += bonuses.critDmg;
  unit.moveRange += bonuses.moveRange;
  unit.attackRange += bonuses.attackRange;

  unit.critRate = Math.min(unit.critRate, 1);
}

export function applyEquipmentBuffs(unit: Unit, unitEquipment: UnitEquipment): void {
  const equipments = getEquipmentList(unitEquipment);

  for (const eq of equipments) {
    if (eq.buffEffects) {
      for (const effect of eq.buffEffects) {
        const buff: Buff = {
          name: effect.name,
          type: effect.type,
          value: effect.value,
          remainingTurns: 999,
          stacks: effect.stackable ? 1 : 1,
          sourceUnitId: unit.id,
        };
        applyBuff(unit, buff);
      }
    }
  }
}

export function canEquip(equipment: Equipment, profession: string): boolean {
  if (!equipment.allowedProfessions || equipment.allowedProfessions.length === 0) {
    return true;
  }
  return equipment.allowedProfessions.includes(profession as any);
}

export function createEmptyUnitEquipment(): UnitEquipment {
  return {
    weapon: null,
    armor: null,
    accessory: null,
  };
}

export function equipItem(
  unitEquipment: UnitEquipment,
  equipment: Equipment
): { success: boolean; message: string; equipment: UnitEquipment; unequipped?: Equipment } {
  if (!canEquip(equipment, 'warrior')) {
    return { success: false, message: '职业不匹配', equipment: unitEquipment };
  }

  const slot = equipment.slot;
  const currentEquipped = unitEquipment[slot];

  const newEquipment = {
    ...unitEquipment,
    [slot]: equipment,
  };

  return {
    success: true,
    message: `装备了 ${equipment.name}`,
    equipment: newEquipment,
    unequipped: currentEquipped ?? undefined,
  };
}

export function unequipItem(
  unitEquipment: UnitEquipment,
  slot: keyof UnitEquipment
): { success: boolean; message: string; equipment: UnitEquipment; unequipped?: Equipment } {
  const currentEquipped = unitEquipment[slot];
  if (!currentEquipped) {
    return { success: false, message: '该槽位没有装备', equipment: unitEquipment };
  }

  const newEquipment = {
    ...unitEquipment,
    [slot]: null,
  };

  return {
    success: true,
    message: `卸下了 ${currentEquipped.name}`,
    equipment: newEquipment,
    unequipped: currentEquipped,
  };
}
