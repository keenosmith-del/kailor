import { useConversation } from "../ConversationModal/ConversationModal";
import { ModalClose } from "../../ModalClose/ModalClose";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import "./CookiePreferences.css";
export const COOKIE_PREFERENCE_KEY = "kailor.cookie-preferences.v1";
export function CookiePreferences() {
  const { showToast } = useConversation();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem(COOKIE_PREFERENCE_KEY) || "null",
      );
      setSaved(
        value?.version === 1 &&
          value?.essential === true &&
          value?.optional === false,
      );
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);
  function close() {
    dialog.current?.close();
    trigger.current?.focus();
  }
  function save() {
    try {
      localStorage.setItem(
        COOKIE_PREFERENCE_KEY,
        JSON.stringify({
          version: 1,
          essential: true,
          optional: false,
          updatedAt: new Date().toISOString(),
        }),
      );
      setSaved(true);
      close();
      showToast("Cookie preferences saved.");
    } catch {
      setError(
        "Your browser could not save preferences. Only essential storage is used.",
      );
    }
  }
  return (
    <>
      <button
        ref={trigger}
        className="footer-cookies"
        type="button"
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
      >
        <img src="/svgs/cookie-cutter.svg" width={16} height={16} alt="" />
        Cookies
      </button>
      <dialog
        ref={dialog}
        className="cookie-preferences"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-description"
        onClose={() => trigger.current?.focus()}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const rect = dialog.current.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              close();
          }
        }}
      >
        <ModalClose
          className="cookie-close"
          type="button"
          aria-label="Close cookie preferences"
          onClick={close}
        />
        <h2 id="cookie-title">Cookie preferences</h2>
        <p id="cookie-description">
          We use essential storage to keep accounts secure and remember your
          choices.
        </p>
        <h3>Essential · always active</h3>
        <p>
          Account and guest session cookies support sign-in, security and
          temporary work. This browser also remembers your cookie preference.
          These are used only when the relevant feature is opened.
        </p>
        <h3>Optional cookies</h3>
        <p>
          No optional analytics or advertising trackers are integrated. There
          are no optional cookies to accept. New services will require a
          separate choice before they load.
        </p>
        <p>
          {saved
            ? "Your essential-only preference is saved. You can review it here at any time."
            : "You can continue using the website without saving a preference."}
        </p>
        <p>
          <Link to="/cookies" onClick={close}>
            Cookie information
          </Link>{" "}
          ·{" "}
          <Link to="/privacy" onClick={close}>
            Privacy
          </Link>
        </p>
        {error && <p role="alert">{error}</p>}
        <button className="cookie-save" type="button" onClick={save}>
          Save essential-only preferences
        </button>
      </dialog>
    </>
  );
}
