import { useRef } from "react";
import { Link } from "react-router";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Sparkles,
  MoveUpRight,
  Puzzle,
  BrainCircuit,
  ScanLine,
  Workflow,
  Cloud,
  ShieldCheck,
  MessageCircle,
  Blocks,
  Lightbulb,
} from "lucide-react";
import { StackedPanels } from "../../../components/public/StackedPanels";
import { ConversationVisual } from "../../../components/public/ConversationVisual";
import {
  ProcessTimeline,
  InsightGraph,
  Sculpture,
} from "../../../components/public/Visuals";
import { FeatureCarousel } from "../../../components/public/FeatureCarousel";
import { MediaSection } from "../../../components/public/MediaSection";
import { Engagements } from "../../../components/public/Engagements";
import { media } from "../media";
import { mail } from "../content";
import "./Home.css";
const journeys = [
  {
    title: "Starting something new",
    icon: Sparkles,
    copy: "An idea, an emerging business, or simply a question about where to begin.",
    detail:
      "Example: turn a broad idea into a small, testable first step. Clarify who it helps, what you need to learn and which existing tools could be enough.",
    path: "An idea → a clearer question → a practical first step",
  },
  {
    title: "Improving an existing business",
    icon: MoveUpRight,
    copy: "Less administration. Fewer disconnected tools. A process that fits your day.",
    detail:
      "Example: map how enquiries become bookings and follow-ups. Identify duplicated work, compare suitable platforms and agree a manageable improvement.",
    path: "A daily friction → a workflow map → a focused improvement",
  },
  {
    title: "Building a technical solution",
    icon: Puzzle,
    copy: "A specific requirement that needs considered design and sound engineering.",
    detail:
      "Example: explore an operational web application. Define essential records, users and integrations, then assess feasibility before agreeing delivery.",
    path: "A requirement → feasible options → an agreed scope",
  },
];
export default function Home() {
  const hero = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.15]);
  return (
    <>
      <section ref={hero} className="public-hero" aria-labelledby="hero-title">
        <MediaSection media={media.hero} background>
          <div className="hero-sculptural">
            <Sculpture />
            <div className="hero-coordinate">
              Considered by design.
              <br />
              Built around you.
            </div>
          </div>
        </MediaSection>
        <motion.div
          className="hero-content"
          style={{ y: reduced ? 0 : y, opacity: reduced ? 1 : opacity }}
        >
          <p className="hero-intro">
            Technology consulting & intelligent solutions
          </p>
          <h1 id="hero-title">
            Technology,
            <br />
            <span>thoughtfully</span> tailored.
          </h1>
          <div className="hero-bottom">
            <p>
              Clarity for your next decision.
              <br />
              Engineering for what comes after.
            </p>
            <div className="actions">
              <Link className="pub-pill pub-pill-dark" to="/contact">
                Let's find your next step <ArrowUpRight size={18} />
              </Link>
              <Link className="hero-secondary" to="/services">
                Explore our services
              </Link>
            </div>
          </div>
        </motion.div>
        <a href="#introduction" className="hero-scroll">
          <ArrowDown size={16} /> A clearer way forward
        </a>
        <span className="hero-side-note">
          Independent thinking. Practical technology.
        </span>
      </section>
      <section className="public-section home-introduction" id="introduction">
        <div className="section-prelude">
          <span>Meet kailor</span>
          <span>Consultancy + engineering + intelligence</span>
        </div>
        <h2>
          Good technology starts
          <br />
          with <span className="kinetic-word">understanding.</span>
        </h2>
        <div className="introduction-aside">
          <span className="tiny-orbit" aria-hidden="true">
            ✳
          </span>
          <div>
            <p>
              We bring practical consulting, software engineering and
              intelligent assessment together to help you make better technology
              decisions.
            </p>
            <p>
              For the idea taking shape. The business ready to work better. The
              technical challenge that needs a thoughtful solution.
            </p>
            <Link className="pub-text-link" to="/about">
              A little more about kailor <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section
        className="home-services public-section"
        aria-labelledby="services-title"
      >
        <div className="section-prelude">
          <span>What we do</span>
          <span>Different disciplines. One considered approach.</span>
        </div>
        <h2 id="services-title">
          From the right question
          <br />
          to the <span>right solution.</span>
        </h2>
        <StackedPanels />
      </section>
      <section className="public-section home-journeys">
        <div className="section-prelude">
          <span>Your starting point</span>
        </div>
        <h2>
          Where are <span>you now?</span>
        </h2>
        <div className="journey-grid">
          {journeys.map((j, i) => {
            const Icon = j.icon;
            return (
              <article className={`journey-tile journey-${i}`} key={j.title}>
                <div className="journey-geometry" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <Icon size={34} strokeWidth={1} />
                </div>
                <h3>{j.title}</h3>
                <p>{j.copy}</p>
                <details>
                  <summary>
                    See a possible journey <ArrowUpRight size={17} />
                  </summary>
                  <p>{j.detail}</p>
                  <span className="journey-path">{j.path}</span>
                  <Link to="/how-it-works" className="pub-text-link">
                    Understand the process <ArrowUpRight size={16} />
                  </Link>
                </details>
              </article>
            );
          })}
        </div>
      </section>
      <section className="public-section home-conversation" id="conversation">
        <div className="conversation-intro">
          <span>A conversation with kailor</span>
          <h2>
            Start with
            <br />
            what's <span>on your mind.</span>
          </h2>
          <p>
            You don't need a technical brief to begin. A good conversation can
            uncover the question worth answering.
          </p>
          <Link className="pub-pill pub-pill-dark" to="/how-it-works">
            See how it works <ArrowUpRight size={17} />
          </Link>
        </div>
        <MediaSection media={media.conversation}>
          <ConversationVisual />
        </MediaSection>
      </section>
      <section className="public-section home-process" id="process">
        <div className="section-prelude">
          <span>How kailor works</span>
          <Link className="pub-text-link" to="/how-it-works">
            The full process <ArrowUpRight size={17} />
          </Link>
        </div>
        <h2>
          A little more clarity.
          <br />
          <span>At every step.</span>
        </h2>
        <ProcessTimeline />
      </section>
      <section className="public-section home-intelligence" id="intelligence">
        <div>
          <span>The intelligence behind kailor</span>
          <h2>
            Connected thinking.
            <br />
            <span>Human judgement.</span>
          </h2>
          <p>
            AI can help organise context and explore options. It works best with
            clear boundaries, useful evidence and professional oversight.
          </p>
          <Link className="pub-text-link" to="/services#ai">
            Explore our approach to AI <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="intelligence-mosaic">
          {[
            [
              MessageCircle,
              "Conversational AI",
              "An accessible way to explore a situation.",
            ],
            [
              BrainCircuit,
              "Language models",
              "Assistance with interpretation and drafting.",
            ],
            [
              ScanLine,
              "Context",
              "Your goals and constraints give advice meaning.",
            ],
            [
              Blocks,
              "Structured assessment",
              "A way to organise evidence and compare options.",
            ],
            [
              Workflow,
              "Automation",
              "Start with the process, then consider the tools.",
            ],
            [
              Puzzle,
              "APIs & integrations",
              "Connections assessed for each project.",
            ],
            [
              Cloud,
              "Cloud engineering",
              "Infrastructure suited to the requirement.",
            ],
            [
              ShieldCheck,
              "Human oversight",
              "Judgement and agreement remain essential.",
            ],
            [
              Lightbulb,
              "Recommendations",
              "Practical next steps, with uncertainty made clear.",
            ],
          ].map(([Icon, title, copy]) => {
            const TileIcon = Icon as typeof MessageCircle;
            return (
              <details className="intelligence-tile" key={String(title)}>
                <summary>
                  <TileIcon size={26} strokeWidth={1.2} />
                  <span>{String(title)}</span>
                </summary>
                <p>{String(copy)}</p>
              </details>
            );
          })}
        </div>
      </section>
      <section className="public-section home-insights" id="insights">
        <div className="section-prelude">
          <span>A clearer picture</span>
          <span>Illustrative process · not performance data</span>
        </div>
        <h2>
          Make progress
          <br />
          <span>with perspective.</span>
        </h2>
        <InsightGraph />
        <div className="insight-facts">
          <div>
            <strong>5</strong>
            <p>
              Connected service disciplines.
              <br />
              One practical point of view.
            </p>
          </div>
          <div>
            <strong>3</strong>
            <p>
              Starting points.
              <br />A path shaped around yours.
            </p>
          </div>
          <div>
            <strong>You.</strong>
            <p>
              Your needs set the direction.
              <br />
              The technology follows.
            </p>
          </div>
        </div>
      </section>
      <section className="public-section home-work" id="work">
        <div className="section-prelude">
          <span>Possible solutions</span>
        </div>
        <h2>
          Ideas made <span>tangible.</span>
        </h2>
        <MediaSection media={media.work}>
          <FeatureCarousel />
        </MediaSection>
      </section>
      <section className="public-section home-engagements" id="engagements">
        <div className="section-prelude">
          <span>Ways to work with kailor</span>
          <Link className="pub-text-link" to="/pricing">
            Engagement details <ArrowUpRight size={17} />
          </Link>
        </div>
        <h2>
          The right level
          <br />
          <span>of support.</span>
        </h2>
        <Engagements />
      </section>
      <section className="public-section home-closing">
        <span>A good place to begin</span>
        <h2>
          Let's make
          <br />
          <span>the next step</span> clear.
        </h2>
        <div>
          <p>
            Tell us what you're thinking about.
            <br />
            We'll start with a conversation.
          </p>
          <a
            className="pub-pill pub-pill-dark"
            href={mail("Let's talk about technology")}
          >
            Let's talk <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
    </>
  );
}
