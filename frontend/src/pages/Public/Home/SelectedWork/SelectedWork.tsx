import { FeatureCarousel } from "../../../../components/public/FeatureCarousel/FeatureCarousel";
import { MediaSection } from "../../../../components/public/MediaSection/MediaSection";
import { media } from "../../media";
import "./SelectedWork.css";
export function SelectedWork() {
  return (
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
  );
}
