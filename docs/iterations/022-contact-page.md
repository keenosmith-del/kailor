# Contact page — 23 October 2026

## Implementation

The existing /contact route now has a two-column editorial/form composition, selectable email address with copy/check feedback, four optional topic pills and compact How it works / Common questions / shared conversation actions. ContactForm is colocated beneath the page. The form enters once and remains stationary while typing or scrolling; focusing during its entrance completes that motion immediately. Other editorial content uses reversible scroll fades; topics reveal with a small stagger. Reduced motion is static. The existing header, footer, authentication and application logic are unchanged.

`services/enquiries.ts` owns the shared contact email, field limits, topic allowlist, validation and EmailJS delivery. `services/useEnquiry.ts` owns form state, synchronous duplicate-request protection, pending/error state, validation focus and confirmed-delivery callbacks. Both Contact and ConversationModal use this path. The modal's existing form appearance and close-then-toast behaviour remain. `services/useEmailCopy.ts` centralises clipboard confirmation, truthful failure feedback and timer/unmount cleanup for both experiences.

The template contract remains `from_name`, `reply_to`, `subject`, `message`, with the existing public-key option. No topic means subject `Website enquiry`; an allowed topic appends its label to that subject. Messages are trimmed for submission, bounded at the existing modal's 3,000 characters and retained on failure. Success requires a successful EmailJS receipt. Invalid fields receive linked errors and focus. Private provider diagnostics are not shown.

## Provider/configuration audit

The existing local frontend environment contains all three EmailJS identifiers (presence checked without logging values). `frontend/.env.example` documents the same build-time variables: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY. Production release builds need their approved values; no private mail/account credentials belong in VITE variables. The deployed bundle has to be rebuilt when these public settings change.

The installed EmailJS SDK sends to https://api.emailjs.com/api/v1.0/email/send. The existing deploy/nginx.conf.example CSP already permits that origin in connect-src. No CSP or provider-account changes were made.

The EmailJS dashboard was not accessed: recipient routing, active template mapping, exact production/staging permitted origins, provider quotas and anti-abuse settings still require owner confirmation. Review the provider's origin restrictions and account-level abuse controls before production delivery. Client validation, a local pending guard and EmailJS public identifiers alone are not comprehensive spam protection. No CAPTCHA or server-side email relay has been added. There is no claim that the current frontend prevents all automated submissions.

## Validation

- All-workspace typecheck and build passed. The final frontend build also passed after scoped input-spacing and modal-focus refinements.
- All 85 frontend tests passed. Contact tests cover validation/focus, optional topics and payloads, no message overwrite, synchronous duplicate protection, confirmation-only success, preserved failure content, missing configuration, shared modal delivery/toast, copying/error recovery, bounds and invalid receipt/topic checks.
- Launch checks passed: 12 prerendered routes, 453 asset references, metadata, links and production content gates.
- Chrome passed direct/refresh, validation/focus, copied/check/reset and clipboard failure, topic state, intercepted EmailJS success/failure and modal delivery. Form position was stable during editing/scrolling. Desktop/tablet/mobile checks passed at 1440/1024/768/390/320px, including reduced motion and route return.
- Production preview passed metadata/canonical/noindex, rounded border-free inputs, compact labels, hidden topic state, 3,000-character message layout, compiled intercepted delivery, Common questions/Back navigation and prerendered contact information with JavaScript disabled.

Tests use mocked EmailJS receipts; browser checks intercept every EmailJS endpoint request with local success/error responses. No real email was sent and inbox delivery is not verified. The page remains noindex under the existing controlled-launch policy.

## Form refinement

Topic pills now insert editable message starters and focus the message field. Changing a topic replaces an untouched starter; user-edited messages remain intact. Deselecting a topic clears only its untouched starter.

Contact and ConversationModal share EnquiryComposer: the original modal placeholders, expanding rounded message field, inset send arrow and animated sending dots. Contact name/email fields match the modal. Confirmed delivery uses the same shared toast.

Contact, the conversation modal and authentication forms suppress native validation prompts. Required semantics remain accessible; linked inline errors explain missing or invalid values and focus the first invalid field. Sign in/Create account validate locally before requesting authentication, including password confirmation and invitation requirements. This refinement updates authentication in addition to the original Contact scope.

All-workspace typecheck, build and launch checks passed, alongside 88 frontend tests. Chrome verified topic starters and preserved edits, exact modal/input style parity, pending dots, duplicate guards, the shared toast, inline Contact/auth errors without native prompts, and 1440/390/320px layouts with long messages. The same browser checks passed against the production build after fixing stylesheet-order-dependent modal input metrics. Email and authentication requests were intercepted; no real emails or accounts were created.
