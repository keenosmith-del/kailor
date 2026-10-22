import CommonQuestions from "./pages/Public/Questions/CommonQuestions";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { PublicLayout } from "./components/public/PublicLayout/PublicLayout";
import { InternalNavigation } from "./components/public/PageBack/PageBack";
import Home from "./pages/Public/Home/Home";
import HowItWorks from "./pages/Public/HowItWorks/HowItWorks";
import Timeline from "./pages/Public/Timeline/Timeline";
import Pricing from "./pages/Public/Pricing/Pricing";
import Careers from "./pages/Public/Careers/Careers";
import Contact from "./pages/Public/Contact/Contact";
import Privacy from "./pages/Public/Privacy/Privacy";
import Terms from "./pages/Public/Terms/Terms";
import Cookies from "./pages/Public/Cookies/Cookies";
import { Auth } from "./pages/Auth/Auth";
const pages = {
  "/": Home,
  "/how-it-works": HowItWorks,
  "/timeline": Timeline,
  "/pricing": Pricing,
  "/careers": Careers,
  "/faqs": CommonQuestions,
  "/contact": Contact,
  "/privacy": Privacy,
  "/terms": Terms,
  "/cookies": Cookies,
};
export function render(path: string) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <InternalNavigation>
        <Routes>
          <Route element={<PublicLayout />}>
            {Object.entries(pages).map(([url, Component]) => (
              <Route key={url} path={url} element={<Component />} />
            ))}
          </Route>
          <Route path="/sign-in" element={<Auth onLogin={() => {}} />} />
          <Route
            path="/create-account"
            element={<Auth signup onLogin={() => {}} />}
          />
        </Routes>
      </InternalNavigation>
    </MemoryRouter>,
  );
}
