const fs = require('fs');
const path = require('path');

class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}
global.localStorage = new LocalStorageMock();

function getDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function getSeasonId(date = new Date()) { return `season_${getDateString(date)}`; }

const SEASONS_KEY = 'game_seasons';
const PLAYERS_KEY = 'game_players';
const MATCHES_KEY = 'match_records';

function loadJSON(k, def) {
  try { const raw = localStorage.getItem(k); if (!raw) return def; const p = JSON.parse(raw); return Array.isArray(p) ? p : def; }
  catch { return def; }
}
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function hashPassword(p) {
  let h = 0; for (let i = 0; i < p.length; i++) { const c = p.charCodeAt(i); h = ((h << 5) - h) + c; h = h & h; }
  return 'hash_' + Math.abs(h).toString(16) + '_' + p.length;
}

function getOrCreateCurrentSeason() {
  const seasons = loadJSON(SEASONS_KEY, []);
  const sid = getSeasonId(); const ds = getDateString();
  let s = seasons.find(x => x.id === sid);
  if (!s) {
    const d = new Date(); d.setHours(0, 0, 0, 0); const st = d.getTime();
    d.setHours(23, 59, 59, 999);
    s = { id: sid, date: ds, startTime: st, endTime: d.getTime() };
    seasons.push(s); saveJSON(SEASONS_KEY, seasons);
  }
  return s;
}

function getLast7DaysSeasons() {
  const result = []; const today = new Date();
  const saved = loadJSON(SEASONS_KEY, []);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = getDateString(d); const sid = getSeasonId(d);
    let s = saved.find(x => x.id === sid);
    if (!s) {
      const dd = new Date(d); dd.setHours(0, 0, 0, 0); const st = dd.getTime();
      dd.setHours(23, 59, 59, 999);
      s = { id: sid, date: ds, startTime: st, endTime: dd.getTime() };
    }
    result.push(s);
  }
  return result;
}

function registerPlayer(un, pw) {
  const players = loadJSON(PLAYERS_KEY, []);
  const p = { id: 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), username: un.trim(), passwordHash: hashPassword(pw), createdAt: Date.now(), lastLoginAt: Date.now() };
  players.push(p); saveJSON(PLAYERS_KEY, players); return p;
}

function createMatch(playerId, seasonId, win, remaining, oppRemaining, turns, endTime) {
  return {
    id: 'match_' + endTime + '_' + Math.random().toString(36).slice(2, 6),
    seasonId, playerId, playerTeam: 'blue', opponentPlayerId: null, opponentName: 'AI',
    blueFormation: [], redFormation: [],
    winner: win ? 'blue' : 'red', playerWin: win,
    remainingPlayerUnits: remaining, remainingOpponentUnits: oppRemaining,
    totalTurns: turns, startTime: endTime - 60000, endTime,
    status: 'completed', battleRecordingId: null,
  };
}

function getCompletedMatchesByPlayerAndSeason(pid, sid) {
  return loadJSON(MATCHES_KEY, []).filter(r => r.playerId === pid && r.seasonId === sid && r.status === 'completed')
    .sort((a, b) => b.endTime - a.endTime);
}

function getPlayerWinStreak(pid, sid) {
  const matchesDesc = getCompletedMatchesByPlayerAndSeason(pid, sid);

  let current = 0;
  for (let i = 0; i < matchesDesc.length; i++) {
    if (matchesDesc[i].playerWin === true) current++;
    else break;
  }

  const matchesAsc = [...matchesDesc].reverse();
  let max = 0; let temp = 0;
  for (let i = 0; i < matchesAsc.length; i++) {
    if (matchesAsc[i].playerWin === true) { temp++; max = Math.max(max, temp); }
    else temp = 0;
  }

  return { current, max };
}

console.log('='.repeat(60));
console.log('📋 综合功能测试 - 最高连胜/排行榜筛选/近7日赛季');
console.log('='.repeat(60));

let pass = 0, fail = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log(`✅ PASS: ${name}`); pass++; }
  else { console.log(`❌ FAIL: ${name}${detail ? ' - ' + detail : ''}`); fail++; }
}

// =============== 测试1: 最高连胜按时间正序统计 ===============
console.log('\n--- 测试1: 最高连胜按时间正序统计 ---');
localStorage.clear();
getOrCreateCurrentSeason();
const p1 = registerPlayer('player1', 'pass1234');
const sid = getSeasonId();
const now = Date.now();

