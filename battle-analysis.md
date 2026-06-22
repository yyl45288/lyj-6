# 战斗系统完整调用链分析文档

> 分析范围：从"点击开始战斗"按钮 → 战斗结束后的结算与记录全流程

---

## 目录

1. [系统架构概览](#1-系统架构概览)
2. [完整调用链时序图](#2-完整调用链时序图)
3. [阶段一：布阵与准备 (SetupPage)](#3-阶段一布阵与准备-setuppage)
4. [阶段二：战斗初始化](#4-阶段二战斗初始化)
5. [阶段三：战斗主循环执行](#5-阶段三战斗主循环执行)
6. [阶段四：单位行动详解](#6-阶段四单位行动详解)
7. [阶段五：胜负判定与战斗结束](#7-阶段五胜负判定与战斗结束)
8. [阶段六：战斗记录与排行榜更新](#8-阶段六战斗记录与排行榜更新)
9. [状态流转全景](#9-状态流转全景)
10. [关键模块依赖关系](#10-关键模块依赖关系)
11. [潜在性能瓶颈分析](#11-潜在性能瓶颈分析)
12. [文件索引](#12-文件索引)

---

## 1. 系统架构概览

### 1.1 分层架构

```
┌─────────────────────────────────────────────────────┐
│                    表现层 (UI Layer)                  │
│  SetupPage / BattlePage / BattleMap / BattleControls │
├─────────────────────────────────────────────────────┤
│                 状态管理层 (Store Layer)               │
│                  useGameStore (Zustand)               │
├─────────────────────────────────────────────────────┤
│                  业务引擎层 (Engine Layer)              │
│  battle / aggro / buff / pathfinding / synergy / ... │
├─────────────────────────────────────────────────────┤
│                  数据持久层 (Storage Layer)             │
│              localStorage 封装 (battleStorage ...)    │
└─────────────────────────────────────────────────────┘
```

### 1.2 核心文件分布

| 层级 | 文件 | 职责 |
|------|------|------|
| 页面 | [SetupPage.tsx](file:///d:/git/lyj-6/src/pages/SetupPage.tsx) | 阵容编排、开始战斗入口、战斗回放列表 |
| 页面 | [BattlePage.tsx](file:///d:/git/lyj-6/src/pages/BattlePage.tsx) | 战斗主界面、回合循环驱动、战斗结束处理 |
| 页面 | [LeaderboardPage.tsx](file:///d:/git/lyj-6/src/pages/LeaderboardPage.tsx) | 排行榜展示 |
| Store | [useGameStore.ts](file:///d:/git/lyj-6/src/store/useGameStore.ts) | 全局状态管理：阵容、战斗状态、回放、鉴权、对局记录 |
| 引擎 | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | 战斗核心：初始化、回合执行、单位行动、胜负判定 |
| 引擎 | [pathfinding.ts](file:///d:/git/lyj-6/src/engine/pathfinding.ts) | A*寻路算法 |
| 引擎 | [aggro.ts](file:///d:/git/lyj-6/src/engine/aggro.ts) | 仇恨系统：仇恨增减、目标选择 |
| 引擎 | [buff.ts](file:///d:/git/lyj-6/src/engine/buff.ts) | Buff/Debuff：施加、tick结算、修饰符计算 |
| 引擎 | [synergy.ts](file:///d:/git/lyj-6/src/engine/synergy.ts) | 职业羁绊计算与属性加成 |
| 引擎 | [equipment.ts](file:///d:/git/lyj-6/src/engine/equipment.ts) | 装备属性与Buff应用 |
| 引擎 | [mapGenerator.ts](file:///d:/git/lyj-6/src/engine/mapGenerator.ts) | 随机地图生成、出生点分配 |
| 引擎 | [battleRecorder.ts](file:///d:/git/lyj-6/src/engine/battleRecorder.ts) | 战斗快照录制 |
| 引擎 | [battleReplay.ts](file:///d:/git/lyj-6/src/engine/battleReplay.ts) | 战斗回放播放控制 |
| 引擎 | [battleStorage.ts](file:///d:/git/lyj-6/src/engine/battleStorage.ts) | 战斗记录localStorage持久化 |
| 引擎 | [matchRecord.ts](file:///d:/git/lyj-6/src/engine/matchRecord.ts) | 对局记录管理（胜/负、回合数、剩余单位等） |
| 引擎 | [leaderboard.ts](file:///d:/git/lyj-6/src/engine/leaderboard.ts) | 排行榜统计与排序 |
| 引擎 | [season.ts](file:///d:/git/lyj-6/src/engine/season.ts) | 赛季（按日）管理 |
| 引擎 | [account.ts](file:///d:/git/lyj-6/src/engine/account.ts) | 玩家账号注册/登录 |
| 类型 | [index.ts](file:///d:/git/lyj-6/src/types/index.ts) | 全部TypeScript类型定义 |

---

## 2. 完整调用链时序图

```
用户点击"开始战斗"
        │
        ▼
┌────────────────────┐
│  SetupPage         │
│  handleStart()     │
└─────────┬──────────┘
          │ 1. startBattle()
          ▼
┌─────────────────────────────────────────────────┐
│  useGameStore.startBattle()                     │
│  ├─ cancelActiveMatch()                         │
│  ├─ initBattle(blueFormation, redFormation, ...)│
│  ├─ createBattleRecorder().start(...)           │
│  └─ createPendingMatch(...)                     │
└─────────┬───────────────────────────────────────┘
          │ 2. navigate('/battle')
          ▼
┌─────────────────────────────────────────────────────┐
│  BattlePage (useEffect 初始化)                      │
│  ├─ localStateRef.current = battleState             │
│  └─ setInterval(advanceTurn, 1000/speed ms)         │
└─────────┬───────────────────────────────────────────┘
          │ 3. 每1000/speed毫秒触发一次advanceTurn()
          ▼
┌─────────────────────────────────────────────────────┐
│  BattlePage.advanceTurn()                           │
│  ├─ deepClone(state)                                │
│  ├─ executeTurn(cloned)                             │
│  ├─ recordBattleSnapshot(cloned)                    │
│  └─ setState({ battleState: cloned })               │
│     ├─ 若phase==='finished':                        │
│     │   ├─ finishBattleRecording(cloned)            │
│     │   └─ completeMatchRecord(cloned, recordingId) │
└─────────┬───────────────────────────────────────────┘
          │ 4. executeTurn()
          ▼
┌─────────────────────────────────────────────────────┐
│  battle.executeTurn(state)                          │
│  ├─ turn += 1                                       │
│  ├─ 按speed降序排序存活单位                           │
│  └─ for each aliveUnit:                             │
│     ├─ executeUnitAction(state, unit)               │
│     └─ checkWinCondition(state) → winner?           │
│        ├─ 是: phase='finished', winner=team, return │
│        └─ 否: 继续下一个单位                          │
└─────────┬───────────────────────────────────────────┘
          │ 5. executeUnitAction()
          ▼
┌──────────────────────────────────────────────────────┐
│  battle.executeUnitAction(state, unit)               │
│  ├─ updateAggroProximity(unit, enemies)              │
│  ├─ decayAggro(unit)                                 │
│  ├─ target = getAggroTarget(unit, enemies)           │
│  ├─ [若距离 > attackRange]                           │
│  │   ├─ 遍历target周围4个相邻格                       │
│  │   ├─ 对每个相邻格调用 findPath() → A*寻路          │
│  │   ├─ 取最短路径，移动 Math.min(moveRange, len-1) 步│
│  │   └─ addLog('move')                               │
│  ├─ [技能判定] 遍历技能列表(CD=0优先)                  │
│  │   ├─ heal类型: 检查受伤友军是否在射程内 → executeSkill│
│  │   ├─ buff(self): 直接对自身施放 → executeSkill    │
│  │   ├─ buff(aoe): 检查范围内友军 → executeSkill     │
│  │   ├─ aoe/damage/debuff: 检查目标距离 → executeSkill│
│  │   └─ 技能使用后 set currentCd = cd                │
│  ├─ [普攻] 若未使用技能且在攻击范围内                  │
│  │   ├─ calculateDamage(attacker, target)            │
│  │   ├─ applyDamageToUnit(target, damage)            │
│  │   ├─ updateAggroOnDamage(...)                     │
│  │   └─ addLog('attack')                             │
│  ├─ tickBuffs(unit) → DOT伤害/HOT治疗/Buff过期        │
│  └─ 所有技能CD -= 1                                   │
└─────────┬────────────────────────────────────────────┘
          │ 6. checkWinCondition() 判定胜负
          ▼
┌─────────────────────────────────────────────────────┐
│  战斗结束后续流程                                    │
│  ├─ BattleRecorder.finish() → saveRecording()       │
│  ├─ completeMatch() → 写入match_records             │
│  ├─ loadPlayerSeasonStats() → 刷新玩家赛季数据       │
│  ├─ loadPlayerMatchHistory() → 刷新对局历史          │
│  └─ loadLeaderboard() → 刷新排行榜                   │
└─────────────────────────────────────────────────────┘
```

---

## 3. 阶段一：布阵与准备 (SetupPage)

### 3.1 入口函数

**位置**: [SetupPage.tsx#L119-L127](file:///d:/git/lyj-6/src/pages/SetupPage.tsx#L119-L127)

```typescript
const handleStart = () => {
  if (blueFormation.length === 0 || redFormation.length === 0) return;
  if (!auth.isLoggedIn) {
    setAuthModalOpen(true);
    return;
  }
  startBattle();      // 调用store动作
  navigate('/battle'); // 路由跳转
};
```

### 3.2 前置状态

在点击"开始战斗"之前，`useGameStore`中已维护以下状态：

| 状态字段 | 类型 | 说明 |
|----------|------|------|
| `blueFormation` | `CharacterId[]` | 蓝方阵容（最多8人） |
| `redFormation` | `CharacterId[]` | 红方阵容（最多8人） |
| `blueEquipment` | `FormationEquipment` | 蓝方各位置装备 |
| `redEquipment` | `FormationEquipment` | 红方各位置装备 |
| `playerTeam` | `Team` | 玩家所属阵营（blue/red） |
| `auth` | `AuthState` | 当前登录玩家信息 |

### 3.3 鉴权检查

- 未登录用户点击时，会弹出 [AuthModal](file:///d:/git/lyj-6/src/components/AuthModal.tsx) 要求登录
- 登录通过 `account.registerPlayer()` / `account.loginPlayer()` 完成，写入localStorage

---

## 4. 阶段二：战斗初始化

### 4.1 Store: startBattle()

**位置**: [useGameStore.ts#L185-L219](file:///d:/git/lyj-6/src/store/useGameStore.ts#L185-L219)

执行顺序：

```
1. cancelActiveMatch()              → 取消之前未完成的对局
2. initBattle(formation, equipment) → 构建初始BattleState
3. createBattleRecorder()
   └─ recorder.start()              → 开始录制，写入初始快照
4. createPendingMatch()             → 创建pending状态对局记录
5. 更新store状态：
   ├─ battleState = 新状态
   ├─ battleRecorder = recorder
   ├─ battleReplay = null
   ├─ replayState = { isReplayMode: false, ... }
   └─ currentMatch = matchRecord
```

### 4.2 核心: initBattle()

**位置**: [battle.ts#L62-L158](file:///d:/git/lyj-6/src/engine/battle.ts#L62-L158)

初始化流程详解：

```
initBattle(blueFormation, redFormation, blueEquipment, redEquipment)
│
├─ 1. generateMap(12, 8)
│     └─ 生成12×8随机地图，保证左右两侧有通路（最多重试100次）
│
├─ 2. getSpawnPositions(map, 'blue', n) / getSpawnPositions(map, 'red', n)
│     └─ 蓝方在左侧2列、红方在右侧2列，按接近中线优先分配出生点
│
├─ 3. calculateSynergies(formation) → 对蓝/红双方分别计算
│     └─ countProfessions() → 按职业统计数量 → 匹配最高等级羁绊
│
├─ 4. 遍历双方阵容，为每个角色创建Unit实例：
│     ├─ createUnit(template, team, pos, id)
│     │    └─ 从CHARACTER_TEMPLATES复制属性，初始化buffs/aggro/equipment
│     ├─ applySynergyBonuses(unit, synergies)
│     │    └─ 按羁绊加成 hp/atk/def/speed/critRate/critDmg
│     ├─ applyEquipmentStats(unit, unitEquip)
│     │    └─ 叠加装备属性（含moveRange/attackRange扩展）
│     └─ applyEquipmentBuffs(unit, unitEquip)
│          └─ 装备附带的永久Buff(remainingTurns=999)
│
├─ 5. 生成synergy激活日志（写入logs数组，turn=0）
│
└─ 6. 返回 BattleState {
      phase: 'running',
      turn: 0,
      currentUnitIndex: 0,
      units: [...],
      map: {...},
      logs: [...],
      winner: null,
      speed: 1,
      selectedUnitId: null,
      blueSynergies: [...],
      redSynergies: [...],
    }
```

### 4.3 BattleState 数据结构

**定义位置**: [types/index.ts#L95-L107](file:///d:/git/lyj-6/src/types/index.ts#L95-L107)

```typescript
type BattleState = {
  phase: 'idle' | 'running' | 'paused' | 'finished';
  turn: number;
  currentUnitIndex: number;
  units: Unit[];                     // 双方所有单位
  map: GameMap;                      // 12×8 瓦片地图
  logs: BattleLog[];                 // 战斗日志（追加写入）
  winner: Team | null;               // 'blue' | 'red' | null
  speed: 1 | 2 | 4;                  // 战斗倍速
  selectedUnitId: string | null;     // UI选中的单位
  blueSynergies: ActiveSynergy[];
  redSynergies: ActiveSynergy[];
};
```

---

## 5. 阶段三：战斗主循环执行

### 5.1 循环驱动机制

**位置**: [BattlePage.tsx#L73-L116](file:///d:/git/lyj-6/src/pages/BattlePage.tsx#L73-L116)

战斗主循环由 `setInterval` 驱动：

```
useEffect 依赖项变化 → 重建定时器：
├─ 正常战斗模式:
│   interval = setInterval(advanceTurn, max(100, 1000/speed) ms)
│   └─ speed=1 → 1000ms/回合; speed=2 → 500ms/回合; speed=4 → 250ms/回合
│
└─ 回放模式:
    interval = setInterval(advanceReplay, max(100, 1000/playSpeed) ms)
    └─ 从battleReplay读取下一个快照，而非执行战斗逻辑
```

### 5.2 advanceTurn() 单回合推进

**位置**: [BattlePage.tsx#L41-L62](file:///d:/git/lyj-6/src/pages/BattlePage.tsx#L41-L62)

```
advanceTurn()
│
├─ 前置检查：phase==='finished' or 'paused' → return
│
├─ 1. cloned = deepClone(state)
│     └─ JSON.parse(JSON.stringify(state)) → 完整深拷贝，避免直接修改store
│
├─ 2. executeTurn(cloned)
│     └─ 核心战斗逻辑（详见下一节）
│
├─ 3. recordBattleSnapshot(cloned)
│     └─ BattleRecorder.recordSnapshot() → 将cloned状态推入snapshots数组
│
├─ 4. useGameStore.setState({ battleState: cloned })
│     └─ 更新Zustand状态，触发UI重渲染
│
└─ 5. 若 cloned.phase === 'finished':
       ├─ recordingId = finishBattleRecording(cloned)
       │    └─ BattleRecorder.finish() → saveRecording() 写入 localStorage
       ├─ 若非回放模式: completeMatchRecord(cloned, recordingId)
       │    └─ matchRecord.completeMatch() → 标记对局完成，统计胜负数据
       └─ finishedRecordingIdRef.current = recordingId → 供"查看回放"按钮使用
```

### 5.3 关键性能注意点

`advanceTurn` 每回合都执行 **3次完整深拷贝**：
1. `deepClone(state)` — 将当前状态克隆一份用于计算
2. `recordBattleSnapshot(cloned)` — 在Recorder内部再次 `deepClone`
3. `setState` — Zustand内部也会进行引用比较

这是主要的性能开销点（详见第11节）。

---

## 6. 阶段四：单位行动详解

### 6.1 executeTurn() — 回合调度

**位置**: [battle.ts#L530-L552](file:///d:/git/lyj-6/src/engine/battle.ts#L530-L552)

```
executeTurn(state)
│
├─ 1. state.turn += 1
├─ 2. state.phase = 'running'
│
├─ 3. aliveUnits = state.units
│     ├─ .filter(u => u.isAlive)
│     └─ .sort((a, b) => b.speed - a.speed)  ← 速度降序决定行动顺序
│
└─ 4. for (const unit of aliveUnits):
       ├─ if (!unit.isAlive) continue;  ← 本回合内前面单位击杀的跳过
       ├─ executeUnitAction(state, unit)
       └─ winner = checkWinCondition(state)
           ├─ 有winner: phase='finished', winner=team, return state
           └─ 无winner: 继续下一单位
```

> **注意**: 单位的行动顺序在回合开始时就已确定（按速度排序），但在行动过程中若单位被击杀（被前序行动的敌方单位击杀），会被跳过。

### 6.2 executeUnitAction() — 单单位完整行动

**位置**: [battle.ts#L395-L528](file:///d:/git/lyj-6/src/engine/battle.ts#L395-L528)

#### 步骤分解：

```
executeUnitAction(state, unit)
│
├─ ▓▓ 第一步：仇恨系统更新 ▓▓
│  ├─ updateAggroProximity(unit, enemies)
│  │    └─ 攻击范围内的敌人 +2 仇恨
│  ├─ decayAggro(unit)
│  │    └─ 所有仇恨值 × 0.95，低于0.01删除
│  └─ target = getAggroTarget(unit, enemies)
│       ├─ 优先选仇恨最高的敌人
│       └─ 无仇恨时 fallback 到最近的敌人
│
├─ ▓▓ 第二步：移动（若需要） ▓▓
│  └─ if (distToTarget > unit.attackRange):
│     ├─ 枚举target上下左右4个相邻格
│     ├─ 对每个空格调用 findPath(map, unit.pos, adjPos, occupied)
│     │    └─ A* 寻路，最大迭代1000次
│     ├─ 选择路径最短的一条
│     └─ 移动 min(moveRange, pathLength-1) 步
│
├─ ▓▓ 第三步：技能/攻击判定 ▓▓
│  ├─ 遍历 unit.skills（数组顺序即优先级）
│  │   ├─ skill.currentCd > 0 → 跳过
│  │   │
│  │   ├─ [heal类型]
│  │   │   ├─ 检查是否有受伤友军 (hp < maxHp)
│  │   │   └─ 若有受伤友军在射程内 → executeSkill(heal)
│  │   │
│  │   ├─ [buff类型 range=0]  自身Buff
│  │   │   └─ executeSkill(buff, self)
│  │   │
│  │   ├─ [buff类型 range>0]  群体Buff
│  │   │   ├─ 检查范围内友军数量 > 0
│  │   │   └─ executeSkill(buff, firstAlly)
│  │   │
│  │   ├─ [aoe类型]
│  │   │   └─ dist <= skill.range → executeSkill(aoe, target)
│  │   │
│  │   └─ [damage/debuff类型]
│  │       └─ dist <= skill.range → executeSkill(damage/debuff, target)
│  │
│  ├─ if (技能已使用): skillUsed = true; break;
│  │
│  └─ if (!skillUsed && 在攻击范围内):
│     ├─ damage = calculateDamage(unit, target)
│     │    ├─ atkMod = getBuffModifier(attacker, 'atk')
│     │    ├─ defMod = getBuffModifier(target, 'def')
│     │    ├─ damage = atk*(1+atkMod/atk) - def*(1+defMod/def)
│     │    ├─ damage = max(1, damage)
│     │    └─ 暴击判定: random < critRate → damage *= critDmg
│     ├─ applyDamageToUnit(target, damage)
│     │    ├─ 优先扣shieldBuff
│     │    ├─ 剩余伤害扣HP
│     │    └─ hp<=0 → isAlive=false
│     ├─ updateAggroOnDamage(target, unit.id, damage, unit.profession)
│     │    └─ target仇恨 += damage*0.5，warrior额外×1.5
│     └─ addLog('attack', ...)
│
├─ ▓▓ 第四步：Buff结算 ▓▓
│  └─ buffResult = tickBuffs(unit)
│     ├─ dotDamage = Σ (buff.value × buff.stacks) for buff.type==='dot'
│     ├─ hotHeal = Σ (buff.value × buff.stacks) for buff.type==='hot'
│     ├─ remainingTurns -= 1
│     ├─ remainingTurns <= 0 → 从buffs数组移除
│     ├─ 若dotDamage>0: applyDamageToUnit(unit, dotDamage)
│     └─ 若hotHeal>0: unit.hp += heal (不超上限)
│
└─ ▓▓ 第五步：技能CD递减 ▓▓
   └─ for each skill: if (currentCd > 0) currentCd -= 1
```

### 6.3 executeSkill() — 技能执行

**位置**: [battle.ts#L317-L393](file:///d:/git/lyj-6/src/engine/battle.ts#L317-L393)

| 技能类型 | 行为 |
|----------|------|
| `damage` | 单体伤害 + 职业专属暴击逻辑(archer 30%/assassin 40%) + 仇恨更新 |
| `aoe` | 以target为中心的aoeRadius范围内所有敌方单位伤害 |
| `heal` | 选范围内HP%最低的友军治疗 + updateAggroOnHeal |
| `buff` | range=0自身; range>0范围内所有友军 + processSkillBuffEffect |
| `debuff` | 单体伤害 + 施加负面Buff + 职业专属额外Buff(warlock防御降低等) |

### 6.4 子模块调用清单

每个单位行动涉及的引擎模块调用：

```
executeUnitAction
├─ aggro.ts: updateAggroProximity
├─ aggro.ts: decayAggro
├─ aggro.ts: getAggroTarget
├─ pathfinding.ts: findPath (A*)              ← 可能多次调用
├─ buff.ts: getBuffModifier                   ← calculateDamage调用
├─ aggro.ts: updateAggroOnDamage
├─ buff.ts: applyBuff                         ← executeSkill内调用
├─ battle.ts: processSkillBuffEffect          ← 处理技能附带Buff
├─ buff.ts: tickBuffs
└─ (隐式) synergy / equipment 属性已在initBattle时固化，运行时无额外计算
```

---

## 7. 阶段五：胜负判定与战斗结束

### 7.1 checkWinCondition()

**位置**: [battle.ts#L554-L562](file:///d:/git/lyj-6/src/engine/battle.ts#L554-L562)

```typescript
export function checkWinCondition(state: BattleState): Team | null {
  const blueAlive = state.units.some(u => u.team === 'blue' && u.isAlive);
  const redAlive  = state.units.some(u => u.team === 'red'  && u.isAlive);
  if (!blueAlive && !redAlive) return null;   // 同归于尽，继续（罕见）
  if (!blueAlive) return 'red';
  if (!redAlive)  return 'blue';
  return null;
}
```

> **调用时机**: 每个单位行动完成后立即检查一次。若某单位击杀了最后一个敌人，则战斗在当前单位行动后立刻终止，后续单位不再行动。

### 7.2 战斗结束后的UI展示

**位置**: [BattlePage.tsx#L244-L283](file:///d:/git/lyj-6/src/pages/BattlePage.tsx#L244-L283)

当 `battleState.phase === 'finished' && !replayState.isReplayMode` 时：

- 渲染半透明遮罩 + 胜利/失败弹窗
- 展示获胜方、回合数
- 提供两个按钮：
  - **查看回放**: `handleViewReplay()` → `startReplay(finishedRecordingId)` → 切换到回放模式
  - **返回配置**: `handleReset()` → 清理定时器、取消对局（如pending）、`navigate('/')`

---

## 8. 阶段六：战斗记录与排行榜更新

### 8.1 战斗录制保存

**位置**: [battleRecorder.ts#L44-L59](file:///d:/git/lyj-6/src/engine/battleRecorder.ts#L44-L59)

```
BattleRecorder.finish(state)
├─ 填充 recording.endTime / recording.winner / recording.totalTurns
├─ deepClone(recording)
├─ saveRecording(finalRecording) → battleStorage.ts
│   ├─ loadAllRecordings()  ← 从localStorage读取
│   ├─ unshift(recording)   ← 新记录插入头部
│   ├─ while (length > 10) pop()  ← 最多保留10条
│   └─ localStorage.setItem('battle_recordings', JSON.stringify(...))
└─ 返回 finalRecording
```

### 8.2 对局记录完成

**位置**: [matchRecord.ts#L91-L129](file:///d:/git/lyj-6/src/engine/matchRecord.ts#L91-L129)

```
completeMatch(matchId, battleState, recordingId)
├─ 从localStorage读取全部MatchRecord
├─ 找到对应记录（status必须为pending）
├─ 计算统计数据：
│   ├─ winner = battleState.winner
│   ├─ playerWin = winner === match.playerTeam
│   ├─ remainingPlayerUnits = 玩家方存活单位数
│   ├─ remainingOpponentUnits = 对方存活单位数
│   └─ totalTurns = battleState.turn
├─ status = 'completed'
├─ endTime = Date.now()
├─ battleRecordingId = recordingId
├─ 写回 localStorage (match_records)
└─ setActiveMatchId(null)  ← 清除进行中的对局标记
```

### 8.3 排行榜与玩家数据刷新

**位置**: [useGameStore.ts#L582-L594](file:///d:/git/lyj-6/src/store/useGameStore.ts#L582-L594)

战斗完成后，`completeMatchRecord()` 触发三项刷新：

```
loadPlayerSeasonStats()
└─ getPlayerSeasonStatsEntry(playerId, seasonId)
   └─ leaderboard.calculatePlayerSeasonStats()
      ├─ wins / losses / winRate
      ├─ currentWinStreak / maxWinStreak
      └─ averageRemainingUnits

loadPlayerMatchHistory()
└─ getCurrentSeasonPlayerMatches(playerId)
   └─ 从match_records筛选本季已完成对局，按endTime降序

loadLeaderboard()
└─ getCurrentSeasonLeaderboard(sortType)
   ├─ getSeasonPlayerStats(seasonId) → 所有有对局玩家的统计
   └─ sortStats(stats, sortType) → 按winRate/wins/winStreak/maxWinStreak排序+排名
```

---

## 9. 状态流转全景

### 9.1 BattlePhase 状态机

```
                    ┌──────────┐
                    │   idle   │ (store初始值)
                    └────┬─────┘
                         │ startBattle()
                         ▼
                    ┌──────────┐
          ┌────────►│ running  │◄──────────┐
          │         └────┬─────┘           │
          │              │                 │
   togglePause()     回合结束            togglePause()
          │              │                 │
          │              ▼                 │
          │         ┌──────────┐           │
          └─────────│  paused  │───────────┘
                    └────┬─────┘
                         │ checkWinCondition()检测到胜负
                         ▼
                    ┌──────────┐
                    │ finished │ → 触发录制保存+对局完成+数据刷新
                    └──────────┘
```

### 9.2 BattleState 关键字段生命周期

| 字段 | 创建时机 | 更新时机 | 销毁时机 |
|------|----------|----------|----------|
| `phase` | `initBattle()` → 'running' | 用户暂停toggle; 胜负判定 | `resetBattle()` |
| `turn` | `initBattle()` → 0 | 每个`executeTurn()`开始时+1 | `resetBattle()` |
| `units` | `initBattle()` 创建所有Unit | 每回合各单位hp/pos/buffs/aggro变化 | `resetBattle()` |
| `logs` | `initBattle()` 写入synergy日志 | 每次移动/攻击/技能/buff结算追加 | `resetBattle()` |
| `winner` | `initBattle()` → null | `checkWinCondition()`返回非null时 | `resetBattle()` |
| `speed` | `initBattle()` → 1 | 用户点击speed按钮 | `resetBattle()` |

### 9.3 Store 中与战斗相关的状态生命周期

```
SetupPage                                BattlePage                     返回SetupPage
    │                                        │                              │
    │  startBattle()                         │  battleState=null → navigate │  handleReset()
    ▼                                        ▼                              ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  useGameStore                                                                     │
│  ├─ battleState: null ──────► initBattle()创建 ──────► resetBattle() → null       │
│  ├─ battleRecorder: null ──► create+start ──────► finish后isActive=false ──► null│
│  ├─ battleReplay: null   ──► 点击查看回放 ──► close()/resetBattle() → null       │
│  ├─ replayState: {false} ──► 战斗中{false} / 回放中{true} ──► reset → {false}    │
│  ├─ currentMatch: null ──► createPendingMatch ──► completeMatch后 → null          │
│  └─ lastSavedRecordingId: null ──► finishBattleRecording → id ──► 下次start清空  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. 关键模块依赖关系

### 10.1 引擎模块依赖图

```
                    ┌──────────────┐
                    │   battle.ts  │ ◄──────────────┐
                    └──────┬───────┘                │
                           │                        │
          ┌────────────────┼────────────────┐       │
          ▼                ▼                ▼       │
   ┌────────────┐   ┌────────────┐   ┌───────────┐ │
   │  aggro.ts  │   │   buff.ts  │   │ synergy.ts│ │
   └────────────┘   └────────────┘   └───────────┘ │
          ▲                ▲                ▲       │
          │                │                │       │
   ┌──────────────┐        │         ┌──────────────┴─┐
   │pathfinding.ts│        │         │  equipment.ts  │
   └──────────────┘        │         └────────────────┘
          ▲                │
          │                │
   ┌──────────────┐        │
   │mapGenerator.ts│       │
   └──────────────┘        │
                           │
                    ┌──────────────┐
                    │   types/     │  (所有模块共享类型定义)
                    └──────────────┘
```

### 10.2 关键依赖明细

| 模块 | 直接依赖 | 被谁依赖 |
|------|----------|----------|
| **battle.ts** | pathfinding, aggro, buff, mapGenerator, synergy, equipment, types, data/units | BattlePage, useGameStore |
| **aggro.ts** | types | battle.ts, BattleMap(UI展示仇恨连线) |
| **buff.ts** | types | battle.ts, equipment.ts |
| **pathfinding.ts** | types | battle.ts, mapGenerator |
| **synergy.ts** | types, data/units | battle.ts, SetupPage, useGameStore |
| **equipment.ts** | types, buff.ts | battle.ts, useGameStore, SetupPage |
| **mapGenerator.ts** | types, pathfinding | battle.ts |
| **battleRecorder.ts** | types, battleStorage | useGameStore |
| **battleReplay.ts** | types, battleStorage | useGameStore, BattlePage |
| **matchRecord.ts** | types, season, account | useGameStore, leaderboard |
| **leaderboard.ts** | types, matchRecord, account, season | useGameStore |
| **useGameStore** | 全部engine模块 + types + data | 所有页面/组件 |

### 10.3 Store 暴露的动作接口

| Action | 说明 |
|--------|------|
| `addToFormation(team, cid)` | 阵容加人 |
| `removeFromFormation(team, idx)` | 阵容减人（装备索引同步重排） |
| `startBattle()` | 初始化战斗+录制+对局记录 |
| `resetBattle()` | 清空battleState |
| `setSpeed(1\|2\|4)` | 调整战斗倍速 |
| `togglePause()` | 暂停/继续 |
| `recordBattleSnapshot(state)` | 录制快照 |
| `finishBattleRecording(state)` | 结束录制并保存 |
| `completeMatchRecord(state, recId)` | 完成对局记录并刷新排行榜 |
| `equipItem(team, idx, equipment)` | 装备物品（含职业校验） |
| `login/register/logout/checkAuth` | 鉴权相关 |

---

## 11. 潜在性能瓶颈分析

### 11.1 高风险瓶颈（按严重程度排序）

#### 🔴 P0: 每回合多次深拷贝 (JSON序列化/反序列化)

**位置**: 
- [BattlePage.tsx#L13-L15](file:///d:/git/lyj-6/src/pages/BattlePage.tsx#L13-L15) `deepClone`
- [battleRecorder.ts#L4-L6](file:///d:/git/lyj-6/src/engine/battleRecorder.ts#L4-L6) `deepClone`

**问题**: 每回合 `advanceTurn()` 执行：
1. `BattlePage` 中 `deepClone(state)` → 序列化完整 BattleState
2. `recordBattleSnapshot(cloned)` → Recorder 内部再次 `deepClone(cloned)`

**开销估算**: 
- 双方各8单位 → 约16个Unit，每个Unit含skills/buffs/aggroTable
- 12×8地图 = 96个瓦片
- logs数组随回合数线性增长
- 每回合2次完整JSON.parse/stringify，在长对局（>30回合）下会产生明显卡顿

**优化建议**:
1. 使用结构化克隆（structuredClone）替代 JSON 方案
2. 只增量记录变化部分（如仅记录单位位置/HP变化，而非全量快照）
3. 对 logs 数组做分层存储（快照中只存索引，不重复存全量日志）

---

#### 🔴 P0: 寻路算法可能被高频调用

**位置**: [battle.ts#L412-L446](file:///d:/git/lyj-6/src/engine/battle.ts#L412-L446)

**问题**: 每个超出攻击范围的单位行动时：
1. 遍历目标周围4个相邻格
2. 对每个可达相邻格调用一次 `findPath()`
3. `findPath()` 使用 A* 算法，最大迭代1000次
4. 每单位最多 4 × O(W×H) 复杂度

**极端场景**: 双方各8单位，大部分处于远程攻击范围外 → 每回合 16 × 4 = 64次 A* 寻路

**优化建议**:
1. 每回合缓存已计算的路径（相同起终点复用）
2. 先用曼哈顿距离粗筛，只对最近的1-2个相邻格做精确寻路
3. 考虑使用跳点搜索(JPS)或预先计算全地图可达性

---

#### 🟠 P1: 地图生成时全量路径可达性验证

**位置**: [mapGenerator.ts#L37-L55](file:///d:/git/lyj-6/src/engine/mapGenerator.ts#L37-L55)

**问题**: `hasPathFromLeftToRight()` 会：
- 遍历所有左侧Y坐标作为起点（H=8个）
- 遍历所有右侧Y坐标作为终点（H=8个）
- 每对起终点调用一次 `findPath()`
- 最坏情况 64 次 A* 寻路，最多重试100次地图生成

**优化建议**:
1. 使用 BFS  flood fill 从左侧所有起点一次性标记所有可达点，O(W×H) 即可判定是否有通路
2. 避免嵌套 起点×终点 的双重循环

---

#### 🟠 P1: 排行榜每次加载全量重算

**位置**: [leaderboard.ts#L101-L114](file:///d:/git/lyj-6/src/engine/leaderboard.ts#L101-L114)

**问题**: `getLeaderboard()` 每次调用都：
1. 从 localStorage 读取全部 match_records
2. 按赛季过滤
3. 为每个有对局的玩家调用 `calculatePlayerSeasonStats()`
4. 每个玩家的 `getPlayerWinStreak()` 又要再次读取+排序全部对局

**复杂度**: O(M × P)，M为对局数，P为玩家数，且含N次localStorage读取

**优化建议**:
1. 对局完成时增量更新排行榜数据，缓存到 localStorage
2. 玩家赛季统计也做持久化缓存，而非每次全量重算
3. 连胜统计可以在对局完成时直接更新（不必每次扫描全部历史）

---

#### 🟡 P2: Zustand 全量状态触发重渲染

**位置**: [BattlePage.tsx#L19-L35](file:///d:/git/lyj-6/src/pages/BattlePage.tsx#L19-L35)

**问题**: `BattlePage` 中通过 `useGameStore(s => s.battleState)` 订阅整个战斗状态。每次 `setState({ battleState })` 会导致页面及所有子组件（BattleMap/BattleLog/BattleControls/...）全部重渲染。

**优化建议**:
1. 使用 Zustand 的 `shallow` 选择器或 `useGameStore.subscribe` 细粒度订阅
2. BattleMap/BattleLog/BattleControls 各自只订阅自己需要的字段切片
3. 考虑将日志与单位状态拆分到不同 store 切片

---

#### 🟡 P2: localStorage 同步写入阻塞主线程

**问题链路**:
```
advanceTurn() → recordBattleSnapshot() → ...(暂存内存)...
  → finish时 → saveRecording() → localStorage.setItem(全量序列化)
  → completeMatch() → localStorage.setItem(所有match_records全量)
```

**问题**: `localStorage.setItem` 是同步阻塞操作。战斗结束时一次性写入：
- `battle_recordings`：10条完整 BattleRecording（含全部快照）
- `match_records`：所有历史对局

**优化建议**:
1. 使用 `requestIdleCallback` 延迟写入
2. 对战报快照做增量压缩存储
3. 考虑 IndexedDB 替代 localStorage 存储大量结构化数据

---

#### 🟡 P2: Canvas 渲染全量重绘

**位置**: [BattleMap.tsx#L78-L315](file:///d:/git/lyj-6/src/components/BattleMap.tsx#L78-L315)

**问题**: `BattleMap` 的 `useEffect` 依赖 `[battleState]`，每次状态变化（每回合）都会：
1. 卸载旧的 `requestAnimationFrame` 循环
2. 重新建立 RAF 循环
3. 每帧完整重绘整张地图（瓦片+网格+单位+仇恨线+特效+HP条+Buff点）

**优化建议**:
1. 将 RAF 循环移到组件挂载时启动，不因 battleState 变化而重启
2. 使用 refs 存储最新 battleState，避免重建绘制循环
3. 只重绘变化的单位位置/HP，而非每帧全量重绘

---

### 11.2 瓶颈汇总表

| 优先级 | 问题 | 影响模块 | 主要场景 | 建议优化 |
|--------|------|----------|----------|----------|
| 🔴 P0 | 每回合2次JSON深拷贝 | BattlePage, battleRecorder | 所有战斗，长对局更明显 | structuredClone/增量快照 |
| 🔴 P0 | 多邻格A*寻路（每单位最多4次） | battle.ts, pathfinding | 近战单位接近目标时 | 缓存路径/降采样 |
| 🟠 P1 | 地图生成可达性检查（64次A*） | mapGenerator, pathfinding | 战斗开始时 | BFS Flood Fill |
| 🟠 P1 | 排行榜全量重算 + 重复localStorage读 | leaderboard, matchRecord | 战斗结束后刷新 | 增量缓存 |
| 🟡 P2 | Zustand全量状态订阅致全组件重渲染 | BattlePage及其子组件 | 每回合UI更新 | 细粒度selector |
| 🟡 P2 | localStorage同步阻塞写入 | battleStorage, matchRecord | 战斗结束时 | IndexedDB/异步写入 |
| 🟡 P2 | Canvas RAF循环重建+全量重绘 | BattleMap | 每回合视觉更新 | Refs存储最新状态 |

---

## 12. 文件索引

### 12.1 核心入口（点击开始战斗相关）

| 功能 | 文件 | 行号 |
|------|------|------|
| "开始战斗"按钮点击 | [SetupPage.tsx](file:///d:/git/lyj-6/src/pages/SetupPage.tsx) | L119-L127 |
| store.startBattle() | [useGameStore.ts](file:///d:/git/lyj-6/src/store/useGameStore.ts) | L185-L219 |
| 路由入口 | [App.tsx](file:///d:/git/lyj-6/src/App.tsx) | L6-L14 |

### 12.2 战斗初始化

| 功能 | 文件 | 行号 |
|------|------|------|
| initBattle() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L62-L158 |
| createUnit() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L30-L60 |
| generateMap() | [mapGenerator.ts](file:///d:/git/lyj-6/src/engine/mapGenerator.ts) | L57-L81 |
| getSpawnPositions() | [mapGenerator.ts](file:///d:/git/lyj-6/src/engine/mapGenerator.ts) | L83-L116 |
| calculateSynergies() | [synergy.ts](file:///d:/git/lyj-6/src/engine/synergy.ts) | L16-L44 |
| applySynergyBonuses() | [synergy.ts](file:///d:/git/lyj-6/src/engine/synergy.ts) | L86-L108 |
| applyEquipmentStats() | [equipment.ts](file:///d:/git/lyj-6/src/engine/equipment.ts) | L51-L65 |
| applyEquipmentBuffs() | [equipment.ts](file:///d:/git/lyj-6/src/engine/equipment.ts) | L67-L85 |

### 12.3 战斗主循环

| 功能 | 文件 | 行号 |
|------|------|------|
| 定时器驱动 useEffect | [BattlePage.tsx](file:///d:/git/lyj-6/src/pages/BattlePage.tsx) | L81-L116 |
| advanceTurn() | [BattlePage.tsx](file:///d:/git/lyj-6/src/pages/BattlePage.tsx) | L41-L62 |
| executeTurn() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L530-L552 |
| executeUnitAction() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L395-L528 |
| executeSkill() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L317-L393 |
| calculateDamage() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L186-L199 |
| applyDamageToUnit() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L201-L225 |
| checkWinCondition() | [battle.ts](file:///d:/git/lyj-6/src/engine/battle.ts) | L554-L562 |

### 12.4 子系统模块

| 子系统 | 文件 | 行号 |
|--------|------|------|
| 寻路 A* | [pathfinding.ts](file:///d:/git/lyj-6/src/engine/pathfinding.ts) | L32-L117 |
| 仇恨系统 | [aggro.ts](file:///d:/git/lyj-6/src/engine/aggro.ts) | L1-L67 |
| Buff系统 | [buff.ts](file:///d:/git/lyj-6/src/engine/buff.ts) | L1-L83 |

### 12.5 战斗录制/回放/结算

| 功能 | 文件 | 行号 |
|------|------|------|
| BattleRecorder 类 | [battleRecorder.ts](file:///d:/git/lyj-6/src/engine/battleRecorder.ts) | L8-L77 |
| BattleReplay 类 | [battleReplay.ts](file:///d:/git/lyj-6/src/engine/battleReplay.ts) | L8-L154 |
| 录制存储 | [battleStorage.ts](file:///d:/git/lyj-6/src/engine/battleStorage.ts) | L1-L56 |
| 对局记录 createPendingMatch | [matchRecord.ts](file:///d:/git/lyj-6/src/engine/matchRecord.ts) | L43-L81 |
| 对局记录 completeMatch | [matchRecord.ts](file:///d:/git/lyj-6/src/engine/matchRecord.ts) | L91-L129 |
| 排行榜统计 | [leaderboard.ts](file:///d:/git/lyj-6/src/engine/leaderboard.ts) | L1-L152 |
| 赛季管理 | [season.ts](file:///d:/git/lyj-6/src/engine/season.ts) | L1-L124 |
| store.completeMatchRecord | [useGameStore.ts](file:///d:/git/lyj-6/src/store/useGameStore.ts) | L582-L594 |
| 战斗结束UI | [BattlePage.tsx](file:///d:/git/lyj-6/src/pages/BattlePage.tsx) | L244-L283 |

### 12.6 类型定义

| 类型 | 文件 | 行号 |
|------|------|------|
| BattleState | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L95-L107 |
| Unit | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L51-L74 |
| Skill | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L30-L40 |
| Buff | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L42-L49 |
| BattlePhase | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L82 |
| MatchRecord | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L261-L279 |
| PlayerSeasonStats | [types/index.ts](file:///d:/git/lyj-6/src/types/index.ts) | L281-L294 |

---

*文档生成时间：2026-06-22*
*分析范围覆盖 d:\git\lyj-6\src 下全部战斗相关代码*
