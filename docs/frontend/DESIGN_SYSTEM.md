# Design system

React 19, Vite, React Router, Tailwind 4, Motion and Lucide form the UI stack. `styles.css` declares Tailwind theme tokens and shared CSS variables for cream, charcoal, surfaces, muted text, lines, accent, radius and responsive spacing. Editorial typography uses system Helvetica/Arial, without external font requests.

Screens are separate modules: Intro, Workspace, Discovery, Conversation, Canvas, Analysis; SessionPage orchestrates persistent session loading. All backend communication uses the Fetch wrapper. Mutation errors are visible, buttons show busy/disabled states and revision conflicts trigger a refresh.

The introduction has three vertical scenes. On desktop the mascot space is left of text; below 540px it sits above. Scenes reveal with Motion. Navigation links jump between vertical anchors. MotionConfig respects reduced-motion preferences; CSS suppresses animation and transitions under reduced motion.

`Mascot` accepts greeting, curious, attentive, thinking, conversation, recommendation and completed states plus an optional asset map. Without assets it renders a small labelled reserved space, not a substitute character. Supply a central asset map in a future iteration. No artwork is generated.

Guided questions use native radio/checkbox controls with visible focus on their containing choices, semantic labels, text areas and progress. An answer review reveals prior entries. Conversation distinguishes developer mock replies, AI replies, confirmed answers and unconfirmed proposals.

Canvas separates existing presence from core, optional and future components. Evidence and dependencies expand inside each component card. This is a dependency list representation, not an editable graph editor.

Reports have seven panels, buttons, a numbered section navigator, arrow-key support when the panel is focused and touch-swipe handlers. The PDF uses the same section text. Stale snapshots are visibly labelled and can be regenerated. Horizontal overflow is not used for page navigation.

Accessibility baseline: native controls, labelled icon buttons, visible focus, aria-live chat, progress semantics and reduced-motion support. Formal screen-reader testing, automated accessibility audits and real-device gesture testing remain iteration 002 work. Do not mistake desktop browser resizing for physical-device verification.
