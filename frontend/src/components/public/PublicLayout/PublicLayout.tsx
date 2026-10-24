import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import "../primitives.css";
import "./PublicLayout.css";

import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";

import { ConversationProvider } from "../ConversationModal/ConversationModal";

import { usePublicPage } from "./usePublicPage";

export function PublicLayout({ showHeader = true }: { showHeader?: boolean }) {
  const main = usePublicPage();
  const outlet = useOutlet();
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <div className={`public-site${showHeader ? "" : " public-site--account"}`}>
      <ConversationProvider>
        <a href="#public-main" className="public-skip">
          Skip to content
        </a>

        {showHeader && <Header />}

        <main ref={main} id="public-main" tabIndex={-1}>
          {showHeader ? (
            outlet
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="account-page-transition"
                key={location.pathname}
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
                transition={{
                  duration: reduced ? 0 : 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        <Footer compact={!showHeader} />
      </ConversationProvider>
    </div>
  );
}
