import "./Hero.css";
import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import { MediaSection } from "../../../../components/public/MediaSection/MediaSection";
import { media } from "../../media";

export function Hero() {
  return (
    <section className="kailor-hero" aria-labelledby="hero-title">
      <MediaSection media={media.hero} background>
        <div className="kailor-hero__fallback" />
      </MediaSection>

      <div className="kailor-hero__overlay" aria-hidden="true" />

      <div className="kailor-hero__content">
        <h1 id="hero-title">
          Technology that
          <br />
          works for you.
        </h1>

        <p>
          From a first business idea to complex software and AI systems, kailor
          helps you choose, build and improve technology around your goals.
        </p>

        <div className="kailor-hero__actions">
          <Link className="pub-pill pub-pill-dark" to="/services">
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
