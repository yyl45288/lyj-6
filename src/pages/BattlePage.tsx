import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { BattleState, Unit } from '@/types';
import { executeTurn } from '@/engine/battle';
import BattleMap from '@/components/BattleMap';
import BattleLog from '@/components/BattleLog';
import BattleControls from '@/components/BattleControls';
import UnitInfoPanel from '@/components/UnitInfoPanel';
import SynergyDisplay from '@/components/SynergyDisplay';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function BattlePage() {
  const navigate = useNavigate();
  const battleState = useGameStore((s) => s.battleState);
  const replayState = useGameStore((s) => s.replayState);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setSelectedUnit = useGameStore((s) => s.setSelectedUnit);
  const togglePause = useGameStore((s) => s.togglePause);
  const resetBattle = useGameStore((s) => s.resetBattle);
  const recordBattleSnapshot = useGameStore((s) => s.recordBattleSnapshot);
  const finishBattleRecording = useGameStore((s) => s.finishBattleRecording);
  const stopReplay = useGameStore((s) => s.stopReplay);
  const startReplay = useGameStore((s) => s.startReplay);
  const lastSavedRecordingId = useGameStore((s) => s.lastSavedRecordingId);
  const replayNext = useGameStore((s) => s.replayNext);
  const setReplayPlaying = useGameStore((s) => s.setReplayPlaying);
  const setReplaySpeed = useGameStore((s) => s.setReplaySpeed);
  const battleReplay = useGameStore((s) => s.battleReplay);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStateRef = useRef<BattleState | null>(null);
  const finishedRecordingIdRef = useRef<string | null>(null);

  const advanceTurn = useCallback(() => {
    if (!localStateRef.current) return;
    const state = localStateRef.current;
    if (state.phase === 'finished' || state.phase === 'paused') return;

    const cloned = deepClone(state);
    executeTurn(cloned);

    localStateRef.current = cloned;

    recordBattleSnapshot(cloned);

    useGameStore.setState({ battleState: cloned });

    if (cloned.phase === 'finished') {
      const recordingId = finishBattleRecording(cloned);
      finishedRecordingIdRef.current = recordingId;
    }
  }, [recordBattleSnapshot, finishBattleRecording]);

  const advanceReplay = useCallback(() => {
    if (!battleReplay) return;
    if (battleReplay.isAtEnd()) {
      setReplayPlaying(false);
      return;
    }
    replayNext();
  }, [battleReplay, replayNext, setReplayPlaying]);

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

    if (replayState.isReplayMode) {
      if (replayState.isPlaying) {
        const ms = Math.max(100, 1000 / replayState.playSpeed);
        intervalRef.current = setInterval(advanceReplay, ms);
      }
    } else {
      const state = localStateRef.current;
      if (state.phase === 'running') {
        const ms = Math.max(100, 1000 / state.speed);
        intervalRef.current = setInterval(advanceTurn, ms);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    battleState?.phase,
    battleState?.speed,
    replayState.isReplayMode,
    replayState.isPlaying,
    replayState.playSpeed,
    advanceTurn,
    advanceReplay,
  ]);

  const handleTogglePause = useCallback(() => {
    if (replayState.isReplayMode) {
      setReplayPlaying(!replayState.isPlaying);
      return;
    }

    if (!localStateRef.current) return;
    const state = localStateRef.current;
    if (state.phase === 'finished') return;

    const newPhase: BattleState['phase'] = state.phase === 'running' ? 'paused' : 'running';
    const updated = { ...state, phase: newPhase };
    localStateRef.current = updated;

    togglePause();
  }, [replayState.isReplayMode, replayState.isPlaying, setReplayPlaying, togglePause]);

  const handleSetSpeed = useCallback(
    (speed: 1 | 2 | 4) => {
      if (replayState.isReplayMode) {
        setReplaySpeed(speed);
        return;
      }

      if (!localStateRef.current) return;
      const updated = { ...localStateRef.current, speed };
      localStateRef.current = updated;
      setSpeed(speed);
    },
    [replayState.isReplayMode, setReplaySpeed, setSpeed]
  );

  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    localStateRef.current = null;
    finishedRecordingIdRef.current = null;

    if (replayState.isReplayMode) {
      stopReplay();
    } else {
      resetBattle();
    }
    navigate('/');
  }, [replayState.isReplayMode, stopReplay, resetBattle, navigate]);

  const handleViewReplay = useCallback(() => {
    const recordingId = finishedRecordingIdRef.current || lastSavedRecordingId;
    if (!recordingId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    localStateRef.current = null;

    const success = startReplay(recordingId);
    if (success) {
      setReplayPlaying(false);
    }
  }, [lastSavedRecordingId, startReplay, setReplayPlaying]);

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
  const effectiveSpeed = replayState.isReplayMode ? replayState.playSpeed : battleState.speed;
  const effectiveIsRunning = replayState.isReplayMode ? replayState.isPlaying : battleState.phase === 'running';

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      {replayState.isReplayMode && (
        <div className="bg-[#f0c040]/20 border-b border-[#f0c040]/50 px-4 py-2 text-center text-sm">
          <span className="font-bold text-[#f0c040]">回放模式</span>
          <span className="text-gray-400 ml-2">
            快照 {replayState.currentSnapshotIndex + 1} / {battleReplay?.getTotalSnapshots() ?? 0}
          </span>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <BattleMap battleState={battleState} onUnitClick={handleUnitClick} />
        </div>

        <div className="w-72 lg:w-80 flex flex-col gap-2 p-2 border-l border-[#2a2a4a] min-h-0">
          <div className="shrink-0">
            <SynergyDisplay blueSynergies={battleState.blueSynergies} redSynergies={battleState.redSynergies} />
          </div>
          <div className="shrink-0">
            <UnitInfoPanel unit={selectedUnit} allUnits={battleState.units} onClose={handleCloseInfo} />
          </div>
          <div className="flex-1 min-h-0">
            <BattleLog logs={battleState.logs} />
          </div>
        </div>
      </div>

      <BattleControls
        battleState={{ ...battleState, speed: effectiveSpeed, phase: effectiveIsRunning ? 'running' : isFinished ? 'finished' : 'paused' }}
        onTogglePause={handleTogglePause}
        onSetSpeed={handleSetSpeed}
        onReset={handleReset}
      />

      {isFinished && battleState.winner && !replayState.isReplayMode && (
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
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleViewReplay}
                className="px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105 border"
                style={{
                  backgroundColor: '#2a2a4a',
                  color: '#f0c040',
                  borderColor: '#f0c040',
                }}
              >
                查看回放
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105"
                style={{ backgroundColor: '#f0c040', color: '#1a1a2e' }}
              >
                返回配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
