import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { TimerDisplay } from "../components/TimerDisplay";
import { isFocusSession } from "../domain/routineEngine";
import { calculateRemainingSeconds } from "../domain/timerEngine";
import type { HelpSource, StudySession } from "../domain/types";
import { CompletionModal } from "../features/focus-session/CompletionModal";
import { SessionSwitchModal } from "../features/focus-session/SessionSwitchModal";
import { JapaneseCompletionModal } from "../features/japanese/JapaneseCompletionModal";
import { JapaneseFocusPanel } from "../features/japanese/JapaneseFocusPanel";
import { useClock } from "../hooks/useClock";
import { useSessionEndEffects } from "../hooks/useSessionEndEffects";
import { useVisibilityTracking } from "../hooks/useVisibilityTracking";
import { useWakeLock } from "../hooks/useWakeLock";
import { useAppStore } from "../store/useAppStore";
import styles from "./FocusPage.module.css";

type OpenModal = "distraction" | "blocker" | "complete" | "switch" | "expired" | undefined;

const helpSources: Array<{ value: HelpSource; label: string }> = [
  { value: "officialDocs", label: "공식문서" },
  { value: "search", label: "검색" },
  { value: "gpt", label: "GPT 힌트" },
  { value: "lecture", label: "강의 확인" }
];

