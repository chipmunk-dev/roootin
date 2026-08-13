import { useEffect, useRef, type PropsWithChildren } from "react";
import { Button } from "./Button";
import styles from "./ui.module.css";

interface ModalProps {
  title: string;
  onClose?: () => void;
}

export function Modal({ title, onClose, children }: PropsWithChildren<ModalProps>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>("button, input, textarea, select, [tabindex]");
    firstFocusable?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current?.();
      if (event.key === "Tab" && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])")];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div ref={panelRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.modalHeader}>
          <h2 id="modal-title">{title}</h2>
          {onClose && <Button className={styles.close} variant="quiet" onClick={onClose} aria-label="닫기">닫기</Button>}
        </div>
        {children}
      </div>
    </div>
  );
}
