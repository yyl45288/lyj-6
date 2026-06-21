import { CharacterId, CharacterTemplate, Profession, ActiveSynergy } from '@/types';
import { CHARACTER_TEMPLATES, PROFESSION_NAMES, PROFESSION_EMOJI } from '@/data/units';
import { getSynergyModifier } from '@/engine/synergy';

interface UnitCardProps {
  characterId: CharacterId;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  synergies?: ActiveSynergy[];
}

function StatBar({ label, value, max, color, bonusValue }: { label: string; value: number; max: number; color: string; bonusValue?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const showBonus = bonusValue && bonusValue > 0;
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-6 text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-6 text-right text-gray-300">{value}</span>
      {showBonus && (
        <span className="text-[9px] text-[#f0c040] font-bold">+{bonusValue}</span>
      )}
    </div>
  );
}

export default function UnitCard({ characterId, onClick, selected, compact, synergies }: UnitCardProps) {
  const template: CharacterTemplate = CHARACTER_TEMPLATES[characterId];
  const emoji = PROFESSION_EMOJI[template.profession];

  const modifier = synergies ? getSynergyModifier(
    { profession: template.profession } as any,
    synergies
  ) : null;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded bg-[#1a1a2e]/80 border transition-all ${
          selected
            ? 'border-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.5)]'
            : 'border-[#2a2a4a] hover:border-[#4ea8de]/50'
        }`}
        onClick={onClick}
      >
        <span className="text-lg">{emoji}</span>
        <span className="text-xs text-gray-200 font-medium">{template.name}</span>
        <span className="text-[10px] text-gray-400 ml-auto">
          HP{template.maxHp}
          {modifier && modifier.maxHp > 0 && <span className="text-[#f0c040] ml-0.5">+{modifier.maxHp}</span>}
        </span>
      </div>
    );
  }

  const hasSynergyBonus = modifier && (modifier.atk > 0 || modifier.def > 0 || modifier.maxHp > 0 || modifier.speed > 0 || modifier.critRate > 0 || modifier.critDmg > 0);

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
        {hasSynergyBonus && (
          <div className="text-[9px] px-1.5 py-0.5 rounded bg-[#f0c040]/20 text-[#f0c040] font-bold">
            羁绊加成
          </div>
        )}
      </div>

      <div className="space-y-1 mb-2">
        <StatBar label="HP" value={template.maxHp} max={150} color="#22c55e" bonusValue={modifier?.maxHp} />
        <StatBar label="ATK" value={template.atk} max={30} color="#e94560" bonusValue={modifier?.atk} />
        <StatBar label="DEF" value={template.def} max={20} color="#4ea8de" bonusValue={modifier?.def} />
        {modifier && modifier.speed > 0 && (
          <StatBar label="SPD" value={template.speed} max={10} color="#a855f7" bonusValue={modifier.speed} />
        )}
        {modifier && (modifier.critRate > 0 || modifier.critDmg > 0) && (
          <div className="flex items-center gap-2 text-[10px] text-[#f0c040]">
            {modifier.critRate > 0 && <span>暴击+{(modifier.critRate * 100).toFixed(0)}%</span>}
            {modifier.critDmg > 0 && <span>暴伤+{(modifier.critDmg * 100).toFixed(0)}%</span>}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
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
