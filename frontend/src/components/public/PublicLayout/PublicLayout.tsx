import { Outlet } from "react-router";

import "../primitives.css";
import "./PublicLayout.css";

import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";

import { ConversationProvider } from "../ConversationModal/ConversationModal";

import { usePublicPage } from "./usePublicPage";

export function PublicLayout({ showHeader = true }: { showHeader?: boolean }) {
  const main = usePublicPage();

  return (
    <div className="public-site">
      <ConversationProvider>
        <a href="#public-main" className="public-skip">
          Skip to content
        </a>

        {showHeader && <Header />}

        <main ref={main} id="public-main" tabIndex={-1}>
          <Outlet />
        </main>

        <Footer />
      </ConversationProvider>
    </div>
  );
}
