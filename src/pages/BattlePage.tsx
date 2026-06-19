import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { BattleState, Unit } from '@/types';
import { executeTurn } from '@/engine/battle';
import BattleMap from '@/components/BattleMap';
import BattleLog from '@/components/BattleLog';
import BattleControls from '@/components/BattleControls';
import UnitInfoPanel from '@/components/UnitInfoPanel';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function BattlePage() {
  const navigate = useNavigate();
  const battleState = useGameStore((s) => s.battleState);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setSelectedUnit = useGameStore((s) => s.setSelectedUnit);
  const togglePause = useGameStore((s) => s.togglePause);
  const resetBattle = useGameStore((s) => s.resetBattle);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStateRef = useRef<BattleState | null>(null);

  const advanceTurn = useCallback(() => {
    if (!localStateRef.current) return;
    const state = localStateRef.current;
    if (state.phase === 'finished' || state.phase === 'paused') return;

    const cloned = deepClone(state);
    executeTurn(cloned);

    localStateRef.current = cloned;

    useGameStore.setState({ battleState: cloned });
  }, []);

  useEffect(() => {
    if (!battleState) {
      navigate('/');
      return;
    }
    localStateRef.current = battleState;
  }, [battleState, navigate]);

  useEffect(() => {
    if (!localStateRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const state = localStateRef.current;
    if (state.phase === 'running') {
      const ms = Math.max(100, 1000 / state.speed);
      intervalRef.current = setInterval(advanceTurn, ms);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [battleState?.phase, battleState?.speed, advanceTurn]);

  const handleTogglePause = useCallback(() => {
    if (!localStateRef.current) return;
    const state = localStateRef.current;
    if (state.phase === 'finished') return;

    const newPhase = state.phase === 'running' ? 'paused' : 'running';
    const updated = { ...state, phase: newPhase };
    localStateRef.current = updated;

    togglePause();
  }, [togglePause]);

  const handleSetSpeed = useCallback(
    (speed: 1 | 2 | 4) => {
      if (!localStateRef.current) return;
      const updated = { ...localStateRef.current, speed };
      localStateRef.current = updated;
      setSpeed(speed);
    },
    [setSpeed]
  );

  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    localStateRef.current = null;
    resetBattle();
    navigate('/');
  }, [resetBattle, navigate]);

  const handleUnitClick = useCallback(
    (unitId: string) => {
      setSelectedUnit(unitId);
    },
    [setSelectedUnit]
  );

  const handleCloseInfo = useCallback(() => {
    setSelectedUnit(null);
  }, [setSelectedUnit]);

  if (!battleState) return null;

  const selectedUnit: Unit | null = battleState.selectedUnitId
    ? battleState.units.find((u) => u.id === battleState.selectedUnitId) ?? null
    : null;

  const isFinished = battleState.phase === 'finished';

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <BattleMap battleState={battleState} onUnitClick={handleUnitClick} />
        </div>

        <div className="w-72 lg:w-80 flex flex-col gap-2 p-2 border-l border-[#2a2a4a] min-h-0">
          <div className="shrink-0">
            <UnitInfoPanel unit={selectedUnit} allUnits={battleState.units} onClose={handleCloseInfo} />
          </div>
          <div className="flex-1 min-h-0">
            <BattleLog logs={battleState.logs} />
          </div>
        </div>
      </div>

      <BattleControls
        battleState={battleState}
        onTogglePause={handleTogglePause}
        onSetSpeed={handleSetSpeed}
        onReset={handleReset}
      />

      {isFinished && battleState.winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2"
            style={{
              backgroundColor: '#1a1a2eee',
              borderColor: battleState.winner === 'blue' ? '#4ea8de' : '#e94560',
              boxShadow: `0 0 60px ${battleState.winner === 'blue' ? '#4ea8de44' : '#e9456044'}`,
            }}
          >
            <div
              className="text-4xl font-black tracking-widest animate-pulse"
              style={{ color: battleState.winner === 'blue' ? '#4ea8de' : '#e94560' }}
            >
              {battleState.winner === 'blue' ? '蓝方' : '红方'}胜利
            </div>
            <div className="text-gray-400 text-sm">第 {battleState.turn} 回合结束</div>
            <button
              onClick={handleReset}
              className="px-8 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105"
              style={{ backgroundColor: '#f0c040', color: '#1a1a2e' }}
            >
              返回配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
