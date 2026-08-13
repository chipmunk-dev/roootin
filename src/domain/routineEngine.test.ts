import { describe, expect, it } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS, DEFAULT_SETTINGS } from "../config/defaults";
import type { DailyPlan, EnergyLevel, SupportType } from "./types";
import { createRoutine } from "./routineEngine";

function plan(energyLevel: EnergyLevel, supportType: SupportType = "none", projectEnabled = true): DailyPlan {
  return {
    id: "plan-1",
    date: "2026-08-13",
    energyLevel,
    graphicsGoal: "View Matrix",
    japaneseGoal: "22강",
    supportType,
    projectEnabled,
    createdAt: 1,
    updatedAt: 1
  };
}

describe("createRoutine", () => {
  it("Green 계획에서 Graphics Deep 2개와 Japanese 상세 흐름을 유지한다", () => {
    const routine = createRoutine(plan("green"), DEFAULT_SETTINGS);
    expect(routine.filter((item) => item.title.startsWith("Graphics Deep"))).toHaveLength(2);
    expect(routine.filter((item) => item.japaneseMode).map((item) => item.japaneseMode)).toEqual([
      "ankiVocabulary", "yuhadayo", "recall", "todaiiReading"
    ]);
    expect(routine.map((item) => item.order)).toEqual(routine.map((_, index) => index + 1));
    expect(routine.map((item) => item.title).slice(0, 10)).toEqual([
      "Japanese Warm-up · Anki",
      "Graphics Deep #1",
      "Micro Break",
      "Graphics Deep #2",
      "Long Break",
      "Yuhadayo Deep Study",
      "Japanese Recall",
      "Micro Break",
      "Todaii",
      "Meal / Long Break"
    ]);
    expect(routine.find((item) => item.type === "entertainmentBreak")?.isOptional).toBe(true);
  });

  it("Yellow 계획에서 후반 블록을 optional로 만든다", () => {
    const routine = createRoutine(plan("yellow", "certification"), DEFAULT_SETTINGS);
    expect(routine.find((item) => item.title === "Graphics Deep #2")?.isOptional).toBe(true);
    expect(routine.find((item) => item.title === "Certification")?.isOptional).toBe(true);
    expect(routine.find((item) => item.japaneseMode === "yuhadayo")?.plannedDurationMinutes).toBe(45);
    expect(routine.find((item) => item.japaneseMode === "todaiiReading")?.isOptional).toBe(true);
  });

  it("Red 계획은 성공 가능한 최소 루틴만 만든다", () => {
    const routine = createRoutine(plan("red", "certification", true), DEFAULT_SETTINGS);
    expect(routine.map((item) => item.title)).toEqual(["Anki Review", "Japanese Minimum · Yuhadayo", "Graphics Review"]);
    expect(routine.some((item) => item.type === "project" || item.type === "certification" || item.type === "math")).toBe(false);
    expect(routine.some((item) => item.japaneseMode === "todaiiReading" || item.japaneseMode === "todaiiListening")).toBe(false);
  });

  it("Basic Phase 기본값에서는 Anki Grammar session을 만들지 않는다", () => {
    const routine = createRoutine(plan("green"), DEFAULT_SETTINGS);
    expect(routine.some((item) => item.japaneseMode === "ankiGrammar")).toBe(false);
  });

  it("LevelUp Phase에서 활성화된 Anki Grammar session을 만든다", () => {
    const settings = { ...DEFAULT_SETTINGS, japanese: { ...DEFAULT_JAPANESE_SETTINGS, phase: "levelUp" as const, ankiGrammarEnabled: true } };
    expect(createRoutine(plan("green"), settings).some((item) => item.japaneseMode === "ankiGrammar")).toBe(true);
  });

  it("N3 Exam Prep에서 JLPT Practice를 만든다", () => {
    const settings = { ...DEFAULT_SETTINGS, japanese: { ...DEFAULT_JAPANESE_SETTINGS, phase: "n3ExamPrep" as const, ankiGrammarEnabled: true } };
    expect(createRoutine(plan("green"), settings).some((item) => item.japaneseMode === "jlptPractice")).toBe(true);
  });

  it("Math support 뒤에 Graphics Apply를 연결한다", () => {
    const titles = createRoutine(plan("green", "math"), DEFAULT_SETTINGS).map((item) => item.title);
    expect(titles.indexOf("Graphics Apply")).toBe(titles.indexOf("Math") + 1);
  });

  it("Certification support에는 Graphics Apply를 만들지 않는다", () => {
    const routine = createRoutine(plan("green", "certification"), DEFAULT_SETTINGS);
    expect(routine.some((item) => item.title === "Certification")).toBe(true);
    expect(routine.some((item) => item.title === "Graphics Apply")).toBe(false);
  });

  it("Japanese weakness support를 30~40분 session으로 만든다", () => {
    const weaknessPlan = { ...plan("green", "japaneseWeakness"), japaneseWeakness: "reading" as const };
    const support = createRoutine(weaknessPlan, DEFAULT_SETTINGS).find((item) => item.title.startsWith("JLPT Weakness"));
    expect(support?.japaneseMode).toBe("todaiiReading");
    expect(support?.plannedDurationMinutes).toBe(40);
  });
});
