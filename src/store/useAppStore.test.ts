import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../config/defaults";
import { db } from "../db/db";
import { getDistraction } from "../db/repository";
import { localDateKey } from "../shared/date";
import { useAppStore } from "./useAppStore";

describe("rescue flow", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useAppStore.setState({
      initialized: false,
      loading: false,
      settings: { ...DEFAULT_SETTINGS },
      currentPlan: undefined,
      sessions: [],
      runningSession: undefined,
      blockers: []
    });
  });

  it("distraction을 저장하고 rescue count를 올린 뒤 복귀 성공을 기록한다", async () => {
    await useAppStore.getState().createDailyPlan({
      energyLevel: "red",
      graphicsGoal: "복습",
      japaneseGoal: "최소 학습",
      supportType: "none",
      projectEnabled: false
    }, localDateKey());
    const first = useAppStore.getState().sessions[0];
    await useAppStore.getState().startSession(first.id, 1_000_000);
    const distraction = await useAppStore.getState().addDistraction(first.id, "YouTube 보기", 1_060_000);

    expect(distraction.text).toBe("YouTube 보기");
    expect(useAppStore.getState().sessions[0].distractionCount).toBe(1);
    expect(useAppStore.getState().sessions[0].rescueCount).toBe(1);

    await useAppStore.getState().finishRescue(first.id, true);
    expect(useAppStore.getState().sessions[0].successfulRescueCount).toBe(1);
    expect((await getDistraction(distraction.id))?.returnedToFocus).toBe(true);
  });
});
