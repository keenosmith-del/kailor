# Careers page — 23 October 2026

`/careers` now has a Contact-related two-column editorial/form composition: Work with kailor, general expressions of interest, shared copy/email interaction, six multi-select professional-interest pills, and a white rounded form. No vacancies, benefits or recruitment claims were invented. Compact How it works, Our timeline, Contact us and shared conversation actions follow.

Colocated ApplicationForm manages bounded name/email, optional phone/location/two professional URLs, an introduction, explicit privacy acknowledgement, pending state and confirmed success via the shared conversation toast. CVAttachment handles local PDF/DOCX selection, drop, validation, a filename/size chip, replacement and removal. Drafts and the selected file remain on failure; successful confirmed delivery clears the form. No remote professional links are fetched.

The form enters once and settles immediately on focus; it never follows scroll while being edited. Existing ProcessReveal supplies reversible individual editorial/action fades; interest pills stagger. Reduced motion is static. Contact, Home, auth, sidebar inventory and footer are not redesigned. Existing PageBack and Careers links remain. Metadata follows the noindex controlled-launch policy, with meaningful prerendered copy and page CSS.

Shared application validation lives in shared/src/careers.ts. The new backend career router receives bounded multipart bodies, validates inputs and document signatures/structure, and calls an authenticated private intake processor. It stores no applicant records locally. Intake defaults closed and requires a reviewed private processor, destination, retention and location configuration. See [private submission contract and deployment blockers](../deployment/CAREERS_SUBMISSIONS.md). No actual provider or inbox delivery has been configured or claimed. Privacy information was extended for applicant handling.

## Validation

- All-workspace typecheck and build passed, including 12 prerendered public/auth routes.
- All 95 frontend tests passed, including route/Back/navigation, inline required/email/URL/acknowledgement errors, multiple interests, CV/drop/replacement/removal and invalid formats/size/signature, synchronous duplicate prevention, shared confirmation toast, retained failure and email copy.
- All 351 backend tests passed. The 12 isolated Careers endpoint/document tests cover closed/misconfigured policy, actual multipart document bytes, confirmed private receipt with/without CV, size/format/XML validation, malformed/duplicate fields, unconfirmed/scanning/retention failures, hourly throttling, concurrency bounds/release and content-derived processor retry keys. No application database or production provider was used.
- Launch verification passed: 12 routes and 465 asset references, metadata, links and production gates.
- Chrome production checks passed at 1440/1024/768/390/320px: no overflow, direct/refresh metadata, closed policy, multiple interests, custom validation, local attachment selection, confirmed toast, failure retention, stable form position, helpful navigation/Back/shared chat, reduced motion and meaningful prerendered copy. Browser requests used isolated fixtures and intercepted submission responses; no real applicant records, emails or accounts were created.

The private processor contract is implemented but live attachment delivery, scanner operation, reviewer access and scheduled deletion remain unverified deployment dependencies. Keep intake disabled until those are provisioned and tested.
