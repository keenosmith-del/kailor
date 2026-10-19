import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import type { PublicMedia } from "../../pages/Public/media";
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
          {background && !reduced && (
            <button
              className="pub-pill media-pause"
              onClick={() => {
                if (video.current) {
                  if (paused)
                    void video.current.play().catch(() => setFailed(true));
                  else video.current.pause();
                }
                setPaused(!paused);
              }}
            >
              {paused ? "Play background" : "Pause background"}
            </button>
          )}
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
