import type {
  AppSettings,
  DailyPlan,
  JapaneseSessionMode,
  JapaneseSettings,
  JlptPracticeType,
  StudySession,
  StudySessionDraft,
  TodaiiMode
} from "./types";

export const JLPT_PRACTICE_PRESETS: Record<Exclude<JlptPracticeType, "custom">, number> = {
  vocabulary: 30,
  grammar: 70,
  reading: 70,
  listening: 40,
  mixed: 70
};

export function applyJlptPracticeType(
  session: StudySession,
  type: JlptPracticeType,
  customMinutes?: number
): StudySession;
export function applyJlptPracticeType(
  session: StudySessionDraft,
  type: JlptPracticeType,
  customMinutes?: number
): StudySessionDraft;
export function applyJlptPracticeType(
  session: StudySessionDraft | StudySession,
  type: JlptPracticeType,
  customMinutes = session.plannedDurationMinutes
): StudySessionDraft | StudySession {
  const minutes = type === "custom" ? Math.max(1, Math.min(180, customMinutes)) : JLPT_PRACTICE_PRESETS[type];
  const startedAt = "startedAt" in session ? session.startedAt : undefined;
  return {
    ...session,
    jlptPracticeType: type,
    plannedDurationMinutes: minutes,
    ...("expectedEndAt" in session && startedAt ? { expectedEndAt: startedAt + minutes * 60_000 + session.totalPausedDurationMs } : {})
  };
}

const sessionDraft = (
  type: StudySessionDraft["type"],
  title: string,
  goal: string | undefined,
  minutes: number,
  order: number,
  metadata: Partial<StudySessionDraft> = {}
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
  isOptional: false,
  order,
  ...metadata
});

function todaiiJapaneseMode(mode: TodaiiMode): JapaneseSessionMode {
  return mode === "listening" ? "todaiiListening" : "todaiiReading";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createJapaneseRoutine(
  plan: Pick<DailyPlan, "energyLevel" | "japaneseGoal">,
  japanese: JapaneseSettings,
  timers: AppSettings
): StudySessionDraft[] {
  const drafts: StudySessionDraft[] = [];
  const add = (
    type: StudySessionDraft["type"],
    title: string,
    mode: JapaneseSessionMode,
    minutes: number,
    metadata: Partial<StudySessionDraft> = {}
  ) => drafts.push(sessionDraft(type, title, plan.japaneseGoal, minutes, drafts.length + 1, {
    japaneseMode: mode,
    japanesePhase: japanese.phase,
    ...metadata
  }));

  const hasVocabularyDeck = japanese.ankiVocabularyEnabled || japanese.ankiKanjiEnabled;
  if (hasVocabularyDeck) {
    const ankiMinutes = plan.energyLevel === "green" ? clamp(timers.ankiMinutes, 20, 30) : clamp(timers.ankiMinutes, 15, 20);
    add("anki", plan.energyLevel === "red" ? "Anki Review" : "Japanese Warm-up · Anki", "ankiVocabulary", ankiMinutes);
  }

  if (plan.energyLevel === "red") {
    add(
      "japanese",
      japanese.phase === "basic" ? "Japanese Minimum · Yuhadayo" : "Japanese Minimum · Yuhadayo / Review",
      "yuhadayo",
      clamp(timers.japaneseMinutes, japanese.phase === "basic" ? 10 : 15, 20),
      { yuhadayoCourse: japanese.yuhadayoCurrentCourse, yuhadayoLesson: japanese.yuhadayoCurrentLesson }
    );
    return drafts;
  }

  if (japanese.ankiGrammarEnabled) {
    add("japanese", "Japanese · Grammar Anki", "ankiGrammar", plan.energyLevel === "green" ? 15 : 10, {
      isOptional: japanese.phase === "n3ExamPrep"
    });
  }

  if (japanese.phase === "n3ExamPrep") {
    add("japanese", "Japanese · Error Review", "errorReview", plan.energyLevel === "green" ? 30 : 20);
    add("japanese", "JLPT Practice", "jlptPractice", JLPT_PRACTICE_PRESETS.mixed, {
      jlptPracticeType: "mixed"
    });
  } else {
    add("japanese", "Yuhadayo Deep Study", "yuhadayo", plan.energyLevel === "green" ? clamp(timers.japaneseMinutes, 45, 50) : clamp(timers.japaneseMinutes, 35, 45), {
      yuhadayoCourse: japanese.yuhadayoCurrentCourse,
      yuhadayoLesson: japanese.yuhadayoCurrentLesson
    });
    add("japanese", "Japanese Recall", "recall", 10);
  }

  if (japanese.todaiiEnabled || japanese.phase === "n3" || japanese.phase === "n3ExamPrep") {
    add("japanese", japanese.phase === "n3ExamPrep" ? "JLPT Reading / Listening" : "Todaii", todaiiJapaneseMode(japanese.todaiiDefaultMode), plan.energyLevel === "green" ? 35 : 25, {
      todaiiMode: japanese.todaiiDefaultMode,
      isOptional: plan.energyLevel === "yellow"
    });
  }

  return drafts;
}

export function createJapaneseWeaknessSession(
  plan: Pick<DailyPlan, "japaneseWeakness" | "supportGoal" | "energyLevel">,
  japanese: JapaneseSettings,
  timers: AppSettings
): StudySessionDraft | undefined {
  if (!plan.japaneseWeakness) return undefined;
  const modeByWeakness: Record<NonNullable<DailyPlan["japaneseWeakness"]>, JapaneseSessionMode> = {
    vocabulary: "ankiVocabulary",
    grammar: "ankiGrammar",
    reading: "todaiiReading",
    listening: "todaiiListening"
  };
  return sessionDraft("japanese", `JLPT Weakness · ${plan.japaneseWeakness[0].toUpperCase()}${plan.japaneseWeakness.slice(1)}`, plan.supportGoal, clamp(timers.supportMinutes, 30, 40), 1, {
    japaneseMode: modeByWeakness[plan.japaneseWeakness],
    japanesePhase: japanese.phase,
    todaiiMode: plan.japaneseWeakness === "listening" ? "listening" : plan.japaneseWeakness === "reading" ? "reading" : undefined,
    isOptional: plan.energyLevel === "yellow"
  });
}
