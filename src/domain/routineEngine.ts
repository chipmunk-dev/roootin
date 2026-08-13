import type { AppSettings, DailyPlan, StudySession, StudySessionDraft } from "./types";
import { createId } from "../shared/id";
import { createJapaneseRoutine, createJapaneseWeaknessSession } from "./japaneseRoutineEngine";

const baseDraft = (
  type: StudySessionDraft["type"],
  title: string,
  goal: string | undefined,
  minutes: number,
  order: number,
  isOptional = false
): StudySessionDraft => ({
  type,
  title,
  goal,
  plannedDurationMinutes: minutes,
  status: "pending",
  elapsedSeconds: 0,
  totalPausedDurationMs: 0,
  extendedSeconds: 0,
  distractionCount: 0,
  rescueCount: 0,
  successfulRescueCount: 0,
  tabHiddenCount: 0,
  tabHiddenDurationSeconds: 0,
  unplannedExitCount: 0,
  isOptional,
  order
});

export function createRoutine(plan: DailyPlan, settings: AppSettings): StudySessionDraft[] {
  const drafts: StudySessionDraft[] = [];
  const japaneseRoutine = createJapaneseRoutine(plan, settings.japanese, settings);
  const add = (
    type: StudySessionDraft["type"],
    title: string,
    goal: string | undefined,
    minutes: number,
    optional = false
  ) => drafts.push(baseDraft(type, title, goal, minutes, drafts.length + 1, optional));
  const addDraft = (draft: StudySessionDraft) => drafts.push({ ...draft, order: drafts.length + 1 });

  if (plan.energyLevel === "red") {
    japaneseRoutine.forEach(addDraft);
    add("graphics", "Graphics Review", plan.graphicsGoal, Math.min(30, Math.max(20, settings.deepFocusMinutes)));
    return drafts;
  }

  japaneseRoutine.filter((session) => session.japaneseMode === "ankiVocabulary" || session.japaneseMode === "ankiGrammar").forEach(addDraft);
  add("graphics", "Graphics Deep #1", plan.graphicsGoal, settings.deepFocusMinutes);
  add("microBreak", "Micro Break", undefined, settings.microBreakMinutes);
  add("graphics", "Graphics Deep #2", plan.graphicsGoal, settings.deepFocusMinutes, plan.energyLevel === "yellow");

  if (plan.energyLevel === "green") {
    add("longBreak", "Long Break", undefined, settings.longBreakMinutes);
  }

  japaneseRoutine.filter((session) => session.japaneseMode !== "ankiVocabulary" && session.japaneseMode !== "ankiGrammar").forEach((session) => {
    addDraft(session);
    if (session.japaneseMode === "recall") add("microBreak", "Micro Break", undefined, settings.microBreakMinutes);
  });

  if (plan.energyLevel === "green") {
    add("longBreak", "Meal / Long Break", undefined, settings.longBreakMinutes);
    add("entertainmentBreak", "Entertainment Break", undefined, settings.entertainmentMinutes, true);
  }

  if (plan.supportType === "math") {
    add("math", "Math", plan.supportGoal, settings.supportMinutes, plan.energyLevel === "yellow");
    add("graphics", "Graphics Apply", plan.graphicsGoal, settings.deepFocusMinutes, plan.energyLevel === "yellow");
  } else if (plan.supportType === "certification") {
    add("certification", "Certification", plan.supportGoal, Math.min(40, Math.max(30, settings.supportMinutes)), plan.energyLevel === "yellow");
  } else if (plan.supportType === "japaneseWeakness") {
    const weaknessSession = createJapaneseWeaknessSession(plan, settings.japanese, settings);
    if (weaknessSession) addDraft(weaknessSession);
  }

  if (plan.projectEnabled) {
    add("project", "Project", plan.graphicsGoal, settings.projectMinutes, true);
  }

  return drafts;
}

export function materializeRoutine(plan: DailyPlan, settings: AppSettings): StudySession[] {
  return createRoutine(plan, settings).map((draft) => ({
    ...draft,
    id: createId("session"),
    dailyPlanId: plan.id
  }));
}

export function isFocusSession(session: Pick<StudySession, "type">): boolean {
  return !["microBreak", "longBreak", "entertainmentBreak", "rescue"].includes(session.type);
}

export function isCoreSession(session: Pick<StudySession, "type" | "title">): boolean {
  return session.type === "graphics" || session.type === "japanese" || session.type === "anki";
}
