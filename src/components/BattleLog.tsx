import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, Trash2, History, ScrollText } from 'lucide-react';
import { BattleLog as BattleLogEntry, BattleLogType as LogType, BattleRecording } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import { MAX_BATTLE_RECORDINGS } from '@/engine/battleStorage';

const LOG_COLORS: Record<LogType, string> = {
  attack: '#e94560',
  skill: '#f0c040',
  buff: '#22c55e',
  aggro: '#ff8c00',
  death: '#8b0000',
  heal: '#90ee90',
  move: '#888888',
  synergy: '#a855f7',
};

interface BattleLogProps {
  logs: BattleLogEntry[];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function BattleLog({ logs }: BattleLogProps) {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'replay'>('log');

  const savedRecordings = useGameStore((s) => s.savedRecordings);
  const replayState = useGameStore((s) => s.replayState);
  const battleReplay = useGameStore((s) => s.battleReplay);
  const loadRecordings = useGameStore((s) => s.loadRecordings);
  const startReplay = useGameStore((s) => s.startReplay);
  const stopReplay = useGameStore((s) => s.stopReplay);
  const setReplayPlaying = useGameStore((s) => s.setReplayPlaying);
  const setReplaySpeed = useGameStore((s) => s.setReplaySpeed);
  const replayPrevious = useGameStore((s) => s.replayPrevious);
  const replayNext = useGameStore((s) => s.replayNext);
  const replayGoToStart = useGameStore((s) => s.replayGoToStart);
  const replayGoToEnd = useGameStore((s) => s.replayGoToEnd);
  const setReplaySnapshotIndex = useGameStore((s) => s.setReplaySnapshotIndex);
  const deleteRecordingAction = useGameStore((s) => s.deleteRecording);
  const clearAllRecordingsAction = useGameStore((s) => s.clearAllRecordings);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    if (activeTab === 'replay') {
      loadRecordings();
    }
  }, [activeTab, loadRecordings]);

  useEffect(() => {
    if (activeTab === 'log') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, activeTab]);

  const handleStartReplay = (recordingId: string) => {
    const success = startReplay(recordingId);
    if (success) {
      navigate('/battle');
    }
  };

  const handleStopReplay = () => {
    stopReplay();
    navigate('/');
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    setReplaySnapshotIndex(index);
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

  const renderRecordingItem = (recording: BattleRecording) => {
    const duration = Math.round((recording.endTime - recording.startTime) / 1000);
    const isActive = replayState.currentRecordingId === recording.id;

    return (
      <div
        key={recording.id}
        onClick={() => !replayState.isReplayMode && handleStartReplay(recording.id)}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          isActive
            ? 'bg-[#f0c040]/20 border-[#f0c040]'
            : 'bg-[#2a2a4a]/50 border-[#2a2a4a] hover:bg-[#3a3a5a]/50 hover:border-[#3a3a5a]'
        } ${replayState.isReplayMode && !isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{
                backgroundColor: recording.winner === 'blue' ? '#4ea8de33' : '#e9456033',
                color: recording.winner === 'blue' ? '#4ea8de' : '#e94560',
              }}
            >
              {recording.winner === 'blue' ? '蓝方胜' : recording.winner === 'red' ? '红方胜' : '进行中'}
            </span>
            <span className="text-[10px] text-gray-400">
              {recording.totalTurns}回合
            </span>
          </div>
          <button
            onClick={(e) => handleDeleteRecording(e, recording.id)}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="删除记录"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="text-[10px] text-gray-500 mb-1">
          {formatDate(recording.startTime)} · {duration}秒
        </div>
        <div className="flex items-center gap-1 text-[9px] text-gray-500">
          <span className="text-[#4ea8de]">蓝: {recording.blueFormation.length}</span>
          <span>vs</span>
          <span className="text-[#e94560]">红: {recording.redFormation.length}</span>
          <span className="ml-auto">
            {recording.snapshots.length}个快照
          </span>
        </div>
      </div>
    );
  };

  const renderReplayPanel = () => {
    if (!replayState.isReplayMode || !battleReplay) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History size={12} className="text-[#f0c040]" />
              <span className="text-xs font-bold text-[#f0c040]">
                战斗记录 ({savedRecordings.length}/{MAX_BATTLE_RECORDINGS})
              </span>
            </div>
            {savedRecordings.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
              >
                清空全部
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {savedRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                <History size={32} className="mb-2 opacity-30" />
                <div>暂无战斗记录</div>
                <div className="text-[10px] mt-1">完成战斗后将自动保存</div>
              </div>
            ) : (
              savedRecordings.map(renderRecordingItem)
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-[#2a2a4a] text-[9px] text-gray-600 text-center">
            点击记录开始回放 · 最多保存{MAX_BATTLE_RECORDINGS}场
          </div>
        </div>
      );
    }

    const totalSnapshots = battleReplay.getTotalSnapshots();
    const currentIndex = replayState.currentSnapshotIndex;
    const isAtStart = currentIndex <= 0;
    const isAtEnd = currentIndex >= totalSnapshots - 1;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Play size={12} className="text-[#f0c040] animate-pulse" />
            <span className="text-xs font-bold text-[#f0c040]">回放控制</span>
          </div>
          <button
            onClick={handleStopReplay}
            className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            退出回放
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={replayGoToStart}
              disabled={isAtStart}
              className="p-1.5 rounded bg-[#2a2a4a] hover:bg-[#3a3a5a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="回到开始"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={replayPrevious}
              disabled={isAtStart}
              className="p-1.5 rounded bg-[#2a2a4a] hover:bg-[#3a3a5a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="上一帧"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={() => setReplayPlaying(!replayState.isPlaying)}
              className="p-2 rounded bg-[#f0c040] text-[#1a1a2e] hover:bg-[#f0c040]/90 transition-colors flex-1 flex items-center justify-center gap-1"
            >
              {replayState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="text-xs font-bold">
                {replayState.isPlaying ? '暂停' : '播放'}
              </span>
            </button>
            <button
              onClick={replayNext}
              disabled={isAtEnd}
              className="p-1.5 rounded bg-[#2a2a4a] hover:bg-[#3a3a5a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="下一帧"
            >
              <SkipForward size={14} />
            </button>
            <button
              onClick={replayGoToEnd}
              disabled={isAtEnd}
              className="p-1.5 rounded bg-[#2a2a4a] hover:bg-[#3a3a5a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="跳到结尾"
            >
              <ChevronsRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReplaySpeed(s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    replayState.playSpeed === s
                      ? 'bg-[#f0c040] text-[#1a1a2e]'
                      : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex-1 text-[10px] text-gray-400 text-right">
              {battleReplay.getCurrentTurn()} / {battleReplay.getTotalTurns()} 回合
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={Math.max(0, totalSnapshots - 1)}
              value={currentIndex}
              onChange={handleTimelineChange}
              className="w-full h-1.5 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer accent-[#f0c040]"
            />
            <div className="flex justify-between text-[9px] text-gray-500">
              <span>第0帧</span>
              <span>第{currentIndex}帧</span>
              <span>第{Math.max(0, totalSnapshots - 1)}帧</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[#2a2a4a]">
          <div className="text-[10px] text-gray-400 mb-2 font-bold">战斗日志</div>
          <div className="flex-1 overflow-y-auto space-y-1 max-h-48 pr-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] leading-tight">
                <span className="shrink-0 px-1 py-0.5 rounded bg-[#2a2a4a] text-gray-400 text-[8px] font-mono">
                  {log.turn}
                </span>
                <span
                  className="shrink-0 font-bold"
                  style={{ color: log.team === 'blue' ? '#4ea8de' : '#e94560' }}
                >
                  {log.unitName}
                </span>
                <span style={{ color: LOG_COLORS[log.type] }} className={log.type === 'death' ? 'font-bold' : ''}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e]/90 rounded-lg border border-[#2a2a4a]">
      <div className="flex border-b border-[#2a2a4a]">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 px-3 py-2 text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'log'
              ? 'text-[#f0c040] bg-[#2a2a4a]/50 border-b-2 border-[#f0c040]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <ScrollText size={12} />
          战斗日志
        </button>
        <button
          onClick={() => setActiveTab('replay')}
          className={`flex-1 px-3 py-2 text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'replay'
              ? 'text-[#f0c040] bg-[#2a2a4a]/50 border-b-2 border-[#f0c040]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <History size={12} />
          战斗回放
          {savedRecordings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#f0c040]/20 text-[#f0c040] text-[9px]">
              {savedRecordings.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-2 min-h-0">
        {activeTab === 'log' ? (
          <div className="h-full overflow-y-auto space-y-1 pr-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] leading-tight">
                <span className="shrink-0 px-1 py-0.5 rounded bg-[#2a2a4a] text-gray-400 text-[9px] font-mono">
                  {log.turn}
                </span>
                <span
                  className="shrink-0 font-bold"
                  style={{ color: log.team === 'blue' ? '#4ea8de' : '#e94560' }}
                >
                  {log.unitName}
                </span>
                <span style={{ color: LOG_COLORS[log.type] }} className={log.type === 'death' ? 'font-bold' : ''}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        ) : (
          renderReplayPanel()
        )}
      </div>
    </div>
  );
}
