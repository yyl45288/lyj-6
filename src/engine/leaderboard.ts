import { PlayerSeasonStats, LeaderboardSortType, Leaderboard } from '../types';
import { getMatchRecordsBySeason, getPlayerWinStreak } from './matchRecord';
import { getPlayerById, getAllPlayers } from './account';
import { getOrCreateCurrentSeason } from './season';

const MIN_MATCHES_FOR_RANKING = 3;

export function calculatePlayerSeasonStats(
  playerId: string,
  seasonId: string,
): PlayerSeasonStats | null {
  const player = getPlayerById(playerId);
  if (!player) return null;

  const matches = getMatchRecordsBySeason(seasonId).filter(m => m.playerId === playerId);

  if (matches.length === 0) {
    return {
      playerId,
      username: player.username,
      seasonId,
      wins: 0,
      losses: 0,
      totalMatches: 0,
      winRate: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      totalRemainingUnits: 0,
      averageRemainingUnits: 0,
      rank: -1,
    };
  }

  const wins = matches.filter(m => m.playerWin === true).length;
  const losses = matches.filter(m => m.playerWin === false).length;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? wins / totalMatches : 0;

  const { current: currentWinStreak, max: maxWinStreak } = getPlayerWinStreak(playerId, seasonId);

  const totalRemainingUnits = matches.reduce((sum, m) => sum + m.remainingPlayerUnits, 0);
  const averageRemainingUnits = totalMatches > 0 ? totalRemainingUnits / totalMatches : 0;

  return {
    playerId,
    username: player.username,
    seasonId,
    wins,
    losses,
    totalMatches,
    winRate,
    currentWinStreak,
    maxWinStreak,
    totalRemainingUnits,
    averageRemainingUnits,
    rank: -1,
  };
}

export function getSeasonPlayerStats(seasonId: string): PlayerSeasonStats[] {
  const allPlayers = getAllPlayers();
  const allMatches = getMatchRecordsBySeason(seasonId);

  const playerIdsWithMatches = new Set(allMatches.map(m => m.playerId));

  const stats: PlayerSeasonStats[] = [];

  playerIdsWithMatches.forEach(playerId => {
    const playerStats = calculatePlayerSeasonStats(playerId, seasonId);
    if (playerStats) {
      stats.push(playerStats);
    }
  });

  allPlayers.forEach(player => {
    if (!playerIdsWithMatches.has(player.id)) {
      const playerStats = calculatePlayerSeasonStats(player.id, seasonId);
      if (playerStats) {
        stats.push(playerStats);
      }
    }
  });

  return stats;
}

function sortStats(stats: PlayerSeasonStats[], sortType: LeaderboardSortType): PlayerSeasonStats[] {
  const sorted = [...stats];

  switch (sortType) {
    case 'winRate':
      sorted.sort((a, b) => {
        if (a.totalMatches < MIN_MATCHES_FOR_RANKING && b.totalMatches >= MIN_MATCHES_FOR_RANKING) return 1;
        if (b.totalMatches < MIN_MATCHES_FOR_RANKING && a.totalMatches >= MIN_MATCHES_FOR_RANKING) return -1;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalMatches - a.totalMatches;
      });
      break;
    case 'wins':
      sorted.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalMatches - a.totalMatches;
      });
      break;
    case 'winStreak':
      sorted.sort((a, b) => {
        if (b.currentWinStreak !== a.currentWinStreak) return b.currentWinStreak - a.currentWinStreak;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.wins - a.wins;
      });
      break;
    case 'maxWinStreak':
      sorted.sort((a, b) => {
        if (b.maxWinStreak !== a.maxWinStreak) return b.maxWinStreak - a.maxWinStreak;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.wins - a.wins;
      });
      break;
  }

  return sorted.map((stat, index) => ({
    ...stat,
    rank: stat.totalMatches >= MIN_MATCHES_FOR_RANKING ? index + 1 : -1,
  }));
}

export function getLeaderboard(
  seasonId: string,
  sortType: LeaderboardSortType = 'winRate',
): Leaderboard {
  const stats = getSeasonPlayerStats(seasonId);
  const sorted = sortStats(stats, sortType);

  return {
    seasonId,
    sortType,
    entries: sorted,
    lastUpdated: Date.now(),
  };
}

export function getCurrentSeasonLeaderboard(
  sortType: LeaderboardSortType = 'winRate',
): Leaderboard {
  const season = getOrCreateCurrentSeason();
  return getLeaderboard(season.id, sortType);
}

export function getPlayerRank(
  playerId: string,
  seasonId: string,
  sortType: LeaderboardSortType = 'winRate',
): number {
  const leaderboard = getLeaderboard(seasonId, sortType);
  const entry = leaderboard.entries.find(e => e.playerId === playerId);
  return entry?.rank ?? -1;
}

export function getPlayerSeasonStatsEntry(
  playerId: string,
  seasonId: string,
): PlayerSeasonStats | null {
  const stats = getSeasonPlayerStats(seasonId);
  const entry = stats.find(e => e.playerId === playerId);
  if (!entry) return null;

  const winRateSorted = sortStats(stats, 'winRate');
  const rankIndex = winRateSorted.findIndex(e => e.playerId === playerId);

  return {
    ...entry,
    rank: entry.totalMatches >= MIN_MATCHES_FOR_RANKING ? rankIndex + 1 : -1,
  };
}

export function formatWinRate(winRate: number): string {
  return `${(winRate * 100).toFixed(1)}%`;
}

export const MIN_MATCHES_REQUIRED = MIN_MATCHES_FOR_RANKING;
