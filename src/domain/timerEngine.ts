import type { StudySession } from "./types";

export const SECOND_MS = 1_000;
export const MINUTE_MS = 60 * SECOND_MS;

type TimerFields = Pick<
  StudySession,
  | "plannedDurationMinutes"
  | "status"
  | "startedAt"
  | "expectedEndAt"
  | "pausedAt"
  | "extendedSeconds"
  | "elapsedSeconds"
  | "totalPausedDurationMs"
>;

export function calculateRemainingSeconds(timer: TimerFields, now = Date.now()): number {
  if (timer.status === "pending") return timer.plannedDurationMinutes * 60;
  if (timer.status === "completed" || timer.status === "skipped") return 0;
  if (!timer.expectedEndAt) return Math.max(0, timer.plannedDurationMinutes * 60 - timer.elapsedSeconds);
  const clock = timer.status === "paused" && timer.pausedAt ? timer.pausedAt : now;
  return Math.max(0, Math.ceil((timer.expectedEndAt - clock) / SECOND_MS));
}

export function calculateElapsedSeconds(timer: TimerFields, now = Date.now()): number {
  if (timer.status === "completed" || timer.status === "skipped") return timer.elapsedSeconds;
  if (!timer.startedAt) return timer.elapsedSeconds;
  const clock = timer.status === "paused" && timer.pausedAt ? timer.pausedAt : now;
  return Math.max(0, Math.floor((clock - timer.startedAt - timer.totalPausedDurationMs) / SECOND_MS));
}

export function startTimer<T extends TimerFields>(timer: T, now = Date.now()): T {
  if (timer.status !== "pending") return timer;
  return {
    ...timer,
    status: "running",
    startedAt: now,
    expectedEndAt: now + timer.plannedDurationMinutes * MINUTE_MS,
    pausedAt: undefined
  };
}

export function pauseTimer<T extends TimerFields>(timer: T, now = Date.now()): T {
  if (timer.status !== "running") return timer;
  return {
    ...timer,
    status: "paused",
    pausedAt: now,
    elapsedSeconds: calculateElapsedSeconds(timer, now)
  };
}

export function resumeTimer<T extends TimerFields>(timer: T, now = Date.now()): T {
  if (timer.status !== "paused" || !timer.pausedAt || !timer.expectedEndAt) return timer;
  const pausedDuration = Math.max(0, now - timer.pausedAt);
  return {
    ...timer,
    status: "running",
    pausedAt: undefined,
    expectedEndAt: timer.expectedEndAt + pausedDuration,
    totalPausedDurationMs: timer.totalPausedDurationMs + pausedDuration
  };
}

export function extendExpiredTimer<T extends TimerFields>(timer: T, minutes: number, now = Date.now()): T {
  return {
    ...timer,
    status: "running",
    pausedAt: undefined,
    expectedEndAt: now + minutes * MINUTE_MS,
    extendedSeconds: timer.extendedSeconds + minutes * 60
  };
}

export function isTimerExpired(timer: TimerFields, now = Date.now()): boolean {
  return timer.status === "running" && calculateRemainingSeconds(timer, now) === 0;
}

export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
