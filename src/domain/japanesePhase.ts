import type { JapanesePhase, JapaneseSettings } from "./types";

export const JAPANESE_PHASE_LABELS: Record<JapanesePhase, string> = {
  basic: "Basic Japanese",
  levelUp: "Level Up Japanese",
  n3: "JLPT N3",
  n3ExamPrep: "N3 Exam Preparation"
};

export function resolveJapanesePhase(settings: JapaneseSettings, date = new Date()): JapanesePhase {
  void date;
  return settings.phase;
}

export function changeJapanesePhase(settings: JapaneseSettings, phase: JapanesePhase): JapaneseSettings {
  const shouldEnableGrammar = phase !== "basic" && !settings.ankiGrammarManuallyConfigured;
  return {
    ...settings,
    phase,
    ankiGrammarEnabled: shouldEnableGrammar ? true : settings.ankiGrammarEnabled
  };
}

export function completeBasicJapanese(settings: JapaneseSettings): JapaneseSettings {
  if (settings.phase !== "basic") return settings;
  return {
    ...settings,
    phase: "levelUp",
    ankiGrammarEnabled: settings.ankiGrammarManuallyConfigured ? settings.ankiGrammarEnabled : true
  };
}

export function todaiiLevelRecommendation(phase: JapanesePhase): string {
  const recommendations: Record<JapanesePhase, string> = {
    basic: "N5~N4 수준 추천",
    levelUp: "N4 중심 추천",
    n3: "N4~N3, 점차 N3 중심",
    n3ExamPrep: "N3 독해/청해 및 시험형 자료 중심"
  };
  return recommendations[phase];
}

export function japaneseTodaySummary(settings: JapaneseSettings): string {
  if (settings.phase === "n3ExamPrep") return "Anki + Error Review + JLPT Practice";
  return settings.todaiiEnabled ? "Anki + Yuhadayo + Todaii" : "Anki + Yuhadayo + Recall";
}
