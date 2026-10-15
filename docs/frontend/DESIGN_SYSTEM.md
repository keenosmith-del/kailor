# kailor experience design — iteration 008

Iteration 008 section 44 supersedes every earlier instruction for glass surfaces. **Glassmorphism is removed throughout kailor.** Do not add backdrop filters, frosted panels, translucent controls, heavy shadows, oversized pills, decorative dots/dividers or ArrowUpRight. Earlier iteration records describe historical decisions, not the current design contract.

## Brand family

The actual local sister repository `/Users/keenosmith/Programming/kai` was inspected before styling changes: `frontend/src/pages/Home/Home.css`, `pages/SignIn/SignIn.css`, `index.css` and `App.css`. The reference is read-only; no kai files were changed. Source reference: [kai repository](https://github.com/keenosmith-del/kai).

Shared cues are cream `#faf7f0`, paper `#fffdf8`, charcoal `#302f2a`, muted `#77736b`, Helvetica/Arial typography, quiet surfaces and restrained labels. Kai's source also contains transparent surfaces and large rounded pills. Those are deliberately replaced according to the founder's latest requirements. Kailor retains its own discovery composition, character artwork, conversational layout and editorial reports.

## Shared controls

`frontend/src/styles.css` centralizes `--surface`, `--surface-edge`, `--surface-hover`, `--control-height`, `--control-padding`, `--control-font`, `--control-radius` and spacing tokens. `.button` and `.surface-button` share opaque paper surfaces, subtle warm edges, 13px labels, 7px × 12px padding, a 34px desktop minimum height and 9px corners. Primary controls use charcoal and cream; secondary controls use paper. Hover changes color, without a large lift or shadow. Disabled controls retain their label and visibly reduce opacity. Keyboard focus uses a visible 2px warm outline with offset, including inputs and choices. Mobile and coarse-pointer controls have a minimum 44px height; inputs remain at least comfortable form height and mobile composer text is 16px.

Introduction actions, authentication, Discovery choices/actions, suggestions, evidence confirmation, plan controls, workspace actions, Canvas and Analysis use the same system. Functional headings and form/action gaps are reduced; the character keeps intentional whitespace. Input backgrounds, dialogue surfaces and modal backdrops are opaque. Native dialog focus handling supports the constrained, internally scrolling plan selector.

## Conversation geometry

A `100dvh` shell and a complete `min-height: 0` flex chain constrain the session view, fieldset, grid, conversation and transcript. Only the transcript scrolls. The compact composer remains anchored below it, grows automatically to 144px and then scrolls internally. Safe-area padding keeps it usable near device edges. Error/processing notices do not consume layout height. A shorter mobile character row preserves transcript space; very short mobile layouts hide that row to protect typing space.

Conversation uses the exact supplied `/mascot/other/kailor-sitting.png`, contained without cropping. It never changes pose with sending, readiness, assessment or confirmation. Every assistant message reserves 32 × 32px for `/mascot/heads/kailor-head-neutral.png`. The author is simply “kailor”; one concise local-provider notice sits inside the transcript. No depth selector or repeated technical author label is shown. Evidence controls attach to the assistant following the source user message; related actions, suggestions, plan proposals and readiness stay in the transcript. Suggestions fill and focus a draft; assessment controls perform explicit actions and never navigate automatically.

Enter sends on fine-pointer desktop, Shift+Enter inserts a newline, and IME composition is respected. Touch users can use the Send control. Existing tab-scoped thirty-minute draft persistence, duplicate submission guard and error recovery remain. New conversation creates a fresh session in the same plan while preserving prior history/reports/drafts. Clear conversation asks for confirmation and archives/excludes the old conversational context; it preserves confirmed facts and reports.

## Discovery, Introduction and navigation

Discovery retains four starting pathways, adaptive questions, existing answers and dynamic supplied poses. The nine body poses still cycle after accepted responses; the smiling completion artwork remains. Question positioning, headings, options and action gaps are more compact. The removed Review your answers action stays removed.

SessionTransition now crossfades opacity only, without translating/scaling the whole page. Mascot and question transitions remain isolated. All supplied images reserve layout space and use contain fit. Reduced-motion preferences continue to suppress animation. Introduction retains three scenes, the supplied head artwork and Start Discovery. Its brand is lowercase kailor without decorative dot separators; account actions route to real authentication.

## Authentication and workspace

Dedicated sign-in and invited account creation use cream/paper columns at larger sizes and a single readable mobile composition. Email begins blank, fields have real labels, password-manager autocomplete and visible focus. The member workspace contains owned plans and preferences. Founder tools and invitation issuance are visible only to founders and independently protected by server middleware. No email verification or recovery success is simulated.

## Validation and limits

See [iteration 008](../iterations/008-ai-conversation-and-auth.md) for the current browser matrix, geometry evidence and automated results. Browser viewport testing does not establish physical iPhone keyboard or formal screen-reader behavior. Preserve the original artwork; no replacement illustrations, generated characters, video or sprite animation were introduced.
