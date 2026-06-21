import { useState } from 'react';
import { Equipment, EquipmentSlot, Profession } from '@/types';
import { ALL_EQUIPMENTS, getEquipmentsBySlotAndProfession, SLOT_NAMES } from '@/data/equipment';
import EquipmentCard from './EquipmentCard';
import { X } from 'lucide-react';

interface EquipmentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  slot: EquipmentSlot;
  profession: Profession;
  currentEquipment: Equipment | null;
  onEquip: (equipment: Equipment) => void;
  onUnequip: () => void;
}

export default function EquipmentSelector({
  isOpen,
  onClose,
  slot,
  profession,
  currentEquipment,
  onEquip,
  onUnequip,
}: EquipmentSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentEquipment?.id || null);

  if (!isOpen) return null;

  const availableEquipments = getEquipmentsBySlotAndProfession(slot, profession);

  const handleEquip = () => {
    const equipment = availableEquipments.find((e) => e.id === selectedId);
    if (equipment) {
      onEquip(equipment);
      onClose();
    }
  };

  const handleUnequip = () => {
    onUnequip();
    setSelectedId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a]">
          <div>
            <h3 className="text-base font-bold text-white">选择{SLOT_NAMES[slot]}</h3>
            <p className="text-[11px] text-gray-500">
              共 {availableEquipments.length} 件可装备
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            {availableEquipments.map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                selected={selectedId === eq.id}
                onClick={() => setSelectedId(eq.id)}
              />
            ))}
          </div>
          {availableEquipments.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              没有可用的{SLOT_NAMES[slot]}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-[#2a2a4a]">
          {currentEquipment && (
            <button
              onClick={handleUnequip}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#2a2a4a] text-gray-300 hover:bg-[#3a3a5a]"
            >
              卸下装备
            </button>
          )}
          <button
            onClick={handleEquip}
            disabled={!selectedId || selectedId === currentEquipment?.id}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#f0c040] text-[#1a1a2e] hover:bg-[#ffd45f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            装备
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#2a2a4a] text-gray-300 hover:bg-[#3a3a5a]"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
