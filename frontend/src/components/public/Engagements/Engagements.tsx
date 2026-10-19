import "./Engagements.css";
import { ArrowUpRight } from "lucide-react";
import { engagements, mail } from "../../../pages/Public/content";
export function Engagements() {
  return (
    <div className="engagements">
      {engagements.map((plan, i) => (
        <article
          key={plan.name}
          className={i === 1 ? "engagement engagement-dark" : "engagement"}
        >
          <span>{plan.note}</span>
          <h3>{plan.name}</h3>
          <p>{plan.text}</p>
          <ul>
            {plan.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a className="pub-pill" href={mail(plan.subject)}>
            {plan.action}
            <ArrowUpRight size={16} />
          </a>
        </article>
      ))}
    </div>
  );
}
