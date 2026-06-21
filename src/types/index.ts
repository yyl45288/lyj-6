export type Profession = 'warrior' | 'knight' | 'archer' | 'mage' | 'assassin' | 'priest' | 'warlock';

export type CharacterId =
  | 'zhaoyun' | 'zhangfei' | 'guanyu' | 'machao' | 'huangzhong'
  | 'caocao' | 'xiahouyuan' | 'zhangliao' | 'xuchu' | 'dianwei'
  | 'zhugeliang' | 'simayi' | 'zhouyu' | 'guojia' | 'pangtong'
  | 'zhaozilong' | 'lubu' | 'sunshangxiang' | 'xiaoqiao' | 'daqiao'
  | 'huatuo' | 'zuoci' | 'nanhuaman' | 'caizhiwenji' | 'diaochan'
  | 'jiangwei' | 'weiyan' | 'xiahoudun' | 'caoren' | 'huanggai'
  | 'ganning' | 'lingtong' | 'taishi' | 'lvmeng' | 'lusu';

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
  characterId: CharacterId;
  name: string;
  profession: Profession;
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

export type BattleLogType = 'attack' | 'skill' | 'move' | 'buff' | 'aggro' | 'death' | 'heal' | 'synergy';

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
  blueSynergies: ActiveSynergy[];
  redSynergies: ActiveSynergy[];
};

export type UnitTemplate = {
  profession: Profession;
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

export type CharacterTemplate = {
  characterId: CharacterId;
  name: string;
  profession: Profession;
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

export type SynergyBonus = {
  type: 'atkUp' | 'defUp' | 'hpUp' | 'speedUp' | 'critRateUp' | 'critDmgUp';
  value: number;
};

export type SynergyTier = {
  threshold: number;
  name: string;
  bonuses: SynergyBonus[];
};

export type SynergyData = {
  profession: Profession;
  name: string;
  tiers: SynergyTier[];
};

export type ActiveSynergy = {
  profession: Profession;
  name: string;
  tierName: string;
  tierIndex: number;
  count: number;
  bonuses: SynergyBonus[];
};

export type FormationSlot = {
  index: number;
  characterId: CharacterId | null;
  team: Team;
};
