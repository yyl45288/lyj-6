import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Flame, Star, RefreshCw, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { LeaderboardSortType, PlayerSeasonStats, Season } from '@/types';
import { formatWinRate } from '@/engine/leaderboard';
import { getDateString, getLast7DaysSeasons, getSeasonId } from '@/engine/season';

const sortOptions: { value: LeaderboardSortType; label: string; icon: typeof Trophy }[] = [
  { value: 'winRate', label: '胜率', icon: TrendingUp },
  { value: 'wins', label: '胜场', icon: Star },
  { value: 'winStreak', label: '当前连胜', icon: Flame },
  { value: 'maxWinStreak', label: '最高连胜', icon: Trophy },
];

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}

function formatSeasonDate(dateStr: string): string {
  const today = getDateString();
  if (dateStr === today) return '今天';
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === getDateString(yesterday)) return '昨天';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function PlayerCard({ stats, isCurrentPlayer }: { stats: PlayerSeasonStats; isCurrentPlayer: boolean }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        isCurrentPlayer
          ? 'bg-[#f0c040]/10 border-[#f0c040]/50 shadow-[0_0_20px_rgba(240,192,64,0.15)]'
          : 'bg-[#1a1a2e]/50 border-[#2a2a4a] hover:bg-[#2a2a4a]/50'
      }`}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg ${
          stats.rank === 1
            ? 'bg-yellow-500/20 text-yellow-400'
            : stats.rank === 2
            ? 'bg-gray-400/20 text-gray-300'
            : stats.rank === 3
            ? 'bg-orange-600/20 text-orange-400'
            : 'bg-[#2a2a4a] text-gray-500'
        }`}
      >
        {stats.rank > 0 ? getRankIcon(stats.rank) : '-'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold truncate ${isCurrentPlayer ? 'text-[#f0c040]' : 'text-white'}`}>
            {stats.username}
          </span>
          {isCurrentPlayer && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0c040]/20 text-[#f0c040]">
              我
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span>{stats.wins}胜</span>
          <span>{stats.losses}负</span>
          <span>{stats.totalMatches}场</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-xl font-black text-[#f0c040]">
          {stats.totalMatches > 0 ? formatWinRate(stats.winRate) : '--'}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 justify-end">
          <span className="flex items-center gap-1">
            <Flame size={12} className="text-orange-400" />
            {stats.currentWinStreak}
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={12} className="text-yellow-400" />
            {stats.maxWinStreak}
          </span>
          <span className="flex items-center gap-1">
            <User size={12} className="text-blue-400" />
            {stats.averageRemainingUnits.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [sortType, setSortType] = useState<LeaderboardSortType>('winRate');
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const loadLeaderboard = useGameStore((s) => s.loadLeaderboard);
  const auth = useGameStore((s) => s.auth);
  const checkAuth = useGameStore((s) => s.checkAuth);

  const todaySeasonId = getSeasonId();
  const [selectedSeasonId, setSelectedSeasonId] = useState(todaySeasonId);

  const seasons = useMemo(() => getLast7DaysSeasons(), []);

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
  const isToday = selectedSeasonId === todaySeasonId;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadLeaderboard(sortType, selectedSeasonId);
  }, [loadLeaderboard, sortType, selectedSeasonId]);

  const entries = leaderboard?.entries || [];
  const currentPlayerId = auth.currentPlayer?.id;

  const handleSeasonSelect = (season: Season) => {
    setSelectedSeasonId(season.id);
    setShowSeasonPicker(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-black tracking-wider text-[#f0c040] flex items-center gap-2">
            <Trophy size={24} />
            {isToday ? '今日排行榜' : '历史排行榜'}
          </h1>
          <div className="text-xs text-gray-500">{selectedSeason?.date}</div>
        </div>

        <div className="bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#f0c040]" />
            <span className="text-sm font-medium text-gray-300">选择赛季</span>
            <button
              onClick={() => setShowSeasonPicker(!showSeasonPicker)}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] hover:border-[#3a3a5a] transition-colors"
            >
              <span className="text-sm">
                {selectedSeason ? formatSeasonDate(selectedSeason.date) : '选择日期'}
              </span>
              {showSeasonPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showSeasonPicker && (
            <div className="mt-3 grid grid-cols-7 gap-2">
              {seasons.map((season) => {
                const isSelected = season.id === selectedSeasonId;
                const isTodaySeason = season.id === todaySeasonId;
                return (
                  <button
                    key={season.id}
                    onClick={() => handleSeasonSelect(season)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#f0c040] text-[#1a1a2e]'
                        : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#2a2a4a] hover:border-[#3a3a5a]'
                    }`}
                  >
                    <div>{formatSeasonDate(season.date)}</div>
                    <div className={`text-[9px] mt-0.5 ${isSelected ? 'opacity-70' : 'opacity-50'}`}>
                      {isTodaySeason ? '今日' : season.date.slice(5)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-300">排序方式</span>
            <button
              onClick={() => loadLeaderboard(sortType, selectedSeasonId)}
              className="p-2 rounded-lg hover:bg-[#2a2a4a] text-gray-400 hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSortType(option.value)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    sortType === option.value
                      ? 'bg-[#f0c040] text-[#1a1a2e] shadow-[0_0_20px_rgba(240,192,64,0.3)]'
                      : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#2a2a4a] hover:border-[#3a3a5a]'
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Flame size={12} className="text-orange-400" />
              <span>当前连胜</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy size={12} className="text-yellow-400" />
              <span>最高连胜</span>
            </div>
            <div className="flex items-center gap-1">
              <User size={12} className="text-blue-400" />
              <span>平均剩余单位</span>
            </div>
          </div>

          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Trophy size={48} className="mb-4 opacity-30" />
                <div className="text-lg font-medium">
                  {isToday ? '暂无排行数据' : '该赛季暂无数据'}
                </div>
                <div className="text-sm mt-2">
                  {isToday ? '完成对局后将进入排行榜' : '当日玩家未进行对局'}
                </div>
              </div>
            )}

            {entries.map((entry) => (
              <PlayerCard
                key={entry.playerId}
                stats={entry}
                isCurrentPlayer={entry.playerId === currentPlayerId}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-600">
          排行榜每日重置 · 数据每局结束后更新
        </div>
      </div>
    </div>
  );
}
