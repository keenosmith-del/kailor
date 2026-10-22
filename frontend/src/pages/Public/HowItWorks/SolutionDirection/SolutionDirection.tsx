import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Boxes, Bell, ChartNoAxesColumn } from "lucide-react";
import { ModalClose } from "../../../../components/ModalClose/ModalClose";
import { ProcessReveal } from "../ProcessReveal";
import "./SolutionDirection.css";

function DirectionDetails({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="hiw-direction-details"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button, a[href], [tabindex='0']",
          ),
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <ModalClose
        className="hiw-details-close"
        aria-label="Close proposed solution details"
        onClick={onClose}
      />
      <p className="hiw-caption">Illustrative proposal · For review</p>
      <h2 id={titleId}>Connected orders &amp; inventory</h2>
      <section>
        <h3>What it could improve</h3>
        <p>
          A more consistent stock record across sales channels, with fewer
          separate manual updates.
        </p>
      </section>
      <section>
        <h3>Tools to review</h3>
        <p>
          The current online store, spreadsheets and any existing inventory
          tools. We would check integration access, data quality and how returns
          and cancellations are recorded.
        </p>
      </section>
      <section>
        <h3>Possible scope</h3>
        <p>
          Map the order flow, agree where stock quantities are maintained and
          explore a connection between existing tools. Exception alerts and
          reporting could be considered separately.
        </p>
      </section>
      <section>
        <h3>Still to confirm</h3>
        <p>
          Which system is the source of truth, how updates should be approved
          and who maintains the connection. Requirements, scope and a proposal
          need agreement before implementation is commissioned.
        </p>
      </section>
    </dialog>,
    document.body,
  );
}
export function SolutionDirection() {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="hiw-editorial-section hiw-solution-section"
      aria-labelledby="hiw-assessment-title"
    >
      <ProcessReveal className="hiw-direction-visual">
        <p className="hiw-caption">Solution Canvas · Illustrative direction</p>
        <button
          type="button"
          className="hiw-solution-tile"
          onClick={() => setOpen(true)}
          aria-label="View Connected orders and inventory proposed solution"
        >
          <span className="hiw-solution-top">
            <Boxes size={27} strokeWidth={1.3} aria-hidden="true" />
            <span className="hiw-review-status">For review</span>
          </span>
          <span className="hiw-solution-title">
            Connected orders
            <br />
            &amp; inventory
          </span>
          <span className="hiw-solution-description">
            A more consistent way to update stock records as orders come in,
            using the tools already in place wherever possible.
          </span>
          <span className="hiw-solution-action">View proposed direction</span>
        </button>
        <div className="hiw-related-options">
          <span>
            <Bell size={14} aria-hidden="true" />
            Stock exception alerts
          </span>
          <span>
            <ChartNoAxesColumn size={14} aria-hidden="true" />
            Operational reporting
          </span>
        </div>
      </ProcessReveal>
      <div className="hiw-editorial-copy">
        <ProcessReveal>
          <h2 id="hiw-assessment-title">
            Understanding changes what we recommend
          </h2>
        </ProcessReveal>
        <ProcessReveal>
          <p>
            Assessment brings the problem, existing tools and missing
            information into focus. Sometimes improving a system is enough.
            Sometimes integration, automation or custom development makes more
            sense.
          </p>
        </ProcessReveal>
        <ProcessReveal>
          <p>
            The Solution Canvas gives each proposed direction room to be
            considered. Review the reasoning, explore connected options and
            decide what deserves a closer look.
          </p>
        </ProcessReveal>
      </div>
      {open && <DirectionDetails onClose={() => setOpen(false)} />}
    </section>
  );
}
