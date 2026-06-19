import { UnitClass, UnitTemplate } from '@/types';
import { UNIT_TEMPLATES } from '@/data/units';

const CLASS_EMOJI: Record<UnitClass, string> = {
  warrior: '⚔️',
  knight: '🛡️',
  archer: '🏹',
  mage: '🔮',
  assassin: '🗡️',
  priest: '✨',
  warlock: '💀',
};

interface UnitCardProps {
  unitClass: UnitClass;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-6 text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-6 text-right text-gray-300">{value}</span>
    </div>
  );
}

export default function UnitCard({ unitClass, onClick, selected, compact }: UnitCardProps) {
  const template: UnitTemplate = UNIT_TEMPLATES[unitClass];
  const emoji = CLASS_EMOJI[unitClass];

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
        <span className="text-[10px] text-gray-400 ml-auto">HP{template.maxHp}</span>
      </div>
    );
  }

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
        <div>
          <div className="text-sm font-bold text-gray-100">{template.name}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{unitClass}</div>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        <StatBar label="HP" value={template.maxHp} max={150} color="#22c55e" />
        <StatBar label="ATK" value={template.atk} max={30} color="#e94560" />
        <StatBar label="DEF" value={template.def} max={20} color="#4ea8de" />
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
