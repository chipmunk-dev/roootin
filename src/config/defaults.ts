import type { AppSettings, JapaneseSettings } from "../domain/types";

export const DEFAULT_JAPANESE_SETTINGS: JapaneseSettings = {
  phase: "basic",
  ankiVocabularyEnabled: true,
  ankiKanjiEnabled: true,
  ankiGrammarEnabled: false,
  ankiGrammarManuallyConfigured: false,
  dailyNewVocabularyTarget: 20,
  dailyNewGrammarTarget: 5,
  todaiiEnabled: true,
  todaiiDefaultMode: "reading",
  jlptExamDate: "2026-12-06",
  yuhadayoCurrentCourse: "",
  yuhadayoCurrentLesson: ""
};

export const DEFAULT_SETTINGS: AppSettings = {
  id: "app",
  ankiMinutes: 20,
  deepFocusMinutes: 50,
  microBreakMinutes: 10,
  japaneseMinutes: 45,
  supportMinutes: 40,
  projectMinutes: 50,
  longBreakMinutes: 20,
  entertainmentMinutes: 20,
  rescueMinutes: 3,
  minimumBeforeSwitchMinutes: 20,
  audioEnabled: true,
  notificationsEnabled: false,
  wakeLockMode: "off",
  japanese: DEFAULT_JAPANESE_SETTINGS,
  updatedAt: 0
};

export function normalizeAppSettings(settings?: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    id: "app",
    japanese: {
      ...DEFAULT_JAPANESE_SETTINGS,
      ...settings?.japanese
    }
  };
}
