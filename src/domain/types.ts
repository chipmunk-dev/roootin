export type EnergyLevel = "green" | "yellow" | "red";
export type JapaneseWeakness = "vocabulary" | "grammar" | "reading" | "listening";
export type SupportType = "math" | "japaneseWeakness" | "certification" | "none";

export type JapanesePhase = "basic" | "levelUp" | "n3" | "n3ExamPrep";

export type JapaneseSessionMode =
  | "ankiVocabulary"
  | "ankiGrammar"
  | "yuhadayo"
  | "todaiiReading"
  | "todaiiListening"
  | "jlptPractice"
  | "recall"
  | "errorReview";

export type AnkiLoad = "easy" | "normal" | "heavy";
export type TodaiiMode = "reading" | "listening" | "mixed";
export type JlptPracticeType = "vocabulary" | "grammar" | "reading" | "listening" | "mixed" | "custom";
export type JlptWrongCategory = "vocabulary" | "kanji" | "grammar" | "reading" | "listening";

export interface JapaneseSettings {
  phase: JapanesePhase;
  ankiVocabularyEnabled: boolean;
  ankiKanjiEnabled: boolean;
  ankiGrammarEnabled: boolean;
  ankiGrammarManuallyConfigured?: boolean;
  dailyNewVocabularyTarget: number;
  dailyNewGrammarTarget: number;
  todaiiEnabled: boolean;
  todaiiDefaultMode: TodaiiMode;
  jlptExamDate?: string;
  yuhadayoCurrentCourse?: string;
  yuhadayoCurrentLesson?: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  energyLevel: EnergyLevel;
  graphicsGoal: string;
  japaneseGoal: string;
  japanesePhase?: JapanesePhase;
  supportType: SupportType;
  supportGoal?: string;
  japaneseWeakness?: JapaneseWeakness;
  projectEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SessionType =
  | "anki"
  | "graphics"
  | "japanese"
  | "math"
  | "certification"
  | "project"
  | "microBreak"
  | "longBreak"
  | "entertainmentBreak"
  | "rescue";

export type SessionStatus = "pending" | "running" | "paused" | "completed" | "skipped";

export type SessionSwitchReason =
  | "lowFocus"
  | "tooDifficult"
  | "tired"
  | "schedule"
  | "goalChanged"
  | "other";

export interface StudySession {
  id: string;
  dailyPlanId: string;
  type: SessionType;
  title: string;
  goal?: string;
  plannedDurationMinutes: number;
  startedAt?: number;
  expectedEndAt?: number;
  pausedAt?: number;
  totalPausedDurationMs: number;
  extendedSeconds: number;
  completedAt?: number;
  status: SessionStatus;
  elapsedSeconds: number;
  distractionCount: number;
  rescueCount: number;
  successfulRescueCount: number;
  tabHiddenCount: number;
  tabHiddenDurationSeconds: number;
  hiddenStartedAt?: number;
  unplannedExitCount: number;
  rescueStartedAt?: number;
  rescueExpectedEndAt?: number;
  rescueDistractionId?: string;
  nextNote?: string;
  isOptional: boolean;
  switchReason?: SessionSwitchReason;
  mathQuestion?: string;
  japaneseLearned?: string;
  japaneseRecalled?: boolean;
  japaneseExample?: boolean;
  japaneseAnki?: boolean;
  japaneseMode?: JapaneseSessionMode;
  japanesePhase?: JapanesePhase;
  ankiReviewCompleted?: boolean;
  ankiLoad?: AnkiLoad;
  newVocabularyCount?: number;
  newGrammarCount?: number;
  yuhadayoCourse?: string;
  yuhadayoLesson?: string;
  yuhadayoExpression?: string;
  yuhadayoExample?: string;
  recallGrammarExplained?: boolean;
  recallExampleMade?: boolean;
  recallWords?: string;
  recallUnclearNote?: string;
  todaiiMode?: TodaiiMode;
  todaiiFirstPassCompleted?: boolean;
  todaiiTopic?: string;
  todaiiVocabulary?: string[];
  todaiiSummary?: string;
  todaiiListeningGuess?: string;
  todaiiScriptChecked?: boolean;
  todaiiSecondListenCompleted?: boolean;
  jlptPracticeType?: JlptPracticeType;
  jlptWrongCategories?: JlptWrongCategory[];
  jlptWrongNote?: string;
  entertainmentChoice?: "youtube" | "game" | "other";
  helpReproduced?: boolean;
  order: number;
}

export type HelpSource = "none" | "officialDocs" | "search" | "gpt" | "lecture";

export interface Distraction {
  id: string;
  sessionId: string;
  text: string;
  createdAt: number;
  returnedToFocus: boolean;
}

export interface Blocker {
  id: string;
  sessionId: string;
  description: string;
  createdAt: number;
  resolved: boolean;
  helpSource?: HelpSource;
}

export interface DailyReview {
  id: string;
  dailyPlanId: string;
  date: string;
  focusScore?: 1 | 2 | 3 | 4 | 5;
  japaneseLearned?: string;
  graphicsLearned?: string;
  finalNextAction?: string;
  completedFocusBlocks: number;
  rescueCount: number;
  successfulRescues: number;
  unplannedExitCount: number;
  studySeconds: number;
  coreCompleted: boolean;
  plannedCompletionRate: number;
  japaneseSummary?: JapaneseDailySummary;
  createdAt: number;
}

export interface JapaneseDailySummary {
  ankiReviewCompleted: boolean;
  newVocabularyCount: number;
  newGrammarCount: number;
  grammarReviewCompleted: boolean;
  yuhadayoCompleted: boolean;
  todaiiCompleted: boolean;
  todaiiSummary?: string;
  jlptPracticeCompleted: boolean;
  japaneseFocusBlocks: number;
}

export type WakeLockMode = "focus" | "always" | "off";

export interface AppSettings {
  id: "app";
  ankiMinutes: number;
  deepFocusMinutes: number;
  microBreakMinutes: number;
  japaneseMinutes: number;
  supportMinutes: number;
  projectMinutes: number;
  longBreakMinutes: number;
  entertainmentMinutes: number;
  rescueMinutes: number;
  minimumBeforeSwitchMinutes: number;
  audioEnabled: boolean;
  notificationsEnabled: boolean;
  wakeLockMode: WakeLockMode;
  japanese: JapaneseSettings;
  updatedAt: number;
}

export type StudySessionDraft = Omit<
  StudySession,
  | "id"
  | "dailyPlanId"
  | "startedAt"
  | "expectedEndAt"
  | "pausedAt"
  | "completedAt"
  | "hiddenStartedAt"
  | "rescueStartedAt"
  | "rescueExpectedEndAt"
  | "rescueDistractionId"
>;
