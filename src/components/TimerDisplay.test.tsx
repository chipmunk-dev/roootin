import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimerDisplay } from "./TimerDisplay";

describe("TimerDisplay", () => {
  it("초를 읽기 쉬운 타이머로 표시하고 screen reader를 계속 방해하지 않는다", () => {
    render(<TimerDisplay seconds={2_597} />);
    const timer = screen.getByRole("timer", { name: "남은 시간 43:17" });
    expect(timer).toHaveTextContent("43:17");
    expect(timer).toHaveAttribute("aria-live", "off");
  });
});
