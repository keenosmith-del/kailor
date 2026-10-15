# Frontend architecture refactor

## Before: inventory and audit

The audited frontend has 18 files directly under `src/`, one 1,687-line stylesheet,
and 13 public PNG assets (favicon plus mascot head, sitting/smiling and nine poses).
There are no nested source folders, frontend tests, lint command, custom hooks or
shared context/providers. React state stays in components; authentication is owned
by App. main.tsx supplies StrictMode, MotionConfig (user reduced motion) and BrowserRouter.
The baseline frontend production build passes.

Actual route inventory:

| Path                                        | Existing implementation                                        |
| ------------------------------------------- | -------------------------------------------------------------- |
| `/`                                         | Intro, three gesture/keyboard scenes                           |
| `/sign-in`, `/create-account`               | Auth, parameterized sign-in/invited registration               |
| `/workspace`                                | Workspace, member plans and conditional founder review/invites |
| `/plans`, `/preview/plans`                  | Inline session-shell with reusable PlanManager                 |
| `/plans/:planId`, `/preview/plans/:planId`  | PlanLanding, selection/redirect and archived fallback          |
| `/sessions/:id/:view`, `/preview/:id/:view` | SessionPage, discovery/conversation/canvas/report views        |
| `*`                                         | Redirect to `/`                                                |

Discovery, Conversation, Canvas and Analysis are the actual session views. There
are no standalone settings, dashboard, recovery or account-management routes.
Protected and the API client's 401 handler preserve authentication redirects.
Guest paths use the existing `/api/guest` endpoint prefix. PDF download uses the
same client endpoint resolver. No backend contracts need changing.

Shared UI is Mascot, ErrorBox, PlanNavigation and PlanManager. Plans.tsx mixes two
shared components with a route page and plan display helpers. Workspace contains
large founder-only CaseReview and InviteForm internals. Intro/Discovery scene
helpers are small and appropriately local. Conversation manages transcript,
confirmations, suggestions, drafts and composer together. api.ts owns requests,
errors, downloads and session URLs; drafts.ts owns tab-scoped expiring persistence;
types.ts contains shared session-view props. mascot-assets.ts holds public URLs.
Shared schemas and conversation suggestions come from shared/src, and founder
service choices from data/services; these external files will remain untouched.

The principal risks are relative imports and CSS cascade order. styles.css mixes
resets/tokens, shared controls/navigation, page styles, breakpoint rules and later
iteration overrides. Some apparently repeated rules intentionally override earlier
rules (including mobile rules); removing them indiscriminately would alter visuals.
There are no verified unused source modules. Public assets will keep their URLs.

## Target plan (recorded before source edits)

1. Move Intro and Auth, then session views/controller, then Workspace into
   `pages/Name/Name.tsx`, checking TypeScript after each related group.
2. Separate Plans/PlanLanding pages from reusable PlanManager/PlanNavigation.
3. Colocate Mascot/ErrorBox and extract the substantial founder-only Workspace
   internals under its own components folder. Keep small scene helpers local.
4. Move API to services, drafts/error formatting to utils, shared props/account
   to types, mascot URL constants beside Mascot. Do not invent context/hook layers.
5. Split styles by ownership, retaining tokens, base controls, shared shell and
   accessibility rules globally. Preserve cascade outcomes, all breakpoints,
   interaction states and animation declarations; verify against baseline CSS.
6. Run frontend checks/build, static import/assets checks and representative
   browser/interaction checks where available; record exact limitations below.

## After

```text
frontend/
  index.html, package.json, tsconfig.json, vite.config.ts
  public/                         # unchanged favicon and mascot PNGs
  src/
    App.tsx                       # existing routes and authentication guard/state
    main.tsx                      # global styles, then existing React providers
    pages/
      Intro/                      # each page folder has Name.tsx + Name.css
      Auth/                       # shared sign-in/registration screen
      Discovery/
      Conversation/
      Canvas/
      Analysis/                   # report view; route still ends in /report
      SessionPage/                # session loading/actions and view composition
      Plans/                      # existing standalone PlanManager shell
      PlanLanding/                # existing plan selection/archived fallback
      Workspace/
        Workspace.tsx, Workspace.css
        components/
          CaseReview/             # CaseReview.tsx + CaseReview.css
          InviteForm/             # InviteForm.tsx + InviteForm.css
    components/
      ErrorBox/                   # ErrorBox.tsx + ErrorBox.css
      Mascot/                     # Mascot.tsx + Mascot.css + mascot-assets.ts
      PlanManager/                # PlanManager.tsx + PlanManager.css
      PlanNavigation/             # PlanNavigation.tsx + PlanNavigation.css
    services/
      api.ts                      # requests, ApiError, guest routing, PDF download
    styles/
      global.css                  # Tailwind, tokens, reset, forms, shared controls
      layout.css                  # shared session shell/navigation
    types/
      account.ts
      session.ts
    utils/
      drafts.ts
      errorMessage.ts
```

