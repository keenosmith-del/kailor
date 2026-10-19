# Iteration 019 — kailor-branded solution cards

Date: 17 October 2026. Implements the visual-direction addendum to iteration 018. All existing working changes remain unstaged and uncommitted; no branch, worktree, commit, push or Git history operation was performed.

## Visual correction

The previous full-width browser, calendar, storefront and dashboard previews have been removed from both tiles and modal. Their markup and CSS, including the green-grey/pastel panels and abstract illustration shapes, were deleted. This supersedes iteration 018's conceptual-preview visual direction.

Tiles now use crisp white surfaces, quiet charcoal type, rounded corners, soft neutral elevation and a compact kailor identity object. The existing supplied artwork is paired with an overlapping white icon badge and a warm-white backing layer. The backing layer and shadows give the identity depth without gradients, glass, coloured panels or a large illustration banner. Selection, notices and the selection summary use the same neutral palette. Artwork retains its supplied natural colours; no image was generated, edited or recoloured.

The modal retains its centred native dialog, focus management, reduced-motion handling and internal scrolling. Its identity object is smaller than the tile version and sits above the title and concise description. The modal is white, uses restrained neutral shadows and has a plain charcoal backdrop with **no backdrop blur**. Editing, selection, consultancy review, reasoning downloads and Chat handoff retain their existing contracts.

## Reusable visual definitions

`frontend/src/pages/Canvas/solution-visuals.ts` exports a typed `SolutionVisualDefinition` and `solutionVisuals` registry. Every entry defines:

- `solutionIcon`: an actual Lucide icon component from the existing dependency.
- `kailorPose`: a key in the application's existing `mascotAssets` registry.
- `visualVariant`: `portrait`, `head` or `figure`.

| Solution category  | Icon          | Existing artwork treatment     |
| ------------------ | ------------- | ------------------------------ |
| Website            | Globe         | Neutral pose, cropped portrait |
| Booking            | Calendar days | Pensive pose, cropped portrait |
| Logistics/delivery | Truck         | Neutral pose, cropped portrait |
| Automation         | Workflow      | Pensive pose, cropped portrait |
| Instagram/social   | Instagram     | Existing neutral head          |
| Online store       | Shopping bag  | Neutral full figure            |
| Other platform     | Panels        | Pensive pose, cropped portrait |
| Analysis/reporting | Chart         | Pensive pose, cropped portrait |
| Invoicing          | Receipt       | Neutral pose, cropped portrait |
| Online presence    | Megaphone     | Existing neutral head          |

`solutionVisualDefinition(type, title)` preserves the existing solution visual category and resolves more specific reporting, invoicing and online-presence titles from the generic platform fallback. `SolutionVisual` also accepts an explicit `identity` definition for future callers. New categories can be added to the registry without duplicating visual markup or changing existing stored projects or recommendation APIs. Assets come from `frontend/src/components/Mascot/mascot-assets.ts`; no new dependency or image bundle was added.

The decorative identity is excluded from the accessibility tree; the real solution title, status and independently labelled selection control remain accessible. Image dimensions reserve the layout space. The tile identity occupies approximately 136×130px, with a 116px portrait frame. The modal uses approximately 116×110px, with a 96px portrait frame. There are no responsive full-width illustration areas. A single solution collection is capped at 600px; the existing responsive multi-column/stacked layout is retained. Long titles wrap and descriptions remain bounded.

## Approved-app audit and scope

Inspected the existing Introduction and authentication styles, current frontend design-system guidance, mascot registry and supplied neutral/pensive/head artwork. Reused those actual assets and the installed icon family. Changes are confined to the Canvas visual component, new visual-definition registry, Canvas CSS/call sites and documentation. No backend, schema, assessment, project data, approved page layout or authentication workflow changed in this addendum.

## Executed validation

- `npm run test -w frontend`: **36 tests passed**, covering the existing Canvas selection/editing/review/error/archived-read behaviours as well as the rest of the frontend suite.
- `npm run typecheck`: passed across all workspaces.
- `npm run build`: passed for shared, backend and frontend. The existing non-failing Vite main-chunk size advisory remains. The CSS bundle decreased after deleting the mockup styles.
- `git diff --check`: passed.

Browser checks used the existing synthetic logistics and five-solution fixtures through the real local app. Checked 1365×1000 and 1536×1000 desktop viewports and 390×844 mobile: one-card composition, multi-card grid, neutral/pensive/head variants, real category icons, long titles, modal centring, focus entry, Escape dismissal, return to the opening tile, internal scrolling and absence of horizontal overflow. Verified that existing kailor images loaded, the desktop collection retained three columns at the wide breakpoint, no `.solution-preview` mockup remained, modal background computed to white and backdrop filter computed to `none`. The modal visual remains 110px tall on mobile. No project content or selection was changed during these visual checks.

Screenshots are local ignored artifacts under `.cache/qa/iteration019/`: `single-desktop.jpg`, `single-mobile.jpg`, `collection-desktop.jpg`, `modal-desktop.jpg` and `modal-mobile.jpg`. Viewport overrides were reset and the temporary browser tab was closed after verification. This was viewport-based browser testing, not a physical-device or formal screen-reader audit.
