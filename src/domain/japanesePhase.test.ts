import { describe, expect, it } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS } from "../config/defaults";
import { changeJapanesePhase, completeBasicJapanese, resolveJapanesePhase } from "./japanesePhase";

describe("Japanese phase", () => {
  it("manual selection을 날짜와 무관하게 authoritative하게 사용한다", () => {
    const settings = { ...DEFAULT_JAPANESE_SETTINGS, phase: "n3" as const };
    expect(resolveJapanesePhase(settings, new Date("2026-01-01"))).toBe("n3");
  });

  it("Basic 완료 시 LevelUp으로 이동하고 기본 Grammar를 활성화한다", () => {
    const completed = completeBasicJapanese({ ...DEFAULT_JAPANESE_SETTINGS });
    expect(completed.phase).toBe("levelUp");
    expect(completed.ankiGrammarEnabled).toBe(true);
  });

  it("사용자가 Grammar를 직접 끈 설정은 Basic 완료 시 존중한다", () => {
    const completed = completeBasicJapanese({
      ...DEFAULT_JAPANESE_SETTINGS,
      ankiGrammarEnabled: false,
      ankiGrammarManuallyConfigured: true
    });
    expect(completed.phase).toBe("levelUp");
    expect(completed.ankiGrammarEnabled).toBe(false);
  });

  it("LevelUp을 직접 선택하면 기본 Grammar를 활성화한다", () => {
    const changed = changeJapanesePhase({ ...DEFAULT_JAPANESE_SETTINGS }, "levelUp");
    expect(changed.ankiGrammarEnabled).toBe(true);
  });
});
