import { Play, Pause, RotateCcw } from 'lucide-react';
import { BattleState } from '@/types';

interface BattleControlsProps {
  battleState: BattleState;
  onTogglePause: () => void;
  onSetSpeed: (speed: 1 | 2 | 4) => void;
  onReset: () => void;
}

export default function BattleControls({
  battleState,
  onTogglePause,
  onSetSpeed,
  onReset,
}: BattleControlsProps) {
  const isRunning = battleState.phase === 'running';
  const isFinished = battleState.phase === 'finished';

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 bg-[#1a1a2e]/95 border-t border-[#2a2a4a]">
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePause}
          disabled={isFinished}
          className="w-10 h-10 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors disabled:opacity-40"
        >
          {isRunning ? <Pause size={18} className="text-[#4ea8de]" /> : <Play size={18} className="text-[#22c55e]" />}
        </button>

        <div className="flex gap-1">
          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                battleState.speed === s
                  ? 'bg-[#f0c040] text-[#1a1a2e]'
                  : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onReset}
          className="w-10 h-10 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors"
        >
          <RotateCcw size={16} className="text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-400">
          回合 <span className="text-[#f0c040] font-bold text-sm">{battleState.turn}</span>
        </div>

        {isFinished && battleState.winner && (
          <div
            className="px-4 py-1.5 rounded-lg font-bold text-sm animate-pulse"
            style={{
              backgroundColor: battleState.winner === 'blue' ? '#4ea8de33' : '#e9456033',
              color: battleState.winner === 'blue' ? '#4ea8de' : '#e94560',
              border: `1px solid ${battleState.winner === 'blue' ? '#4ea8de' : '#e94560'}`,
            }}
          >
            {battleState.winner === 'blue' ? '蓝方' : '红方'}胜利！
          </div>
        )}
      </div>
    </div>
  );
}
