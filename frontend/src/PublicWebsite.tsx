import { Link, Navigate, Route, Routes } from "react-router";
import { AccountAccess } from "./components/public/AccountAccess/AccountAccess";
import { PublicLayout } from "./components/public/PublicLayout/PublicLayout";
import { InternalNavigation } from "./components/public/PageBack/PageBack";
import { PageShell } from "./components/public/PageShell/PageShell";
import Home from "./pages/Public/Home/Home";
import HowItWorks from "./pages/Public/HowItWorks/HowItWorks";
import TryKailor from "./pages/Public/TryKailor/TryKailor";
import Careers from "./pages/Public/Careers/Careers";
import Contact from "./pages/Public/Contact/Contact";
import CommonQuestions from "./pages/Public/Questions/CommonQuestions";
import Privacy from "./pages/Public/Privacy/Privacy";
import Terms from "./pages/Public/Terms/Terms";
import Cookies from "./pages/Public/Cookies/Cookies";

export function PublicNotFound() {
  return (
    <PageShell title="Page unavailable">
      <p>This page is not available on the kailor public website.</p>
      <p>
        <Link to="/">Return to the homepage</Link> or{" "}
        <Link to="/contact">contact kailor</Link>.
      </p>
    </PageShell>
  );
}

// This entry point deliberately has no dependency on App, authentication,
// workspaces, AI, API clients or the application backend.
export function PublicWebsite() {
  return (
    <InternalNavigation>
      <div className="public-shell">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/try-kailor" element={<TryKailor />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/questions" element={<CommonQuestions />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route
              path="/faqs"
              element={<Navigate to="/questions" replace />}
            />
            <Route path="/timeline" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Navigate to="/" replace />} />
            <Route path="*" element={<PublicNotFound />} />
          </Route>
          <Route element={<PublicLayout showHeader={false} />}>
            <Route path="/sign-in" element={<AccountAccess />} />
            <Route path="/create-account" element={<AccountAccess signup />} />
          </Route>
        </Routes>
      </div>
    </InternalNavigation>
  );
}
