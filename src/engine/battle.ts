import {
  BattleLog,
  BattleLogType,
  BattleState,
  Buff,
  Position,
  Skill,
  Team,
  Unit,
  CharacterId,
  CharacterTemplate,
} from '../types';
import { CHARACTER_TEMPLATES } from '../data/units';
import { findPath } from './pathfinding';
import {
  decayAggro,
  getAggroTarget,
  updateAggroOnDamage,
  updateAggroOnHeal,
  updateAggroProximity,
} from './aggro';
import { applyBuff, getBuffModifier, tickBuffs } from './buff';
import { generateMap, getSpawnPositions } from './mapGenerator';
import { calculateSynergies, applySynergyBonuses } from './synergy';

export function createUnit(
  template: CharacterTemplate,
  team: Team,
  pos: Position,
  id: string
): Unit {
  return {
    id,
    characterId: template.characterId,
    name: template.name,
    profession: template.profession,
    team,
    hp: template.maxHp,
    maxHp: template.maxHp,
    mp: template.maxMp,
    maxMp: template.maxMp,
    atk: template.atk,
    def: template.def,
    speed: template.speed,
    moveRange: template.moveRange,
    attackRange: template.attackRange,
    pos: { ...pos },
    skills: template.skills.map((s) => ({ ...s, currentCd: 0 })),
    buffs: [],
    aggroTable: {},
    isAlive: true,
    critRate: template.critRate,
    critDmg: template.critDmg,
  };
}

export function initBattle(
  blueFormation: CharacterId[],
  redFormation: CharacterId[]
): BattleState {
  const map = generateMap(12, 8);

  const blueSpawns = getSpawnPositions(map, 'blue', blueFormation.length);
  const redSpawns = getSpawnPositions(map, 'red', redFormation.length);

  const blueSynergies = calculateSynergies(blueFormation);
  const redSynergies = calculateSynergies(redFormation);

  const units: Unit[] = [];

  blueFormation.forEach((characterId, i) => {
    const template = CHARACTER_TEMPLATES[characterId];
    if (template && blueSpawns[i]) {
      const unit = createUnit(template, 'blue', blueSpawns[i], `blue_${i}`);
      applySynergyBonuses(unit, blueSynergies);
      units.push(unit);
    }
  });

  redFormation.forEach((characterId, i) => {
    const template = CHARACTER_TEMPLATES[characterId];
    if (template && redSpawns[i]) {
      const unit = createUnit(template, 'red', redSpawns[i], `red_${i}`);
      applySynergyBonuses(unit, redSynergies);
      units.push(unit);
    }
  });

  return {
    phase: 'running',
    turn: 0,
    currentUnitIndex: 0,
    units,
    map,
    logs: [],
    winner: null,
    speed: 1,
    selectedUnitId: null,
    blueSynergies,
    redSynergies,
  };
}

function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getOccupiedPositions(units: Unit[], excludeUnitId?: string): Position[] {
  return units
    .filter((u) => u.isAlive && u.id !== excludeUnitId)
    .map((u) => u.pos);
}

function addLog(
  state: BattleState,
  unit: Unit,
  type: BattleLogType,
  message: string
): void {
  state.logs.push({
    turn: state.turn,
    unitId: unit.id,
    unitName: unit.name,
    type,
    message,
    team: unit.team,
  });
}

function calculateDamage(attacker: Unit, target: Unit): number {
  const atkMod = getBuffModifier(attacker, 'atk');
  const defMod = getBuffModifier(target, 'def');
  let damage =
    attacker.atk * (1 + atkMod / attacker.atk) -
    target.def * (1 + defMod / target.def);
  damage = Math.max(1, damage);

  if (Math.random() < attacker.critRate) {
    damage *= attacker.critDmg;
  }

  return Math.floor(damage);
}

