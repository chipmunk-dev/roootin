import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS } from "../../config/defaults";
import type { StudySession } from "../../domain/types";
import { JapaneseFocusPanel } from "./JapaneseFocusPanel";

const ankiSession = (): StudySession => ({
  id: "anki",
  dailyPlanId: "plan",
  type: "anki",
  title: "Japanese Warm-up · Anki",
  japaneseMode: "ankiVocabulary",
  japanesePhase: "basic",
  plannedDurationMinutes: 20,
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

describe("JapaneseFocusPanel", () => {
  it("Basic Anki에서 Review First와 Vocabulary target만 강조한다", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<JapaneseFocusPanel session={ankiSession()} settings={DEFAULT_JAPANESE_SETTINGS} onUpdate={onUpdate} />);

    expect(screen.getByText("REVIEW FIRST")).toBeInTheDocument();
    expect(screen.getByText("Vocabulary/Kanji target: 20")).toBeInTheDocument();
    expect(screen.queryByText("Grammar target: 5")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review 완료" }));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ ankiReviewCompleted: true }));
  });
});
