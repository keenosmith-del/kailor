# 020 — complete public website redesign

19 October 2026. Implemented locally; not deployed, staged, committed or pushed. Preserved the pre-existing backend, schema, application and documentation working-tree changes. No database operations, account modifications, remote inference or new dependencies.

## Delivered

- Six substantive public pages in `frontend/src/pages/Public/`: Home, Services, HowItWorks, About, Pricing, Contact, each with its own component and stylesheet.
- Shared public layout, header/footer, metadata, native page scrolling and application-layout separation. Trailing-slash public URLs remain public. Public visits do not call account/guest APIs. Existing protected, auth, preview, plan and founder routes remain; `/app` also redirects to `/app/chat`.
- All eleven homepage sections: edge-to-edge media-ready sculptural hero; editorial introduction; five sticky charcoal service panels; exactly three expandable client journeys; scripted conversation; five-stage process; intelligence mosaic; dimensional illustrative graph and honest information tiles; controlled horizontal solution-concept gallery; engagement enquiries; substantial contact closing.
- Semantic monochrome tokens and neutralised shared/app CSS accents; rounded controls throughout; existing app structure retained.
- Original CSS/SVG compositions, configured media fallbacks, reduced-motion alternatives, mobile menu, keyboard disclosures, carousel controls and copy-address feedback.
- Lazy application/public routes. The initial entry JS is approximately 244KB before compression, versus the initial pre-splitting 517KB build; other route/shared chunks load as needed. This is build output, not a measured web-vitals score.
- Favicon, theme, initial social metadata, route titles/descriptions/canonicals, robots and sitemap. See the hosting guide for SPA/social crawler limitations.

## Reference review

Inspected the supplied motion contact sheet, enlarged video frames and key palette, typography, conversation, graph, carousel, orb and timeline/service references. The MP4 was not directly played. Compared actual desktop overlap against the frames: incoming broad rounded charcoal panels cover earlier sticky panels; tonal edges remain visible, then the stack exits naturally. Inspiration assets are excluded from the build and ignored by Git.

## Executed verification

| Check                                 | Result                                                           |
| ------------------------------------- | ---------------------------------------------------------------- |
| `npm run typecheck`                   | Passed across all workspaces                                     |
| `npm test`                            | Passed: 334 backend tests, 52 frontend tests, 386 total          |
| `npm run build`                       | Passed shared/backend/frontend; Vite production assets generated |
| `git diff --check`                    | Passed                                                           |
| Reference material in `frontend/dist` | No reference-video/contact-sheet/reference-directory paths found |

Twelve added frontend tests cover actual lazy route integration, no public account request, private redirect, trailing-slash layout/canonical, all six pages and metadata, mobile-menu dismissal, service anchors, exactly three journey disclosures, conversation sequence/pause/restart, reduced-motion conversation content, media fallbacks, honest engagement links and carousel details/controls. Existing frontend and deterministic backend tests continue to pass.

### Rendered browser inspection

Inspected the live local Vite build in the Codex in-app browser at **1440, 1024, 768, 390 and 320 CSS pixels**. The homepage had document scroll width equal to viewport width at every inspected size. At 320px every supporting page also measured 320px document width. A text-overflow audit caught the narrow Recommendations tile; the mosaic now switches to two columns at <=400px and the repeated audit found no overflowing heading/paragraph/summary text.

Verified native scrolling, hero fallback, real sticky layering (first panel top 104px while incoming panel top 339px), static mobile panels, graph and timeline, conversation sequencing and pause control, mobile menu navigation, carousel movement (`2 / 3` with changed horizontal position), expanded solution details and successful email-copy status. Verified real `/app/chat` navigation redirects to `/sign-in?returnTo=%2Fapp%2Fchat` with the app shell and no public header. Public controls inspected with 999px computed radii.

Local QA screenshots are saved under ignored `.cache/public-website/`: `desktop-1440.jpg`, `mobile-320.jpg`, `stacked-panels-1440.jpg`.

Reduced-motion rendering is covered by the component tests and explicit CSS/Motion fallbacks; **OS/browser reduced-motion emulation was not performed**. No physical touchscreen or cross-browser/Safari test was performed. No signed-in account, live inference, guest-creation mutation or database-backed integration suite was exercised. Existing protected-route redirection and deterministic application suites were verified. Final MP4 playback/crops/captions require actual owner media.

## Handoff and remaining release decisions

- Editing/architecture/motion: [Public website guide](../style/PUBLIC_WEBSITE.md).
- Media configuration: `frontend/src/pages/Public/media.ts` and [Media replacement instructions](../../frontend/public/media/README.md).
- Registration/guests/inference/security and HTTPS/SPA hosting: [Launch review](../deployment/PUBLIC_WEBSITE_LAUNCH.md).
- Public launch still needs the owner's visual/content approval, final original media and commercial availability wording, an explicit account/guest/inference policy, privacy/retention review, staging verification and deployment approval. `REGISTRATION_POLICY=invite` is not an invitation gate in this working tree; closing signup alone does not close guest routes.

Preview locally with `npm run dev -w frontend`, or `npm run dev` for the existing API and frontend together. This iteration requires no migration or seed. No DNS, paid infrastructure, hosting or deployment configuration was changed.
