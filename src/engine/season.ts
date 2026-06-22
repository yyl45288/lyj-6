import { Season } from '../types';

const SEASONS_STORAGE_KEY = 'game_seasons';

export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSeasonId(date: Date = new Date()): string {
  return `season_${getDateString(date)}`;
}

export function getSeasonStartOfDay(date: Date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getSeasonEndOfDay(date: Date = new Date()): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function loadAllSeasons(): Season[] {
  try {
    const raw = localStorage.getItem(SEASONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllSeasons(seasons: Season[]): void {
  try {
    localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(seasons));
  } catch (e) {
    console.error('Failed to save seasons:', e);
  }
}

export function getOrCreateCurrentSeason(): Season {
  const seasons = loadAllSeasons();
  const seasonId = getSeasonId();
  const dateStr = getDateString();

  let season = seasons.find(s => s.id === seasonId);

  if (!season) {
    season = {
      id: seasonId,
      date: dateStr,
      startTime: getSeasonStartOfDay(),
      endTime: getSeasonEndOfDay(),
    };
    seasons.push(season);
    saveAllSeasons(seasons);
  }

  return season;
}

export function getCurrentSeason(): Season | null {
  const seasons = loadAllSeasons();
  const seasonId = getSeasonId();
  return seasons.find(s => s.id === seasonId) || null;
}

export function getSeasonByDate(date: Date): Season | null {
  const seasons = loadAllSeasons();
  const seasonId = getSeasonId(date);
  return seasons.find(s => s.id === seasonId) || null;
}

export function getRecentSeasons(limit: number = 7): Season[] {
  const seasons = loadAllSeasons();
  seasons.sort((a, b) => b.startTime - a.startTime);
  return seasons.slice(0, limit);
}

export function getLast7DaysSeasons(): Season[] {
  const result: Season[] = [];
  const today = new Date();
  const savedSeasons = loadAllSeasons();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = getDateString(date);
    const seasonId = getSeasonId(date);

    let season = savedSeasons.find(s => s.id === seasonId);
    if (!season) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const startTime = d.getTime();
      d.setHours(23, 59, 59, 999);
      season = {
        id: seasonId,
        date: dateStr,
        startTime,
        endTime: d.getTime(),
      };
    }
    result.push(season);
  }

  return result;
}

export function isCurrentSeason(season: Season): boolean {
  const currentId = getSeasonId();
  return season.id === currentId;
}

export function isTodayInSeason(season: Season): boolean {
  const now = Date.now();
  return now >= season.startTime && now <= season.endTime;
}
