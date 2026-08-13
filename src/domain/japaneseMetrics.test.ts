import { describe, expect, it } from "vitest";
import type { JapaneseSessionMode, JlptWrongCategory, StudySession } from "./types";
import { calculateJapaneseCoreCompletion, calculateJapaneseHistoryStats } from "./japaneseMetrics";

const session = (id: string, japaneseMode: JapaneseSessionMode | undefined, dailyPlanId = "plan-1"): StudySession => ({
  id,
  dailyPlanId,
  type: japaneseMode === "ankiVocabulary" ? "anki" : "japanese",
  title: id,
  japaneseMode,
  plannedDurationMinutes: 20,
  status: "completed",
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

describe("Japanese completion rules", () => {
  const anki = session("anki", "ankiVocabulary");
  const grammar = session("grammar", "ankiGrammar");
  const yuhadayo = session("yuhadayo", "yuhadayo");
  const reading = { ...session("reading", "todaiiReading"), todaiiMode: "reading" as const };
  const practice = session("practice", "jlptPractice");

  it("Basic은 Anki Review와 Yuhadayo로 완료한다", () => {
    expect(calculateJapaneseCoreCompletion("basic", [anki, yuhadayo], "green")).toBe(true);
    expect(calculateJapaneseCoreCompletion("basic", [anki], "green")).toBe(false);
  });

  it("LevelUp은 Grammar Review도 필요하다", () => {
    expect(calculateJapaneseCoreCompletion("levelUp", [anki, yuhadayo], "green")).toBe(false);
    expect(calculateJapaneseCoreCompletion("levelUp", [anki, grammar, yuhadayo], "green")).toBe(true);
  });

  it("N3는 Reading 또는 Listening을 포함한다", () => {
    expect(calculateJapaneseCoreCompletion("n3", [anki, yuhadayo, reading], "green")).toBe(true);
  });

  it("N3 Exam Prep은 Practice/Error Review와 Reading/Listening을 포함한다", () => {
    expect(calculateJapaneseCoreCompletion("n3ExamPrep", [anki, practice, reading], "green")).toBe(true);
    expect(calculateJapaneseCoreCompletion("n3ExamPrep", [anki, practice], "green")).toBe(false);
  });

  it("legacy Japanese session을 기존 core 완료로 읽는다", () => {
    const legacy = { ...session("legacy", undefined), type: "japanese" as const };
    expect(calculateJapaneseCoreCompletion("basic", [legacy], "green")).toBe(true);
  });
});

describe("Japanese history statistics", () => {
  it("mode와 JLPT 오답 category를 누적한다", () => {
    const anki = { ...session("anki", "ankiVocabulary"), newVocabularyCount: 18 };
    const practice = { ...session("practice", "jlptPractice"), jlptWrongCategories: ["grammar", "reading"] as JlptWrongCategory[] };
    const mixed = { ...session("mixed", "todaiiReading"), todaiiMode: "mixed" as const };
    const stats = calculateJapaneseHistoryStats([anki, practice, mixed]);
    expect(stats.ankiReviewDays).toBe(1);
    expect(stats.newVocabularyCount).toBe(18);
    expect(stats.readingSessions).toBe(1);
    expect(stats.listeningSessions).toBe(1);
    expect(stats.wrongAnswers.grammar).toBe(1);
    expect(stats.wrongAnswers.reading).toBe(1);
  });
});
