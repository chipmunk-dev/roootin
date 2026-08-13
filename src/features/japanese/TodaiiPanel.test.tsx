import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS } from "../../config/defaults";
import type { StudySession } from "../../domain/types";
import { TodaiiPanel } from "./TodaiiPanel";

const session: StudySession = {
  id: "todaii",
  dailyPlanId: "plan",
  type: "japanese",
  title: "Todaii",
  japaneseMode: "todaiiReading",
  japanesePhase: "basic",
  todaiiMode: "reading",
  plannedDurationMinutes: 35,
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

describe("TodaiiPanel", () => {
  it("Basic Reading protocol과 phase recommendation을 보여준다", () => {
    render(<TodaiiPanel session={session} settings={DEFAULT_JAPANESE_SETTINGS} onUpdate={vi.fn()} />);
    expect(screen.getByText("TODAII · N5~N4 수준 추천")).toBeInTheDocument();
    expect(screen.getByText(/사전 없이 먼저 읽기/)).toBeInTheDocument();
    expect(screen.getByText(/글의 주제를 한 문장으로 생각하기/)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/기억할 단어/)).toHaveLength(5);
  });
});
