import { create } from 'zustand';
import { BattleState, Team, CharacterId, ActiveSynergy } from '@/types';
import { initBattle } from '@/engine/battle';
import { calculateSynergies } from '@/engine/synergy';

interface GameStore {
  blueFormation: CharacterId[];
  redFormation: CharacterId[];
  battleState: BattleState | null;
  addToFormation: (team: Team, characterId: CharacterId) => void;
  removeFromFormation: (team: Team, index: number) => void;
  startBattle: () => void;
  resetBattle: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  setSelectedUnit: (id: string | null) => void;
  togglePause: () => void;
  getBlueSynergies: () => ActiveSynergy[];
  getRedSynergies: () => ActiveSynergy[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  blueFormation: ['zhaoyun', 'huangzhong', 'zhugeliang', 'huatuo'],
  redFormation: ['caocao', 'lubu', 'zuoci', 'zhangfei'],
  battleState: null,

  addToFormation: (team, characterId) =>
    set((state) => {
      const key = team === 'blue' ? 'blueFormation' : 'redFormation';
      const formation = state[key];
      if (formation.length >= 8) return state;
      return { [key]: [...formation, characterId] };
    }),

  removeFromFormation: (team, index) =>
    set((state) => {
      const key = team === 'blue' ? 'blueFormation' : 'redFormation';
      const formation = [...state[key]];
      formation.splice(index, 1);
      return { [key]: formation };
    }),

  startBattle: () =>
    set((state) => ({
      battleState: initBattle(state.blueFormation, state.redFormation),
    })),

  resetBattle: () => set({ battleState: null }),

  setSpeed: (speed) =>
    set((state) => {
      if (!state.battleState) return state;
      return { battleState: { ...state.battleState, speed } };
    }),

  setSelectedUnit: (id) =>
    set((state) => {
      if (!state.battleState) return state;
      return { battleState: { ...state.battleState, selectedUnitId: id } };
    }),

  togglePause: () =>
    set((state) => {
      if (!state.battleState) return state;
      const phase = state.battleState.phase === 'running' ? 'paused' : 'running';
      return { battleState: { ...state.battleState, phase } };
    }),

  getBlueSynergies: () => calculateSynergies(get().blueFormation),
  getRedSynergies: () => calculateSynergies(get().redFormation),
}));