All ten existing pages/views now import their own matching stylesheet directly.
The route inventory above is unchanged. Auth remains one parameterized screen for
its two existing routes. Plans is a named extraction of the existing inline JSX;
it does not introduce a new screen. Plans.css and PlanLanding.css deliberately
contain ownership notes rather than invented rules: their current UI is entirely
styled by the shared shell and PlanManager. SessionPage.css owns the fieldset;
Conversation.css owns the bounded conversation-shell geometry.

Shared components import their colocated CSS. PlanManager is reused by Plans,
PlanLanding, Workspace and the PlanNavigation dialog. ErrorBox and Mascot remain
small explicit components. CaseReview and InviteForm are Workspace internals;
their types and founder-specific UI stay local. Small scene helpers remain in
Intro/Discovery/SessionPage. Conversation's tightly coupled transcript, evidence,
draft and composer state remains together; no new state abstractions were added.

There are no hooks/context directories because no existing standalone reusable
hooks or shared contexts required them. Authentication state still lives in App;
page state remains where it was. Public assets retain their exact root-relative
URLs, so no empty assets directory or asset migration was needed. Shared domain
types, conversation suggestions and the service catalogue remain in their
existing shared/data packages.

### CSS conventions and cascade

- Page CSS owns page selectors and their responsive rules. Discovery owns its
  choices/actions; Conversation owns messages, suggestions and confirmations;
  Canvas owns cards/pills; Analysis owns report controls and panels.
- Component CSS owns reusable component selectors. Workspace's extracted
  components own their own styles.
- global.css holds existing tokens, base typography, form fields, utility classes,
  shared button/link classes and reduced-motion behavior. layout.css holds styles
  shared by the session, workspace and standalone plan surfaces.
- main.tsx loads global.css and layout.css before App. Pages/components then
  import their CSS directly. No lazy loading, cascade layers or router changes
  were introduced.
- Existing selectors, breakpoints, tokens, hover/focus/disabled behavior and
  animations are preserved. Later overrides within an owner are intentionally
  still ordered after earlier responsive blocks where that was the old behavior.
  Do not automatically move every media query to the bottom.
- Discovery choices explicitly retain the shared 13px control font, 34px desktop
  minimum height and 44px mobile/coarse-pointer targets. These formerly depended
  on the late global .surface-button override. The browser comparison caught
  and resolved that order dependency during migration.

## Migration

| Original source                                                                                                | Final owner                                                      |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Intro.tsx, Auth.tsx, Discovery.tsx, Conversation.tsx, Canvas.tsx, Analysis.tsx, SessionPage.tsx, Workspace.tsx | Matching pages/Name/Name.tsx                                     |
| Plans.tsx: PlanManager and display helpers                                                                     | components/PlanManager/PlanManager.tsx                           |
| Plans.tsx: PlanNavigation/dialog                                                                               | components/PlanNavigation/PlanNavigation.tsx                     |
| Plans.tsx: PlanLanding                                                                                         | pages/PlanLanding/PlanLanding.tsx                                |
| App.tsx: inline standalone plans markup                                                                        | pages/Plans/Plans.tsx                                            |
| Workspace.tsx: CaseReview/types, InviteForm                                                                    | pages/Workspace/components/CaseReview and InviteForm             |
| Mascot.tsx, mascot-assets.ts                                                                                   | components/Mascot/                                               |
| ui.tsx: ErrorBox                                                                                               | components/ErrorBox/ErrorBox.tsx                                 |
| ui.tsx: errorMessage                                                                                           | utils/errorMessage.ts                                            |
| api.ts                                                                                                         | services/api.ts                                                  |
| drafts.ts                                                                                                      | utils/drafts.ts                                                  |
| types.ts                                                                                                       | types/session.ts                                                 |
| Auth.tsx: Account type                                                                                         | types/account.ts                                                 |
| styles.css                                                                                                     | styles/global.css, styles/layout.css, and colocated owner styles |

Relative imports and route component imports were repaired at each move. No
compatibility re-export files, barrels, old source copies or abandoned stylesheets
remain. The old flat files were removed after their consumers were updated.
Normalized token comparison confirmed that 26 of the 27 original top-level
function declarations are unchanged apart from paths, exports and formatting;
App's only structural JSX change is using the equivalent Plans wrapper.

CSS cleanup removed 59 declarations superseded by later declarations of the same
selector/condition, merged adjacent identical media blocks, and removed verified
unused surface-control, narrow/login, inline-form, session-row and desktop-break
rules. The unused inline-form rule included an unnecessary !important. Existing
reduced-motion !important rules remain. No assets, features or API contracts were
removed, and no packages/configuration were changed.

## Verification

Completed on 15 October 2026:

