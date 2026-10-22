import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { api } from "./services/api";
import type { Account } from "./types/account";
import { Footer } from "./components/Footer/Footer";
import { InternalNavigation } from "./components/public/PageBack/PageBack";
import { publicPaths } from "./components/public/navigation";
import { applyPageMetadata } from "./components/public/PublicLayout/metadata";
import { PageTransition } from "./components/PageTransition/PageTransition";
const GuestJourneyEntry = lazy(() =>
  import("./pages/Application/GuestJourneyEntry").then((m) => ({
    default: m.GuestJourneyEntry,
  })),
);
const ApplicationWorkspace = lazy(() =>
  import("./pages/Application/ApplicationWorkspace").then((m) => ({
    default: m.ApplicationWorkspace,
  })),
);
const Plans = lazy(() =>
  import("./pages/Plans/Plans").then((m) => ({ default: m.Plans })),
);
const PlanLanding = lazy(() =>
  import("./pages/PlanLanding/PlanLanding").then((m) => ({
    default: m.PlanLanding,
  })),
);
const Auth = lazy(() =>
  import("./pages/Auth/Auth").then((m) => ({ default: m.Auth })),
);
const PublicLayout = lazy(() =>
  import("./components/public/PublicLayout/PublicLayout").then((m) => ({
    default: m.PublicLayout,
  })),
);
const Home = lazy(() => import("./pages/Public/Home/Home"));
const HowItWorks = lazy(() => import("./pages/Public/HowItWorks/HowItWorks"));
const Pricing = lazy(() => import("./pages/Public/Pricing/Pricing"));
const Contact = lazy(() => import("./pages/Public/Contact/Contact"));
const Workspace = lazy(() =>
  import("./pages/Workspace/Workspace").then((m) => ({ default: m.Workspace })),
);
const Timeline = lazy(() => import("./pages/Public/Timeline/Timeline"));
const CommonQuestions = lazy(
  () => import("./pages/Public/Questions/CommonQuestions"),
);
const Careers = lazy(() => import("./pages/Public/Careers/Careers"));
const Privacy = lazy(() => import("./pages/Public/Privacy/Privacy"));
const Terms = lazy(() => import("./pages/Public/Terms/Terms"));
const Cookies = lazy(() => import("./pages/Public/Cookies/Cookies"));
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
  const { pathname } = useLocation();
  const publicPath = pathname.replace(/\/+$/, "") || "/";
  const isPublic = publicPaths.includes(publicPath);
  const [account, setAccount] = useState<Account | null>();
  useEffect(() => {
    if (isPublic) return;
    void api<Account>("/auth/me")
      .then(setAccount)
      .catch(() => setAccount(null));
  }, [isPublic]);
  useEffect(() => {
    applyPageMetadata(publicPath);
  }, [publicPath]);
  const protect = (children: ReactNode) => (
    <Protected account={account}>{children}</Protected>
  );
  return (
    <InternalNavigation>
      <div className={isPublic ? "public-shell" : "app-shell"}>
        <PageTransition />
        <Suspense fallback={<p className="loading">Opening kailor…</p>}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/faqs" element={<CommonQuestions />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="/sign-in" element={<Auth onLogin={setAccount} />} />
            <Route
              path="/create-account"
              element={<Auth signup onLogin={setAccount} />}
            />
            {import.meta.env.DEV ? (
              <>
                <Route
                  path="/preview/discovery"
                  element={<GuestJourneyEntry />}
                />
                <Route
                  path="/preview/plans/:planId"
                  element={<PlanLanding />}
                />
                <Route path="/preview/plans" element={<Plans />} />
                <Route
                  path="/preview/:view"
                  element={<ApplicationWorkspace account={account ?? null} />}
                />
                <Route
                  path="/preview/:id/:view"
                  element={<ApplicationWorkspace account={account ?? null} />}
                />
              </>
            ) : (
              <Route
                path="/preview/*"
                element={<Navigate to="/sign-in" replace />}
              />
            )}
            <Route
              path="/app/:view"
              element={protect(
                <ApplicationWorkspace account={account ?? null} />,
              )}
            />
            <Route
              path="/app/:id/:view"
              element={protect(
                <ApplicationWorkspace account={account ?? null} />,
              )}
            />
            <Route
              path="/app"
              element={protect(<Navigate to="/app/chat" replace />)}
            />
            <Route path="/plans/:planId" element={protect(<PlanLanding />)} />
            <Route path="/plans" element={protect(<Plans />)} />
            <Route
              path="/workspace"
              element={protect(<Navigate to="/app/chat" replace />)}
            />
            <Route
              path="/sessions/:id/:view"
              element={protect(
                <ApplicationWorkspace account={account ?? null} />,
              )}
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
        </Suspense>
        {!isPublic && <Footer />}
      </div>
    </InternalNavigation>
  );
}
