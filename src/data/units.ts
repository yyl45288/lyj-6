import { CharacterId, CharacterTemplate, Profession, SynergyData } from '../types';

export const PROFESSION_NAMES: Record<Profession, string> = {
  warrior: '战士',
  knight: '骑士',
  archer: '射手',
  mage: '法师',
  assassin: '刺客',
  priest: '牧师',
  warlock: '术士',
};

export const PROFESSION_EMOJI: Record<Profession, string> = {
  warrior: '⚔️',
  knight: '🛡️',
  archer: '🏹',
  mage: '🔮',
  assassin: '🗡️',
  priest: '✨',
  warlock: '💀',
};

const baseSkills = {
  warrior: [
    { id: 'warrior_slam', name: '猛击', type: 'damage' as const, value: 25, range: 1, cd: 3 },
    { id: 'warrior_warcry', name: '战吼', type: 'buff' as const, value: 0, range: 2, cd: 5,
      buffEffect: { name: '攻击提升', type: 'atkUp' as const, value: 5, duration: 3, stackable: false } },
  ],
  knight: [
    { id: 'knight_shield_bash', name: '盾击', type: 'damage' as const, value: 18, range: 1, cd: 2 },
    { id: 'knight_guardian_shield', name: '守护之盾', type: 'buff' as const, value: 15, range: 0, cd: 4,
      buffEffect: { name: '护盾', type: 'shield' as const, value: 15, duration: 2, stackable: false } },
  ],
  archer: [
    { id: 'archer_precise_shot', name: '精准射击', type: 'damage' as const, value: 35, range: 4, cd: 3 },
    { id: 'archer_arrow_rain', name: '箭雨', type: 'aoe' as const, value: 15, range: 3, cd: 5, aoeRadius: 2 },
  ],
  mage: [
    { id: 'mage_fireball', name: '火球术', type: 'damage' as const, value: 40, range: 3, cd: 3 },
    { id: 'mage_blizzard', name: '暴风雪', type: 'aoe' as const, value: 20, range: 3, cd: 5, aoeRadius: 2,
      buffEffect: { name: '攻击降低', type: 'atkDown' as const, value: 5, duration: 2, stackable: false } },
  ],
  assassin: [
    { id: 'assassin_shadow_strike', name: '暗影突袭', type: 'damage' as const, value: 30, range: 1, cd: 3 },
    { id: 'assassin_stealth', name: '隐匿', type: 'buff' as const, value: 0, range: 0, cd: 4,
      buffEffect: { name: '攻击提升', type: 'atkUp' as const, value: 8, duration: 2, stackable: false } },
  ],
  priest: [
    { id: 'priest_heal', name: '治疗术', type: 'heal' as const, value: 30, range: 3, cd: 2 },
    { id: 'priest_blessing', name: '神圣祝福', type: 'buff' as const, value: 10, range: 2, cd: 5,
      buffEffect: { name: '护盾', type: 'shield' as const, value: 10, duration: 2, stackable: false } },
  ],
  warlock: [
    { id: 'warlock_shadow_erode', name: '暗影侵蚀', type: 'debuff' as const, value: 20, range: 3, cd: 3,
      buffEffect: { name: '暗影侵蚀', type: 'dot' as const, value: 8, duration: 3, stackable: true } },
    { id: 'warlock_weakness_curse', name: '虚弱诅咒', type: 'debuff' as const, value: 8, range: 3, cd: 4,
      buffEffect: { name: '虚弱', type: 'atkDown' as const, value: 6, duration: 2, stackable: false } },
  ],
};

