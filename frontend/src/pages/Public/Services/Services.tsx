import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { services } from "../content";
import { Sculpture } from "../../../components/public/Visuals";
import "./Services.css";
export default function Services() {
  return (
    <>
      <header className="public-page-hero">
        <span>Our services</span>
        <h1>
          Practical expertise.
          <br />
          <span>Thoughtful outcomes.</span>
        </h1>
        <p>
          A connected set of disciplines, brought together around your needs.
          Start with the problem; choose the technology with care.
        </p>
      </header>
      <div className="services-index" aria-label="Service index">
        {services.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title} {s.second}
            <ArrowUpRight size={15} />
          </a>
        ))}
      </div>
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
      <section className="public-page-closing">
        <h2>
          A good solution starts
          <br />
          with a better question.
        </h2>
        <Link className="pub-pill pub-pill-dark" to="/how-it-works">
          How we work <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
