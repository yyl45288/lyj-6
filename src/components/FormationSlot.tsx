import { UnitClass, Team } from '@/types';
import UnitCard from './UnitCard';
import { X } from 'lucide-react';

interface FormationSlotProps {
  unitClass: UnitClass | null;
  team: Team;
  index: number;
  onRemove: () => void;
}

export default function FormationSlot({ unitClass, team, index, onRemove }: FormationSlotProps) {
  const teamColor = team === 'blue' ? '#4ea8de' : '#e94560';

  if (!unitClass) {
    return (
      <div
        className="relative flex items-center justify-center h-16 rounded-lg border-2 border-dashed transition-all hover:bg-white/5"
        style={{ borderColor: `${teamColor}44` }}
      >
        <span className="absolute top-0.5 left-1.5 text-[10px] font-bold" style={{ color: teamColor }}>
          {index + 1}
        </span>
        <span className="text-xl text-gray-600">+</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <span
        className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]"
        style={{ backgroundColor: teamColor }}
      >
        {index + 1}
      </span>
      <UnitCard unitClass={unitClass} compact selected={false} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-[#e94560] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} className="text-white" />
      </button>
    </div>
  );
}
