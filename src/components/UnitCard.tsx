import { CharacterId, CharacterTemplate, Profession, ActiveSynergy, UnitEquipment } from '@/types';
import { CHARACTER_TEMPLATES, PROFESSION_NAMES, PROFESSION_EMOJI } from '@/data/units';
import { getSynergyModifier } from '@/engine/synergy';
import { getTotalStatBonus } from '@/engine/equipment';
import { RARITY_COLORS, SLOT_EMOJIS } from '@/data/equipment';

interface UnitCardProps {
  characterId: CharacterId;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  synergies?: ActiveSynergy[];
  equipment?: UnitEquipment;
}

interface CombinedModifier {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  critRate: number;
  critDmg: number;
  moveRange: number;
  attackRange: number;
  hasEquip: boolean;
  hasSynergy: boolean;
}

function formatBonus(value: number, isPercent = false): string | null {
  if (value === 0) return null;
  const displayVal = isPercent ? Math.round(value * 100) : value;
  if (displayVal === 0) return null;
  const sign = displayVal > 0 ? '+' : '';
  return `${sign}${displayVal}${isPercent ? '%' : ''}`;
}

function getBonusColor(value: number): string {
  if (value > 0) return '#22c55e';
  if (value < 0) return '#e94560';
  return '#9ca3af';
}

function StatBar({ label, value, max, color, bonusValue, equipBonusValue }: { label: string; value: number; max: number; color: string; bonusValue?: number; equipBonusValue?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const combinedBonus = (bonusValue || 0) + (equipBonusValue || 0);
  const formattedBonus = formatBonus(combinedBonus);
  const bonusColor = getBonusColor(combinedBonus);
  const synergyFormatted = formatBonus(bonusValue || 0);
  const equipFormatted = formatBonus(equipBonusValue || 0);

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-6 text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-6 text-right text-gray-300">{value}</span>
      {formattedBonus && (
        <span className="text-[9px] font-bold" style={{ color: bonusColor }} title={
          synergyFormatted && equipFormatted
            ? `羁绊${synergyFormatted} 装备${equipFormatted}`
            : synergyFormatted
            ? `羁绊${synergyFormatted}`
            : equipFormatted
            ? `装备${equipFormatted}`
            : ''
        }>
          {formattedBonus}
        </span>
      )}
    </div>
  );
}

