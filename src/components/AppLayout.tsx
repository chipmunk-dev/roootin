import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "../config/app";
import styles from "./AppLayout.module.css";

const navItems = [
  ["/today", "오늘"],
  ["/review", "리뷰"],
  ["/history", "기록"],
  ["/settings", "설정"]
] as const;

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink className={styles.brand} to="/today">{APP_NAME}</NavLink>
          <nav className={styles.nav} aria-label="주요 메뉴">
            {navItems.map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}
