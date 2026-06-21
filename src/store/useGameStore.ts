import { create } from 'zustand';
import { BattleState, Team, CharacterId, ActiveSynergy, BattleReplayState, BattleRecording } from '@/types';
import { initBattle } from '@/engine/battle';
import { calculateSynergies } from '@/engine/synergy';
import { createBattleRecorder, BattleRecorder } from '@/engine/battleRecorder';
import { createBattleReplay, BattleReplay, getAllRecordings } from '@/engine/battleReplay';
import { loadAllRecordings, deleteRecording, clearAllRecordings } from '@/engine/battleStorage';

interface GameStore {
  blueFormation: CharacterId[];
  redFormation: CharacterId[];
  battleState: BattleState | null;
  battleRecorder: BattleRecorder | null;
  battleReplay: BattleReplay | null;
  replayState: BattleReplayState;
  savedRecordings: BattleRecording[];
  lastSavedRecordingId: string | null;
  addToFormation: (team: Team, characterId: CharacterId) => void;
  removeFromFormation: (team: Team, index: number) => void;
  startBattle: () => void;
  resetBattle: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  setSelectedUnit: (id: string | null) => void;
  togglePause: () => void;
  getBlueSynergies: () => ActiveSynergy[];
  getRedSynergies: () => ActiveSynergy[];
  recordBattleSnapshot: (state: BattleState) => void;
  finishBattleRecording: (state: BattleState) => string | null;
  loadRecordings: () => void;
  startReplay: (recordingId: string) => boolean;
  stopReplay: () => void;
  setReplaySnapshotIndex: (index: number) => void;
  setReplayPlaying: (playing: boolean) => void;
  setReplaySpeed: (speed: 1 | 2 | 4) => void;
  replayNext: () => void;
  replayPrevious: () => void;
  replayGoToStart: () => void;
  replayGoToEnd: () => void;
  replayGoToTurn: (turn: number) => void;
  deleteRecording: (recordingId: string) => void;
  clearAllRecordings: () => void;
  setLastSavedRecordingId: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  blueFormation: ['zhaoyun', 'huangzhong', 'zhugeliang', 'huatuo'],
  redFormation: ['caocao', 'lubu', 'zuoci', 'zhangfei'],
  battleState: null,
  battleRecorder: null,
  battleReplay: null,
  replayState: {
    isReplayMode: false,
    currentRecordingId: null,
    currentSnapshotIndex: 0,
    isPlaying: false,
    playSpeed: 1,
  },
  savedRecordings: [],
  lastSavedRecordingId: null,

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
    set((state) => {
      const battleState = initBattle(state.blueFormation, state.redFormation);
      const recorder = createBattleRecorder();
      recorder.start(battleState, state.blueFormation, state.redFormation);
      return {
        battleState,
        battleRecorder: recorder,
        battleReplay: null,
        replayState: {
          isReplayMode: false,
          currentRecordingId: null,
          currentSnapshotIndex: 0,
          isPlaying: false,
          playSpeed: 1,
        },
      };
    }),

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

  recordBattleSnapshot: (state) => {
    const recorder = get().battleRecorder;
    if (recorder && recorder.isActive()) {
      recorder.recordSnapshot(state);
    }
  },

  finishBattleRecording: (state) => {
    const recorder = get().battleRecorder;
    if (recorder && recorder.isActive()) {
      const recording = recorder.finish(state);
      if (recording) {
        set({ lastSavedRecordingId: recording.id });
        get().loadRecordings();
        return recording.id;
      }
    }
    return null;
  },

  loadRecordings: () => {
    const recordings = loadAllRecordings();
    set({ savedRecordings: recordings });
  },

  startReplay: (recordingId) => {
    const replay = createBattleReplay();
    const success = replay.loadRecording(recordingId);
    if (!success) return false;

    const initialState = replay.getCurrentState();
    if (!initialState) return false;

    set({
      battleReplay: replay,
      battleState: initialState,
      battleRecorder: null,
      replayState: {
        isReplayMode: true,
        currentRecordingId: recordingId,
        currentSnapshotIndex: 0,
        isPlaying: false,
        playSpeed: 1,
      },
    });
    return true;
  },

  stopReplay: () => {
    const replay = get().battleReplay;
    if (replay) {
      replay.close();
    }
    set({
      battleReplay: null,
      battleState: null,
      replayState: {
        isReplayMode: false,
        currentRecordingId: null,
        currentSnapshotIndex: 0,
        isPlaying: false,
        playSpeed: 1,
      },
    });
  },

  setReplaySnapshotIndex: (index) => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.goToSnapshot(index);
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
        },
      });
    }
  },

  setReplayPlaying: (playing) => {
    const replay = get().battleReplay;
    if (!replay) return;

    replay.setPlaying(playing);
    set({
      replayState: {
        ...get().replayState,
        isPlaying: playing,
      },
    });
  },

  setReplaySpeed: (speed) => {
    const replay = get().battleReplay;
    if (!replay) return;

    replay.setPlaySpeed(speed);
    set({
      replayState: {
        ...get().replayState,
        playSpeed: speed,
      },
    });
  },

  replayNext: () => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.next();
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
          isPlaying: replay.getIsPlaying(),
        },
      });
    }
  },

  replayPrevious: () => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.previous();
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
        },
      });
    }
  },

  replayGoToStart: () => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.goToStart();
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
        },
      });
    }
  },

  replayGoToEnd: () => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.goToEnd();
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
        },
      });
    }
  },

  replayGoToTurn: (turn) => {
    const replay = get().battleReplay;
    if (!replay) return;

    const state = replay.goToTurn(turn);
    if (state) {
      set({
        battleState: state,
        replayState: {
          ...get().replayState,
          currentSnapshotIndex: replay.getCurrentSnapshotIndex(),
        },
      });
    }
  },

  deleteRecording: (recordingId) => {
    deleteRecording(recordingId);
    get().loadRecordings();
  },

  clearAllRecordings: () => {
    clearAllRecordings();
    set({ savedRecordings: [] });
  },

  setLastSavedRecordingId: (id) => {
    set({ lastSavedRecordingId: id });
  },
}));
