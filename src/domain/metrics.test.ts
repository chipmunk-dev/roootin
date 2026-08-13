import { describe, expect, it } from "vitest";
import type { DailyPlan, StudySession } from "./types";
import { calculateCoreCompletion, calculateDayMetrics, rescueSuccessRate } from "./metrics";

const plan = (energyLevel: DailyPlan["energyLevel"]): DailyPlan => ({
  id: "plan-1",
  date: "2026-08-13",
  energyLevel,
  graphicsGoal: "g",
  japaneseGoal: "j",
  supportType: "none",
  projectEnabled: false,
  createdAt: 0,
  updatedAt: 0
});

const session = (title: string, type: StudySession["type"], status: StudySession["status"] = "completed"): StudySession => ({
  id: title,
  dailyPlanId: "plan-1",
  type,
  title,
  plannedDurationMinutes: 20,
  status,
  elapsedSeconds: 1_200,
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

describe("daily metrics", () => {
  it("완료된 focus block만 계산한다", () => {
    const sessions = [session("Anki", "anki"), session("Micro Break", "microBreak"), session("Graphics Deep #1", "graphics", "running")];
    expect(calculateDayMetrics(plan("yellow"), sessions).completedFocusBlocks).toBe(1);
    expect(calculateDayMetrics(plan("yellow"), sessions).plannedCompletionRate).toBe(67);
  });

  it("Green은 Graphics 두 블록과 Japanese 완료가 core success다", () => {
    const sessions = [session("Graphics Deep #1", "graphics"), session("Graphics Deep #2", "graphics"), session("Japanese", "japanese")];
    expect(calculateCoreCompletion(plan("green"), sessions)).toBe(true);
  });

  it("Red day 최소 루틴을 정상 성공으로 판정한다", () => {
    const sessions = [session("Anki", "anki"), session("Japanese Minimum", "japanese"), session("Graphics Review", "graphics")];
    expect(calculateCoreCompletion(plan("red"), sessions)).toBe(true);
  });

  it("Rescue success rate를 successful / attempts로 계산한다", () => {
    expect(rescueSuccessRate(8, 10)).toBe(80);
    expect(rescueSuccessRate(0, 0)).toBe(0);
  });
});
