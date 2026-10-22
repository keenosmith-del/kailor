import { createContext, useContext, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import "./PageBack.css";
const Previous = createContext("/");
export function InternalNavigation({ children }: { children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname + location.search + location.hash;
  const history = useRef({ current: path, previous: "/" });
  if (path !== history.current.current) {
    history.current.previous = history.current.current;
    history.current.current = path;
  }
  return (
    <Previous.Provider value={history.current.previous}>
      {children}
    </Previous.Provider>
  );
}
export function PageBack({ to }: { to?: string } = {}) {
  const previous = useContext(Previous);
  const destination = to ?? previous;
  const navigate = useNavigate();
  return (
    <button
      className="page-back"
      type="button"
      onClick={() =>
        navigate(
          destination.startsWith("/") && !destination.startsWith("//")
            ? destination
            : "/",
          { replace: Boolean(to) },
        )
      }
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back
    </button>
  );
}