export default function UnitCard({ characterId, onClick, selected, compact, synergies, equipment }: UnitCardProps) {
  const template: CharacterTemplate = CHARACTER_TEMPLATES[characterId];
  const emoji = PROFESSION_EMOJI[template.profession];

  const synergyModifier = synergies ? getSynergyModifier(
    { profession: template.profession } as any,
    synergies
  ) : null;

  const equipModifier = equipment ? getTotalStatBonus(equipment) : null;

  const combined: CombinedModifier = {
    maxHp: (synergyModifier?.maxHp || 0) + (equipModifier?.maxHp || 0),
    maxMp: (equipModifier?.maxMp || 0),
    atk: (synergyModifier?.atk || 0) + (equipModifier?.atk || 0),
    def: (synergyModifier?.def || 0) + (equipModifier?.def || 0),
    speed: (synergyModifier?.speed || 0) + (equipModifier?.speed || 0),
    critRate: (synergyModifier?.critRate || 0) + (equipModifier?.critRate || 0),
    critDmg: (synergyModifier?.critDmg || 0) + (equipModifier?.critDmg || 0),
    moveRange: (equipModifier?.moveRange || 0),
    attackRange: (equipModifier?.attackRange || 0),
    hasEquip: !!(equipment && (equipment.weapon || equipment.armor || equipment.accessory)),
    hasSynergy: !!(synergyModifier && (synergyModifier.atk > 0 || synergyModifier.def > 0 || synergyModifier.maxHp > 0 || synergyModifier.speed > 0 || synergyModifier.critRate > 0 || synergyModifier.critDmg > 0)),
  };

  if (compact) {
    const renderStatLine = (
      label: string,
      base: number,
      bonus: number,
      baseColor: string,
      showIfNoBonus = false
    ) => {
      const bonusStr = formatBonus(bonus);
      if (!showIfNoBonus && !bonusStr) return null;
      const bonusColor = getBonusColor(bonus);
      return (
        <span className="inline-flex items-center text-[10px] text-gray-400">
          <span style={{ color: baseColor }}>{label}</span>
          <span>{base}</span>
          {bonusStr && <span className="ml-0.5 font-bold" style={{ color: bonusColor }}>{bonusStr}</span>}
        </span>
      );
    };

    const hasAnyBonus = combined.maxHp !== 0 || combined.atk !== 0 || combined.def !== 0 || combined.speed !== 0 || combined.maxMp !== 0 || combined.critRate !== 0 || combined.critDmg !== 0;
    const hasEquipMark = combined.hasEquip || combined.hasSynergy;

    return (
      <div
        className={`flex flex-col gap-0.5 px-2 py-1.5 rounded bg-[#1a1a2e]/80 border transition-all ${
          selected
            ? 'border-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.5)]'
            : 'border-[#2a2a4a] hover:border-[#4ea8de]/50'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-base">{emoji}</span>
          <span className="text-xs text-gray-200 font-medium flex-1 min-w-0 truncate">{template.name}</span>
          {hasEquipMark && (
            <div className="flex gap-0.5">
              {combined.hasSynergy && (
                <span className="text-[8px] px-1 rounded bg-[#f0c040]/20 text-[#f0c040] font-bold leading-none py-0.5">羁</span>
              )}
              {combined.hasEquip && (
                <span className="text-[8px] px-1 rounded bg-[#22c55e]/20 text-[#22c55e] font-bold leading-none py-0.5">装</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {renderStatLine('H', template.maxHp, combined.maxHp, '#22c55e', true)}
          {renderStatLine('A', template.atk, combined.atk, '#e94560', true)}
          {renderStatLine('D', template.def, combined.def, '#4ea8de', true)}
          {renderStatLine('S', template.speed, combined.speed, '#a855f7')}
          {renderStatLine('M', template.maxMp, combined.maxMp, '#3b82f6')}
          {combined.critRate !== 0 && (
            <span className="text-[10px] font-bold" style={{ color: getBonusColor(combined.critRate) }}>
              暴{formatBonus(combined.critRate, true)}
            </span>
          )}
          {combined.critDmg !== 0 && (
            <span className="text-[10px] font-bold" style={{ color: getBonusColor(combined.critDmg) }}>
              伤{formatBonus(combined.critDmg, true)}
            </span>
          )}
          {combined.moveRange !== 0 && (
            <span className="text-[10px] font-bold" style={{ color: getBonusColor(combined.moveRange) }}>
              移{formatBonus(combined.moveRange)}
            </span>
          )}
          {combined.attackRange !== 0 && (
            <span className="text-[10px] font-bold" style={{ color: getBonusColor(combined.attackRange) }}>
              射{formatBonus(combined.attackRange)}
            </span>
          )}
        </div>
      </div>
    );
  }

  const hasAnyBonus = combined.hasEquip || combined.hasSynergy;

  const equipmentList: Array<{ slot: string; name: string; rarity: string }> = [];
  if (equipment?.weapon) equipmentList.push({ slot: 'weapon', name: equipment.weapon.name, rarity: equipment.weapon.rarity });
  if (equipment?.armor) equipmentList.push({ slot: 'armor', name: equipment.armor.name, rarity: equipment.armor.rarity });
  if (equipment?.accessory) equipmentList.push({ slot: 'accessory', name: equipment.accessory.name, rarity: equipment.accessory.rarity });

  return (
    <div
      className={`relative p-3 rounded-lg bg-[#1a1a2e]/90 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected
          ? 'border-[#f0c040] shadow-[0_0_12px_rgba(240,192,64,0.4)]'
          : 'border-[#2a2a4a] hover:border-[#4ea8de]/40 hover:shadow-[0_0_8px_rgba(78,168,222,0.2)]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-100">{template.name}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{PROFESSION_NAMES[template.profession]}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {combined.hasSynergy && (
            <div className="text-[9px] px-1.5 py-0.5 rounded bg-[#f0c040]/20 text-[#f0c040] font-bold">
              羁绊
            </div>
          )}
          {combined.hasEquip && (
            <div className="text-[9px] px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-bold">
              装备
            </div>
          )}
        </div>
      </div>

      {equipmentList.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-[#2a2a4a]/50">
          {equipmentList.map((eq, i) => (
            <div
              key={i}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${RARITY_COLORS[eq.rarity as keyof typeof RARITY_COLORS]}22` }}
              title={eq.name}
            >
              <span>{SLOT_EMOJIS[eq.slot]}</span>
              <span className="truncate max-w-[70px]" style={{ color: RARITY_COLORS[eq.rarity as keyof typeof RARITY_COLORS] }}>
                {eq.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 mb-2">
        <StatBar label="HP" value={template.maxHp} max={150} color="#22c55e" bonusValue={synergyModifier?.maxHp} equipBonusValue={equipModifier?.maxHp} />
        {combined.maxMp !== 0 && (
          <StatBar label="MP" value={template.maxMp} max={80} color="#3b82f6" equipBonusValue={equipModifier?.maxMp} />
        )}
        <StatBar label="ATK" value={template.atk} max={30} color="#e94560" bonusValue={synergyModifier?.atk} equipBonusValue={equipModifier?.atk} />
        <StatBar label="DEF" value={template.def} max={20} color="#4ea8de" bonusValue={synergyModifier?.def} equipBonusValue={equipModifier?.def} />
        {combined.speed !== 0 && (
          <StatBar label="SPD" value={template.speed} max={10} color="#a855f7" bonusValue={synergyModifier?.speed} equipBonusValue={equipModifier?.speed} />
        )}
        {combined.moveRange !== 0 && (
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-6 text-gray-400">MOV</span>
            <span className="flex-1 text-gray-300">{template.moveRange}</span>
            <span className="text-[9px] font-bold" style={{ color: getBonusColor(combined.moveRange) }}>
              {formatBonus(combined.moveRange)}
            </span>
          </div>
        )}
        {combined.attackRange !== 0 && (
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-6 text-gray-400">RNG</span>
            <span className="flex-1 text-gray-300">{template.attackRange}</span>
            <span className="text-[9px] font-bold" style={{ color: getBonusColor(combined.attackRange) }}>
              {formatBonus(combined.attackRange)}
            </span>
          </div>
        )}
        {(combined.critRate !== 0 || combined.critDmg !== 0) && (
          <div className="flex flex-wrap gap-2 text-[10px] pt-1">
            {combined.critRate !== 0 && (
              <span style={{ color: getBonusColor(combined.critRate) }} className="font-bold" title={
                (synergyModifier?.critRate ? `羁绊${formatBonus(synergyModifier.critRate, true) || ''}` : '') +
                (equipModifier?.critRate ? ` 装备${formatBonus(equipModifier.critRate, true) || ''}` : '')
              }>
                暴击{formatBonus(combined.critRate, true)}
              </span>
            )}
            {combined.critDmg !== 0 && (
              <span style={{ color: getBonusColor(combined.critDmg) }} className="font-bold" title={
                (synergyModifier?.critDmg ? `羁绊${formatBonus(synergyModifier.critDmg, true) || ''}` : '') +
                (equipModifier?.critDmg ? ` 装备${formatBonus(equipModifier.critDmg, true) || ''}` : '')
              }>
                暴伤{formatBonus(combined.critDmg, true)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-0.5 pt-2 border-t border-[#2a2a4a]/50">
        {template.skills.map((skill) => (
          <div key={skill.id} className="flex items-center justify-between text-[10px]">
            <span className="text-[#f0c040]">{skill.name}</span>
            <span className="text-gray-500">CD:{skill.cd}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
