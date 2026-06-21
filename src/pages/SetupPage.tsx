import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Shield, Sparkles, History, Play, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { CharacterId, Team, ActiveSynergy, Profession, BattleRecording, EquipmentSlot, Equipment } from '@/types';
import { CHARACTER_TEMPLATES, ALL_CHARACTERS, PROFESSION_NAMES, PROFESSION_EMOJI, SYNERGY_DATA } from '@/data/units';
import { calculateSynergies, getSynergyEmoji } from '@/engine/synergy';
import { MAX_BATTLE_RECORDINGS } from '@/engine/battleStorage';
import UnitCard from '@/components/UnitCard';
import FormationSlot from '@/components/FormationSlot';
import EquipmentSlots from '@/components/EquipmentSlots';
import EquipmentSelector from '@/components/EquipmentSelector';

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
  const blueEquipment = useGameStore((s) => s.blueEquipment);
  const redEquipment = useGameStore((s) => s.redEquipment);
  const addToFormation = useGameStore((s) => s.addToFormation);
  const removeFromFormation = useGameStore((s) => s.removeFromFormation);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const getUnitEquipment = useGameStore((s) => s.getUnitEquipment);
  const startBattle = useGameStore((s) => s.startBattle);
  const savedRecordings = useGameStore((s) => s.savedRecordings);
  const loadRecordings = useGameStore((s) => s.loadRecordings);
  const startReplay = useGameStore((s) => s.startReplay);
  const deleteRecordingAction = useGameStore((s) => s.deleteRecording);
  const clearAllRecordingsAction = useGameStore((s) => s.clearAllRecordings);

  const [selectedUnitForEquipment, setSelectedUnitForEquipment] = useState<{ team: Team; index: number } | null>(null);
  const [equipmentSelectorOpen, setEquipmentSelectorOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);

  const blueSynergies = calculateSynergies(blueFormation);
  const redSynergies = calculateSynergies(redFormation);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleSlotClick = (team: Team, index: number) => {
    const formation = team === 'blue' ? blueFormation : redFormation;
    if (formation[index]) {
      setSelectedUnitForEquipment({ team, index });
    }
  };

  const handleEquipmentSlotClick = (slot: EquipmentSlot) => {
    if (selectedUnitForEquipment) {
      setSelectedSlot(slot);
      setEquipmentSelectorOpen(true);
    }
  };

  const handleEquip = (equipment: Equipment) => {
    if (selectedUnitForEquipment && selectedSlot) {
      equipItem(selectedUnitForEquipment.team, selectedUnitForEquipment.index, equipment);
    }
  };

  const handleUnequip = () => {
    if (selectedUnitForEquipment && selectedSlot) {
      unequipItem(selectedUnitForEquipment.team, selectedUnitForEquipment.index, selectedSlot);
    }
  };

  const handleStart = () => {
    if (blueFormation.length === 0 || redFormation.length === 0) return;
    startBattle();
    navigate('/battle');
  };

  const handleStartReplay = (recordingId: string) => {
    const success = startReplay(recordingId);
    if (success) {
      navigate('/battle');
    }
  };

  const handleDeleteRecording = (e: React.MouseEvent, recordingId: string) => {
    e.stopPropagation();
    deleteRecordingAction(recordingId);
  };

  const handleClearAll = () => {
    if (window.confirm('确定要删除所有战斗记录吗？')) {
      clearAllRecordingsAction();
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderRecordingItem = (recording: BattleRecording) => {
    const duration = Math.round((recording.endTime - recording.startTime) / 1000);
    return (
      <div
        key={recording.id}
        onClick={() => handleStartReplay(recording.id)}
        className="p-3 rounded-lg border bg-[#2a2a4a]/50 border-[#2a2a4a] hover:bg-[#3a3a5a]/50 hover:border-[#3a3a5a] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: recording.winner === 'blue' ? '#4ea8de33' : '#e9456033',
                color: recording.winner === 'blue' ? '#4ea8de' : '#e94560',
              }}
            >
              {recording.winner === 'blue' ? '蓝方胜' : recording.winner === 'red' ? '红方胜' : '进行中'}
            </span>
            <span className="text-xs text-gray-400">{recording.totalTurns}回合</span>
            <span className="text-[10px] text-gray-600">{duration}秒</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-[#f0c040]/20 text-[#f0c040] transition-all"
              title="回放"
            >
              <Play size={14} />
            </button>
            <button
              onClick={(e) => handleDeleteRecording(e, recording.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-1.5">{formatDate(recording.startTime)}</div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="text-[#4ea8de]">蓝: {recording.blueFormation.length}</span>
          <span>vs</span>
          <span className="text-[#e94560]">红: {recording.redFormation.length}</span>
          <span className="ml-auto">{recording.snapshots.length}个快照</span>
        </div>
      </div>
    );
  };

  const renderTeamPanel = (team: Team) => {
    const formation = team === 'blue' ? blueFormation : redFormation;
    const equipment = team === 'blue' ? blueEquipment : redEquipment;
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

    const handleEquipSlotClick = (index: number, slot: EquipmentSlot, e: React.MouseEvent) => {
      e.stopPropagation();
      if (formation[index]) {
        setSelectedUnitForEquipment({ team, index });
        setSelectedSlot(slot);
        setEquipmentSelectorOpen(true);
      }
    };

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

        <div className="text-xs text-gray-500 mb-2">阵容与装备（点击装备图标编辑）</div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {slots.map((characterId, i) => (
            <div key={i} className="space-y-1">
              <FormationSlot
                characterId={characterId}
                team={team}
                index={i}
                synergies={synergies}
                onRemove={() => removeFromFormation(team, i)}
              />
              {characterId && (
                <div className="flex gap-1 justify-center">
                  {(['weapon', 'armor', 'accessory'] as EquipmentSlot[]).map((slot) => {
                    const unitEquip = equipment[i];
                    const item = unitEquip?.[slot];
                    return (
                      <div
                        key={slot}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs border cursor-pointer transition-all hover:scale-110"
                        style={{
                          backgroundColor: item ? '#1a1a2e' : '#0a0a1a',
                          borderColor: item ? '#f0c04066' : '#2a2a4a',
                          borderStyle: item ? 'solid' : 'dashed',
                        }}
                        onClick={(e) => handleEquipSlotClick(i, slot, e)}
                        title={item ? item.name : `装备${slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '饰品'}`}
                      >
                        {item ? (
                          <span className="text-[10px]">
                            {slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍'}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-[10px]">+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mb-2">选择角色加入阵容</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
          {ALL_CHARACTERS.map((cid) => (
            <UnitCard
              key={cid}
              characterId={cid}
              synergies={synergies}
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

      <div className="flex justify-center mb-6">
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

      <div className="max-w-7xl mx-auto mb-6 p-4 rounded-lg bg-[#0a0a1a]/50 border border-[#2a2a4a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#f0c040]" />
            <span className="text-sm font-bold text-[#f0c040]">
              历史战斗 ({savedRecordings.length}/{MAX_BATTLE_RECORDINGS})
            </span>
          </div>
          {savedRecordings.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              清空全部
            </button>
          )}
        </div>

        {savedRecordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-xs">
            <History size={32} className="mb-2 opacity-30" />
            <div>暂无战斗记录</div>
            <div className="text-[10px] mt-1">完成战斗后将自动保存到这里</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {savedRecordings.map(renderRecordingItem)}
          </div>
        )}
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

      {selectedUnitForEquipment && selectedSlot && (
        <EquipmentSelector
          isOpen={equipmentSelectorOpen}
          onClose={() => setEquipmentSelectorOpen(false)}
          slot={selectedSlot}
          profession={
            CHARACTER_TEMPLATES[
              (selectedUnitForEquipment.team === 'blue'
                ? blueFormation
                : redFormation
              )[selectedUnitForEquipment.index]
            ]?.profession || 'warrior'
          }
          currentEquipment={
            (selectedUnitForEquipment.team === 'blue'
              ? blueEquipment
              : redEquipment
            )[selectedUnitForEquipment.index]?.[selectedSlot] || null
          }
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(240,192,64,0.3), 0 0 60px rgba(240,192,64,0.1); }
          50% { box-shadow: 0 0 40px rgba(240,192,64,0.5), 0 0 80px rgba(240,192,64,0.2); }
        }
      `}</style>
    </div>
  );
}
