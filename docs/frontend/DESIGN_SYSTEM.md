# kailor experience design

Iteration 009 adds the scoped introduction/authentication pill controls described below; it supersedes the earlier corner/hover treatment only for those entry actions.

Iteration 008 section 44 supersedes every earlier instruction for glass surfaces. **Glassmorphism is removed throughout kailor.** Do not add backdrop filters, frosted panels, translucent controls, heavy shadows, oversized pills, decorative dots/dividers or ArrowUpRight. Earlier iteration records describe historical decisions, not the current design contract.

## Brand family

The actual local sister repository `/Users/keenosmith/Programming/kai` was inspected before styling changes: `frontend/src/pages/Home/Home.css`, `pages/SignIn/SignIn.css`, `index.css` and `App.css`. The reference is read-only; no kai files were changed. Source reference: [kai repository](https://github.com/keenosmith-del/kai).

Shared cues are cream `#faf7f0`, paper `#fffdf8`, charcoal `#302f2a`, muted `#77736b`, Helvetica/Arial typography, quiet surfaces and restrained labels. Kai's source also contains transparent surfaces and large rounded pills. Those are deliberately replaced according to the founder's latest requirements. Kailor retains its own discovery composition, character artwork, conversational layout and editorial reports.

## Shared controls

`frontend/src/styles.css` centralizes `--surface`, `--surface-edge`, `--surface-hover`, `--control-height`, `--control-padding`, `--control-font`, `--control-radius` and spacing tokens. `.button` and `.surface-button` share opaque paper surfaces, subtle warm edges, 13px labels, 7px × 12px padding, a 34px desktop minimum height and 9px corners. Primary controls use charcoal and cream; secondary controls use paper. Hover changes color, without a large lift or shadow. Disabled controls retain their label and visibly reduce opacity. Keyboard focus uses a visible 2px warm outline with offset, including inputs and choices. Mobile and coarse-pointer controls have a minimum 44px height; inputs remain at least comfortable form height and mobile composer text is 16px.

Discovery choices/actions, suggestions, evidence confirmation, plan controls, workspace actions, Canvas and Analysis use the system above. Introduction and authentication entry actions use the scoped pill treatment below. Functional headings and form/action gaps are reduced; the character keeps intentional whitespace. Input backgrounds, dialogue surfaces and modal backdrops are opaque. Native dialog focus handling supports the constrained, internally scrolling plan selector.

### Introduction and authentication entry controls (iteration 009)

`frontend/src/components/EntryButton/EntryButton.css` defines `.entry-button`, `.entry-button--text`, `.entry-button--light` and `.entry-button__arrow`. These actions use `9999px` corners, existing control height/font variables, 7px × 18px padding, 8px icon gaps, and 200ms transitions. Do not combine them with `.button` or `.surface-button`, whose compact 9px radius and hover reset caused the previous introduction controls to lose their pill treatment. Unrelated application controls retain their existing styling.

Text actions remain transparent and move from softer charcoal to the existing charcoal on hover. Light actions use `#fffefc`, changing to white and slightly lighter charcoal. Fine-pointer hover lifts the button 2px and moves only its arrow 4px right. The profile image reuses `/svgs/profile.svg` at 17px with contain sizing; arrows use the installed Lucide `ArrowRight`. Touch/mobile hit areas are at least 44px; keyboard focus retains a 2px warm outline. Reduced motion disables both lift and arrow movement. Account links remain outside scene transitions. Scene 3 retains its CTA placement; the user's concurrent refinement labels it “Continue” and omits the account-requirement note.

## Conversation geometry

A `100dvh` shell and a complete `min-height: 0` flex chain constrain the session view, fieldset, grid, conversation and transcript. Only the transcript scrolls. The compact composer remains anchored below it, grows automatically to 144px and then scrolls internally. Safe-area padding keeps it usable near device edges. Error/processing notices do not consume layout height. A shorter mobile character row preserves transcript space; very short mobile layouts hide that row to protect typing space.

Conversation uses the exact supplied `/mascot/other/kailor-sitting.png`, contained without cropping. It never changes pose with sending, readiness, assessment or confirmation. Every assistant message reserves 32 × 32px for `/mascot/heads/kailor-head-neutral.png`. The author is simply “kailor”; one concise local-provider notice sits inside the transcript. No depth selector or repeated technical author label is shown. Evidence controls attach to the assistant following the source user message; related actions, suggestions, plan proposals and readiness stay in the transcript. Suggestions fill and focus a draft; assessment controls perform explicit actions and never navigate automatically.

Enter sends on fine-pointer desktop, Shift+Enter inserts a newline, and IME composition is respected. Touch users can use the Send control. Existing tab-scoped thirty-minute draft persistence, duplicate submission guard and error recovery remain. New conversation creates a fresh session in the same plan while preserving prior history/reports/drafts. Clear conversation asks for confirmation and archives/excludes the old conversational context; it preserves confirmed facts and reports.

## Discovery, Introduction and navigation

Discovery retains four starting pathways, adaptive questions, existing answers and dynamic supplied poses. The nine body poses still cycle after accepted responses; the smiling completion artwork remains. Question positioning, headings, options and action gaps are more compact. The removed Review your answers action stays removed.

SessionTransition now crossfades opacity only, without translating/scaling the whole page. Mascot and question transitions remain isolated. All supplied images reserve layout space and use contain fit. Reduced-motion preferences continue to suppress animation. Introduction retains three scenes, the supplied head artwork and Start Discovery. Its brand is lowercase kailor without decorative dot separators; account actions route to real authentication.

## Authentication and workspace

Dedicated sign-in and public account creation now replicate kai's authentication CSS: equal cream/paper columns, 390px form width, 53px rounded inputs, 48px pill actions, matching focus/hover styles, and 900px/480px responsive breakpoints. Both use the unchanged unamused mascot on the left and centered `k ᐧ ai ᐧ lor` above the form description. These pages use scoped `Auth.css` rather than the introduction's `.entry-button` treatment. Registration includes full name and password confirmation; invitation/recovery messaging is removed. GitHub remains explicitly unavailable until real OAuth infrastructure is added. The shared footer occupies only the bottom-left authentication grid area, keeping the right panel full height. Shared 280ms route fades retain mounted session state and respect reduced motion. See [iteration 010](../iterations/010-kai-authentication-replication.md).

Email begins blank, fields have real labels and password-manager autocomplete. Member plan ownership and founder tools remain independently protected by server middleware. No email verification or recovery success is simulated.

## Validation and limits

See [iteration 008](../iterations/008-ai-conversation-and-auth.md) for the current browser matrix, geometry evidence and automated results. Browser viewport testing does not establish physical iPhone keyboard or formal screen-reader behavior. Preserve the original artwork; no replacement illustrations, generated characters, video or sprite animation were introduced.

## Project application shell (iteration 011)

ApplicationWorkspace scopes the cream/charcoal palette, `#fffefc` pill controls and rounded inputs to application pages. ApplicationSidebar supplies a 250ms cream overlay drawer with restrained backdrop blur, focus trapping and scroll lock, plus accessible icon navigation (hidden on mobile). It never changes the content width. Chat uses an 820px content column, head mascot/avatar and bottom composer with separately reserved footer space. New turns anchor near their start rather than following the bottom of long replies. Existing Discovery compositions and introduction/authentication layouts remain. Page fades and thinking animation respect existing reduced-motion rules. See [iteration 011](../iterations/011-project-workspace.md).

## Consulting intelligence refinement (requested iteration 013)

The current Chat composer is a fixed 42px single-line input, superseding the earlier textarea-growth description. Its send button uses a charcoal `#302f2a` background, deeper `#1e1d19` on hover, a contrasting paper-coloured arrow and reduced opacity when disabled; attachment controls are unchanged. Welcome uses the existing EntryButton pill treatment with left-aligned Lucide Compass/Coffee icons. Discovery completion groups its primary/secondary actions, separates New project, and puts Chat on its own line, with scoped 44px mobile targets. Canvas uses priority disclosures and group connections on desktop and a connector-free single-column mobile layout. See [the implementation and validation record](../iterations/017-consulting-intelligence.md).
