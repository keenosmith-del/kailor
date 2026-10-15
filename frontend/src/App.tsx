import { ApplicationWorkspace } from "./pages/Application/ApplicationWorkspace";
import { Plans } from "./pages/Plans/Plans";
import { PlanLanding } from "./pages/PlanLanding/PlanLanding";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { api } from "./services/api";
import { Auth } from "./pages/Auth/Auth";
import type { Account } from "./types/account";
import { Intro } from "./pages/Intro/Intro";
import { Workspace } from "./pages/Workspace/Workspace";
import { Footer } from "./components/Footer/Footer";
import { PageTransition } from "./components/PageTransition/PageTransition";
function Protected({
  account,
  children,
}: {
  account: Account | null | undefined;
  children: ReactNode;
}) {
  const location = useLocation();
  if (account === undefined)
    return <p className="loading">Opening your workspace…</p>;
  return account ? (
    children
  ) : (
    <Navigate
      to={`/sign-in?returnTo=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}
export function App() {
  const [account, setAccount] = useState<Account | null>();
  useEffect(() => {
    void api<Account>("/auth/me")
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);
  const protect = (children: ReactNode) => (
    <Protected account={account}>{children}</Protected>
  );
  return (
    <div className="app-shell">
      <PageTransition />
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/sign-in" element={<Auth onLogin={setAccount} />} />
        <Route
          path="/create-account"
          element={<Auth signup onLogin={setAccount} />}
        />
        <Route path="/preview/plans/:planId" element={<PlanLanding />} />
        <Route path="/preview/plans" element={<Plans />} />
        <Route
          path="/preview/:view"
          element={<ApplicationWorkspace account={null} />}
        />
        <Route
          path="/preview/:id/:view"
          element={<ApplicationWorkspace account={null} />}
        />
        <Route
          path="/app/:view"
          element={protect(<ApplicationWorkspace account={account ?? null} />)}
        />
        <Route
          path="/app/:id/:view"
          element={protect(<ApplicationWorkspace account={account ?? null} />)}
        />
        <Route path="/plans/:planId" element={protect(<PlanLanding />)} />
        <Route path="/plans" element={protect(<Plans />)} />
        <Route
          path="/workspace"
          element={protect(<Navigate to="/app/chat" replace />)}
        />
        <Route
          path="/sessions/:id/:view"
          element={protect(<ApplicationWorkspace account={account ?? null} />)}
        />
        <Route
          path="/founder"
          element={protect(
            account?.role === "admin" ? (
              <Workspace founder />
            ) : (
              <Navigate to="/app/chat" replace />
            ),
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}
