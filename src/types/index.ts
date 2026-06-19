export type UnitClass = 'warrior' | 'knight' | 'archer' | 'mage' | 'assassin' | 'priest' | 'warlock';

export type Team = 'blue' | 'red';

export type Position = { x: number; y: number };

export type TileType = 'plain' | 'wall' | 'water';

export type BuffType = 'atkUp' | 'defUp' | 'atkDown' | 'defDown' | 'dot' | 'hot' | 'shield' | 'slow' | 'taunt';

export type SkillType = 'damage' | 'heal' | 'buff' | 'debuff' | 'aoe';

export type BuffEffect = {
  name: string;
  type: BuffType;
  value: number;
  duration: number;
  stackable: boolean;
};

export type Skill = {
  id: string;
  name: string;
  type: SkillType;
  value: number;
  range: number;
  cd: number;
  currentCd: number;
  buffEffect?: BuffEffect;
  aoeRadius?: number;
};

export type Buff = {
  name: string;
  type: BuffType;
  value: number;
  remainingTurns: number;
  stacks: number;
  sourceUnitId: string;
};

export type Unit = {
  id: string;
  name: string;
  class: UnitClass;
  team: Team;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  moveRange: number;
  attackRange: number;
  pos: Position;
  skills: Skill[];
  buffs: Buff[];
  aggroTable: Record<string, number>;
  isAlive: boolean;
  critRate: number;
  critDmg: number;
};

export type GameMap = {
  width: number;
  height: number;
  tiles: TileType[][];
};

export type BattlePhase = 'idle' | 'running' | 'paused' | 'finished';

export type BattleLogType = 'attack' | 'skill' | 'move' | 'buff' | 'aggro' | 'death' | 'heal';

export type BattleLog = {
  turn: number;
  unitId: string;
  unitName: string;
  type: BattleLogType;
  message: string;
  team: Team;
};

export type BattleState = {
  phase: BattlePhase;
  turn: number;
  currentUnitIndex: number;
  units: Unit[];
  map: GameMap;
  logs: BattleLog[];
  winner: Team | null;
  speed: 1 | 2 | 4;
  selectedUnitId: string | null;
};

export type UnitTemplate = {
  class: UnitClass;
  name: string;
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  moveRange: number;
  attackRange: number;
  critRate: number;
  critDmg: number;
  skills: Omit<Skill, 'currentCd'>[];
};

export type FormationSlot = {
  index: number;
  unitClass: UnitClass | null;
  team: Team;
};
