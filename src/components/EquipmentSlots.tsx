import { UnitEquipment, EquipmentSlot, Equipment } from '@/types';
import { SLOT_EMOJIS, SLOT_NAMES, RARITY_COLORS } from '@/data/equipment';

interface EquipmentSlotsProps {
  equipment: UnitEquipment;
  onSlotClick?: (slot: EquipmentSlot) => void;
  compact?: boolean;
}

const SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

export default function EquipmentSlots({ equipment, onSlotClick, compact }: EquipmentSlotsProps) {
  if (compact) {
    return (
      <div className="flex gap-1">
        {SLOTS.map((slot) => {
          const item = equipment[slot];
          return (
            <div
              key={slot}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm border cursor-pointer transition-all ${
                item
                  ? 'bg-[#1a1a2e] hover:bg-[#2a2a4a]'
                  : 'bg-[#0a0a1a] border-dashed border-gray-600 hover:border-gray-400'
              }`}
              style={{ borderColor: item ? RARITY_COLORS[item.rarity] + '66' : undefined }}
              onClick={() => onSlotClick?.(slot)}
              title={item ? item.name : `装备${SLOT_NAMES[slot]}`}
            >
              {item ? (
                <span>{SLOT_EMOJIS[slot]}</span>
              ) : (
                <span className="text-gray-600 text-xs">+</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {SLOTS.map((slot) => {
        const item = equipment[slot];
        return (
          <div
            key={slot}
            className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
              item
                ? 'bg-[#1a1a2e] hover:bg-[#2a2a4a]'
                : 'bg-[#0a0a1a] border-dashed border-gray-600 hover:border-gray-400'
            }`}
            style={{ borderColor: item ? RARITY_COLORS[item.rarity] + '66' : undefined }}
            onClick={() => onSlotClick?.(slot)}
          >
            <div className="w-10 h-10 rounded flex items-center justify-center text-xl bg-[#0a0a1a]">
              {SLOT_EMOJIS[slot]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                {SLOT_NAMES[slot]}
              </div>
              {item ? (
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: RARITY_COLORS[item.rarity] }}
                >
                  {item.name}
                </div>
              ) : (
                <div className="text-sm text-gray-600">未装备</div>
              )}
            </div>
            {item && (
              <div className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{ backgroundColor: RARITY_COLORS[item.rarity] + '33', color: RARITY_COLORS[item.rarity] }}>
                已装备
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
