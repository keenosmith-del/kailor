import "./MediaSection.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
// Kept with the tested reusable component; the retired hero configuration is gone.
export type PublicMedia = {
  desktopMp4?: string;
  mobileMp4?: string;
  poster?: string;
  image?: string;
  description?: string;
};
export function MediaSection({
  media,
  background = false,
  children,
}: {
  media: PublicMedia;
  background?: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = video.current;
    if (!el || !background) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced && !paused)
        void el.play().catch(() => setPaused(true));
      else el.pause();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [background, reduced, paused]);
  const hasVideo =
    !!(media.desktopMp4 || media.mobileMp4) &&
    !failed &&
    !(background && reduced);
  return (
    <div className={`public-media ${background ? "media-background" : ""}`}>
      {hasVideo ? (
        <>
          <video
            ref={video}
            muted={background}
            loop={background}
            playsInline
            controls={!background}
            preload="none"
            poster={media.poster}
            aria-label={media.description}
            onError={() => setFailed(true)}
          >
            {media.mobileMp4 && (
              <source
                src={media.mobileMp4}
                type="video/mp4"
                media="(max-width: 700px)"
              />
            )}
            {(media.desktopMp4 || media.mobileMp4) && (
              <source
                src={media.desktopMp4 || media.mobileMp4}
                type="video/mp4"
              />
            )}
          </video>
        </>
      ) : !failed &&
        (media.poster ||
          (media.image && !(reduced && /\.gif(?:\?|$)/i.test(media.image)))) ? (
        <img
          src={
            reduced ? media.poster || media.image : media.image || media.poster
          }
          alt={media.description || ""}
          loading={background ? "eager" : "lazy"}
          onError={() => setFailed(true)}
        />
      ) : (
        children
      )}
    </div>
  );
}
