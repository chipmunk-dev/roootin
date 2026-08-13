import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_JAPANESE_SETTINGS } from "../config/defaults";
import type { AppSettings, Blocker, DailyPlan, DailyReview, Distraction, StudySession } from "../domain/types";

export class FocusFlowDatabase extends Dexie {
  dailyPlans!: EntityTable<DailyPlan, "id">;
  studySessions!: EntityTable<StudySession, "id">;
  distractions!: EntityTable<Distraction, "id">;
  blockers!: EntityTable<Blocker, "id">;
  dailyReviews!: EntityTable<DailyReview, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor(name = "focus-flow") {
    super(name);
    this.version(1).stores({
      dailyPlans: "id, date, energyLevel, updatedAt",
      studySessions: "id, dailyPlanId, status, type, order, startedAt",
      distractions: "id, sessionId, createdAt",
      blockers: "id, sessionId, createdAt, resolved",
      dailyReviews: "id, dailyPlanId, date, createdAt",
      settings: "id"
    });
    this.version(2).stores({
      dailyPlans: "id, date, energyLevel, updatedAt",
      studySessions: "id, dailyPlanId, status, type, order, startedAt",
      distractions: "id, sessionId, createdAt",
      blockers: "id, sessionId, createdAt, resolved",
      dailyReviews: "id, dailyPlanId, date, createdAt",
      settings: "id"
    }).upgrade(async (transaction) => {
      await transaction.table<AppSettings>("settings").toCollection().modify((settings) => {
        settings.japanese = { ...DEFAULT_JAPANESE_SETTINGS, ...settings.japanese };
      });
    });
  }
}

export const db = new FocusFlowDatabase();
