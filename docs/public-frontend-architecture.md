# Public frontend architecture

The public website is independent of the authenticated application. Each component
folder below contains matching `Name.tsx` and `Name.css` files. Page entry files
compose sections in their original order; components import their own CSS.

## File tree

```text
frontend/src/
├── components/public/
│   ├── PublicLayout/          # PublicLayout.tsx/.css + usePublicPage.ts
│   ├── Header/                # Navigation, dropdown, scroll state, Escape focus
│   ├── Footer/                # Wordmark, contact and navigation
│   ├── MediaSection/          # Video/image/fallback and visibility playback
│   ├── StackedPanels/         # Sticky service panels and scroll transforms
│   ├── ConversationVisual/    # Scripted messages, avatar, timer and controls
│   ├── ProcessTimeline/       # Shared process diagram and motion
│   ├── InsightGraph/          # SVG graph and scroll-driven path
│   ├── FeatureCarousel/       # Solution examples and carousel interaction
│   ├── Engagements/           # Shared enquiry/engagement cards
│   ├── Sculpture/             # Existing About and Services visual only
│   ├── navigation.ts          # Header/footer destinations
│   └── primitives.css         # Public typography, spacing, buttons and focus
├── pages/Public/
│   ├── Home/                  # Home.tsx/.css
│   │   ├── Hero/
│   │   ├── Introduction/
│   │   ├── ServicesSection/
│   │   ├── ClientJourneys/
│   │   ├── Conversation/
│   │   ├── Process/
│   │   ├── Intelligence/
│   │   ├── Insights/
│   │   ├── SelectedWork/
│   │   ├── EngagementSection/
│   │   └── Closing/
│   ├── Services/              # Services.tsx/.css
│   │   ├── ServicesHero/
│   │   ├── ServiceIndex/
│   │   ├── ServiceDetails/
│   │   └── ServicesClosing/
│   ├── HowItWorks/            # HowItWorks.tsx/.css
│   │   ├── ProcessHero/
│   │   ├── ProcessOverview/
│   │   ├── ProcessEditorial/
│   │   ├── HumanAI/
│   │   └── ProcessClosing/
│   ├── About/                 # About.tsx/.css
│   │   ├── AboutHero/
│   │   ├── Statement/
│   │   ├── Principles/
│   │   └── Founder/
│   ├── Pricing/               # Pricing.tsx/.css
│   │   ├── PricingHero/
│   │   ├── PricingOptions/
│   │   ├── PricingQuestions/
│   │   └── PricingClosing/
│   ├── Contact/               # Contact.tsx/.css
│   │   ├── ContactHero/
│   │   ├── DirectContact/     # Owns clipboard state and feedback
│   │   └── ContactLinks/
│   ├── content.ts             # Shared services, steps, engagements and email
│   └── media.ts               # Central media configuration
└── styles/
    ├── global.css
    ├── layout.css
    └── tokens.css
```

## Editing sections and styles

Edit a homepage section in its named folder. Journey copy lives directly in
`ClientJourneys.tsx`; carousel examples remain with `FeatureCarousel`. Shared
service, process and engagement copy stays in `content.ts` because multiple pages
use it. Header and footer share only the navigation list.

`PublicLayout` imports public primitives before its child components. Primitives
contain the existing site typography, focus indicators, rounded controls, section
spacing, page hero/closing patterns and reduced-motion rules. They use the existing
global tokens; global styles and authenticated layouts were not changed.

Section selectors retain their existing names and specificity. Responsive and
animation rules live with their owning component. About, HowItWorks and Contact
retain small page-level rules shared by two sections; their page CSS is imported
after their section imports, preserving the original cascade. Home.css contains
only the existing anchor scroll offset. Some section CSS files contain only a
comment because their appearance uses shared primitives and child components;
add future section-specific rules there instead of copying shared declarations.

The old header capsule overrides were consolidated into the active Header styles.
Unused old homepage hero/sculpture styles, absent wordmark-span styles and absent
media-pause button styles were removed. Sculpture remains because About and
Services still render it. No sculpture was restored to Home. There is no duplicate
legacy Public.css or Visuals.tsx implementation.

