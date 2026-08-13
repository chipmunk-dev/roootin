import { create } from "zustand";
import { DEFAULT_SETTINGS } from "../config/defaults";
import {
  getBlockersForSession,
  getDistraction,
  getPlan,
  getPlanByDate,
  getRunningSession,
  getSession,
  getSessionsForPlan,
  getSettings,
  saveBlocker,
  saveDistraction,
  savePlanWithSessions,
  saveSession,
  saveSettings
} from "../db/repository";
import { materializeRoutine } from "../domain/routineEngine";
import {
  calculateElapsedSeconds,
  extendExpiredTimer,
  pauseTimer,
  resumeTimer,
  startTimer
} from "../domain/timerEngine";
import type {
  AppSettings,
  Blocker,
  DailyPlan,
  Distraction,
  EnergyLevel,
  HelpSource,
  StudySession,
  SupportType
} from "../domain/types";
import { createId } from "../shared/id";
import { localDateKey } from "../shared/date";

interface PlanInput {
  energyLevel: EnergyLevel;
  graphicsGoal: string;
  japaneseGoal: string;
  supportType: SupportType;
  supportGoal?: string;
  japaneseWeakness?: DailyPlan["japaneseWeakness"];
  projectEnabled: boolean;
}

interface AppState {
  initialized: boolean;
  loading: boolean;
  error?: string;
  settings: AppSettings;
  currentPlan?: DailyPlan;
  sessions: StudySession[];
  runningSession?: StudySession;
  blockers: Blocker[];
  initialize: (date?: string) => Promise<void>;
  loadSessionContext: (sessionId: string) => Promise<StudySession | undefined>;
  createDailyPlan: (input: PlanInput, date?: string) => Promise<DailyPlan>;
  updateSession: (session: StudySession) => Promise<void>;
  updateDuration: (sessionId: string, minutes: number) => Promise<void>;
  startSession: (sessionId: string, now?: number) => Promise<StudySession | undefined>;
  pauseSession: (sessionId: string, now?: number) => Promise<void>;
  resumeSession: (sessionId: string, now?: number) => Promise<void>;
  extendSession: (sessionId: string, minutes?: number, now?: number) => Promise<void>;
  completeSession: (sessionId: string, patch?: Partial<StudySession>, now?: number) => Promise<void>;
  switchSession: (fromId: string, toId: string, reason: StudySession["switchReason"], now?: number) => Promise<void>;
  addDistraction: (sessionId: string, text: string, now?: number) => Promise<Distraction>;
  finishRescue: (sessionId: string, returnedToFocus: boolean) => Promise<void>;
  addBlocker: (sessionId: string, description: string, now?: number) => Promise<Blocker>;
  setBlockerHelp: (blockerId: string, source: HelpSource) => Promise<void>;
  resolveBlocker: (blockerId: string) => Promise<void>;
  markHidden: (sessionId: string, now?: number) => Promise<void>;
  markVisible: (sessionId: string, now?: number) => Promise<number>;
  classifyExit: (sessionId: string, planned: boolean) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
}