| Check                                               | Result                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Baseline `npm run build -w frontend`                | Passed before source edits                                                                                                         |
| `npm run typecheck -w frontend` after page groups   | Passed                                                                                                                             |
| `npm run typecheck -w frontend -- --noUnusedLocals` | Passed after extraction/import cleanup                                                                                             |
| Final `npm run build -w frontend`                   | Passed; TypeScript plus Vite production bundle                                                                                     |
| `npx prettier --check frontend/src`                 | Passed                                                                                                                             |
| Static source/import/asset audit                    | Ten page conventions, 102 relative imports and 12 source-referenced mascot assets resolve; unchanged favicon remains in index.html |
| Original function comparison                        | 26 original declarations unchanged; App's Plans wrapper is the expected difference                                                 |
| Browser baseline comparison, reduced motion         | 48 desktop/mobile cases; zero computed-style differences and 48 byte-identical screenshot pairs                                    |
| Browser baseline comparison, normal motion          | 24 tablet/narrow-mobile/short-landscape cases; zero computed-style differences                                                     |
| Existing frontend lint/tests                        | No lint command or frontend test suite is configured                                                                               |

### Browser checks actually performed

Headless installed Chrome exercised the saved original production bundle and the
refactored bundle with the same isolated API fixtures. The reduced-motion matrix
used 1440×1000 and 390×844 viewports. It covered all three intro scenes, both auth
modes, founder/member workspace, founder review/invites, plans/guest plans,
archived-plan fallback, discovery/guest discovery/focus/hover, conversation populated/
empty/clear/error states, plan dialog, canvas, analysis, unknown session view and
unauthenticated redirect. No browser runtime errors occurred.

Normal-motion comparisons covered Intro scene three, Discovery/focus/hover,
Conversation, plan dialog, Canvas and Analysis at 1000×800, 360×780 and 667×375.
Twenty-two screenshot pairs were byte-identical. Two narrow Discovery screenshots
had 412 pixels differing by at most one RGB channel value; computed styles were
identical, and both screenshots were visually inspected. Desktop Introduction and
mobile Conversation screenshots were also visually inspected.

A separate pass used the actual Vite dev server on port 5176 with isolated API
responses. Port 5173 was occupied, so the existing process was left alone. It
verified direct entry and refresh for 17 route cases (including preview routes and
the wildcard), image loading, and these interaction groups:

1. Intro wheel/keyboard progression and authenticated Start Discovery.
2. Sign-in payload and returnTo navigation.
3. Invited registration payload and unsafe-returnTo fallback.
4. Discovery answer payload, guest endpoint routing and mascot progression.
5. Suggestion-to-composer, draft restoration after refresh, Shift+Enter/Enter,
   composer height cap, chat payload and confirmed conversation clearing.
6. Native plan dialog opening/Escape and guest plan requests.
7. Report keyboard navigation and PDF download filename/request.
8. Protected-route redirect.
9. Logout endpoint and draft clearing.
10. Inline evidence acceptance payload and revision.
11. New conversation's plan-scoped session creation payload/key.

Temporary comparison scripts, fixtures, screenshots and JSON results are under
`/tmp/kailor-refactor-baseline` and `/tmp/kailor-*.cjs`; they are verification
artifacts, not frontend dependencies or committed test infrastructure.

### Limits and issues requiring attention

These browser checks use fixtures. They do not establish live authentication,
AI-provider quality, database persistence, PDF content correctness or full founder
review/plan-management integration. The existing backend suite was not run or
modified; no frontend suite exists. No backend, Prisma, data or shared-package
source was changed.

Nested-route refresh works in Vite. Existing deployment documentation says
production frontend hosting is not provisioned and requires a static `index.html`
SPA fallback plus same-origin `/api` proxy; deployment refresh cannot be verified
without that hosting environment. Physical mobile keyboards and screen readers
were not tested. No production deployment was attempted.

All changes remain unstaged and uncommitted. No Git history was written.

## Developer guidance

- Add a real page as pages/Name/Name.tsx plus Name.css, import `./Name.css` in the
  page, then explicitly add its route in App.tsx. Keep established paths stable.
- Put substantial page-only UI under that page's components/ folder; keep small
  presentational helpers in the main page file. Workspace demonstrates the pattern.
- Put components reused by multiple pages under components/Name/, with their own
  imported CSS when they have styles. PlanManager demonstrates shared ownership.
- Start a styling change in the matching page CSS. Follow a nested component's
  own stylesheet for its internals. Use global.css only for genuinely shared
  controls, typography, tokens and accessibility; use layout.css for shared shells.
- Keep API requests/downloads in services/api.ts, reusable pure/storage helpers in
  utils/, and genuinely shared frontend types in types/. Introduce hooks/context
  only when actual shared logic needs them.
- Check both authenticated and preview URLs after integration changes. Re-run the
  frontend typecheck/build and representative desktop/mobile checks after moving
  CSS or changing its import order.
