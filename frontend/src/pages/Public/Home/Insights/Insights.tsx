import { InsightGraph } from "../../../../components/public/InsightGraph/InsightGraph";
import "./Insights.css";
export function Insights() {
  return (
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
  );
}
