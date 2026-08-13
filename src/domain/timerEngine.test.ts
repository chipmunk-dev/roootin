import { describe, expect, it } from "vitest";
import type { StudySession } from "./types";
import {
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  isTimerExpired,
  pauseTimer,
  resumeTimer,
  startTimer
} from "./timerEngine";

const pending = (): StudySession => ({
  id: "session-1",
  dailyPlanId: "plan-1",
  type: "graphics",
  title: "Graphics Deep #1",
  plannedDurationMinutes: 50,
  status: "pending",
  elapsedSeconds: 0,
  totalPausedDurationMs: 0,
  extendedSeconds: 0,
  distractionCount: 0,
  rescueCount: 0,
  successfulRescueCount: 0,
  tabHiddenCount: 0,
  tabHiddenDurationSeconds: 0,
  unplannedExitCount: 0,
  isOptional: false,
  order: 1
});

describe("timerEngine", () => {
  it("실제 clock 차이로 남은 시간을 계산한다", () => {
    const timer = startTimer(pending(), 1_000_000);
    expect(calculateRemainingSeconds(timer, 1_060_000)).toBe(49 * 60);
    expect(calculateElapsedSeconds(timer, 1_060_000)).toBe(60);
  });

  it("pause 동안 남은 시간이 줄지 않는다", () => {
    const timer = pauseTimer(startTimer(pending(), 1_000_000), 1_300_000);
    expect(timer.status).toBe("paused");
    expect(calculateRemainingSeconds(timer, 1_900_000)).toBe(45 * 60);
  });

  it("resume 시 종료 시각을 pause 시간만큼 뒤로 옮긴다", () => {
    const started = startTimer(pending(), 1_000_000);
    const paused = pauseTimer(started, 1_300_000);
    const resumed = resumeTimer(paused, 1_900_000);
    expect(resumed.expectedEndAt).toBe(started.expectedEndAt! + 600_000);
    expect(calculateRemainingSeconds(resumed, 1_900_000)).toBe(45 * 60);
  });

  it("새로고침 후 저장된 종료 시각만으로 remaining을 복구한다", () => {
    const restored = { ...startTimer(pending(), 1_000_000) };
    expect(calculateRemainingSeconds(restored, 2_200_000)).toBe(30 * 60);
  });

  it("background에서 callback이 없어도 경과시간을 반영한다", () => {
    const timer = startTimer(pending(), 1_000_000);
    expect(calculateRemainingSeconds(timer, 2_800_000)).toBe(20 * 60);
  });

  it("예정 종료 시각을 넘으면 만료로 판정한다", () => {
    const timer = startTimer(pending(), 1_000_000);
    expect(calculateRemainingSeconds(timer, 4_000_001)).toBe(0);
    expect(isTimerExpired(timer, 4_000_001)).toBe(true);
  });
});
