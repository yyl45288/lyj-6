import { useRef, useEffect, useCallback } from 'react';
import { BattleState, UnitClass, Unit } from '@/types';
import { getAggroTarget } from '@/engine/aggro';

const CLASS_EMOJI: Record<UnitClass, string> = {
  warrior: '⚔️',
  knight: '🛡️',
  archer: '🏹',
  mage: '🔮',
  assassin: '🗡️',
  priest: '✨',
  warlock: '💀',
};

const CELL = 60;
const COLORS = {
  bg: '#1a1a2e',
  plain: '#2a2a4a',
  wall: '#444466',
  water: '#2244aa',
  grid: '#ffffff0a',
  blue: '#4ea8de',
  red: '#e94560',
  aggro: '#ff8c00',
  selectGlow: '#f0c040',
};

const BUFF_COLORS: Record<string, string> = {
  atkUp: '#ff4444',
  defUp: '#4488ff',
  atkDown: '#aa2222',
  defDown: '#2244aa',
  dot: '#8800aa',
  hot: '#44ff44',
  shield: '#44dddd',
  slow: '#888888',
  taunt: '#ffaa00',
};

interface BattleMapProps {
  battleState: BattleState;
  onUnitClick?: (unitId: string) => void;
}

interface AnimState {
  unitPositions: Record<string, { x: number; y: number }>;
  effects: { unitId: string; color: string; start: number; duration: number }[];
}

