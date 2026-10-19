import "../primitives.css";
import "./PublicLayout.css";
import { Outlet } from "react-router";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { usePublicPage } from "./usePublicPage";
export function PublicLayout() {
  const main = usePublicPage();
  return (
    <div className="public-site">
      <a href="#public-main" className="public-skip">
        Skip to content
      </a>
      <Header />
      <main ref={main} id="public-main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
