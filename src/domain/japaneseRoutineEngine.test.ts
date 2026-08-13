import { describe, expect, it } from "vitest";
import { applyJlptPracticeType, JLPT_PRACTICE_PRESETS } from "./japaneseRoutineEngine";
import type { StudySession } from "./types";

const practiceSession = (): StudySession => ({
  id: "practice",
  dailyPlanId: "plan",
  type: "japanese",
  title: "JLPT Practice",
  japaneseMode: "jlptPractice",
  plannedDurationMinutes: 70,
  startedAt: 1_000_000,
  expectedEndAt: 5_200_000,
  status: "running",
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

describe("JLPT practice presets", () => {
  it("Vocabulary/Grammar/Reading/Listening preset을 제공한다", () => {
    expect(JLPT_PRACTICE_PRESETS).toMatchObject({ vocabulary: 30, grammar: 70, reading: 70, listening: 40 });
  });

  it("실행 중 practice type 변경 시 저장 duration과 expectedEndAt을 함께 바꾼다", () => {
    const updated = applyJlptPracticeType(practiceSession(), "listening");
    expect(updated.plannedDurationMinutes).toBe(40);
    expect(updated.expectedEndAt).toBe(1_000_000 + 40 * 60_000);
  });
});
