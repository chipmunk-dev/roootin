import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StudySession } from "../../domain/types";
import { SessionSwitchModal } from "./SessionSwitchModal";

function session(overrides: Partial<StudySession>): StudySession {
  return {
    id: "graphics",
    dailyPlanId: "plan",
    type: "graphics",
    title: "Graphics Deep #1",
    plannedDurationMinutes: 50,
    startedAt: Date.now() - 8 * 60_000,
    expectedEndAt: Date.now() + 42 * 60_000,
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
    order: 1,
    ...overrides
  };
}

describe("SessionSwitchModal", () => {
  it("20분 전에 변경하면 권장 문구를 보여주되 최종 변경은 허용한다", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    const current = session({});
    const japanese = session({ id: "japanese", type: "japanese", title: "Japanese", status: "pending", startedAt: undefined, expectedEndAt: undefined, order: 2 });

    render(<SessionSwitchModal session={current} sessions={[current, japanese]} minimumMinutes={20} onClose={() => undefined} onSwitch={onSwitch} />);
    await user.click(screen.getByRole("button", { name: "집중력 저하" }));
    await user.click(screen.getByRole("button", { name: "Japanese" }));

    expect(screen.getByText("현재 세션을 시작한 지 8분입니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "그래도 변경" }));
    expect(onSwitch).toHaveBeenCalledWith("japanese", "lowFocus");
  });
});
