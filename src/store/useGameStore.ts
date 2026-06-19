import { create } from 'zustand';
import { BattleState, Team, UnitClass } from '@/types';
import { initBattle } from '@/engine/battle';

interface GameStore {
  blueFormation: UnitClass[];
  redFormation: UnitClass[];
  battleState: BattleState | null;
  addToFormation: (team: Team, unitClass: UnitClass) => void;
  removeFromFormation: (team: Team, index: number) => void;
  startBattle: () => void;
  resetBattle: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  setSelectedUnit: (id: string | null) => void;
  togglePause: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  blueFormation: ['warrior', 'archer', 'mage', 'priest'],
  redFormation: ['knight', 'assassin', 'warlock', 'warrior'],
  battleState: null,

  addToFormation: (team, unitClass) =>
    set((state) => {
      const key = team === 'blue' ? 'blueFormation' : 'redFormation';
      const formation = state[key];
      if (formation.length >= 8) return state;
      return { [key]: [...formation, unitClass] };
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
}));
