import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import type { StudySession } from "../domain/types";
import { FocusFlowDatabase } from "./db";

const databaseNames: string[] = [];

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => Dexie.delete(name)));
});

describe("database v2 migration", () => {
  it("기존 plan/session data를 보존하고 legacy Japanese mode를 비워 둔다", async () => {
    const name = `focus-flow-migration-${crypto.randomUUID()}`;
    databaseNames.push(name);
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      dailyPlans: "id, date, energyLevel, updatedAt",
      studySessions: "id, dailyPlanId, status, type, order, startedAt",
      distractions: "id, sessionId, createdAt",
      blockers: "id, sessionId, createdAt, resolved",
      dailyReviews: "id, dailyPlanId, date, createdAt",
      settings: "id"
    });
    await legacy.open();
    await legacy.table("dailyPlans").put({ id: "legacy-plan", date: "2026-08-01", energyLevel: "green", graphicsGoal: "g", japaneseGoal: "j", supportType: "none", projectEnabled: false, createdAt: 1, updatedAt: 1 });
    await legacy.table("studySessions").put({
      id: "legacy-japanese",
      dailyPlanId: "legacy-plan",
      type: "japanese",
      title: "Japanese",
      plannedDurationMinutes: 45,
      status: "completed",
      elapsedSeconds: 2_700,
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
    } satisfies StudySession);
    await legacy.table("settings").put({ id: "app", ankiMinutes: 20, updatedAt: 1 });
    legacy.close();

    const upgraded = new FocusFlowDatabase(name);
    await upgraded.open();
    const plan = await upgraded.dailyPlans.get("legacy-plan");
    const session = await upgraded.studySessions.get("legacy-japanese");
    const settings = await upgraded.settings.get("app");

    expect(plan?.graphicsGoal).toBe("g");
    expect(session?.status).toBe("completed");
    expect(session?.japaneseMode).toBeUndefined();
    expect(settings?.japanese.phase).toBe("basic");
    expect(settings?.japanese.ankiGrammarEnabled).toBe(false);
    upgraded.close();
  });
});
