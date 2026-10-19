import { Link } from "react-router";
import {
  ArrowUpRight,
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
import "./Intelligence.css";
export function Intelligence() {
  return (
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
  );
}