function applyDamageToUnit(unit: Unit, damage: number): number {
  const shieldBuff = unit.buffs.find((b) => b.type === 'shield');
  let remainingDamage = damage;

  if (shieldBuff) {
    const shieldAmount = shieldBuff.value * shieldBuff.stacks;
    if (shieldAmount >= remainingDamage) {
      shieldBuff.value = (shieldAmount - remainingDamage) / shieldBuff.stacks;
      if (shieldBuff.value <= 0) {
        unit.buffs = unit.buffs.filter((b) => b.type !== 'shield');
      }
      remainingDamage = 0;
    } else {
      remainingDamage -= shieldAmount;
      unit.buffs = unit.buffs.filter((b) => b.type !== 'shield');
    }
  }

  unit.hp = Math.max(0, unit.hp - remainingDamage);
  if (unit.hp <= 0) {
    unit.isAlive = false;
  }

  return remainingDamage;
}

function getUnitsInRange(
  center: Position,
  range: number,
  units: Unit[],
  filter?: (u: Unit) => boolean
): Unit[] {
  return units.filter((u) => {
    if (!u.isAlive) return false;
    const dist = getDistance(center, u.pos);
    if (dist > range) return false;
    if (filter && !filter(u)) return false;
    return true;
  });
}

function processSkillBuffEffect(
  state: BattleState,
  unit: Unit,
  skill: Skill,
  target: Unit
): void {
  if (!skill.buffEffect) return;

  const buff: Buff = {
    name: skill.buffEffect.name,
    type: skill.buffEffect.type,
    value: skill.buffEffect.value,
    remainingTurns: skill.buffEffect.duration,
    stacks: skill.buffEffect.stackable ? 1 : 1,
    sourceUnitId: unit.id,
  };

  if (skill.type === 'buff') {
    if (skill.range === 0) {
      applyBuff(unit, { ...buff });
      addLog(state, unit, 'buff', `${unit.name} 获得了 ${buff.name}`);
    } else {
      const allies = getUnitsInRange(
        unit.pos,
        skill.range,
        state.units,
        (u) => u.team === unit.team
      );
      for (const ally of allies) {
        applyBuff(ally, { ...buff, sourceUnitId: unit.id });
        addLog(state, unit, 'buff', `${ally.name} 获得了 ${buff.name}`);
      }
    }
  } else if (skill.type === 'debuff') {
    applyBuff(target, { ...buff, sourceUnitId: unit.id });
    addLog(state, unit, 'buff', `${target.name} 被施加了 ${buff.name}`);

    if (unit.profession === 'assassin' && skill.id === 'assassin_stealth') {
      const defUpBuff: Buff = {
        name: '防御提升',
        type: 'defUp',
        value: 8,
        remainingTurns: 2,
        stacks: 1,
        sourceUnitId: unit.id,
      };
      applyBuff(unit, defUpBuff);
      addLog(state, unit, 'buff', `${unit.name} 获得了 防御提升`);
    }

    if (unit.profession === 'warlock' && skill.id === 'warlock_weakness_curse') {
      const defDownBuff: Buff = {
        name: '防御降低',
        type: 'defDown',
        value: 4,
        remainingTurns: 2,
        stacks: 1,
        sourceUnitId: unit.id,
      };
      applyBuff(target, { ...defDownBuff, sourceUnitId: unit.id });
      addLog(state, unit, 'buff', `${target.name} 被施加了 防御降低`);
    }
  } else if (skill.type === 'damage' || skill.type === 'aoe') {
    if (skill.id === 'warrior_slam') {
      applyBuff(unit, { ...buff, sourceUnitId: unit.id });
      addLog(state, unit, 'buff', `${unit.name} 获得了 ${buff.name}`);
    }

    if (skill.buffEffect.type === 'atkDown') {
      applyBuff(target, { ...buff, sourceUnitId: unit.id });
      addLog(state, unit, 'buff', `${target.name} 被施加了 ${buff.name}`);
    }
  }
}