export const CHARACTER_TEMPLATES: Record<CharacterId, CharacterTemplate> = {
  zhaoyun: { characterId: 'zhaoyun', name: '赵云', profession: 'warrior', maxHp: 130, maxMp: 35, atk: 18, def: 10, speed: 6, moveRange: 3, attackRange: 1, critRate: 0.1, critDmg: 1.6, skills: baseSkills.warrior },
  zhangfei: { characterId: 'zhangfei', name: '张飞', profession: 'warrior', maxHp: 140, maxMp: 25, atk: 20, def: 8, speed: 4, moveRange: 2, attackRange: 1, critRate: 0.08, critDmg: 1.7, skills: baseSkills.warrior },
  guanyu: { characterId: 'guanyu', name: '关羽', profession: 'warrior', maxHp: 125, maxMp: 30, atk: 22, def: 12, speed: 5, moveRange: 2, attackRange: 1, critRate: 0.12, critDmg: 1.8, skills: baseSkills.warrior },
  xuchu: { characterId: 'xuchu', name: '许褚', profession: 'warrior', maxHp: 135, maxMp: 20, atk: 17, def: 14, speed: 4, moveRange: 2, attackRange: 1, critRate: 0.05, critDmg: 1.5, skills: baseSkills.warrior },
  dianwei: { characterId: 'dianwei', name: '典韦', profession: 'warrior', maxHp: 120, maxMp: 25, atk: 19, def: 13, speed: 5, moveRange: 2, attackRange: 1, critRate: 0.07, critDmg: 1.6, skills: baseSkills.warrior },

  caocao: { characterId: 'caocao', name: '曹操', profession: 'knight', maxHp: 115, maxMp: 45, atk: 14, def: 16, speed: 5, moveRange: 3, attackRange: 1, critRate: 0.06, critDmg: 1.4, skills: baseSkills.knight },
  xiahoudun: { characterId: 'xiahoudun', name: '夏侯惇', profession: 'knight', maxHp: 120, maxMp: 35, atk: 15, def: 15, speed: 4, moveRange: 3, attackRange: 1, critRate: 0.07, critDmg: 1.4, skills: baseSkills.knight },
  caoren: { characterId: 'caoren', name: '曹仁', profession: 'knight', maxHp: 125, maxMp: 30, atk: 12, def: 18, speed: 3, moveRange: 2, attackRange: 1, critRate: 0.04, critDmg: 1.3, skills: baseSkills.knight },
  zhangliao: { characterId: 'zhangliao', name: '张辽', profession: 'knight', maxHp: 110, maxMp: 40, atk: 16, def: 14, speed: 5, moveRange: 3, attackRange: 1, critRate: 0.08, critDmg: 1.5, skills: baseSkills.knight },
  huanggai: { characterId: 'huanggai', name: '黄盖', profession: 'knight', maxHp: 118, maxMp: 35, atk: 13, def: 17, speed: 4, moveRange: 2, attackRange: 1, critRate: 0.05, critDmg: 1.3, skills: baseSkills.knight },

  huangzhong: { characterId: 'huangzhong', name: '黄忠', profession: 'archer', maxHp: 65, maxMp: 40, atk: 25, def: 6, speed: 6, moveRange: 2, attackRange: 5, critRate: 0.18, critDmg: 2.1, skills: baseSkills.archer },
  xiahouyuan: { characterId: 'xiahouyuan', name: '夏侯渊', profession: 'archer', maxHp: 60, maxMp: 35, atk: 24, def: 5, speed: 7, moveRange: 3, attackRange: 4, critRate: 0.2, critDmg: 2.0, skills: baseSkills.archer },
  taishi: { characterId: 'taishi', name: '太史慈', profession: 'archer', maxHp: 62, maxMp: 38, atk: 23, def: 6, speed: 6, moveRange: 2, attackRange: 4, critRate: 0.17, critDmg: 2.0, skills: baseSkills.archer },
  ganning: { characterId: 'ganning', name: '甘宁', profession: 'archer', maxHp: 58, maxMp: 32, atk: 26, def: 4, speed: 8, moveRange: 3, attackRange: 4, critRate: 0.16, critDmg: 2.2, skills: baseSkills.archer },
  lingtong: { characterId: 'lingtong', name: '凌统', profession: 'archer', maxHp: 55, maxMp: 30, atk: 22, def: 5, speed: 7, moveRange: 2, attackRange: 4, critRate: 0.15, critDmg: 1.9, skills: baseSkills.archer },

  zhugeliang: { characterId: 'zhugeliang', name: '诸葛亮', profession: 'mage', maxHp: 55, maxMp: 70, atk: 30, def: 4, speed: 5, moveRange: 2, attackRange: 4, critRate: 0.12, critDmg: 1.9, skills: baseSkills.mage },
  simayi: { characterId: 'simayi', name: '司马懿', profession: 'mage', maxHp: 52, maxMp: 65, atk: 28, def: 5, speed: 6, moveRange: 2, attackRange: 3, critRate: 0.1, critDmg: 1.8, skills: baseSkills.mage },
  zhouyu: { characterId: 'zhouyu', name: '周瑜', profession: 'mage', maxHp: 50, maxMp: 68, atk: 29, def: 3, speed: 7, moveRange: 2, attackRange: 3, critRate: 0.11, critDmg: 1.9, skills: baseSkills.mage },
  guojia: { characterId: 'guojia', name: '郭嘉', profession: 'mage', maxHp: 48, maxMp: 72, atk: 27, def: 4, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.13, critDmg: 2.0, skills: baseSkills.mage },
  pangtong: { characterId: 'pangtong', name: '庞统', profession: 'mage', maxHp: 53, maxMp: 60, atk: 26, def: 5, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.09, critDmg: 1.7, skills: baseSkills.mage },

  lubu: { characterId: 'lubu', name: '吕布', profession: 'assassin', maxHp: 80, maxMp: 45, atk: 28, def: 6, speed: 10, moveRange: 4, attackRange: 1, critRate: 0.3, critDmg: 2.8, skills: baseSkills.assassin },
  zhaozilong: { characterId: 'zhaozilong', name: '赵子龙', profession: 'assassin', maxHp: 75, maxMp: 40, atk: 26, def: 5, speed: 9, moveRange: 4, attackRange: 1, critRate: 0.28, critDmg: 2.6, skills: baseSkills.assassin },
  sunshangxiang: { characterId: 'sunshangxiang', name: '孙尚香', profession: 'assassin', maxHp: 72, maxMp: 38, atk: 25, def: 4, speed: 10, moveRange: 4, attackRange: 1, critRate: 0.26, critDmg: 2.5, skills: baseSkills.assassin },
  weiyan: { characterId: 'weiyan', name: '魏延', profession: 'assassin', maxHp: 78, maxMp: 35, atk: 24, def: 7, speed: 8, moveRange: 3, attackRange: 1, critRate: 0.22, critDmg: 2.4, skills: baseSkills.assassin },
  jiangwei: { characterId: 'jiangwei', name: '姜维', profession: 'assassin', maxHp: 74, maxMp: 36, atk: 23, def: 6, speed: 9, moveRange: 4, attackRange: 1, critRate: 0.24, critDmg: 2.3, skills: baseSkills.assassin },

  huatuo: { characterId: 'huatuo', name: '华佗', profession: 'priest', maxHp: 60, maxMp: 80, atk: 10, def: 7, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.06, critDmg: 1.3, skills: baseSkills.priest },
  xiaoqiao: { characterId: 'xiaoqiao', name: '小乔', profession: 'priest', maxHp: 58, maxMp: 75, atk: 9, def: 6, speed: 6, moveRange: 2, attackRange: 3, critRate: 0.05, critDmg: 1.2, skills: baseSkills.priest },
  daqiao: { characterId: 'daqiao', name: '大乔', profession: 'priest', maxHp: 62, maxMp: 70, atk: 8, def: 8, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.04, critDmg: 1.2, skills: baseSkills.priest },
  lusu: { characterId: 'lusu', name: '鲁肃', profession: 'priest', maxHp: 65, maxMp: 72, atk: 9, def: 7, speed: 4, moveRange: 2, attackRange: 3, critRate: 0.05, critDmg: 1.3, skills: baseSkills.priest },
  caizhiwenji: { characterId: 'caizhiwenji', name: '蔡文姬', profession: 'priest', maxHp: 56, maxMp: 78, atk: 7, def: 5, speed: 6, moveRange: 2, attackRange: 3, critRate: 0.06, critDmg: 1.2, skills: baseSkills.priest },

  zuoci: { characterId: 'zuoci', name: '左慈', profession: 'warlock', maxHp: 70, maxMp: 65, atk: 22, def: 6, speed: 6, moveRange: 2, attackRange: 3, critRate: 0.12, critDmg: 1.8, skills: baseSkills.warlock },
  nanhuaman: { characterId: 'nanhuaman', name: '南华老仙', profession: 'warlock', maxHp: 72, maxMp: 60, atk: 21, def: 7, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.1, critDmg: 1.7, skills: baseSkills.warlock },
  diaochan: { characterId: 'diaochan', name: '貂蝉', profession: 'warlock', maxHp: 68, maxMp: 58, atk: 20, def: 5, speed: 7, moveRange: 2, attackRange: 3, critRate: 0.11, critDmg: 1.6, skills: baseSkills.warlock },
  lvmeng: { characterId: 'lvmeng', name: '吕蒙', profession: 'warlock', maxHp: 75, maxMp: 55, atk: 19, def: 8, speed: 5, moveRange: 2, attackRange: 3, critRate: 0.09, critDmg: 1.6, skills: baseSkills.warlock },
  machao: { characterId: 'machao', name: '马超', profession: 'warlock', maxHp: 65, maxMp: 62, atk: 23, def: 5, speed: 7, moveRange: 3, attackRange: 3, critRate: 0.13, critDmg: 1.7, skills: baseSkills.warlock },
};

