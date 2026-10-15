import { PlanManager, PlanLanding } from "./Plans";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { api } from "./api";
import { Auth, type Account } from "./Auth";
import { Intro } from "./Intro";
import { SessionPage } from "./SessionPage";
import { Workspace } from "./Workspace";
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
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/sign-in" element={<Auth onLogin={setAccount} />} />
      <Route
        path="/create-account"
        element={<Auth signup onLogin={setAccount} />}
      />
      <Route path="/preview/plans/:planId" element={<PlanLanding />} />
      <Route
        path="/preview/plans"
        element={
          <main className="session-shell">
            <PlanManager />
          </main>
        }
      />
      <Route path="/preview/:id/:view" element={<SessionPage />} />
      <Route path="/plans/:planId" element={protect(<PlanLanding />)} />
      <Route
        path="/plans"
        element={protect(
          <main className="session-shell">
            <PlanManager />
          </main>,
        )}
      />
      <Route
        path="/workspace"
        element={protect(<Workspace founder={account?.role === "admin"} />)}
      />
      <Route path="/sessions/:id/:view" element={protect(<SessionPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