function executeSkill(
  state: BattleState,
  unit: Unit,
  skill: Skill,
  target: Unit
): void {
  if (skill.type === 'damage') {
    let damage = skill.value;
    if (skill.id === 'archer_precise_shot') {
      if (Math.random() < 0.3) {
        damage = Math.floor(damage * unit.critDmg);
      }
    }
    if (skill.id === 'assassin_shadow_strike') {
      if (Math.random() < 0.4) {
        damage = Math.floor(damage * unit.critDmg);
      }
    }
    const actualDamage = applyDamageToUnit(target, damage);
    updateAggroOnDamage(target, unit.id, actualDamage, unit.profession);
    addLog(state, unit, 'skill', `${unit.name} 对 ${target.name} 使用了 ${skill.name}，造成 ${actualDamage} 点伤害`);

    if (target.hp <= 0) {
      addLog(state, unit, 'death', `${target.name} 被击败了`);
    }

    processSkillBuffEffect(state, unit, skill, target);
  } else if (skill.type === 'aoe') {
    const radius = skill.aoeRadius ?? 1;
    const enemies = getUnitsInRange(
      target.pos,
      radius,
      state.units,
      (u) => u.team !== unit.team
    );
    for (const enemy of enemies) {
      const actualDamage = applyDamageToUnit(enemy, skill.value);
      updateAggroOnDamage(enemy, unit.id, actualDamage, unit.profession);
      addLog(state, unit, 'skill', `${unit.name} 对 ${enemy.name} 使用了 ${skill.name}，造成 ${actualDamage} 点伤害`);

      if (enemy.hp <= 0) {
        addLog(state, unit, 'death', `${enemy.name} 被击败了`);
      }

      processSkillBuffEffect(state, unit, skill, enemy);
    }
  } else if (skill.type === 'heal') {
    const allies = getUnitsInRange(
      unit.pos,
      skill.range,
      state.units,
      (u) => u.team === unit.team && u.hp < u.maxHp
    );
    const healTarget =
      allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] ?? unit;
    const healAmount = Math.min(skill.value, healTarget.maxHp - healTarget.hp);
    healTarget.hp += healAmount;
    updateAggroOnHeal(healTarget, unit.id, healAmount);
    addLog(state, unit, 'heal', `${unit.name} 对 ${healTarget.name} 使用了 ${skill.name}，恢复了 ${healAmount} 点生命`);
    processSkillBuffEffect(state, unit, skill, healTarget);
  } else if (skill.type === 'buff') {
    processSkillBuffEffect(state, unit, skill, target);
  } else if (skill.type === 'debuff') {
    const damage = skill.value;
    const actualDamage = applyDamageToUnit(target, damage);
    updateAggroOnDamage(target, unit.id, actualDamage, unit.profession);
    addLog(state, unit, 'skill', `${unit.name} 对 ${target.name} 使用了 ${skill.name}，造成 ${actualDamage} 点伤害`);

    if (target.hp <= 0) {
      addLog(state, unit, 'death', `${target.name} 被击败了`);
    }

    processSkillBuffEffect(state, unit, skill, target);
  }

  skill.currentCd = skill.cd;
}

