import { MatchRecord, Team, CharacterId, BattleState } from '../types';
import { getOrCreateCurrentSeason, getSeasonId } from './season';
import { getCurrentPlayer } from './account';

const MATCH_RECORDS_KEY = 'match_records';
const ACTIVE_MATCH_KEY = 'active_match_id';

function generateMatchId(): string {
  return 'match_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

function loadAllMatchRecords(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(MATCH_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllMatchRecords(records: MatchRecord[]): void {
  try {
    localStorage.setItem(MATCH_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save match records:', e);
  }
}

function setActiveMatchId(matchId: string | null): void {
  if (matchId === null) {
    localStorage.removeItem(ACTIVE_MATCH_KEY);
  } else {
    localStorage.setItem(ACTIVE_MATCH_KEY, matchId);
  }
}

function getActiveMatchId(): string | null {
  return localStorage.getItem(ACTIVE_MATCH_KEY);
}

export function createPendingMatch(
  playerTeam: Team,
  blueFormation: CharacterId[],
  redFormation: CharacterId[],
  opponentName: string = 'AI对手',
  opponentPlayerId: string | null = null,
): MatchRecord | null {
  const player = getCurrentPlayer();
  if (!player) return null;

  const season = getOrCreateCurrentSeason();

  const match: MatchRecord = {
    id: generateMatchId(),
    seasonId: season.id,
    playerId: player.id,
    playerTeam,
    opponentPlayerId,
    opponentName,
    blueFormation: [...blueFormation],
    redFormation: [...redFormation],
    winner: null,
    playerWin: null,
    remainingPlayerUnits: 0,
    remainingOpponentUnits: 0,
    totalTurns: 0,
    startTime: Date.now(),
    endTime: 0,
    status: 'pending',
    battleRecordingId: null,
  };

  const records = loadAllMatchRecords();
  records.push(match);
  saveAllMatchRecords(records);
  setActiveMatchId(match.id);

  return match;
}

export function getActiveMatch(): MatchRecord | null {
  const activeId = getActiveMatchId();
  if (!activeId) return null;

  const records = loadAllMatchRecords();
  return records.find(r => r.id === activeId && r.status === 'pending') || null;
}

export function completeMatch(
  matchId: string,
  battleState: BattleState,
  battleRecordingId: string | null,
): MatchRecord | null {
  const records = loadAllMatchRecords();
  const index = records.findIndex(r => r.id === matchId);

  if (index === -1) return null;

  const match = records[index];
  if (match.status !== 'pending') return null;

  const winner = battleState.winner;
  const playerUnits = battleState.units.filter(
    u => u.team === match.playerTeam && u.isAlive
  );
  const opponentUnits = battleState.units.filter(
    u => u.team !== match.playerTeam && u.isAlive
  );

  const updatedMatch: MatchRecord = {
    ...match,
    winner,
    playerWin: winner === match.playerTeam,
    remainingPlayerUnits: playerUnits.length,
    remainingOpponentUnits: opponentUnits.length,
    totalTurns: battleState.turn,
    endTime: Date.now(),
    status: 'completed',
    battleRecordingId,
  };

  records[index] = updatedMatch;
  saveAllMatchRecords(records);
  setActiveMatchId(null);

  return updatedMatch;
}

export function cancelMatch(matchId: string): boolean {
  const records = loadAllMatchRecords();
  const index = records.findIndex(r => r.id === matchId);

  if (index === -1) return false;

  const match = records[index];
  if (match.status !== 'pending') return false;

  records[index] = {
    ...match,
    endTime: Date.now(),
    status: 'cancelled',
  };

  saveAllMatchRecords(records);

  const activeId = getActiveMatchId();
  if (activeId === matchId) {
    setActiveMatchId(null);
  }

  return true;
}

export function cancelActiveMatch(): boolean {
  const activeMatch = getActiveMatch();
  if (!activeMatch) return false;
  return cancelMatch(activeMatch.id);
}

export function getMatchRecordsByPlayer(playerId: string, seasonId?: string): MatchRecord[] {
  const records = loadAllMatchRecords();
  return records.filter(r => {
    if (r.playerId !== playerId) return false;
    if (seasonId && r.seasonId !== seasonId) return false;
    return r.status === 'completed';
  }).sort((a, b) => b.endTime - a.endTime);
}

export function getMatchRecordsBySeason(seasonId: string): MatchRecord[] {
  const records = loadAllMatchRecords();
  return records.filter(r => r.seasonId === seasonId && r.status === 'completed');
}

export function getCompletedMatchesByPlayerAndSeason(playerId: string, seasonId: string): MatchRecord[] {
  return getMatchRecordsByPlayer(playerId, seasonId);
}

export function getCurrentSeasonPlayerMatches(playerId: string): MatchRecord[] {
  const seasonId = getSeasonId();
  return getCompletedMatchesByPlayerAndSeason(playerId, seasonId);
}

export function getMatchById(matchId: string): MatchRecord | null {
  const records = loadAllMatchRecords();
  return records.find(r => r.id === matchId) || null;
}

export function getPlayerWinStreak(playerId: string, seasonId: string): { current: number; max: number } {
  const matches = getCompletedMatchesByPlayerAndSeason(playerId, seasonId);

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let countingCurrent = true;

  for (let i = 0; i < matches.length; i++) {
    if (matches[i].playerWin === true) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
      if (countingCurrent) {
        currentStreak = tempStreak;
      }
    } else {
      if (countingCurrent) {
        currentStreak = tempStreak;
        countingCurrent = false;
      }
      tempStreak = 0;
    }
  }

  return { current: currentStreak, max: maxStreak };
}

export function deleteAllMatchRecords(): void {
  localStorage.removeItem(MATCH_RECORDS_KEY);
  localStorage.removeItem(ACTIVE_MATCH_KEY);
}
