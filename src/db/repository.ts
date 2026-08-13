import { DEFAULT_SETTINGS, normalizeAppSettings } from "../config/defaults";
import type { AppSettings, Blocker, DailyPlan, DailyReview, Distraction, StudySession } from "../domain/types";
import { db } from "./db";

export async function getSettings(): Promise<AppSettings> {
  const saved = await db.settings.get("app");
  if (saved) return normalizeAppSettings(saved);
  const defaults = normalizeAppSettings({ ...DEFAULT_SETTINGS, updatedAt: Date.now() });
  await db.settings.put(defaults);
  return defaults;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put(normalizeAppSettings({ ...settings, id: "app", updatedAt: Date.now() }));
}

export async function getPlanByDate(date: string): Promise<DailyPlan | undefined> {
  return db.dailyPlans.where("date").equals(date).last();
}

export async function getPlan(id: string): Promise<DailyPlan | undefined> {
  return db.dailyPlans.get(id);
}

export async function savePlanWithSessions(plan: DailyPlan, sessions: StudySession[]): Promise<void> {
  await db.transaction("rw", db.dailyPlans, db.studySessions, async () => {
    await db.dailyPlans.put(plan);
    await db.studySessions.bulkPut(sessions);
  });
}

export async function getSessionsForPlan(dailyPlanId: string): Promise<StudySession[]> {
  const sessions = await db.studySessions.where("dailyPlanId").equals(dailyPlanId).toArray();
  return sessions.sort((a, b) => a.order - b.order);
}

export async function getSession(id: string): Promise<StudySession | undefined> {
  return db.studySessions.get(id);
}

export async function saveSession(session: StudySession): Promise<void> {
  await db.studySessions.put(session);
}

export async function getRunningSession(): Promise<StudySession | undefined> {
  const running = await db.studySessions.where("status").anyOf("running", "paused").toArray();
  return running.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
}

export async function saveDistraction(distraction: Distraction): Promise<void> {
  await db.distractions.put(distraction);
}

export async function getDistraction(id: string): Promise<Distraction | undefined> {
  return db.distractions.get(id);
}

export async function saveBlocker(blocker: Blocker): Promise<void> {
  await db.blockers.put(blocker);
}

export async function getBlockersForSession(sessionId: string): Promise<Blocker[]> {
  return db.blockers.where("sessionId").equals(sessionId).sortBy("createdAt");
}

export async function saveReview(review: DailyReview): Promise<void> {
  await db.dailyReviews.put(review);
}

export async function getReviewForPlan(dailyPlanId: string): Promise<DailyReview | undefined> {
  return db.dailyReviews.where("dailyPlanId").equals(dailyPlanId).last();
}

export async function getHistory(fromDate: string): Promise<{ plans: DailyPlan[]; sessions: StudySession[]; reviews: DailyReview[] }> {
  const plans = await db.dailyPlans.where("date").aboveOrEqual(fromDate).sortBy("date");
  const planIds = new Set(plans.map((plan) => plan.id));
  const sessions = (await db.studySessions.toArray()).filter((session) => planIds.has(session.dailyPlanId));
  const reviews = await db.dailyReviews.where("date").aboveOrEqual(fromDate).sortBy("date");
  return { plans, sessions, reviews };
}

export async function exportAllData() {
  const [plans, sessions, reviews, distractions, blockers, settings] = await Promise.all([
    db.dailyPlans.toArray(),
    db.studySessions.toArray(),
    db.dailyReviews.toArray(),
    db.distractions.toArray(),
    db.blockers.toArray(),
    db.settings.toArray()
  ]);
  return { version: 2, exportedAt: Date.now(), plans, sessions, reviews, distractions, blockers, settings };
}
