import { Player, PlayerLoginResult } from '../types';

const PLAYERS_STORAGE_KEY = 'game_players';
const CURRENT_PLAYER_KEY = 'current_player';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + password.length;
}

function generatePlayerId(): string {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

function loadAllPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllPlayers(players: Player[]): void {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    console.error('Failed to save players:', e);
  }
}

export function registerPlayer(username: string, password: string): PlayerLoginResult {
  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 2) {
    return { success: false, error: '用户名至少需要2个字符' };
  }

  if (trimmedUsername.length > 20) {
    return { success: false, error: '用户名不能超过20个字符' };
  }

  if (password.length < 4) {
    return { success: false, error: '密码至少需要4个字符' };
  }

  const players = loadAllPlayers();

  if (players.some(p => p.username.toLowerCase() === trimmedUsername.toLowerCase())) {
    return { success: false, error: '用户名已存在' };
  }

  const newPlayer: Player = {
    id: generatePlayerId(),
    username: trimmedUsername,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  players.push(newPlayer);
  saveAllPlayers(players);
  saveCurrentPlayer(newPlayer);

  return { success: true, player: newPlayer };
}

export function loginPlayer(username: string, password: string): PlayerLoginResult {
  const trimmedUsername = username.trim();
  const players = loadAllPlayers();

  const player = players.find(p => p.username.toLowerCase() === trimmedUsername.toLowerCase());

  if (!player) {
    return { success: false, error: '用户不存在' };
  }

  if (player.passwordHash !== hashPassword(password)) {
    return { success: false, error: '密码错误' };
  }

  player.lastLoginAt = Date.now();
  saveAllPlayers(players);
  saveCurrentPlayer(player);

  return { success: true, player };
}

export function logoutPlayer(): void {
  localStorage.removeItem(CURRENT_PLAYER_KEY);
}

export function getCurrentPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(CURRENT_PLAYER_KEY);
    if (!raw) return null;
    const player = JSON.parse(raw) as Player;
    const players = loadAllPlayers();
    const existing = players.find(p => p.id === player.id);
    return existing || null;
  } catch {
    return null;
  }
}

function saveCurrentPlayer(player: Player): void {
  try {
    localStorage.setItem(CURRENT_PLAYER_KEY, JSON.stringify(player));
  } catch (e) {
    console.error('Failed to save current player:', e);
  }
}

export function getPlayerById(playerId: string): Player | null {
  const players = loadAllPlayers();
  return players.find(p => p.id === playerId) || null;
}

export function getPlayerByUsername(username: string): Player | null {
  const players = loadAllPlayers();
  return players.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
}

export function getAllPlayers(): Player[] {
  return loadAllPlayers();
}

export function updatePlayer(player: Player): boolean {
  const players = loadAllPlayers();
  const index = players.findIndex(p => p.id === player.id);
  if (index === -1) return false;
  players[index] = player;
  saveAllPlayers(players);
  saveCurrentPlayer(player);
  return true;
}
