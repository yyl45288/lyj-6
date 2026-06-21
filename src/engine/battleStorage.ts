import { BattleRecording } from '../types';

const STORAGE_KEY = 'battle_recordings';
const MAX_RECORDINGS = 10;

export function loadAllRecordings(): BattleRecording[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecording(recording: BattleRecording): void {
  const recordings = loadAllRecordings();

  recordings.unshift(recording);

  while (recordings.length > MAX_RECORDINGS) {
    recordings.pop();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
  } catch (e) {
    console.error('Failed to save battle recording:', e);
  }
}

export function deleteRecording(recordingId: string): void {
  const recordings = loadAllRecordings();
  const filtered = recordings.filter((r) => r.id !== recordingId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete battle recording:', e);
  }
}

export function clearAllRecordings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear battle recordings:', e);
  }
}

export function getRecordingById(recordingId: string): BattleRecording | null {
  const recordings = loadAllRecordings();
  return recordings.find((r) => r.id === recordingId) ?? null;
}

export const MAX_BATTLE_RECORDINGS = MAX_RECORDINGS;
