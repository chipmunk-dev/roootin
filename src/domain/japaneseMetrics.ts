import type {
  EnergyLevel,
  JapaneseDailySummary,
  JapanesePhase,
  JlptWrongCategory,
  StudySession
} from "./types";

const completed = (sessions: StudySession[], predicate: (session: StudySession) => boolean) =>
  sessions.some((session) => session.status === "completed" && predicate(session));

const isAnkiReview = (session: StudySession) => session.japaneseMode === "ankiVocabulary" || (session.type === "anki" && session.japaneseMode === undefined);
const isTodaii = (session: StudySession) => session.japaneseMode === "todaiiReading" || session.japaneseMode === "todaiiListening";
const isJapaneseBlock = (session: StudySession) => Boolean(session.japaneseMode) || session.type === "japanese" || session.type === "anki";

export function calculateJapaneseCoreCompletion(
  phase: JapanesePhase,
  sessions: StudySession[],
  energyLevel: EnergyLevel
): boolean {
  const legacyJapaneseDone = completed(sessions, (session) => session.type === "japanese" && session.japaneseMode === undefined);
  if (legacyJapaneseDone) return true;

  const ankiDone = completed(sessions, isAnkiReview);
  const yuhadayoDone = completed(sessions, (session) => session.japaneseMode === "yuhadayo");
  if (energyLevel === "red" || phase === "basic") return ankiDone && yuhadayoDone;

  const grammarDone = completed(sessions, (session) => session.japaneseMode === "ankiGrammar");
  if (phase === "levelUp") return ankiDone && yuhadayoDone && grammarDone;

  const readingOrListeningDone = completed(sessions, (session) => isTodaii(session));
  if (phase === "n3") return ankiDone && yuhadayoDone && readingOrListeningDone;

  const practiceOrErrorDone = completed(sessions, (session) => session.japaneseMode === "jlptPractice" || session.japaneseMode === "errorReview");
  return ankiDone && practiceOrErrorDone && readingOrListeningDone;
}

export function calculateJapaneseDailySummary(sessions: StudySession[]): JapaneseDailySummary {
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const todaiiSessions = completedSessions.filter(isTodaii);
  return {
    ankiReviewCompleted: completedSessions.some(isAnkiReview),
    newVocabularyCount: completedSessions.reduce((sum, session) => sum + (session.newVocabularyCount ?? 0), 0),
    newGrammarCount: completedSessions.reduce((sum, session) => sum + (session.newGrammarCount ?? 0), 0),
    grammarReviewCompleted: completedSessions.some((session) => session.japaneseMode === "ankiGrammar"),
    yuhadayoCompleted: completedSessions.some((session) => session.japaneseMode === "yuhadayo" || (session.type === "japanese" && session.japaneseMode === undefined)),
    todaiiCompleted: todaiiSessions.length > 0,
    todaiiSummary: [...todaiiSessions].reverse().find((session) => session.todaiiSummary)?.todaiiSummary,
    jlptPracticeCompleted: completedSessions.some((session) => session.japaneseMode === "jlptPractice"),
    japaneseFocusBlocks: completedSessions.filter(isJapaneseBlock).length
  };
}

export interface JapaneseHistoryStats {
  ankiReviewDays: number;
  newVocabularyCount: number;
  grammarReviewDays: number;
  yuhadayoSessions: number;
  todaiiSessions: number;
  readingSessions: number;
  listeningSessions: number;
  jlptPracticeSessions: number;
  japaneseFocusBlocks: number;
  wrongAnswers: Record<JlptWrongCategory, number>;
}

function uniquePlanDays(sessions: StudySession[], predicate: (session: StudySession) => boolean): number {
  return new Set(sessions.filter((session) => session.status === "completed" && predicate(session)).map((session) => session.dailyPlanId)).size;
}

export function calculateJapaneseHistoryStats(sessions: StudySession[]): JapaneseHistoryStats {
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const wrongAnswers: Record<JlptWrongCategory, number> = { vocabulary: 0, kanji: 0, grammar: 0, reading: 0, listening: 0 };
  completedSessions.forEach((session) => session.jlptWrongCategories?.forEach((category) => { wrongAnswers[category] += 1; }));
  return {
    ankiReviewDays: uniquePlanDays(sessions, isAnkiReview),
    newVocabularyCount: completedSessions.reduce((sum, session) => sum + (session.newVocabularyCount ?? 0), 0),
    grammarReviewDays: uniquePlanDays(sessions, (session) => session.japaneseMode === "ankiGrammar"),
    yuhadayoSessions: completedSessions.filter((session) => session.japaneseMode === "yuhadayo").length,
    todaiiSessions: completedSessions.filter(isTodaii).length,
    readingSessions: completedSessions.filter((session) => isTodaii(session) && (session.todaiiMode === "reading" || session.todaiiMode === "mixed" || (session.todaiiMode === undefined && session.japaneseMode === "todaiiReading"))).length,
    listeningSessions: completedSessions.filter((session) => isTodaii(session) && (session.todaiiMode === "listening" || session.todaiiMode === "mixed" || (session.todaiiMode === undefined && session.japaneseMode === "todaiiListening"))).length,
    jlptPracticeSessions: completedSessions.filter((session) => session.japaneseMode === "jlptPractice").length,
    japaneseFocusBlocks: completedSessions.filter(isJapaneseBlock).length,
    wrongAnswers
  };
}
