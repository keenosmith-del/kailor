import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Mascot } from "./Mascot";
export function Intro() {
  const scenes = [
    {
      title: "Every great idea\nstarts somewhere.",
      body: "A growing business. A new beginning. A better way of doing things. Whatever brings you here, let’s start with you.",
      state: "greeting" as const,
    },
    {
      title: "Let’s figure it\nout together.",
      body: "A few thoughtful questions. A conversation at your pace. We’ll connect what matters to you with what technology could make possible.",
      state: "curious" as const,
    },
    {
      title: "From possibility\nto reality.",
      body: "Clear opportunities. Proportionate solutions. A considered way forward — shaped around your world.",
      state: "recommendation" as const,
    },
  ];
  return (
    <main className="intro">
      {scenes.map((scene, i) => (
        <motion.section
          key={scene.title}
          className="intro-scene"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
        >
          <Mascot state={scene.state} />
          <div className="intro-copy">
            <p className="eyebrow">0{i + 1} / a new perspective</p>
            <h1>{scene.title}</h1>
            <p className="lead">{scene.body}</p>
            {i === 2 ? (
              <Link className="button primary" to="/workspace">
                Let’s begin <ArrowRight size={18} />
              </Link>
            ) : (
              <a className="text-link" href={`#scene-${i + 2}`}>
                Keep exploring <span>↓</span>
              </a>
            )}
          </div>
          <span id={`scene-${i + 1}`} className="scene-anchor" />
        </motion.section>
      ))}
    </main>
  );
}
