import { ActiveSynergy, Team } from '@/types';
import { SYNERGY_DATA } from '@/data/units';
import { getSynergyEmoji } from '@/engine/synergy';
import { Sparkles } from 'lucide-react';

interface SynergyDisplayProps {
  blueSynergies: ActiveSynergy[];
  redSynergies: ActiveSynergy[];
}

export default function SynergyDisplay({ blueSynergies, redSynergies }: SynergyDisplayProps) {
  const renderSynergyList = (synergies: ActiveSynergy[], team: Team) => {
    const teamColor = team === 'blue' ? '#4ea8de' : '#e94560';

    if (synergies.length === 0) {
      return (
        <div className="text-[10px] text-gray-600 italic">
          暂无激活羁绊
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {synergies.map((synergy, i) => {
          const bonusTexts = synergy.bonuses.map((bonus) => {
            const bonusName = {
              atkUp: '攻',
              defUp: '防',
              hpUp: '血',
              speedUp: '速',
              critRateUp: '暴率',
              critDmgUp: '暴伤',
            }[bonus.type];
            const valueStr = bonus.type === 'critRateUp' || bonus.type === 'critDmgUp'
              ? `+${(bonus.value * 100).toFixed(0)}%`
              : `+${bonus.value}`;
            return `${bonusName}${valueStr}`;
          }).join(' ');

          const tierColor = synergy.tierIndex === 0 ? '#9ca3af' : synergy.tierIndex === 1 ? '#f0c040' : '#ef4444';

          return (
            <div key={i} className="text-[10px] bg-[#1a1a2e]/80 px-2 py-1 rounded border-l-2" style={{ borderColor: tierColor }}>
              <div className="flex items-center gap-1">
                <span>{getSynergyEmoji(synergy.profession)}</span>
                <span className="font-bold" style={{ color: tierColor }}>
                  {synergy.count}/{SYNERGY_DATA[synergy.profession].tiers[synergy.tierIndex].threshold}
                </span>
                <span className="text-gray-300 font-medium">{synergy.tierName}</span>
              </div>
              <div className="text-gray-500 mt-0.5">{bonusTexts}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 p-2 rounded-lg bg-[#0a0a1a]/50 border border-[#4ea8de]/30">
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#4ea8de' }}>
          <Sparkles size={10} />
          <span className="font-bold">蓝方羁绊</span>
        </div>
        {renderSynergyList(blueSynergies, 'blue')}
      </div>
      <div className="flex-1 p-2 rounded-lg bg-[#0a0a1a]/50 border border-[#e94560]/30">
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#e94560' }}>
          <Sparkles size={10} />
          <span className="font-bold">红方羁绊</span>
        </div>
        {renderSynergyList(redSynergies, 'red')}
      </div>
    </div>
  );
}