export default function BattleMap({ battleState, onUnitClick }: BattleMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<AnimState>({
    unitPositions: {},
    effects: [],
  });
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const prevUnitsRef = useRef<Unit[]>([]);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

  const getHpColor = (pct: number) => {
    if (pct > 0.6) return '#22c55e';
    if (pct > 0.3) return '#eab308';
    return '#ef4444';
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onUnitClick) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gridX = Math.floor(x / CELL);
      const gridY = Math.floor(y / CELL);

      const clicked = battleState.units.find(
        (u) => u.isAlive && u.pos.x === gridX && u.pos.y === gridY
      );
      if (clicked) onUnitClick(clicked.id);
    },
    [battleState.units, onUnitClick]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const map = battleState.map;
    canvas.width = map.width * CELL;
    canvas.height = map.height * CELL;

    const anim = animRef.current;

    for (const unit of battleState.units) {
      if (!anim.unitPositions[unit.id]) {
        anim.unitPositions[unit.id] = { x: unit.pos.x, y: unit.pos.y };
      }
    }

    for (const unit of battleState.units) {
      const prev = prevUnitsRef.current.find((u) => u.id === unit.id);
      if (prev && (prev.pos.x !== unit.pos.x || prev.pos.y !== unit.pos.y)) {
        anim.unitPositions[unit.id] = { x: prev.pos.x, y: prev.pos.y };
      }
    }

    const prevLogCount = prevUnitsRef.current.length > 0 ? battleState.logs.length : 0;
    prevUnitsRef.current = battleState.units.map((u) => ({ ...u, pos: { ...u.pos } }));

    if (battleState.logs.length > prevLogCount) {
      const newLogs = battleState.logs.slice(prevLogCount);
      for (const log of newLogs) {
        let color = '#ff0000';
        if (log.type === 'heal') color = '#44ff44';
        else if (log.type === 'skill') color = '#f0c040';
        else if (log.type === 'move') color = '#888888';
        anim.effects.push({
          unitId: log.unitId,
          color,
          start: performance.now(),
          duration: 400,
        });
      }
    }

    const draw = (time: number) => {
      timeRef.current = time;
      const dt = 0.08;

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.tiles[y][x];
          const px = x * CELL;
          const py = y * CELL;

          if (tile === 'plain') {
            ctx.fillStyle = COLORS.plain;
            ctx.fillRect(px, py, CELL, CELL);
          } else if (tile === 'wall') {
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(px, py, CELL, CELL);
            ctx.strokeStyle = '#555577';
            ctx.lineWidth = 1;
            for (let row = 0; row < 3; row++) {
              const by = py + 4 + row * 18;
              ctx.beginPath();
              ctx.moveTo(px + 2, by);
              ctx.lineTo(px + CELL - 2, by);
              ctx.stroke();
              const offset = row % 2 === 0 ? 0 : CELL / 2;
              ctx.beginPath();
              ctx.moveTo(px + offset + 10, by);
              ctx.lineTo(px + offset + 10, by + 18);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(px + offset + CELL - 10, by);
              ctx.lineTo(px + offset + CELL - 10, by + 18);
              ctx.stroke();
            }
          } else if (tile === 'water') {
            ctx.fillStyle = COLORS.water;
            ctx.fillRect(px, py, CELL, CELL);
            const waveOffset = Math.sin(time / 800 + x * 0.5 + y * 0.3) * 3;
            ctx.strokeStyle = '#3366cc44';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.moveTo(px, py + 12 + i * 16 + waveOffset);
              ctx.quadraticCurveTo(
                px + CELL / 2,
                py + 12 + i * 16 - waveOffset,
                px + CELL,
                py + 12 + i * 16 + waveOffset
              );
              ctx.stroke();
            }
          }
        }
      }

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= map.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= map.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(canvas.width, y * CELL);
        ctx.stroke();
      }

      const aliveUnits = battleState.units.filter((u) => u.isAlive);

      for (const unit of aliveUnits) {
        const target = getAggroTarget(
          unit,
          battleState.units.filter((u) => u.team !== unit.team && u.isAlive)
        );
        if (!target) continue;

        const from = anim.unitPositions[unit.id] ?? { x: unit.pos.x, y: unit.pos.y };
        const to = anim.unitPositions[target.id] ?? { x: target.pos.x, y: target.pos.y };

        ctx.save();
        ctx.strokeStyle = COLORS.aggro + '66';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(from.x * CELL + CELL / 2, from.y * CELL + CELL / 2);
        ctx.lineTo(to.x * CELL + CELL / 2, to.y * CELL + CELL / 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const unit of aliveUnits) {
        const current = anim.unitPositions[unit.id];
        if (current) {
          current.x = lerp(current.x, unit.pos.x, dt);
          current.y = lerp(current.y, unit.pos.y, dt);
        }

        const pos = current ?? { x: unit.pos.x, y: unit.pos.y };
        const cx = pos.x * CELL + CELL / 2;
        const cy = pos.y * CELL + CELL / 2;
        const radius = CELL * 0.35;
        const teamColor = unit.team === 'blue' ? COLORS.blue : COLORS.red;

        const isSelected = battleState.selectedUnitId === unit.id;
        if (isSelected) {
          const pulse = 0.4 + Math.sin(time / 200) * 0.2;
          ctx.save();
          ctx.shadowColor = COLORS.selectGlow;
          ctx.shadowBlur = 15 + Math.sin(time / 200) * 8;
          ctx.globalAlpha = pulse + 0.6;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.selectGlow + '33';
          ctx.fill();
          ctx.restore();
        }

        const activeEffect = anim.effects.find(
          (e) => e.unitId === unit.id && time - e.start < e.duration
        );
        if (activeEffect) {
          const elapsed = time - activeEffect.start;
          const alpha = 1 - elapsed / activeEffect.duration;
          ctx.save();
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = activeEffect.color;
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = teamColor + 'cc';
        ctx.fill();
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.font = `${Math.floor(CELL * 0.35)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CLASS_EMOJI[unit.class], cx, cy);

        const hpPct = unit.hp / unit.maxHp;
        const barW = CELL * 0.7;
        const barH = 4;
        const barX = cx - barW / 2;
        const barY = cy - radius - 8;
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = getHpColor(hpPct);
        ctx.fillRect(barX, barY, barW * hpPct, barH);

        if (unit.buffs.length > 0) {
          const dotSize = 5;
          const startX = cx - (unit.buffs.length * (dotSize + 2)) / 2;
          const dotY = cy + radius + 5;
          unit.buffs.forEach((buff, i) => {
            ctx.beginPath();
            ctx.arc(startX + i * (dotSize + 2) + dotSize / 2, dotY, dotSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = BUFF_COLORS[buff.type] ?? '#888888';
            ctx.fill();
          });
        }
      }

      anim.effects = anim.effects.filter((e) => time - e.start < e.duration);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [battleState]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="rounded-lg border border-[#2a2a4a] cursor-pointer"
      style={{ background: COLORS.bg }}
    />
  );
}
