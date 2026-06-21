import { Unit } from '@/types';
import { getBuffModifier } from '@/engine/buff';
import { PROFESSION_EMOJI } from '@/data/units';
import { X } from 'lucide-react';

interface UnitInfoPanelProps {
  unit: Unit | null;
  allUnits: Unit[];
  onClose: () => void;
}

export default function UnitInfoPanel({ unit, allUnits, onClose }: UnitInfoPanelProps) {
  if (!unit) return null;

  const teamColor = unit.team === 'blue' ? '#4ea8de' : '#e94560';
  const atkMod = getBuffModifier(unit, 'atk');
  const defMod = getBuffModifier(unit, 'def');
  const spdMod = getBuffModifier(unit, 'speed');

  const hpPct = (unit.hp / unit.maxHp) * 100;
  const mpPct = (unit.mp / unit.maxMp) * 100;

  const aggroEntries = Object.entries(unit.aggroTable)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const maxAggro = aggroEntries.length > 0 ? aggroEntries[0][1] : 1;

  return (
    <div className="bg-[#1a1a2e]/95 rounded-lg border border-[#2a2a4a] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{PROFESSION_EMOJI[unit.profession]}</span>
          <span className="font-bold text-sm" style={{ color: teamColor }}>
            {unit.name}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>HP</span>
              <span>
                {unit.hp}/{unit.maxHp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0a0a1a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hpPct}%`,
                  backgroundColor: hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>MP</span>
              <span>
                {unit.mp}/{unit.maxMp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0a0a1a] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4ea8de] transition-all"
                style={{ width: `${mpPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0a0a1a] rounded px-2 py-1">
            <div className="text-[10px] text-gray-500">ATK</div>
            <div className="text-xs font-bold text-white">
              {unit.atk}
              {atkMod !== 0 && (
                <span className={atkMod > 0 ? 'text-[#22c55e]' : 'text-[#e94560]'}>
                  {atkMod > 0 ? '+' : ''}
                  {atkMod}
                </span>
              )}
            </div>
          </div>
          <div className="bg-[#0a0a1a] rounded px-2 py-1">
            <div className="text-[10px] text-gray-500">DEF</div>
            <div className="text-xs font-bold text-white">
              {unit.def}
              {defMod !== 0 && (
                <span className={defMod > 0 ? 'text-[#22c55e]' : 'text-[#e94560]'}>
                  {defMod > 0 ? '+' : ''}
                  {defMod}
                </span>
              )}
            </div>
          </div>
          <div className="bg-[#0a0a1a] rounded px-2 py-1">
            <div className="text-[10px] text-gray-500">SPD</div>
            <div className="text-xs font-bold text-white">
              {unit.speed}
              {spdMod !== 0 && (
                <span className={spdMod > 0 ? 'text-[#22c55e]' : 'text-[#e94560]'}>
                  {spdMod > 0 ? '+' : ''}
                  {spdMod}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 mb-1">技能</div>
          <div className="space-y-1">
            {unit.skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-[#0a0a1a]"
              >
                <span className="text-[#f0c040]">{skill.name}</span>
                {skill.currentCd > 0 ? (
                  <span className="text-gray-500">CD: {skill.currentCd}</span>
                ) : (
                  <span className="text-[#22c55e]">就绪</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {unit.buffs.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 mb-1">增益/减益</div>
            <div className="space-y-0.5">
              {unit.buffs.map((buff, i) => (
                <div
                  key={`${buff.name}-${i}`}
                  className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded bg-[#0a0a1a]"
                >
                  <span
                    style={{
                      color:
                        buff.type.includes('Up') || buff.type === 'hot' || buff.type === 'shield'
                          ? '#22c55e'
                          : buff.type === 'taunt'
                          ? '#f0c040'
                          : '#e94560',
                    }}
                  >
                    {buff.name}
                  </span>
                  <span className="text-gray-500">
                    {buff.remainingTurns}回合 ×{buff.stacks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aggroEntries.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 mb-1">仇恨目标</div>
            <div className="space-y-1">
              {aggroEntries.map(([id, value]) => {
                const target = allUnits.find((u) => u.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 text-[10px]">
                    <span
                      className="w-14 truncate"
                      style={{ color: target?.team === 'blue' ? '#4ea8de' : '#e94560' }}
                    >
                      {target?.name ?? id}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#0a0a1a] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(value / maxAggro) * 100}%`,
                          backgroundColor: '#ff8c00',
                        }}
                      />
                    </div>
                    <span className="text-gray-500 w-8 text-right">{Math.floor(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
