import { useId, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Minus, Plus } from "lucide-react";
import { PageBack } from "../../../components/public/PageBack/PageBack";
import { useConversation } from "../../../components/public/ConversationModal/ConversationModal";
import "./CommonQuestions.css";

const questions = [
  {
    question: "What does kailor actually do?",
    answer:
      "kailor provides technology consultancy and engineering across software, artificial intelligence, automation and cloud systems. We help work out what a business needs, then explore practical ways to make it happen.",
  },
  {
    question: "Who does kailor work with?",
    answer:
      "We work with individuals, founders and businesses at different stages. You might have an early idea, an existing process that needs attention, or a more defined technical project.",
  },
  {
    question: "Do I need technical knowledge to work with kailor?",
    answer:
      "No. You don’t need to arrive with technical requirements or a particular solution in mind. We explain the options, trade-offs and decisions in a way you can understand.",
  },
  {
    question: "What if I don’t know exactly what I need?",
    answer:
      "That’s a reasonable starting point. We can begin by understanding what’s happening in your business, what you’re trying to achieve and where the difficulties are.",
  },
  {
    question: "Will you always recommend building new software or using AI?",
    answer:
      "No. Sometimes an existing platform, a better workflow or a simple integration is the better choice. We consider what is appropriate before recommending something custom.",
  },
  {
    question: "Can kailor work with the systems we already use?",
    answer:
      "Often, yes. We look at the tools and platforms already in place, what they support and where meaningful integrations or improvements might be possible.",
  },
  {
    question: "Can you also build the proposed solution?",
    answer:
      "Yes, depending on the agreed scope and technical requirements. Assessment and recommendations are distinct from implementation, so any development work is discussed and commissioned separately.",
  },
  {
    question: "How does pricing work?",
    answer:
      "The cost depends on the requirements, complexity and scope of the work. We establish what is needed before discussing a suitable proposal, rather than applying the same price to every project.",
  },
  {
    question: "What happens after I get in touch?",
    answer:
      "We begin by understanding what you’re working on and what you want to achieve. From there, we can discuss whether a discovery process, technical assessment or scoped project is the appropriate next step.",
  },
];
const ease = [0.22, 1, 0.36, 1] as const;

// Local reveals follow the homepage's repeatable in-view motion, without
// putting a scroll-linked transform on the expanding accordion itself.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.1 });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={{
        opacity: reduced || inView ? 1 : 0,
        y: reduced || inView ? 0 : 12,
      }}
      transition={{
        duration: reduced ? 0 : 0.4,
        ease,
        delay: reduced || !inView ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export default function CommonQuestions() {
  const { openConversation } = useConversation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <div className="common-questions-page">
      <PageBack />
      <Reveal className="common-questions-panel">
        <Reveal className="common-questions-heading">
          <h1>Common questions</h1>
          <p>A little more about working with kailor.</p>
        </Reveal>
        <div className="common-questions-list">
          {questions.map(({ question, answer }, index) => {
            const open = openIndex === index;
            const triggerId = `${id}-question-${index}`;
            const answerId = `${id}-answer-${index}`;
            return (
              <Reveal
                className="common-questions-reveal"
                key={question}
                delay={(index % 3) * 0.035}
              >
                <section
                  className={`common-questions-item${open ? " is-open" : ""}`}
                >
                  <h2>
                    <button
                      id={triggerId}
                      type="button"
                      className="common-questions-trigger"
                      aria-expanded={open}
                      aria-controls={answerId}
                      onClick={() => setOpenIndex(open ? null : index)}
                    >
                      <span>{question}</span>
                      <span
                        className="common-questions-control"
                        aria-hidden="true"
                      >
                        {open ? (
                          <Minus size={16} strokeWidth={1.6} />
                        ) : (
                          <Plus size={16} strokeWidth={1.6} />
                        )}
                      </span>
                    </button>
                  </h2>
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!open}
                    inert={!open}
                  >
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="answer"
                          className="common-questions-answer"
                          initial="closed"
                          animate="open"
                          exit="closed"
                          variants={{
                            open: { height: "auto" },
                            closed: { height: 0 },
                          }}
                          transition={{ duration: reduced ? 0 : 0.4, ease }}
                        >
                          <motion.p
                            variants={{
                              open: { opacity: 1, y: 0 },
                              closed: { opacity: 0, y: 8 },
                            }}
                            transition={{ duration: reduced ? 0 : 0.28, ease }}
                          >
                            {answer}
                          </motion.p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="common-questions-more">
          <p>
            Still have a question?{" "}
            <button
              type="button"
              className="common-questions-chat"
              onClick={openConversation}
            >
              Let's chat
            </button>
          </p>
        </Reveal>
      </Reveal>
    </div>
  );
}
