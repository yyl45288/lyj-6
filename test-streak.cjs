const fs = require('fs');
const path = require('path');

const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, value) => { storage[key] = String(value); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (const k in storage) delete storage[k]; },
};

function getDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSeasonId(date = new Date()) {
  return `season_${getDateString(date)}`;
}

const MATCH_RECORDS_KEY = 'match_records';
const ACTIVE_MATCH_KEY = 'active_match_id';

function loadAllMatchRecords() {
  try {
    const raw = localStorage.getItem(MATCH_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllMatchRecords(records) {
  try {
    localStorage.setItem(MATCH_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save match records:', e);
  }
}

function getMatchRecordsByPlayer(playerId, seasonId) {
  const records = loadAllMatchRecords();
  return records.filter(r => {
    if (r.playerId !== playerId) return false;
    if (seasonId && r.seasonId !== seasonId) return false;
    return r.status === 'completed';
  }).sort((a, b) => b.endTime - a.endTime);
}

function getCompletedMatchesByPlayerAndSeason(playerId, seasonId) {
  return getMatchRecordsByPlayer(playerId, seasonId);
}

function getPlayerWinStreak(playerId, seasonId) {
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

function addMatch(playerId, seasonId, playerWin, endTimeOffset) {
  const records = loadAllMatchRecords();
  const baseTime = Date.now();
  records.push({
    id: 'match_' + Math.random().toString(36).slice(2, 10),
    seasonId,
    playerId,
    playerTeam: 'blue',
    opponentPlayerId: null,
    opponentName: 'AI对手',
    blueFormation: ['zhaoyun'],
    redFormation: ['caocao'],
    winner: playerWin ? 'blue' : 'red',
    playerWin,
    remainingPlayerUnits: playerWin ? 1 : 0,
    remainingOpponentUnits: playerWin ? 0 : 1,
    totalTurns: 10,
    startTime: baseTime - endTimeOffset - 1000,
    endTime: baseTime - endTimeOffset,
    status: 'completed',
    battleRecordingId: null,
  });
  saveAllMatchRecords(records);
}

function testStreak() {
  console.log('=== 连胜计算测试 ===\n');

  localStorage.clear();
  const playerId = 'test_player_001';
  const seasonId = getSeasonId();

  console.log('测试用例: 胜、胜、负 (从早到晚: 负最早, 胜, 胜最新)');
  console.log('期望: 当前连胜=2, 最高连胜=2\n');

  addMatch(playerId, seasonId, false, 3000);
  addMatch(playerId, seasonId, true, 2000);
  addMatch(playerId, seasonId, true, 1000);

  const matches = getCompletedMatchesByPlayerAndSeason(playerId, seasonId);
  console.log('对局顺序 (从新到旧):');
  matches.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.playerWin ? '胜' : '负'} (endTime: ${m.endTime})`);
  });
  console.log('');

  const result = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result.current}`);
  console.log(`最高连胜: ${result.max}`);
  console.log('');

  const test1Pass = result.current === 2 && result.max === 2;
  console.log(`测试1通过: ${test1Pass ? '✅' : '❌'}`);
  console.log('');

  console.log('--- 额外测试用例 ---\n');

  localStorage.clear();

  console.log('测试用例2: 负、胜、胜 (从早到晚: 胜最早, 胜, 负最新)');
  console.log('期望: 当前连胜=0, 最高连胜=2\n');

  addMatch(playerId, seasonId, true, 3000);
  addMatch(playerId, seasonId, true, 2000);
  addMatch(playerId, seasonId, false, 1000);

  const matches2 = getCompletedMatchesByPlayerAndSeason(playerId, seasonId);
  console.log('对局顺序 (从新到旧):');
  matches2.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.playerWin ? '胜' : '负'} (endTime: ${m.endTime})`);
  });
  console.log('');

  const result2 = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result2.current}`);
  console.log(`最高连胜: ${result2.max}`);
  const test2Pass = result2.current === 0 && result2.max === 2;
  console.log(`测试2通过: ${test2Pass ? '✅' : '❌'}`);
  console.log('');

  localStorage.clear();

  console.log('测试用例3: 胜、负、胜 (从早到晚: 胜最早, 负, 胜最新)');
  console.log('期望: 当前连胜=1, 最高连胜=1\n');

  addMatch(playerId, seasonId, true, 3000);
  addMatch(playerId, seasonId, false, 2000);
  addMatch(playerId, seasonId, true, 1000);

  const matches3 = getCompletedMatchesByPlayerAndSeason(playerId, seasonId);
  console.log('对局顺序 (从新到旧):');
  matches3.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.playerWin ? '胜' : '负'} (endTime: ${m.endTime})`);
  });
  console.log('');

  const result3 = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result3.current}`);
  console.log(`最高连胜: ${result3.max}`);
  const test3Pass = result3.current === 1 && result3.max === 1;
  console.log(`测试3通过: ${test3Pass ? '✅' : '❌'}`);
  console.log('');

  localStorage.clear();

  console.log('测试用例4: 全负 (3场都输)');
  console.log('期望: 当前连胜=0, 最高连胜=0\n');

  addMatch(playerId, seasonId, false, 3000);
  addMatch(playerId, seasonId, false, 2000);
  addMatch(playerId, seasonId, false, 1000);

  const result4 = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result4.current}`);
  console.log(`最高连胜: ${result4.max}`);
  const test4Pass = result4.current === 0 && result4.max === 0;
  console.log(`测试4通过: ${test4Pass ? '✅' : '❌'}`);
  console.log('');

  localStorage.clear();

  console.log('测试用例5: 全胜 (5场都赢)');
  console.log('期望: 当前连胜=5, 最高连胜=5\n');

  for (let i = 5; i >= 1; i--) {
    addMatch(playerId, seasonId, true, i * 1000);
  }

  const result5 = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result5.current}`);
  console.log(`最高连胜: ${result5.max}`);
  const test5Pass = result5.current === 5 && result5.max === 5;
  console.log(`测试5通过: ${test5Pass ? '✅' : '❌'}`);
  console.log('');

  localStorage.clear();

  console.log('测试用例6: 空数据 (0场)');
  console.log('期望: 当前连胜=0, 最高连胜=0\n');

  const result6 = getPlayerWinStreak(playerId, seasonId);
  console.log(`当前连胜: ${result6.current}`);
  console.log(`最高连胜: ${result6.max}`);
  const test6Pass = result6.current === 0 && result6.max === 0;
  console.log(`测试6通过: ${test6Pass ? '✅' : '❌'}`);
  console.log('');

  const allPass = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass && test6Pass;
  console.log('====================');
  console.log(`全部测试通过: ${allPass ? '✅' : '❌'}`);

  return allPass;
}

testStreak();
