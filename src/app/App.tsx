import { useEffect } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAppStore } from "../store/useAppStore";
import { TodayPage } from "../pages/TodayPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { FocusPage } from "../pages/FocusPage";
import { ReviewPage } from "../pages/ReviewPage";
import { HistoryPage } from "../pages/HistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { useWakeLock } from "../hooks/useWakeLock";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/today" replace /> },
  { path: "/focus/:sessionId", element: <FocusPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/today", element: <TodayPage /> },
      { path: "/review", element: <ReviewPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/settings", element: <SettingsPage /> }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
]);

export function App() {
  const initialize = useAppStore((state) => state.initialize);
  const wakeLockMode = useAppStore((state) => state.settings.wakeLockMode);
  useWakeLock(wakeLockMode === "always");
  useEffect(() => {
    if (!window.location.pathname.startsWith("/focus/")) void initialize();
  }, [initialize]);
  return <RouterProvider router={router} />;
}