export const SYNERGY_DATA: Record<Profession, SynergyData> = {
  warrior: {
    profession: 'warrior',
    name: '战士',
    tiers: [
      { threshold: 2, name: '战士之志', bonuses: [{ type: 'atkUp', value: 5 }] },
      { threshold: 4, name: '狂战之怒', bonuses: [{ type: 'atkUp', value: 10 }, { type: 'defUp', value: 5 }] },
      { threshold: 6, name: '战神附体', bonuses: [{ type: 'atkUp', value: 20 }, { type: 'defUp', value: 10 }, { type: 'hpUp', value: 30 }] },
    ],
  },
  knight: {
    profession: 'knight',
    name: '骑士',
    tiers: [
      { threshold: 2, name: '守护誓言', bonuses: [{ type: 'defUp', value: 8 }] },
      { threshold: 4, name: '钢铁之躯', bonuses: [{ type: 'defUp', value: 15 }, { type: 'hpUp', value: 40 }] },
      { threshold: 6, name: '圣盾军团', bonuses: [{ type: 'defUp', value: 25 }, { type: 'hpUp', value: 80 }, { type: 'atkUp', value: 8 }] },
    ],
  },
  archer: {
    profession: 'archer',
    name: '射手',
    tiers: [
      { threshold: 2, name: '精准打击', bonuses: [{ type: 'critRateUp', value: 0.1 }] },
      { threshold: 4, name: '箭术精通', bonuses: [{ type: 'critRateUp', value: 0.2 }, { type: 'critDmgUp', value: 0.3 }] },
      { threshold: 6, name: '百步穿杨', bonuses: [{ type: 'critRateUp', value: 0.35 }, { type: 'critDmgUp', value: 0.6 }, { type: 'atkUp', value: 10 }] },
    ],
  },
  mage: {
    profession: 'mage',
    name: '法师',
    tiers: [
      { threshold: 2, name: '法术共鸣', bonuses: [{ type: 'atkUp', value: 8 }] },
      { threshold: 4, name: '奥术洪流', bonuses: [{ type: 'atkUp', value: 15 }, { type: 'critRateUp', value: 0.1 }] },
      { threshold: 6, name: '禁咒降临', bonuses: [{ type: 'atkUp', value: 25 }, { type: 'critRateUp', value: 0.2 }, { type: 'critDmgUp', value: 0.4 }] },
    ],
  },
  assassin: {
    profession: 'assassin',
    name: '刺客',
    tiers: [
      { threshold: 2, name: '暗影潜行', bonuses: [{ type: 'speedUp', value: 2 }] },
      { threshold: 4, name: '致命一击', bonuses: [{ type: 'speedUp', value: 3 }, { type: 'critDmgUp', value: 0.5 }] },
      { threshold: 6, name: '死神降临', bonuses: [{ type: 'speedUp', value: 5 }, { type: 'critDmgUp', value: 1.0 }, { type: 'atkUp', value: 15 }] },
    ],
  },
  priest: {
    profession: 'priest',
    name: '牧师',
    tiers: [
      { threshold: 2, name: '神圣祝福', bonuses: [{ type: 'hpUp', value: 30 }] },
      { threshold: 4, name: '生命赞歌', bonuses: [{ type: 'hpUp', value: 60 }, { type: 'defUp', value: 8 }] },
      { threshold: 6, name: '神迹显灵', bonuses: [{ type: 'hpUp', value: 100 }, { type: 'defUp', value: 15 }, { type: 'atkUp', value: 10 }] },
    ],
  },
  warlock: {
    profession: 'warlock',
    name: '术士',
    tiers: [
      { threshold: 2, name: '黑暗契约', bonuses: [{ type: 'atkUp', value: 6 }] },
      { threshold: 4, name: '灵魂虹吸', bonuses: [{ type: 'atkUp', value: 12 }, { type: 'defUp', value: 6 }] },
      { threshold: 6, name: '混沌之源', bonuses: [{ type: 'atkUp', value: 20 }, { type: 'defUp', value: 12 }, { type: 'critRateUp', value: 0.15 }] },
    ],
  },
};

export const ALL_CHARACTERS: CharacterId[] = Object.keys(CHARACTER_TEMPLATES) as CharacterId[];