## Routing, accessibility and metadata

`App.tsx` still lazy-loads all six public routes inside `PublicLayout`; only its
layout import path changed. Application routes, authentication and the application
footer remain separate. `PublicLayout` owns the skip link and focusable main.
`usePublicPage` preserves description, Open Graph and canonical updates, hash
scrolling, scroll reset and main focus. The local browser title remains `kailor`.
The favicon configuration in `frontend/index.html` was not changed by this refactor.

Header owns dropdown state, closing on route/hash changes, Escape focus restoration
and its existing scroll listener. No wrapper elements were added around sections.

## Media

Edit paths in `pages/Public/media.ts`. The existing
`/media/hero/kailor-hero.mp4` asset remains in place. `Hero` owns its overlay, heading,
actions and responsive layout; `MediaSection` owns loading, fallback, muted looping
inline playback, IntersectionObserver pause/resume and reduced-motion behavior.

The authoritative local baseline has a text-only header wordmark, a transparent
header at the top of Home, an outlined menu button, and no visible background-video
pause button. Its dropdown is hidden above 760px even when toggled. These existing
behaviors were preserved rather than changed to match illustrative requirements.
Existing image assets, including kailor-head.png, were not changed or relocated.

## Adding a section or page

1. Create `Name/Name.tsx` and `Name/Name.css`; import the CSS in the component.
2. Keep its content, state and interactions in that folder. Put genuinely reusable
   components under `components/public`; page-only sections stay under their page.
3. Compose the section in the page entry without additional layout wrappers.
4. For a new page, add its lazy route in `App.tsx`, metadata in `usePublicPage.ts`
   and navigation in `navigation.ts` when appropriate.
5. Check desktop/mobile layout and direct navigation as well as transitions from
   Home. Preserve specificity and ordering when sharing CSS.

## Refactor verification (19 October 2026)

- Before edits: production build passed. Frontend tests had 5 failures: 4 lacked
  IntersectionObserver for the newly configured local video; 1 application
  navigation test failed transiently. Public tests also contained stale headline
  and desktop-navigation assumptions, updated to the current local implementation.
- After extraction: typecheck, full build and full test suite passed (334 backend
  and 54 frontend tests). Public tests
  cover routes, canonical metadata, title/Open Graph title, menu focus, journeys,
  service anchors, conversation controls, reduced motion, carousel and fallbacks.
  Added hero checks cover MP4 path, muted/loop/inline attributes, visibility playback
  and observer cleanup.
- Browser comparison: recorded 19 computed layout/typography/color properties plus
  element order and leaf text. All 404 non-SVG homepage elements matched at
  1440×900 and 390×844. All five dedicated pages matched at 390×844 after correcting
  shared responsive-rule ordering. Header transition timing was excluded from
  dedicated-page comparisons; its settled state was inspected separately.
- Screenshots and interactions inspected: desktop/mobile hero, scroll header,
  sticky panel transforms, journey disclosure, conversation pause/restart, graph,
  carousel, pricing, footer, page navigation and mobile menu. Video playback and
  offscreen pause were observed. Automated tests cover reduced-motion behavior.
- This is not a frame-by-frame pixel comparison of animated content. Video frames,
  motion timing and hover states were not exhaustively compared.

All work remains unstaged and uncommitted. Existing local media, index.html,
favicon deletion and media.backup.ts.txt were preserved. No backend or application
business-logic changes were made.

Removed old paths under `components/public`: `Public.css`, `Visuals.tsx`,
`PublicLayout.tsx`, `PublicLayout.css`, `StackedPanels.tsx`,
`ConversationVisual.tsx`, `FeatureCarousel.tsx`, `MediaSection.tsx` and
`Engagements.tsx`. Their active implementations and styles now live in the
component folders above. The one-line ArrowLink wrapper was replaced by the same
icon with the same props inside StackedPanels.