// 按时间顺序(从早到晚): 胜(+2)、胜(+2→3连续)、负、胜、胜(+2连续)、胜(+2→3连续)、负
// 期望: maxStreak=3 (中间那3场), currentStreak=0 (最后一场是负)
const matchesT1 = [
  createMatch(p1.id, sid, true, 3, 0, 8, now - 700000),   // 最早 胜
  createMatch(p1.id, sid, true, 2, 0, 10, now - 600000),  // 胜 (连2)
  createMatch(p1.id, sid, true, 1, 0, 12, now - 500000),  // 胜 (连3) → 峰值3
  createMatch(p1.id, sid, false, 0, 2, 9, now - 400000),  // 负
  createMatch(p1.id, sid, true, 4, 0, 7, now - 300000),   // 胜
  createMatch(p1.id, sid, true, 3, 0, 8, now - 200000),   // 胜 (连2)
  createMatch(p1.id, sid, false, 1, 3, 11, now - 100000), // 最新 负
];
saveJSON(MATCHES_KEY, matchesT1);

const streak1 = getPlayerWinStreak(p1.id, sid);
test('当前连胜=0 (最新一场是负)', streak1.current === 0, `实际=${streak1.current}`);
test('最高连胜=3 (时间正序中间3连胜)', streak1.max === 3, `实际=${streak1.max}`);

// 另一个用例: 最新是胜
localStorage.clear(); getOrCreateCurrentSeason();
const p2 = registerPlayer('player2', 'pass1234');
const now2 = Date.now();
const matchesT2 = [
  createMatch(p2.id, sid, false, 0, 2, 10, now2 - 500000), // 最早 负
  createMatch(p2.id, sid, true, 3, 0, 8, now2 - 400000),  // 胜
  createMatch(p2.id, sid, true, 2, 0, 9, now2 - 300000),  // 胜 (连2)
  createMatch(p2.id, sid, true, 4, 0, 7, now2 - 200000),  // 胜 (连3)
  createMatch(p2.id, sid, true, 3, 0, 6, now2 - 100000),  // 最新 胜 (连4)
];
saveJSON(MATCHES_KEY, matchesT2);
const streak2 = getPlayerWinStreak(p2.id, sid);
test('当前连胜=4 (最新4场连胜)', streak2.current === 4, `实际=${streak2.current}`);
test('最高连胜=4 (最后4场连续)', streak2.max === 4, `实际=${streak2.max}`);

// 用例: 全胜
localStorage.clear(); getOrCreateCurrentSeason();
const p3 = registerPlayer('player3', 'pass1234');
const now3 = Date.now();
const matchesT3 = [];
for (let i = 0; i < 5; i++) matchesT3.push(createMatch(p3.id, sid, true, 4 - i, 0, 6 + i, now3 - (5 - i) * 100000));
saveJSON(MATCHES_KEY, matchesT3);
const streak3 = getPlayerWinStreak(p3.id, sid);
test('全胜5场 - 当前连胜=5', streak3.current === 5, `实际=${streak3.current}`);
test('全胜5场 - 最高连胜=5', streak3.max === 5, `实际=${streak3.max}`);

// 用例: 全负
localStorage.clear(); getOrCreateCurrentSeason();
const p4 = registerPlayer('player4', 'pass1234');
const now4 = Date.now();
const matchesT4 = [];
for (let i = 0; i < 3; i++) matchesT4.push(createMatch(p4.id, sid, false, 0, 3 - i, 8 + i, now4 - (3 - i) * 100000));
saveJSON(MATCHES_KEY, matchesT4);
const streak4 = getPlayerWinStreak(p4.id, sid);
test('全负3场 - 当前连胜=0', streak4.current === 0, `实际=${streak4.current}`);
test('全负3场 - 最高连胜=0', streak4.max === 0, `实际=${streak4.max}`);

// 用例: 胜负交替
localStorage.clear(); getOrCreateCurrentSeason();
const p5 = registerPlayer('player5', 'pass1234');
const now5 = Date.now();
const matchesT5 = [
  createMatch(p5.id, sid, true, 3, 0, 8, now5 - 500000),  // 最早 胜
  createMatch(p5.id, sid, false, 0, 2, 9, now5 - 400000), // 负
  createMatch(p5.id, sid, true, 2, 0, 7, now5 - 300000),  // 胜
  createMatch(p5.id, sid, false, 1, 3, 10, now5 - 200000),// 负
  createMatch(p5.id, sid, true, 4, 0, 6, now5 - 100000),  // 最新 胜
];
saveJSON(MATCHES_KEY, matchesT5);
const streak5 = getPlayerWinStreak(p5.id, sid);
test('胜负交替最新胜 - 当前连胜=1', streak5.current === 1, `实际=${streak5.current}`);
test('胜负交替 - 最高连胜=1', streak5.max === 1, `实际=${streak5.max}`);

