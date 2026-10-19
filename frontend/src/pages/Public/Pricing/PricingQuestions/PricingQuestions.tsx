import "./PricingQuestions.css";
export function PricingQuestions() {
  return (
    <section className="public-section pricing-questions">
      <h2>
        Before
        <br />
        <span>we begin.</span>
      </h2>
      <div>
        {[
          [
            "How is a project priced?",
            "After understanding your requirement, we agree a scope and quote. Deliverables, assumptions, exclusions and responsibilities should be clear before work starts.",
          ],
          [
            "Do I need custom software?",
            "Possibly not. An assessment may recommend an existing platform, a process change, a smaller experiment or no development at all.",
          ],
          [
            "Does an assessment include implementation?",
            "Implementation is separately scoped and agreed. A recommendation or demonstration does not commission work or guarantee delivery.",
          ],
          [
            "Can I explore without an account?",
            "The application has a guest Discovery workflow. Public access and its limits are a launch decision, so contact us to confirm availability. Temporary guest work has different retention from account work.",
          ],
          [
            "Are third-party services included?",
            "Hosting, model usage, external platforms and other operating costs depend on the selected approach. Any such costs need to be identified and agreed; they are not implied by these options.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
