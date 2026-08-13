import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "../components/Button";
import { exportAllData } from "../db/repository";
import type { AppSettings } from "../domain/types";
import { JapaneseSettingsSection } from "../features/japanese/JapaneseSettingsSection";
import { useAppStore } from "../store/useAppStore";
import styles from "./SettingsPage.module.css";

type DurationKey =
  | "ankiMinutes"
  | "deepFocusMinutes"
  | "microBreakMinutes"
  | "japaneseMinutes"
  | "supportMinutes"
  | "projectMinutes"
  | "longBreakMinutes"
  | "entertainmentMinutes"
  | "rescueMinutes"
  | "minimumBeforeSwitchMinutes";

const durations: Array<{ key: DurationKey; label: string }> = [
  { key: "ankiMinutes", label: "Anki" },
  { key: "deepFocusMinutes", label: "Deep Focus" },
  { key: "microBreakMinutes", label: "Micro Break" },
  { key: "japaneseMinutes", label: "Japanese" },
  { key: "supportMinutes", label: "Support" },
  { key: "projectMinutes", label: "Project" },
  { key: "longBreakMinutes", label: "Long Break" },
  { key: "entertainmentMinutes", label: "Entertainment" },
  { key: "rescueMinutes", label: "Rescue" },
  { key: "minimumBeforeSwitchMinutes", label: "변경 전 최소 권장" }
];

export function SettingsPage() {
  const savedSettings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [settings, setSettings] = useState(savedSettings);
  const [status, setStatus] = useState("");

  useEffect(() => setSettings(savedSettings), [savedSettings]);

  const setNumber = (key: DurationKey, event: ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(240, Number(event.target.value)));
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (next = settings) => {
    await updateSettings(next);
    setStatus("설정을 저장했습니다.");
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setStatus("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }
    const permission = await Notification.requestPermission();
    const next = { ...settings, notificationsEnabled: permission === "granted" };
    setSettings(next);
    await save(next);
    setStatus(permission === "granted" ? "세션 종료 알림을 켰습니다." : "알림 없이도 모든 기능을 사용할 수 있습니다.");
  };

  const exportData = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `focusflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("데이터를 JSON으로 내보냈습니다.");
  };

  return (
    <section>
      <header className={styles.header}><h1>설정</h1><p>학습으로 돌아가는 데 필요한 것만 둡니다.</p></header>
      <JapaneseSettingsSection
        value={settings.japanese}
        onChange={(japanese) => setSettings((current) => ({ ...current, japanese }))}
        onCompleteBasic={async (japanese) => {
          const next = { ...settings, japanese };
          setSettings(next);
          await save(next);
          setStatus("Level Up 단계로 이동했습니다.");
        }}
      />
      <section className={styles.section}>
        <h2>Timer durations · 분</h2>
        <div className={styles.timerGrid}>
          {durations.map((item) => <label className={styles.field} key={item.key}><span>{item.label}</span><input type="number" min="1" max="240" value={String(settings[item.key])} onChange={(event) => setNumber(item.key, event)} /></label>)}
        </div>
      </section>
      <section className={styles.section}>
        <h2>집중 환경</h2>
        <div className={styles.settingRow}><div className={styles.settingText}><strong>종료 알림음</strong><span>짧고 차분한 소리</span></div><Button className={styles.toggle} variant={settings.audioEnabled ? "primary" : "secondary"} aria-pressed={settings.audioEnabled} onClick={() => setSettings((current) => ({ ...current, audioEnabled: !current.audioEnabled }))}>{settings.audioEnabled ? "켜짐" : "꺼짐"}</Button></div>
        <div className={styles.settingRow}><div className={styles.settingText}><strong>브라우저 알림</strong><span>원할 때만 권한을 요청합니다.</span></div><Button variant="secondary" onClick={() => void requestNotifications()}>{settings.notificationsEnabled ? "알림 켜짐" : "알림 받기"}</Button></div>
        <div className={styles.settingRow}><div className={styles.settingText}><strong>화면 자동 꺼짐 방지</strong><span>지원 브라우저에서만 동작합니다.</span></div><select className={styles.select} aria-label="화면 자동 꺼짐 방지" value={settings.wakeLockMode} onChange={(event) => setSettings((current) => ({ ...current, wakeLockMode: event.target.value as AppSettings["wakeLockMode"] }))}><option value="off">사용 안 함</option><option value="focus">Focus에서 사용</option><option value="always">항상</option></select></div>
      </section>
      <section className={styles.section}>
        <h2>로컬 데이터</h2>
        <p className="muted">계획과 기록은 이 브라우저의 IndexedDB에 저장됩니다.</p>
        <div className={styles.actions}><Button onClick={() => void save()}>설정 저장</Button><Button variant="secondary" onClick={() => void exportData()}>Export Data</Button></div>
        {status && <p className={styles.status} role="status">{status}</p>}
      </section>
    </section>
  );
}