// =============== 测试2: 排行榜只显示有对局玩家 ===============
console.log('\n--- 测试2: 排行榜只显示有对局玩家 ---');
localStorage.clear(); getOrCreateCurrentSeason();
const pa = registerPlayer('hasMatchA', 'pass1234');
const pb = registerPlayer('hasMatchB', 'pass1234');
const pc = registerPlayer('noMatch', 'pass1234'); // 无对局
const now6 = Date.now();
const matchesT6 = [
  createMatch(pa.id, sid, true, 3, 0, 8, now6 - 200000),
  createMatch(pa.id, sid, true, 2, 0, 7, now6 - 100000),
  createMatch(pb.id, sid, false, 0, 2, 9, now6 - 150000),
];
saveJSON(MATCHES_KEY, matchesT6);

function getSeasonPlayerStatsOnlyWithMatches(seasId) {
  const allMatches = loadJSON(MATCHES_KEY, []).filter(m => m.seasonId === seasId && m.status === 'completed');
  const pids = new Set(allMatches.map(m => m.playerId));
  const players = loadJSON(PLAYERS_KEY, []);
  const stats = [];
  pids.forEach(pid => {
    const player = players.find(p => p.id === pid);
    if (!player) return;
    const pMatches = allMatches.filter(m => m.playerId === pid);
    if (pMatches.length === 0) return;
    const wins = pMatches.filter(m => m.playerWin).length;
    const losses = pMatches.length - wins;
    const wr = pMatches.length > 0 ? wins / pMatches.length : 0;
    const sk = getPlayerWinStreak(pid, seasId);
    const tu = pMatches.reduce((s, m) => s + m.remainingPlayerUnits, 0);
    stats.push({
      playerId: pid, username: player.username, seasonId: seasId,
      wins, losses, totalMatches: pMatches.length, winRate: wr,
      currentWinStreak: sk.current, maxWinStreak: sk.max,
      totalRemainingUnits: tu, averageRemainingUnits: tu / pMatches.length,
      rank: -1,
    });
  });
  return stats;
}

const statsList = getSeasonPlayerStatsOnlyWithMatches(sid);
const usernames = statsList.map(s => s.username).sort();
test('有对局玩家=2人', statsList.length === 2, `实际=${statsList.length}, 玩家=${JSON.stringify(usernames)}`);
test('包含hasMatchA', usernames.includes('hasMatchA'));
test('包含hasMatchB', usernames.includes('hasMatchB'));
test('不包含noMatch玩家', !usernames.includes('noMatch'));

// =============== 测试3: 近7日赛季查看入口 ===============
console.log('\n--- 测试3: 近7日赛季列表 ---');
localStorage.clear();
const last7 = getLast7DaysSeasons();
test('近7日赛季返回7项', last7.length === 7, `实际=${last7.length}`);
const today = getDateString();
test('第一项是今天', last7[0].date === today, `实际=${last7[0].date}`);
const allIds = last7.map(s => s.id);
const allDates = last7.map(s => s.date);
const uniqueIds = new Set(allIds);
test('7个赛季ID不重复', uniqueIds.size === 7, `唯一数=${uniqueIds.size}`);
const allValidDates = allDates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
test('所有日期格式正确 YYYY-MM-DD', allValidDates, `日期=${JSON.stringify(allDates)}`);
// 验证日期顺序
for (let i = 0; i < last7.length - 1; i++) {
  const d1 = new Date(last7[i].date);
  const d2 = new Date(last7[i + 1].date);
  const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
  test(`第${i}天比第${i + 1}天晚1天 (${last7[i].date} vs ${last7[i + 1].date})`, diff === 1);
}

console.log('\n' + '='.repeat(60));
console.log(`📊 最终结果: ${pass} 通过 / ${fail} 失败 / 共${pass + fail}项`);
console.log('='.repeat(60));
process.exit(fail > 0 ? 1 : 0);
