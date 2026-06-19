import { useEffect, useRef } from 'react';
import { BattleLog as BattleLogEntry, BattleLogType as LogType } from '@/types';

const LOG_COLORS: Record<LogType, string> = {
  attack: '#e94560',
  skill: '#f0c040',
  buff: '#22c55e',
  aggro: '#ff8c00',
  death: '#8b0000',
  heal: '#90ee90',
  move: '#888888',
};

interface BattleLogProps {
  logs: BattleLogEntry[];
}

export default function BattleLog({ logs }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e]/90 rounded-lg border border-[#2a2a4a]">
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-xs font-bold text-[#f0c040] tracking-wider">
        战斗日志
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
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
    </div>
  );
}
