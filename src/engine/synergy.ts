import { CharacterId, ActiveSynergy, Unit, SynergyBonus } from '../types';
import { CHARACTER_TEMPLATES, SYNERGY_DATA, PROFESSION_NAMES } from '../data/units';

export function countProfessions(formation: CharacterId[]): Record<string, number> {
  const counts: Record<string, number> = {};
  formation.forEach((characterId) => {
    const template = CHARACTER_TEMPLATES[characterId];
    if (template) {
      const prof = template.profession;
      counts[prof] = (counts[prof] || 0) + 1;
    }
  });
  return counts;
}

export function calculateSynergies(formation: CharacterId[]): ActiveSynergy[] {
  const professionCounts = countProfessions(formation);
  const activeSynergies: ActiveSynergy[] = [];

  Object.entries(professionCounts).forEach(([profession, count]) => {
    const synergyData = SYNERGY_DATA[profession as keyof typeof SYNERGY_DATA];
    if (!synergyData) return;

    let highestTier: ActiveSynergy | null = null;
    synergyData.tiers.forEach((tier, index) => {
      if (count >= tier.threshold) {
        highestTier = {
          profession: profession as keyof typeof SYNERGY_DATA,
          name: synergyData.name,
          tierName: tier.name,
          tierIndex: index,
          count,
          bonuses: tier.bonuses,
        };
      }
    });

    if (highestTier) {
      activeSynergies.push(highestTier);
    }
  });

  return activeSynergies;
}

export function getSynergyModifier(unit: Unit, synergies: ActiveSynergy[]): Record<string, number> {
  const modifiers: Record<string, number> = {
    atk: 0,
    def: 0,
    maxHp: 0,
    speed: 0,
    critRate: 0,
    critDmg: 0,
  };

  synergies.forEach((synergy) => {
    if (synergy.profession === unit.profession) {
      synergy.bonuses.forEach((bonus) => {
        switch (bonus.type) {
          case 'atkUp':
            modifiers.atk += bonus.value;
            break;
          case 'defUp':
            modifiers.def += bonus.value;
            break;
          case 'hpUp':
            modifiers.maxHp += bonus.value;
            break;
          case 'speedUp':
            modifiers.speed += bonus.value;
            break;
          case 'critRateUp':
            modifiers.critRate += bonus.value;
            break;
          case 'critDmgUp':
            modifiers.critDmg += bonus.value;
            break;
        }
      });
    }
  });

  return modifiers;
}

export function applySynergyBonuses(unit: Unit, synergies: ActiveSynergy[]): void {
  const modifiers = getSynergyModifier(unit, synergies);

  if (modifiers.maxHp > 0) {
    unit.maxHp += modifiers.maxHp;
    unit.hp += modifiers.maxHp;
  }
  if (modifiers.atk > 0) {
    unit.atk += modifiers.atk;
  }
  if (modifiers.def > 0) {
    unit.def += modifiers.def;
  }
  if (modifiers.speed > 0) {
    unit.speed += modifiers.speed;
  }
  if (modifiers.critRate > 0) {
    unit.critRate += modifiers.critRate;
  }
  if (modifiers.critDmg > 0) {
    unit.critDmg += modifiers.critDmg;
  }
}

export function formatSynergyDescription(synergy: ActiveSynergy): string {
  const bonusTexts = synergy.bonuses.map((bonus) => {
    const bonusName = {
      atkUp: '攻击',
      defUp: '防御',
      hpUp: '生命',
      speedUp: '速度',
      critRateUp: '暴击率',
      critDmgUp: '暴击伤害',
    }[bonus.type];
    const valueStr = bonus.type === 'critRateUp' || bonus.type === 'critDmgUp'
      ? `+${(bonus.value * 100).toFixed(0)}%`
      : `+${bonus.value}`;
    return `${bonusName}${valueStr}`;
  });
  return `${synergy.count}/${SYNERGY_DATA[synergy.profession].tiers[synergy.tierIndex].threshold} ${synergy.tierName}: ${bonusTexts.join(', ')}`;
}

export function getSynergyEmoji(profession: string): string {
  const emojis: Record<string, string> = {
    warrior: '⚔️',
    knight: '🛡️',
    archer: '🏹',
    mage: '🔮',
    assassin: '🗡️',
    priest: '✨',
    warlock: '💀',
  };
  return emojis[profession] || '⭐';
}