export function executeUnitAction(
  state: BattleState,
  unit: Unit
): BattleState {
  if (!unit.isAlive) return state;

  const enemies = state.units.filter((u) => u.team !== unit.team);
  const allies = state.units.filter((u) => u.team === unit.team);

  updateAggroProximity(unit, enemies);
  decayAggro(unit);

  const target = getAggroTarget(unit, enemies);
  if (!target) return state;

  const distToTarget = getDistance(unit.pos, target.pos);

  if (distToTarget > unit.attackRange) {
    const occupied = getOccupiedPositions(state.units, unit.id);
    const adjacentToTarget: Position[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        const p: Position = { x: target.pos.x + dx, y: target.pos.y + dy };
        if (
          p.x >= 0 && p.x < state.map.width &&
          p.y >= 0 && p.y < state.map.height
        ) {
          adjacentToTarget.push(p);
        }
      }
    }

    let bestPath: Position[] = [];
    let bestLen = Infinity;

    for (const adj of adjacentToTarget) {
      if (occupied.some((o) => o.x === adj.x && o.y === adj.y)) continue;
      const path = findPath(state.map, unit.pos, adj, occupied);
      if (path.length > 0 && path.length < bestLen) {
        bestLen = path.length;
        bestPath = path;
      }
    }

    if (bestPath.length > 0) {
      const moveSteps = Math.min(unit.moveRange, bestPath.length - 1);
      const newPos = bestPath[moveSteps];
      unit.pos = { ...newPos };
      addLog(state, unit, 'move', `${unit.name} 移动到了 (${newPos.x}, ${newPos.y})`);
    }
  }

  const updatedDist = getDistance(unit.pos, target.pos);

  let skillUsed = false;
  for (const skill of unit.skills) {
    if (skill.currentCd > 0) continue;

    if (skill.type === 'heal') {
      const hurtAllies = allies.filter((a) => a.isAlive && a.hp < a.maxHp);
      if (hurtAllies.length > 0) {
        const distToHurt = hurtAllies.some(
          (a) => getDistance(unit.pos, a.pos) <= skill.range
        );
        if (distToHurt) {
          executeSkill(state, unit, skill, target);
          skillUsed = true;
          break;
        }
      }
    } else if (skill.type === 'buff' && skill.range === 0) {
      executeSkill(state, unit, skill, unit);
      skillUsed = true;
      break;
    } else if (skill.type === 'buff') {
      const nearbyAllies = getUnitsInRange(
        unit.pos,
        skill.range,
        allies,
        (u) => u.isAlive
      );
      if (nearbyAllies.length > 0) {
        executeSkill(state, unit, skill, nearbyAllies[0]);
        skillUsed = true;
        break;
      }
    } else if (skill.type === 'aoe') {
      if (updatedDist <= skill.range) {
        executeSkill(state, unit, skill, target);
        skillUsed = true;
        break;
      }
    } else if (updatedDist <= skill.range) {
      executeSkill(state, unit, skill, target);
      skillUsed = true;
      break;
    }
  }

  if (!skillUsed && updatedDist <= unit.attackRange) {
    const damage = calculateDamage(unit, target);
    const actualDamage = applyDamageToUnit(target, damage);
    updateAggroOnDamage(target, unit.id, actualDamage, unit.profession);
    addLog(state, unit, 'attack', `${unit.name} 攻击了 ${target.name}，造成 ${actualDamage} 点伤害`);

    if (target.hp <= 0) {
      addLog(state, unit, 'death', `${target.name} 被击败了`);
    }
  }

  const buffResult = tickBuffs(unit);
  if (buffResult.dotDamage > 0) {
    const dotDmg = applyDamageToUnit(unit, buffResult.dotDamage);
    addLog(state, unit, 'buff', `${unit.name} 受到 ${dotDmg} 点持续伤害`);
    if (unit.hp <= 0) {
      addLog(state, unit, 'death', `${unit.name} 被持续伤害击败了`);
    }
  }
  if (buffResult.hotHeal > 0) {
    const heal = Math.min(buffResult.hotHeal, unit.maxHp - unit.hp);
    unit.hp += heal;
    addLog(state, unit, 'heal', `${unit.name} 恢复了 ${heal} 点生命`);
  }

  for (const skill of unit.skills) {
    if (skill.currentCd > 0) {
      skill.currentCd -= 1;
    }
  }

  return state;
}

export function executeTurn(state: BattleState): BattleState {
  state.turn += 1;
  state.phase = 'running';

  const aliveUnits = state.units
    .filter((u) => u.isAlive)
    .sort((a, b) => b.speed - a.speed);

  for (const unit of aliveUnits) {
    if (!unit.isAlive) continue;

    executeUnitAction(state, unit);

    const winner = checkWinCondition(state);
    if (winner) {
      state.phase = 'finished';
      state.winner = winner;
      return state;
    }
  }

  return state;
}

export function checkWinCondition(state: BattleState): Team | null {
  const blueAlive = state.units.some((u) => u.team === 'blue' && u.isAlive);
  const redAlive = state.units.some((u) => u.team === 'red' && u.isAlive);

  if (!blueAlive && !redAlive) return null;
  if (!blueAlive) return 'red';
  if (!redAlive) return 'blue';
  return null;
}
