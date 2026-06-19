import { useNavigate } from 'react-router-dom';
import { Swords, Shield } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { UnitClass, Team } from '@/types';
import { UNIT_TEMPLATES } from '@/data/units';
import UnitCard from '@/components/UnitCard';
import FormationSlot from '@/components/FormationSlot';

const ALL_CLASSES: UnitClass[] = ['warrior', 'knight', 'archer', 'mage', 'assassin', 'priest', 'warlock'];

export default function SetupPage() {
  const navigate = useNavigate();
  const blueFormation = useGameStore((s) => s.blueFormation);
  const redFormation = useGameStore((s) => s.redFormation);
  const addToFormation = useGameStore((s) => s.addToFormation);
  const removeFromFormation = useGameStore((s) => s.removeFromFormation);
  const startBattle = useGameStore((s) => s.startBattle);

  const handleStart = () => {
    if (blueFormation.length === 0 || redFormation.length === 0) return;
    startBattle();
    navigate('/battle');
  };

  const renderTeamPanel = (team: Team) => {
    const formation = team === 'blue' ? blueFormation : redFormation;
    const teamColor = team === 'blue' ? '#4ea8de' : '#e94560';
    const label = team === 'blue' ? '蓝方' : '红方';
    const Icon = team === 'blue' ? Shield : Swords;

    const slots: (UnitClass | null)[] = Array.from({ length: 8 }, (_, i) => formation[i] ?? null);

    return (
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-2 mb-3 pb-2 border-b-2"
          style={{ borderColor: teamColor, color: teamColor }}
        >
          <Icon size={18} />
          <span className="font-bold text-lg tracking-wider">{label}</span>
          <span className="text-xs text-gray-500 ml-auto">{formation.length}/8</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {slots.map((unitClass, i) => (
            <FormationSlot
              key={i}
              unitClass={unitClass}
              team={team}
              index={i}
              onRemove={() => removeFromFormation(team, i)}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ALL_CLASSES.map((cls) => (
            <UnitCard
              key={cls}
              unitClass={cls}
              onClick={() => addToFormation(team, cls)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-4 lg:p-8">
      <h1 className="text-center text-3xl lg:text-4xl font-black tracking-[0.3em] mb-6"
        style={{ color: '#f0c040', textShadow: '0 0 20px rgba(240,192,64,0.3)' }}
      >
        战棋模拟器
      </h1>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 mb-8">
        {renderTeamPanel('blue')}
        <div className="hidden lg:block w-px bg-[#2a2a4a]" />
        {renderTeamPanel('red')}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={blueFormation.length === 0 || redFormation.length === 0}
          className="px-10 py-3 rounded-xl font-bold text-lg tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#f0c040',
            color: '#1a1a2e',
            boxShadow: '0 0 30px rgba(240,192,64,0.3), 0 0 60px rgba(240,192,64,0.1)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          开始战斗
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-6 p-4 rounded-lg bg-[#0a0a1a]/50 border border-[#2a2a4a]">
        <div className="text-xs text-gray-500 mb-2">兵种一览</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {ALL_CLASSES.map((cls) => {
            const t = UNIT_TEMPLATES[cls];
            return (
              <div key={cls} className="text-[10px] text-gray-400 p-2 rounded bg-[#1a1a2e]/50">
                <div className="text-[#f0c040] font-bold mb-1">{t.name}</div>
                <div>HP:{t.maxHp} ATK:{t.atk} DEF:{t.def}</div>
                <div className="text-gray-600">SPD:{t.speed} 移动:{t.moveRange} 射程:{t.attackRange}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(240,192,64,0.3), 0 0 60px rgba(240,192,64,0.1); }
          50% { box-shadow: 0 0 40px rgba(240,192,64,0.5), 0 0 80px rgba(240,192,64,0.2); }
        }
      `}</style>
    </div>
  );
}
