import { BattleState, BattleSnapshot, BattleRecording, CharacterId, Team } from '../types';
import { saveRecording } from './battleStorage';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class BattleRecorder {
  private recording: BattleRecording | null = null;
  private isRecording: boolean = false;

  start(
    initialState: BattleState,
    blueFormation: CharacterId[],
    redFormation: CharacterId[]
  ): void {
    this.recording = {
      id: `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      startTime: Date.now(),
      endTime: 0,
      blueFormation: [...blueFormation],
      redFormation: [...redFormation],
      winner: null,
      totalTurns: 0,
      snapshots: [],
    };

    this.isRecording = true;
    this.recordSnapshot(initialState);
  }

  recordSnapshot(state: BattleState): void {
    if (!this.isRecording || !this.recording) return;

    const snapshot: BattleSnapshot = {
      turn: state.turn,
      state: deepClone(state),
    };

    this.recording.snapshots.push(snapshot);
    this.recording.totalTurns = state.turn;
  }

  finish(state: BattleState): BattleRecording | null {
    if (!this.isRecording || !this.recording) return null;

    this.recording.endTime = Date.now();
    this.recording.winner = state.winner;
    this.recording.totalTurns = state.turn;

    const finalRecording = deepClone(this.recording);

    saveRecording(finalRecording);

    this.isRecording = false;
    this.recording = null;

    return finalRecording;
  }

  cancel(): void {
    this.isRecording = false;
    this.recording = null;
  }

  isActive(): boolean {
    return this.isRecording;
  }

  getCurrentRecording(): BattleRecording | null {
    return this.recording;
  }
}

export function createBattleRecorder(): BattleRecorder {
  return new BattleRecorder();
}