function formatAway(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}분 ${rest}초` : `${rest}초`;
}

export function FocusPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);
  const blockers = useAppStore((state) => state.blockers);
  const loadSessionContext = useAppStore((state) => state.loadSessionContext);
  const initialize = useAppStore((state) => state.initialize);
  const startSession = useAppStore((state) => state.startSession);
  const pauseSession = useAppStore((state) => state.pauseSession);
  const resumeSession = useAppStore((state) => state.resumeSession);
  const extendSession = useAppStore((state) => state.extendSession);
  const completeSession = useAppStore((state) => state.completeSession);
  const switchSession = useAppStore((state) => state.switchSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const addDistraction = useAppStore((state) => state.addDistraction);
  const finishRescue = useAppStore((state) => state.finishRescue);
  const addBlocker = useAppStore((state) => state.addBlocker);
  const setBlockerHelp = useAppStore((state) => state.setBlockerHelp);
  const resolveBlocker = useAppStore((state) => state.resolveBlocker);
  const [modal, setModal] = useState<OpenModal>();
  const [distractionText, setDistractionText] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [entertainmentChoice, setEntertainmentChoice] = useState<"youtube" | "game" | "other">();
  const [mathQuestion, setMathQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const autoStarted = useRef(false);
  const notifiedTimerKey = useRef<string>();
  const now = useClock(true);
  const session = sessions.find((item) => item.id === sessionId);
  const endEffects = useSessionEndEffects(settings);
  useWakeLock(settings.wakeLockMode === "focus" && Boolean(session && isFocusSession(session)));
  const visibility = useVisibilityTracking(session?.id, session?.status === "running" && isFocusSession(session));

  useEffect(() => {
    if (!sessionId) return;
    autoStarted.current = false;
    setModal(undefined);
    setDistractionText("");
    setBlockerText("");
    setEntertainmentChoice(undefined);
    setMathQuestion("");
    let active = true;
    void initialize().then(() => loadSessionContext(sessionId)).then((loaded) => {
      if (!active) return;
      setLoading(false);
      if (loaded?.status === "pending" && !autoStarted.current) {
        const lockedEntertainment = loaded.type === "entertainmentBreak" && useAppStore.getState().sessions.filter((item) => item.status === "completed" && item.type === "graphics" && item.title.includes("Deep")).length < 2;
        if (lockedEntertainment) return;
        autoStarted.current = true;
        void startSession(loaded.id);
      }
    });
    return () => { active = false; };
  }, [initialize, loadSessionContext, sessionId, startSession]);

  const remaining = session ? calculateRemainingSeconds(session, now) : 0;
  const rescueRemaining = session?.rescueExpectedEndAt ? Math.max(0, Math.ceil((session.rescueExpectedEndAt - now) / 1_000)) : 0;
  const rescueFinished = Boolean(session?.rescueExpectedEndAt && rescueRemaining === 0);

  useEffect(() => {
    const timerKey = `${session?.id}:${session?.expectedEndAt ?? "none"}`;
    if (!session || session.rescueExpectedEndAt || session.status !== "running" || remaining > 0 || notifiedTimerKey.current === timerKey) return;
    notifiedTimerKey.current = timerKey;
    endEffects(session.title);
    setModal("expired");
  }, [endEffects, remaining, session]);

  const completedDeep = sessions.filter((item) => item.status === "completed" && item.type === "graphics" && item.title.includes("Deep")).length;
  const entertainmentLocked = session?.type === "entertainmentBreak" && completedDeep < 2;
  const previousNext = useMemo(
    () => (session?.type === "graphics" || session?.type === "project") ? sessions.filter((item) => item.order < (session?.order ?? 0) && item.nextNote).sort((a, b) => b.order - a.order)[0]?.nextNote : undefined,
    [session?.order, session?.type, sessions]
  );
  const currentBlockers = blockers.filter((blocker) => blocker.sessionId === session?.id);
  const openBlockers = currentBlockers.filter((blocker) => !blocker.resolved);
  const needsReproduction = currentBlockers.some((blocker) => blocker.helpSource === "gpt" || blocker.helpSource === "lecture");

  if (loading || !session) {
    return <main className={styles.page}><p>{loading ? "세션을 복구하는 중…" : "세션을 찾을 수 없습니다."}</p>{!loading && <Button onClick={() => navigate("/today")}>오늘로</Button>}</main>;
  }

  if (session.status === "completed" || session.status === "skipped") {
    return <main className={styles.page}><header className={styles.top}><p className={styles.kicker}>{session.title.toUpperCase()}</p></header><section className={styles.body}><h1>완료한 블록입니다.</h1><p className={styles.hint}>기록은 시작한 날의 계획에 남아 있습니다.</p></section><footer className={styles.footer}><Button onClick={() => navigate("/today")}>오늘 계획</Button><Button variant="secondary" onClick={() => navigate("/review")}>리뷰</Button></footer></main>;
  }

  const goNext = async (patch: Partial<StudySession> = {}) => {
    if (session.japaneseMode === "yuhadayo" && (patch.yuhadayoCourse !== undefined || patch.yuhadayoLesson !== undefined)) {
      await updateSettings({
        ...settings,
        japanese: {
          ...settings.japanese,
          yuhadayoCurrentCourse: patch.yuhadayoCourse ?? settings.japanese.yuhadayoCurrentCourse,
          yuhadayoCurrentLesson: patch.yuhadayoLesson ?? settings.japanese.yuhadayoCurrentLesson
        }
      });
    }
    await completeSession(session.id, patch);
    if (remaining > 0) endEffects(session.title);
    const next = sessions.find((item) => item.id !== session.id && !item.isOptional && (item.status === "pending" || item.status === "paused"));
    if (!next) {
      navigate("/review");
      return;
    }
    await startSession(next.id);
    navigate(`/focus/${next.id}`);
  };

  const recordDistraction = async () => {
    if (!distractionText.trim()) return;
    await addDistraction(session.id, distractionText);
    setDistractionText("");
    setModal(undefined);
  };

  const recordBlocker = async () => {
    if (!blockerText.trim()) return;
    await addBlocker(session.id, blockerText);
    setBlockerText("");
    setModal(undefined);
  };

  const handleRescue = async (returned: boolean) => {
    await finishRescue(session.id, returned);
    if (!returned) setModal("switch");
  };

  const heading = session.title.toUpperCase();
  const isBreak = ["microBreak", "longBreak", "entertainmentBreak"].includes(session.type);

  if (entertainmentLocked) {
    return (
      <main className={styles.page}>
        <header className={styles.top}><p className={styles.kicker}>ENTERTAINMENT BREAK</p></header>
        <section className={styles.body}>
          <div className={styles.locked}>LOCKED</div>
          <div><strong>Graphics Deep</strong><p>{completedDeep} / 2</p></div>
          <p className={styles.hint}>Deep 블록 두 개 뒤에 열립니다. Long Break는 별도입니다.</p>
        </section>
        <footer className={styles.footer}><Button variant="secondary" onClick={() => navigate("/today")}>오늘 계획</Button></footer>
      </main>
    );
  }

  const canAskHelp = (createdAt: number) => now - createdAt >= 10 * 60_000;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <p className={styles.kicker}>{heading}</p>
        <Button variant="quiet" onClick={() => navigate("/today")}>오늘 계획</Button>
      </header>

      <section className={styles.body}>
        {session.rescueExpectedEndAt ? (
          <>
            <div className={styles.rescueLabel}>RESCUE · {settings.rescueMinutes}분</div>
            <TimerDisplay seconds={rescueRemaining} label="복귀 시간" />
            <p className={styles.rescueMessage}>{rescueFinished ? "다시 집중할 수 있나요?" : "하던 행동 하나만 다시 시작합니다."}</p>
            {rescueFinished && <div className={styles.primaryActions}><Button onClick={() => void handleRescue(true)}>계속 집중</Button><Button variant="secondary" onClick={() => void handleRescue(false)}>과목 변경</Button></div>}
          </>
        ) : (
          <>
            <TimerDisplay seconds={remaining} />
            {session.type === "microBreak" && (
              <><div className={styles.goal}><p>화면에서 벗어나세요.</p></div><div className={styles.breakList}><span>물</span><span>화장실</span><span>걷기</span><span>스트레칭</span><span>창밖 보기</span></div><p className={styles.breakRule}>YouTube / 게임 / SNS는<br />이번 휴식에는 사용하지 않습니다.</p></>
            )}
            {session.type === "longBreak" && (
              <><div className={styles.goal}><p>충분히 쉬고 돌아옵니다.</p></div><div className={styles.breakList}><span>식사</span><span>휴식</span><span>걷기</span></div></>
            )}
            {session.type === "entertainmentBreak" && (
              <div className={styles.goal}>
                <span>오늘 사용할 오락 · 하나만</span>
                <div className={styles.primaryActions}>
                  {(["youtube", "game", "other"] as const).map((value) => <Button key={value} aria-pressed={entertainmentChoice === value} variant={entertainmentChoice === value ? "primary" : "secondary"} onClick={() => setEntertainmentChoice(value)}>{value === "youtube" ? "YouTube" : value === "game" ? "Game" : "Other"}</Button>)}
                </div>
              </div>
            )}
            {!isBreak && (
              <>
                <div className={styles.goal}><span>Goal</span><p>{session.goal || "이 블록의 한 가지 목표에 집중합니다."}</p></div>
                {session.japaneseMode && <JapaneseFocusPanel session={session} settings={settings.japanese} onUpdate={updateSession} />}
                {previousNext && <div className={styles.lastNext}><span>LAST NEXT</span><p>{previousNext}</p></div>}
                {session.type === "math" && !session.mathQuestion && (
                  <div className={styles.mathPrompt}>
                    <label htmlFor="math-question"><strong>현재 그래픽스에서 막힌 수학은?</strong></label>
                    <div className={styles.primaryActions} style={{ marginTop: "0.55rem" }}><input id="math-question" className={styles.input} value={mathQuestion} onChange={(event) => setMathQuestion(event.target.value)} placeholder="예: 행렬 곱셈 순서" /><Button variant="secondary" disabled={!mathQuestion.trim()} onClick={() => void updateSession({ ...session, mathQuestion: mathQuestion.trim() })}>저장</Button></div>
                  </div>
                )}
                {openBlockers.map((blocker) => (
                  <aside className={styles.blockerNotice} key={blocker.id}>
                    <p><strong>막힌 지점</strong><br />{blocker.description}</p>
                    {blocker.helpSource === "none" && !canAskHelp(blocker.createdAt) && <span className={styles.hint}>먼저 직접 5~10분 더 시도하세요.</span>}
                    {blocker.helpSource === "none" && canAskHelp(blocker.createdAt) && <><p className={styles.hint}>이제 외부 도움을 사용해도 됩니다.</p><div className={styles.helpChoices}>{helpSources.map((source) => <Button key={source.value} variant="quiet" onClick={() => void setBlockerHelp(blocker.id, source.value)}>{source.label}</Button>)}</div></>}
                    {blocker.helpSource && blocker.helpSource !== "none" && <span className={styles.hint}>도움 기록: {helpSources.find((item) => item.value === blocker.helpSource)?.label}</span>}
                    <div className={styles.helpChoices}><Button variant="quiet" onClick={() => void resolveBlocker(blocker.id)}>해결됨</Button></div>
                  </aside>
                ))}
              </>
            )}
          </>
        )}
      </section>

      {!session.rescueExpectedEndAt && (
        <footer className={styles.footer}>
          <div className={styles.primaryActions}>
            {!isBreak && <><Button variant="secondary" onClick={() => setModal("blocker")}>막혔음</Button><Button variant="secondary" onClick={() => setModal("distraction")}>산만해짐</Button></>}
            <Button onClick={() => setModal("complete")}>완료</Button>
          </div>
          <div className={styles.quietActions}>
            {session.status === "paused" ? <Button variant="quiet" onClick={() => void resumeSession(session.id)}>계속</Button> : <Button variant="quiet" onClick={() => void pauseSession(session.id)}>잠시 멈춤</Button>}
            {!isBreak && <Button variant="quiet" onClick={() => setModal("switch")}>세션 변경</Button>}
          </div>
        </footer>
      )}

      {modal === "distraction" && <Modal title="지금 하고 싶은 것은?" onClose={() => setModal(undefined)}><div className={styles.form}><input className={styles.input} autoFocus value={distractionText} onChange={(event) => setDistractionText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void recordDistraction()} placeholder="YouTube, 게임, 검색, GPT, 다른 공부…" /><p className={styles.hint}>한 줄로 맡겨두고 3분만 돌아옵니다. 타이머는 계속 갑니다.</p><Button wide disabled={!distractionText.trim()} onClick={() => void recordDistraction()}>기록하고 계속</Button></div></Modal>}
      {modal === "blocker" && <Modal title="어디에서 막혔나요?" onClose={() => setModal(undefined)}><div className={styles.form}><textarea className={styles.input} autoFocus value={blockerText} onChange={(event) => setBlockerText(event.target.value)} placeholder="한 문장으로 적습니다." /><p className={styles.hint}>저장한 뒤 5~10분 직접 시도합니다.</p><Button wide disabled={!blockerText.trim()} onClick={() => void recordBlocker()}>저장</Button></div></Modal>}
      {modal === "complete" && session.japaneseMode && <JapaneseCompletionModal session={session} settings={settings.japanese} needsReproduction={needsReproduction} onCancel={() => setModal(undefined)} onComplete={(patch) => void goNext({ ...patch, entertainmentChoice })} />}
      {modal === "complete" && !session.japaneseMode && <CompletionModal session={session} needsReproduction={needsReproduction} onCancel={() => setModal(undefined)} onComplete={(patch) => void goNext({ ...patch, entertainmentChoice })} />}
      {modal === "switch" && <SessionSwitchModal session={session} sessions={sessions} minimumMinutes={settings.minimumBeforeSwitchMinutes} onClose={() => setModal(undefined)} onSwitch={(target, reason) => void switchSession(session.id, target, reason).then(() => navigate(`/focus/${target}`))} />}
      {modal === "expired" && <Modal title="예정된 시간이 끝났습니다."><p>{session.title} 블록의 예정 시간이 지났습니다.</p><div className={styles.modalActions}><Button onClick={() => { setModal(undefined); setModal("complete"); }}>완료 처리</Button><Button variant="secondary" onClick={() => { void extendSession(session.id, 5); setModal(undefined); }}>5분 계속</Button></div></Modal>}
      {visibility.awaySeconds !== undefined && <Modal title={`${formatAway(visibility.awaySeconds)} 동안 페이지를 벗어났습니다.`}><p>공부 관련 활동이었나요?</p><div className={styles.modalActions}><Button variant="secondary" onClick={() => void visibility.answer(true)}>공부 관련</Button><Button onClick={() => void visibility.answer(false)}>계획 밖 이탈</Button></div></Modal>}
    </main>
  );
}
