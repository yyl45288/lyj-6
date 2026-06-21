import { Equipment } from '@/types';
import { RARITY_COLORS, RARITY_NAMES, SLOT_EMOJIS } from '@/data/equipment';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

function StatLine({ label, value, isPositive = true }: { label: string; value: number; isPositive?: boolean }) {
  if (value === 0) return null;
  const isPercent = label.includes('率') || label.includes('伤害');
  const numValue = isPercent ? value * 100 : value;
  const displayValue = numValue > 0 ? `+${numValue}` : `${numValue}`;
  const displayText = isPercent ? `${displayValue}%` : displayValue;
  return (
    <span className={`text-[10px] ${isPositive ? 'text-[#22c55e]' : 'text-[#e94560]'}`}>
      {label} {displayText}
    </span>
  );
}

export default function EquipmentCard({ equipment, onClick, selected, compact, disabled }: EquipmentCardProps) {
  const rarityColor = RARITY_COLORS[equipment.rarity];
  const rarityName = RARITY_NAMES[equipment.rarity];
  const slotEmoji = SLOT_EMOJIS[equipment.slot];

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded bg-[#1a1a2e]/80 border transition-all cursor-pointer ${
          selected
            ? 'border-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.5)]'
            : disabled
            ? 'border-[#2a2a4a] opacity-50 cursor-not-allowed'
            : 'border-[#2a2a4a] hover:border-[#4ea8de]/50'
        }`}
        onClick={disabled ? undefined : onClick}
      >
        <span className="text-lg">{slotEmoji}</span>
        <span className="text-xs font-medium" style={{ color: rarityColor }}>
          {equipment.name}
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">{rarityName}</span>
      </div>
    );
  }

  const hasStatBonuses = Object.values(equipment.statBonuses).some((v) => v && v !== 0);
  const hasBuffEffects = equipment.buffEffects && equipment.buffEffects.length > 0;

  return (
    <div
      className={`relative p-3 rounded-lg bg-[#1a1a2e]/90 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected
          ? 'border-[#f0c040] shadow-[0_0_12px_rgba(240,192,64,0.4)]'
          : disabled
          ? 'border-[#2a2a4a] opacity-50 cursor-not-allowed'
          : 'border-[#2a2a4a] hover:shadow-[0_0_8px_rgba(78,168,222,0.2)]'
      }`}
      style={selected ? {} : { borderColor: `${rarityColor}66` }}
      onClick={disabled ? undefined : onClick}
    >
      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: rarityColor, color: '#1a1a2e' }}>
        {rarityName}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{slotEmoji}</span>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: rarityColor }}>
            {equipment.name}
          </div>
          <div className="text-[10px] text-gray-500">
            {equipment.slot === 'weapon' ? '武器' : equipment.slot === 'armor' ? '防具' : '饰品'}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 mb-2">{equipment.description}</div>

      {hasStatBonuses && (
        <div className="space-y-0.5 mb-2">
          <StatLine label="生命" value={equipment.statBonuses.maxHp || 0} />
          <StatLine label="魔力" value={equipment.statBonuses.maxMp || 0} />
          <StatLine label="攻击" value={equipment.statBonuses.atk || 0} />
          <StatLine label="防御" value={equipment.statBonuses.def || 0} />
          <StatLine label="速度" value={equipment.statBonuses.speed || 0} />
          <StatLine label="暴击率" value={equipment.statBonuses.critRate || 0} />
          <StatLine label="暴击伤害" value={equipment.statBonuses.critDmg || 0} />
          <StatLine label="移动范围" value={equipment.statBonuses.moveRange || 0} />
          <StatLine label="攻击范围" value={equipment.statBonuses.attackRange || 0} />
        </div>
      )}

      {hasBuffEffects && (
        <div className="pt-2 border-t border-[#2a2a4a]">
          <div className="text-[10px] text-gray-500 mb-1">被动效果</div>
          {equipment.buffEffects!.map((buff, i) => (
            <div key={i} className="text-[10px] text-[#f0c040]">
              • {buff.name}
            </div>
          ))}
        </div>
      )}

      {equipment.allowedProfessions && equipment.allowedProfessions.length > 0 && (
        <div className="pt-2 border-t border-[#2a2a4a]">
          <div className="text-[9px] text-gray-500">
            适用职业: {equipment.allowedProfessions.length}种
          </div>
        </div>
      )}
    </div>
  );
}
