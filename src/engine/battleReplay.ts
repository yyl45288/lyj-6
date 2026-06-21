import { BattleState, BattleRecording, BattleSnapshot } from '../types';
import { getRecordingById, loadAllRecordings } from './battleStorage';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class BattleReplay {
  private recording: BattleRecording | null = null;
  private currentSnapshotIndex: number = 0;
  private isPlaying: boolean = false;
  private playSpeed: 1 | 2 | 4 = 1;

  loadRecording(recordingId: string): boolean {
    const recording = getRecordingById(recordingId);
    if (!recording) return false;

    this.recording = recording;
    this.currentSnapshotIndex = 0;
    this.isPlaying = false;
    this.playSpeed = 1;
    return true;
  }

  loadRecordingDirect(recording: BattleRecording): void {
    this.recording = deepClone(recording);
    this.currentSnapshotIndex = 0;
    this.isPlaying = false;
    this.playSpeed = 1;
  }

  getCurrentState(): BattleState | null {
    if (!this.recording) return null;
    const snapshot = this.recording.snapshots[this.currentSnapshotIndex];
    return snapshot ? deepClone(snapshot.state) : null;
  }

  getSnapshotAt(index: number): BattleState | null {
    if (!this.recording) return null;
    if (index < 0 || index >= this.recording.snapshots.length) return null;
    return deepClone(this.recording.snapshots[index].state);
  }

  goToSnapshot(index: number): BattleState | null {
    if (!this.recording) return null;
    const clamped = Math.max(0, Math.min(index, this.recording.snapshots.length - 1));
    this.currentSnapshotIndex = clamped;
    return this.getCurrentState();
  }

  goToTurn(turn: number): BattleState | null {
    if (!this.recording) return null;

    let targetIndex = 0;
    for (let i = 0; i < this.recording.snapshots.length; i++) {
      if (this.recording.snapshots[i].turn <= turn) {
        targetIndex = i;
      }
    }
    this.currentSnapshotIndex = targetIndex;
    return this.getCurrentState();
  }

  next(): BattleState | null {
    if (!this.recording) return null;
    if (this.currentSnapshotIndex < this.recording.snapshots.length - 1) {
      this.currentSnapshotIndex++;
    }
    return this.getCurrentState();
  }

  previous(): BattleState | null {
    if (this.currentSnapshotIndex > 0) {
      this.currentSnapshotIndex--;
    }
    return this.getCurrentState();
  }

  goToStart(): BattleState | null {
    this.currentSnapshotIndex = 0;
    return this.getCurrentState();
  }

  goToEnd(): BattleState | null {
    if (!this.recording) return null;
    this.currentSnapshotIndex = this.recording.snapshots.length - 1;
    return this.getCurrentState();
  }

  setPlaySpeed(speed: 1 | 2 | 4): void {
    this.playSpeed = speed;
  }

  getPlaySpeed(): 1 | 2 | 4 {
    return this.playSpeed;
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSnapshotIndex(): number {
    return this.currentSnapshotIndex;
  }

  getTotalSnapshots(): number {
    return this.recording?.snapshots.length ?? 0;
  }

  getTotalTurns(): number {
    return this.recording?.totalTurns ?? 0;
  }

  getRecording(): BattleRecording | null {
    return this.recording ? deepClone(this.recording) : null;
  }

  getCurrentTurn(): number {
    if (!this.recording) return 0;
    const snapshot = this.recording.snapshots[this.currentSnapshotIndex];
    return snapshot?.turn ?? 0;
  }

  isAtEnd(): boolean {
    if (!this.recording) return true;
    return this.currentSnapshotIndex >= this.recording.snapshots.length - 1;
  }

  isAtStart(): boolean {
    return this.currentSnapshotIndex <= 0;
  }

  getSnapshots(): BattleSnapshot[] {
    return this.recording ? deepClone(this.recording.snapshots) : [];
  }

  close(): void {
    this.recording = null;
    this.currentSnapshotIndex = 0;
    this.isPlaying = false;
  }
}

export function getAllRecordings(): BattleRecording[] {
  return loadAllRecordings();
}

export function createBattleReplay(): BattleReplay {
  return new BattleReplay();
}
