import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_JAPANESE_SETTINGS } from "../../config/defaults";
import { JapaneseSettingsSection } from "./JapaneseSettingsSection";

describe("JapaneseSettingsSection", () => {
  it("confirmation 후 Basic을 LevelUp으로 바꾸고 Grammar를 활성화한다", async () => {
    const user = userEvent.setup();
    const onCompleteBasic = vi.fn().mockResolvedValue(undefined);
    render(<JapaneseSettingsSection value={{ ...DEFAULT_JAPANESE_SETTINGS }} onChange={() => undefined} onCompleteBasic={onCompleteBasic} />);

    expect(screen.getByText("문법 카드는 기초일본어 종료 후 시작합니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "기초일본어 완료" }));
    const dialog = screen.getByRole("dialog", { name: "기초일본어를 완료했나요?" });
    await user.click(within(dialog).getByRole("button", { name: "완료" }));

    expect(onCompleteBasic).toHaveBeenCalledWith(expect.objectContaining({ phase: "levelUp", ankiGrammarEnabled: true }));
  });
});
