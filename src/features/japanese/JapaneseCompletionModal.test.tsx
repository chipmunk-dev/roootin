import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS } from "../../config/defaults";
import type { StudySession } from "../../domain/types";
import { JapaneseCompletionModal } from "./JapaneseCompletionModal";

const practice: StudySession = {
  id: "practice",
  dailyPlanId: "plan",
  type: "japanese",
  title: "JLPT Practice",
  japaneseMode: "jlptPractice",
  plannedDurationMinutes: 70,
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
};

describe("JapaneseCompletionModal", () => {
  it("JLPT 오답 category와 note를 완료 patch로 전달한다", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<JapaneseCompletionModal session={practice} settings={DEFAULT_JAPANESE_SETTINGS} needsReproduction={false} onCancel={() => undefined} onComplete={onComplete} />);
    await user.click(screen.getByRole("checkbox", { name: "Grammar" }));
    await user.click(screen.getByRole("checkbox", { name: "Reading" }));
    await user.type(screen.getByPlaceholderText("선택 입력"), "문장 구조를 놓침");
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ jlptWrongCategories: ["grammar", "reading"], jlptWrongNote: "문장 구조를 놓침" }));
  });
});
