import "./Principles.css";
export function Principles() {
  return (
    <section className="public-section about-principles">
      <h2>
        How we
        <br />
        <span>think about the work.</span>
      </h2>
      <div>
        {[
          [
            "Understand before prescribing.",
            "Your goals, constraints and existing systems come before a technology choice.",
          ],
          [
            "Make the trade-offs visible.",
            "Explain why an option may fit, what remains uncertain and what needs checking.",
          ],
          [
            "Build only what earns its place.",
            "Prefer the smallest useful solution. Consider existing platforms before adding custom software.",
          ],
          [
            "Keep responsibility clear.",
            "AI assistance supports the process. Professional judgement and explicit agreement guide the work.",
          ],
        ].map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
