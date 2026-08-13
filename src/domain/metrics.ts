import type { DailyPlan, DailyReview, Distraction, StudySession } from "./types";
import { isFocusSession } from "./routineEngine";
import { calculateJapaneseCoreCompletion } from "./japaneseMetrics";

export interface DayMetrics {
  completedFocusBlocks: number;
  rescueCount: number;
  successfulRescues: number;
  unplannedExitCount: number;
  studySeconds: number;
  coreCompleted: boolean;
  plannedCompletionRate: number;
}

const completed = (sessions: StudySession[], predicate: (session: StudySession) => boolean) =>
  sessions.some((session) => session.status === "completed" && predicate(session));

export function calculateCoreCompletion(plan: DailyPlan, sessions: StudySession[]): boolean {
  if (plan.energyLevel === "red") {
    return (
      calculateJapaneseCoreCompletion(plan.japanesePhase ?? "basic", sessions, plan.energyLevel) &&
      completed(sessions, (session) => session.title === "Graphics Review")
    );
  }

  const graphicsCount = sessions.filter(
    (session) => session.status === "completed" && session.type === "graphics" && session.title.includes("Deep")
  ).length;
  const japaneseDone = calculateJapaneseCoreCompletion(plan.japanesePhase ?? "basic", sessions, plan.energyLevel);
  return plan.energyLevel === "green" ? graphicsCount >= 2 && japaneseDone : graphicsCount >= 1 && japaneseDone;
}

export function calculateDayMetrics(plan: DailyPlan, sessions: StudySession[]): DayMetrics {
  const planned = sessions.filter((session) => !session.isOptional);
  return {
    completedFocusBlocks: sessions.filter((session) => session.status === "completed" && isFocusSession(session)).length,
    rescueCount: sessions.reduce((sum, session) => sum + session.rescueCount, 0),
    successfulRescues: sessions.reduce((sum, session) => sum + session.successfulRescueCount, 0),
    unplannedExitCount: sessions.reduce((sum, session) => sum + session.unplannedExitCount, 0),
    studySeconds: sessions
      .filter(isFocusSession)
      .reduce((sum, session) => sum + session.elapsedSeconds, 0),
    coreCompleted: calculateCoreCompletion(plan, sessions),
    plannedCompletionRate: planned.length === 0 ? 0 : Math.round((planned.filter((session) => session.status === "completed").length / planned.length) * 100)
  };
}

export function rescueSuccessRate(successful: number, attempts: number): number {
  return attempts === 0 ? 0 : Math.round((successful / attempts) * 100);
}

export function returnedDistractionCount(distractions: Distraction[]): number {
  return distractions.filter((item) => item.returnedToFocus).length;
}

export function summarizeReviews(reviews: DailyReview[]) {
  const totalAttempts = reviews.reduce((sum, review) => sum + review.rescueCount, 0);
  const successful = reviews.reduce((sum, review) => sum + review.successfulRescues, 0);
  return {
    focusBlocks: reviews.reduce((sum, review) => sum + review.completedFocusBlocks, 0),
    coreDays: reviews.filter((review) => review.coreCompleted).length,
    rescueAttempts: totalAttempts,
    successfulRescues: successful,
    rescueRate: rescueSuccessRate(successful, totalAttempts),
    unplannedExits: reviews.reduce((sum, review) => sum + review.unplannedExitCount, 0),
    studySeconds: reviews.reduce((sum, review) => sum + review.studySeconds, 0)
  };
}