const replaceSession = (sessions: StudySession[], updated: StudySession) =>
  sessions.map((session) => (session.id === updated.id ? updated : session));

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.";
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  loading: false,
  settings: DEFAULT_SETTINGS,
  sessions: [],
  blockers: [],

  initialize: async (date = localDateKey()) => {
    set({ loading: true, error: undefined });
    try {
      const [settings, plan, runningSession] = await Promise.all([
        getSettings(),
        getPlanByDate(date),
        getRunningSession()
      ]);
      const sessions = plan ? await getSessionsForPlan(plan.id) : [];
      set({ initialized: true, loading: false, settings, currentPlan: plan, sessions, runningSession });
    } catch (error) {
      set({ initialized: true, loading: false, error: messageFromError(error) });
    }
  },

  loadSessionContext: async (sessionId) => {
    const session = await getSession(sessionId);
    if (!session) return undefined;
    const [plan, sessions, blockers] = await Promise.all([
      getPlan(session.dailyPlanId),
      getSessionsForPlan(session.dailyPlanId),
      getBlockersForSession(session.id)
    ]);
    set({ currentPlan: plan, sessions, blockers, runningSession: session.status === "running" || session.status === "paused" ? session : get().runningSession });
    return session;
  },

  createDailyPlan: async (input, date = localDateKey()) => {
    const now = Date.now();
    const plan: DailyPlan = {
      id: createId("plan"),
      date,
      ...input,
      japanesePhase: get().settings.japanese.phase,
      createdAt: now,
      updatedAt: now
    };
    const sessions = materializeRoutine(plan, get().settings);
    await savePlanWithSessions(plan, sessions);
    set({ currentPlan: plan, sessions });
    return plan;
  },

  updateSession: async (session) => {
    set((state) => ({
      sessions: replaceSession(state.sessions, session),
      runningSession:
        state.runningSession?.id === session.id
          ? session.status === "running" || session.status === "paused"
            ? session
            : undefined
          : state.runningSession
    }));
    await saveSession(session);
  },

  updateDuration: async (sessionId, minutes) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session || session.status !== "pending") return;
    await get().updateSession({ ...session, plannedDurationMinutes: Math.max(1, Math.min(240, Math.round(minutes))) });
  },

  startSession: async (sessionId, now = Date.now()) => {
    let session = get().sessions.find((item) => item.id === sessionId) ?? (await getSession(sessionId));
    if (!session) return undefined;
    const active = get().runningSession;
    let stoppedActive: StudySession | undefined;
    if (active && active.id !== sessionId && (active.status === "running" || active.status === "paused")) {
      stoppedActive = {
        ...active,
        status: "paused" as const,
        pausedAt: active.pausedAt ?? now,
        elapsedSeconds: calculateElapsedSeconds(active, now)
      };
      await saveSession(stoppedActive);
    }
    if (session.status === "pending") session = startTimer(session, now);
    else if (session.status === "paused") session = resumeTimer(session, now);
    await saveSession(session);
    set((state) => ({
      sessions: replaceSession(stoppedActive ? replaceSession(state.sessions, stoppedActive) : state.sessions, session as StudySession),
      runningSession: session
    }));
    return session;
  },

  pauseSession: async (sessionId, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    await get().updateSession(pauseTimer(session, now));
  },

  resumeSession: async (sessionId, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const updated = resumeTimer(session, now);
    await saveSession(updated);
    set((state) => ({ sessions: replaceSession(state.sessions, updated), runningSession: updated }));
  },

  extendSession: async (sessionId, minutes = 5, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const updated = extendExpiredTimer(session, minutes, now);
    await saveSession(updated);
    set((state) => ({ sessions: replaceSession(state.sessions, updated), runningSession: updated }));
  },

  completeSession: async (sessionId, patch = {}, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    const updated: StudySession = {
      ...session,
      ...patch,
      status: "completed",
      completedAt: now,
      elapsedSeconds: calculateElapsedSeconds(session, now),
      pausedAt: undefined,
      hiddenStartedAt: undefined,
      rescueStartedAt: undefined,
      rescueExpectedEndAt: undefined,
      rescueDistractionId: undefined
    };
    await saveSession(updated);
    set((state) => ({ sessions: replaceSession(state.sessions, updated), runningSession: undefined }));
  },

  switchSession: async (fromId, toId, reason, now = Date.now()) => {
    const from = get().sessions.find((session) => session.id === fromId);
    if (!from) return;
    const paused = pauseTimer(from, now);
    await get().updateSession({ ...paused, switchReason: reason });
    await get().startSession(toId, now);
  },

  addDistraction: async (sessionId, text, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) throw new Error("세션을 찾을 수 없습니다.");
    const distraction: Distraction = {
      id: createId("distraction"),
      sessionId,
      text: text.trim(),
      createdAt: now,
      returnedToFocus: false
    };
    const updated: StudySession = {
      ...session,
      distractionCount: session.distractionCount + 1,
      rescueCount: session.rescueCount + 1,
      rescueStartedAt: now,
      rescueExpectedEndAt: now + get().settings.rescueMinutes * 60_000,
      rescueDistractionId: distraction.id
    };
    await Promise.all([saveDistraction(distraction), saveSession(updated)]);
    set((state) => ({ sessions: replaceSession(state.sessions, updated), runningSession: updated }));
    return distraction;
  },

  finishRescue: async (sessionId, returnedToFocus) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    if (session.rescueDistractionId) {
      const distraction = await getDistraction(session.rescueDistractionId);
      if (distraction) await saveDistraction({ ...distraction, returnedToFocus });
    }
    const updated: StudySession = {
      ...session,
      successfulRescueCount: session.successfulRescueCount + (returnedToFocus ? 1 : 0),
      rescueStartedAt: undefined,
      rescueExpectedEndAt: undefined,
      rescueDistractionId: undefined
    };
    await get().updateSession(updated);
  },

  addBlocker: async (sessionId, description, now = Date.now()) => {
    const blocker: Blocker = {
      id: createId("blocker"),
      sessionId,
      description: description.trim(),
      createdAt: now,
      resolved: false,
      helpSource: "none"
    };
    await saveBlocker(blocker);
    set((state) => ({ blockers: [...state.blockers, blocker] }));
    return blocker;
  },

  setBlockerHelp: async (blockerId, source) => {
    const blocker = get().blockers.find((item) => item.id === blockerId);
    if (!blocker) return;
    const updated = { ...blocker, helpSource: source };
    await saveBlocker(updated);
    set((state) => ({ blockers: state.blockers.map((item) => (item.id === blockerId ? updated : item)) }));
  },

  resolveBlocker: async (blockerId) => {
    const blocker = get().blockers.find((item) => item.id === blockerId);
    if (!blocker) return;
    const updated = { ...blocker, resolved: true };
    await saveBlocker(updated);
    set((state) => ({ blockers: state.blockers.map((item) => (item.id === blockerId ? updated : item)) }));
  },

  markHidden: async (sessionId, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session || session.status !== "running" || session.hiddenStartedAt) return;
    await get().updateSession({ ...session, hiddenStartedAt: now, tabHiddenCount: session.tabHiddenCount + 1 });
  },

  markVisible: async (sessionId, now = Date.now()) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session?.hiddenStartedAt) return 0;
    const duration = Math.max(1, Math.round((now - session.hiddenStartedAt) / 1_000));
    await get().updateSession({
      ...session,
      hiddenStartedAt: undefined,
      tabHiddenDurationSeconds: session.tabHiddenDurationSeconds + duration
    });
    return duration;
  },

  classifyExit: async (sessionId, planned) => {
    if (planned) return;
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session) return;
    await get().updateSession({ ...session, unplannedExitCount: session.unplannedExitCount + 1 });
  },

  updateSettings: async (settings) => {
    const updated = { ...settings, id: "app" as const, updatedAt: Date.now() };
    await saveSettings(updated);
    set({ settings: updated });
  }
}));
