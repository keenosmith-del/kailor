# Public image allocation and logo provenance

22 October 2026. File identity is not proof of consent or a real client relationship.

| Area                                 | Portrait allocation                   | Publication                                            |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------ |
| Hero illustrative requests           | clients/1.jpeg–10.jpeg                | Decorative scripted requests; no names or endorsements |
| Introduction                         | clients/11.jpeg–16.jpeg               | Decorative montage; owner must confirm usage rights    |
| Selected Work                        | clients/17.jpeg–20.jpeg               | Retained source only, not routed or composed           |
| Client Perspectives                  | clients/21.jpeg–30.jpeg               | Development only; all ten messages are synthetic       |
| Other active conversations/workspace | User icon, initials and kailor mascot | No client portrait reused                              |
| Unallocated                          | clients/31.jpeg                       | Reserve; do not imply customer identity                |

Before publishing authentic feedback, replace each message, role, date and portrait with permissioned material; record permission and attribution outside the public bundle. The production gate is `showClientPerspectives` in navigation.ts and currently only permits Vite development. There is deliberately no environment switch to publish demo endorsements. Change the gate and navigation together only after review. Client dates in the local composition vary from April 2025 through October 2026 and describe demonstration material, not verified engagements.

Azure was the only technology entry without a logo. azure.svg is an original monochrome vector representation of the familiar Azure silhouette; Azure is Microsoft's trademark. No affiliation is implied. Review brand usage with the owner before launch. Official icon guidance: https://learn.microsoft.com/en-us/azure/architecture/icons/ . Other SVGs are existing assets; their upstream licensing has not been independently established in this iteration and remains a launch review item. Cookie cutter is an original local stroke SVG. The sharing card is original kailor typography.

Source/CSS/ZIP mistakenly located inside public/technology were moved to docs/archive/public-assets; Vite must never publish them. No remote image dependency was added.

All ten development feedback notes now have a unique portrait. The auth wordmark uses mascot-head.png, an exact local copy of the established homepage head asset; no new character was generated.
