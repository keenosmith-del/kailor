import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { services } from "../../content";
import { Sculpture } from "../../../../components/public/Sculpture/Sculpture";
import "./ServiceDetails.css";
export function ServiceDetails() {
  return (
    <div className="service-details">
      {services.map((s, i) => {
        const Icon = s.icon;
        return (
          <section
            className="service-detail public-section"
            id={s.id}
            key={s.id}
          >
            <div>
              <Icon size={30} strokeWidth={1.2} />
              <h2>
                {s.title}
                <br />
                <span>{s.second}</span>
              </h2>
              <p>{s.detail}</p>
              <h3>What we work towards</h3>
              <p>{s.deliverable}</p>
              <div className="detail-tags">
                {s.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <Link className="pub-pill pub-pill-dark" to="/contact">
                Discuss your requirement <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="service-detail-art">
              <Sculpture kind={i + 1} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
