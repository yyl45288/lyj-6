import { useNavigate } from 'react-router-dom';
import { Swords, Shield, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { CharacterId, Team, ActiveSynergy, Profession } from '@/types';
import { CHARACTER_TEMPLATES, ALL_CHARACTERS, PROFESSION_NAMES, PROFESSION_EMOJI, SYNERGY_DATA } from '@/data/units';
import { calculateSynergies, getSynergyEmoji } from '@/engine/synergy';
import UnitCard from '@/components/UnitCard';
import FormationSlot from '@/components/FormationSlot';

function SynergyPanel({ synergies, team }: { synergies: ActiveSynergy[]; team: Team }) {
  const teamColor = team === 'blue' ? '#4ea8de' : '#e94560';

  if (synergies.length === 0) {
    return (
      <div className="text-[10px] text-gray-600 italic">
        暂无激活的羁绊
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {synergies.map((synergy, i) => {
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
}

export default function SetupPage() {
  const navigate = useNavigate();
  const blueFormation = useGameStore((s) => s.blueFormation);
  const redFormation = useGameStore((s) => s.redFormation);
  const addToFormation = useGameStore((s) => s.addToFormation);
  const removeFromFormation = useGameStore((s) => s.removeFromFormation);
  const startBattle = useGameStore((s) => s.startBattle);

  const blueSynergies = calculateSynergies(blueFormation);
  const redSynergies = calculateSynergies(redFormation);

  const handleStart = () => {
    if (blueFormation.length === 0 || redFormation.length === 0) return;
    startBattle();
    navigate('/battle');
  };

  const renderTeamPanel = (team: Team) => {
    const formation = team === 'blue' ? blueFormation : redFormation;
    const synergies = team === 'blue' ? blueSynergies : redSynergies;
    const teamColor = team === 'blue' ? '#4ea8de' : '#e94560';
    const label = team === 'blue' ? '蓝方' : '红方';
    const Icon = team === 'blue' ? Shield : Swords;

    const slots: (CharacterId | null)[] = Array.from({ length: 8 }, (_, i) => formation[i] ?? null);

    const professionCounts: Record<string, number> = {};
    formation.forEach((cid) => {
      const t = CHARACTER_TEMPLATES[cid];
      if (t) {
        professionCounts[t.profession] = (professionCounts[t.profession] || 0) + 1;
      }
    });

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

        <div className="mb-3 p-3 rounded-lg bg-[#0a0a1a]/50 border border-[#2a2a4a]">
          <div className="flex items-center gap-1 text-xs text-[#f0c040] mb-2">
            <Sparkles size={12} />
            <span className="font-bold">职业羁绊</span>
          </div>
          <SynergyPanel synergies={synergies} team={team} />
          <div className="mt-2 pt-2 border-t border-[#2a2a4a]">
            <div className="text-[10px] text-gray-500 mb-1">当前职业分布</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(professionCounts).map(([prof, count]) => (
                <span key={prof} className="text-[10px] bg-[#1a1a2e] px-2 py-0.5 rounded-full">
                  {PROFESSION_EMOJI[prof as Profession]} {PROFESSION_NAMES[prof as Profession]} ×{count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {slots.map((characterId, i) => (
            <FormationSlot
              key={i}
              characterId={characterId}
              team={team}
              index={i}
              onRemove={() => removeFromFormation(team, i)}
            />
          ))}
        </div>

        <div className="text-xs text-gray-500 mb-2">选择角色加入阵容</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
          {ALL_CHARACTERS.map((cid) => (
            <UnitCard
              key={cid}
              characterId={cid}
              onClick={() => addToFormation(team, cid)}
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
        <div className="text-xs text-gray-500 mb-2">职业羁绊一览</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(SYNERGY_DATA).map(([prof, data]) => (
            <div key={prof} className="text-[10px] text-gray-400 p-3 rounded bg-[#1a1a2e]/50 border border-[#2a2a4a]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{PROFESSION_EMOJI[prof as Profession]}</span>
                <span className="text-[#f0c040] font-bold text-sm">{data.name}</span>
              </div>
              <div className="space-y-1">
                {data.tiers.map((tier, i) => {
                  const tierColor = i === 0 ? '#9ca3af' : i === 1 ? '#f0c040' : '#ef4444';
                  const bonusTexts = tier.bonuses.map((b) => {
                    const name = { atkUp: '攻', defUp: '防', hpUp: '血', speedUp: '速', critRateUp: '暴击', critDmgUp: '暴伤' }[b.type];
                    const val = b.type === 'critRateUp' || b.type === 'critDmgUp' ? `+${(b.value * 100).toFixed(0)}%` : `+${b.value}`;
                    return `${name}${val}`;
                  }).join(' ');
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: tierColor }}>{tier.threshold}人</span>
                      <span className="text-gray-300">{tier.name}</span>
                      <span className="text-gray-500 ml-auto">{bonusTexts}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
