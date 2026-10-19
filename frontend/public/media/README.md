# Public media

These are production media slots. Owner-supplied design inspiration stays outside `frontend/public` and is never imported.

Configure `frontend/src/pages/Public/media.ts`. Root-relative paths resolve from here, e.g. `/media/hero/desktop.mp4` (no `public` in the URL). Do not add a path until the file exists. Empty entries use the complete original CSS/SVG fallback.

```ts
hero: {
  desktopMp4: "/media/hero/desktop.mp4",
  mobileMp4: "/media/hero/mobile.mp4",
  poster: "/media/hero/poster.jpg",
  description: "Describe the visual briefly.",
},
conversation: {
  desktopMp4: "/media/conversation/product-demo.mp4",
  poster: "/media/conversation/product-demo.jpg",
  description: "A product walkthrough of …",
},
work: {
  image: "/media/work/solution.jpg",
  description: "An accurately labelled solution visual.",
},
```

- `hero/`: background media spans the opening viewport. Desktop is the default source; mobile source is chosen below 700px. Supply both crops when needed. Background is muted, inline, looped, pauses offscreen and has a pause/play button. Reduced motion uses the poster or sculpture instead of playing. Overlay strength lives in `Home.css`, `.public-hero .media-background::after`; confirm readability against your final video.
- `conversation/`: optional original screen recording replaces the scripted demonstration. Watched videos have native controls, no autoplay, inline playback and `preload="none"`. Include a meaningful poster. Provide a text equivalent/transcript for any recording that communicates more than the existing adjacent copy; add caption tracks before publishing spoken content.
- `work/`: optional image/GIF/video replaces the **entire** concept gallery. To customise individual gallery artwork, edit `FeatureCarousel.tsx` and keep its useful text and controls. GIFs use `image`; supply a static `poster` for reduced motion. Static screenshots use `image` and a meaningful description.

Prefer compressed original MP4/H.264 with dimensions appropriate to each crop. Avoid putting essential text inside video. Error states return to the original composition. No video elements are mounted for unconfigured sources. Image-only assets load lazily except for the hero. Additional service/journey/intelligence slots should be added only when real media needs them, using the same component/type.
