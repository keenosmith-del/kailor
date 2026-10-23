import {
  MessageCircle,
  Compass,
  Layers,
  FileText,
  FolderOpen,
  Search,
  Plus,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import "./Collaboration.css";

const navigation = [
  { label: "Chat", Icon: MessageCircle },
  { label: "Discovery", Icon: Compass },
  { label: "Solution canvas", Icon: Layers },
  { label: "Analysis", Icon: FileText },
  { label: "Sources", Icon: FolderOpen },
];

export function Collaboration() {
  const reducedMotion = useReducedMotion();

  const reveal = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 24 },

    whileInView: { opacity: 1, y: 0 },

    viewport: {
      once: false,
      amount: 0.2,
    },

    transition: {
      duration: reducedMotion ? 0 : 0.8,
      delay: reducedMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      className="public-section home-collaboration"
      id="collaboration"
      aria-labelledby="collaboration-title"
    >
      <div className="collaboration-layout">
        <div
          className="collaboration-preview"
          role="img"
          aria-label="Preview of a kailor project workspace with navigation and messages between a client and a consultant."
        >
          <motion.div className="collaboration-window" {...reveal(0)}>
            <div className="collaboration-sidebar">
              <div className="collaboration-sidebar-logo">
                <img src="/kailor-head.png" alt="" />
              </div>

              <div className="collaboration-sidebar-links">
                {navigation.map(({ label, Icon }, index) => (
                  <div
                    className={`collaboration-sidebar-item ${
                      index === 0 ? "is-active" : ""
                    }`}
                    key={label}
                    title={label}
                  >
                    <Icon size={19} strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            </div>

            <div className="collaboration-workspace">
              <div className="collaboration-workspace-heading">
                <div>
                  <span className="collaboration-workspace-label">
                    kailor workspace
                  </span>

                  <h3>Projects</h3>
                </div>

                <div className="collaboration-add">
                  <Plus size={19} strokeWidth={1.6} />
                </div>
              </div>

              <div className="collaboration-search">
                <Search size={17} strokeWidth={1.5} />
                <span>Search projects</span>
              </div>

              <div className="collaboration-project-heading">Your projects</div>

              <div className="collaboration-project is-selected">
                <div className="collaboration-project-icon">
                  <Layers size={17} />
                </div>
                <div>
                  <strong>Website & bookings</strong>
                  <span>Consultancy in progress</span>
                </div>
              </div>

              <div className="collaboration-project">
                <div className="collaboration-project-icon">
                  <MessageCircle size={17} />
                </div>
                <div>
                  <strong>Business operations</strong>
                  <span>Discovery and assessment</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="collaboration-message collaboration-message--client"
            {...reveal(0.16)}
          >
            <div className="collaboration-avatar collaboration-avatar--client">
              C
            </div>

            <div className="collaboration-message-content">
              <div className="collaboration-message-heading">
                <strong>Client</strong>
                <span>Just now</span>
              </div>

              <p>
                Could we review how the booking process and customer follow-ups
                will work together?
              </p>
            </div>
          </motion.div>

          <motion.div
            className="collaboration-message collaboration-message--consultant"
            {...reveal(0.32)}
          >
            <div className="collaboration-avatar collaboration-avatar--consultant">
              <img src="/kailor-head.png" alt="" />
            </div>

            <div className="collaboration-message-content">
              <div className="collaboration-message-heading">
                <strong>kailor consultant</strong>
                <span>Now</span>
              </div>

              <p>
                Absolutely. I've outlined the proposed workflow and the
                decisions we need to make before implementation.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="collaboration-copy">
          <h2 id="collaboration-title">
            Beyond the
            <br />
            conversation
          </h2>

          <p>
            Great consultancy doesn't end with a recommendation. The
            conversation continues as ideas take shape, requirements become
            clearer and projects move forward.
          </p>

          <p>
            kailor brings everything together in one organised workspace. Each
            project has its own conversations, discoveries, recommendations and
            decisions. Choose the solutions you want to pursue, collaborate with
            a consultant and follow the progress from initial planning to the
            finished build.
          </p>
        </div>
      </div>
    </section>
  );
}
