# Private Careers submissions

The Careers page is an expression-of-interest form, not a job board. No vacancies are advertised. Its attachment UI works locally without uploading until Send introduction. Production intake is **disabled by default on the server**, even if a client bypasses the disabled button. Contact's EmailJS integration is not used for applications or CVs.

## Enable only after operational and privacy review

Set server-only environment variables, restart the API, then verify `/api/careers/policy`:

- `CAREERS_SUBMISSIONS=enabled` (default disabled)
- `CAREERS_PRIVACY_REVIEWED=true` (default false; a deployment acknowledgement, not a compliance certification)
- `CAREERS_PROCESSOR_URL`: an explicit HTTPS private intake endpoint without credentials/query/fragment; redirects are forbidden
- `CAREERS_PROCESSOR_TOKEN`: a scoped server-side bearer credential
- `CAREERS_PROCESSOR_NAME`: the real provider/processor identity, displayed to applicants
- `CAREERS_PROCESSING_REGION`: the real processing/storage location, displayed to applicants
- `CAREERS_RETENTION_DAYS`: owner-approved integer 1–365, displayed to applicants and enforced as a maximum requested deletion deadline

No processor has been provisioned or verified in this iteration. No real application delivery has been attempted. All variables must be present and valid for availability; a missing/failed policy request fails closed in the UI. The server rechecks configuration on POST. Do not set an invented processor or region to activate the form. Maintain the same-origin API deployment. The example nginx configuration allows a 5 MB file plus 64 KB multipart overhead only at the exact intake path; other API body limits stay unchanged. Request buffering is disabled there to avoid writing applicant bodies to nginx temporary files. Verify upstream load balancers have matching limits, bounded timeouts, no body logging and no upload spooling/backups.

## Private processor contract

This repository implements an adapter to a private intake processor, not a mailbox or storage provider. Deploy or integrate a service satisfying this contract before enabling. A generic text EmailJS template cannot substitute for it.

The API sends an authenticated multipart POST with:

- `application`: JSON containing validated name/email, optional phone/location/link1/link2, message, allowlisted interest array, acknowledgement version/timestamp, and ISO `deleteBy` deadline.
- `cv`: optional actual PDF/DOCX bytes with canonical MIME and a validated filename.
- `Authorization: Bearer …` and a content-derived HMAC `Idempotency-Key`. The processor must deduplicate retries and return the same unexpired confirmed receipt for repeated content; it must not duplicate notifications. No automatic upstream retries are performed.

The processor must enforce its own bounded upload and rate limits, authenticate the caller, quarantine documents privately, fully parse the document format and malware-scan before any retrieval, opening or distribution. Reject malformed, encrypted/password-protected or otherwise uninspectable documents. Never follow document links or execute embedded content/macros. No content is sent to AI. A scanner outage or uncertain result is a rejection, never a success. Allow access only to authorized kailor reviewers, through authenticated retrieval; do not return public document URLs or attach unscanned files to notification emails. A notification should refer an authorized reviewer to the private record. Configure a real private destination and verify recipient access with isolated test records.

Before returning success, the processor must confirm durable private acceptance of the introduction and optional document, and an enforceable deletion schedule at or before `deleteBy`, including attachments, copies, quarantine, notification metadata and relevant backups. It must clean failed/incomplete uploads, remove rejected files promptly, provide an authenticated access/deletion mechanism and retain no application after its approved deadline. Test scheduled deletion and manual applicant-request deletion. Do not enable using a service that only returns a success-shaped response without these operations.

The adapter accepts only a successful HTTP response, at most 8 KB, containing:

```json
{
  "accepted": true,
  "scan": "clean",
  "private": true,
  "retentionScheduled": true,
  "receipt": "private-record-id",
  "deleteBy": "<ISO timestamp no later than requested deadline>"
}
```

For an introduction without a CV, `scan` must be `not_applicable`. `receipt` must be 1–120 ASCII letters, numbers, hyphens or underscores. The timestamp must be in the future and within the requested retention ceiling. A pending scan, absent retention confirmation, non-private destination or malformed response fails closed. The processor gets 20 seconds. The browser gets 30 seconds. A lost response can leave delivery uncertain: the form is preserved and the processor's required idempotency behavior makes retry safe. Receipt validity relies on this authenticated processor actually honoring its contract; the website cannot prove deletion at an external service.

## Safeguards in this repository

The endpoint inherits API origin checks, Helmet, no-store headers and global throttling. It adds five POST attempts per IP per hour, two in-flight uploads per API process, a 30-second upload socket timeout, a 5 MB file/5 MB+64 KB request ceiling, rejection of compressed HTTP uploads, duplicate/unexpected fields, unsafe URLs, invalid interests and missing acknowledgement. Configure `TRUST_PROXY=loopback` only behind the documented trusted proxy. Limits are per-process; multi-instance deployment needs a shared limiter and aggregate concurrency controls before launch.

Files are processed only in bounded memory, never in frontend/public, the project database, localStorage or local temporary files. Filename/MIME claims alone are insufficient: PDF header/end markers and bounded DOCX ZIP structure are checked in shared validation; the server also inflates DOCX entries with a 20 MB expansion ceiling and checks required document XML. These structural checks are not malware scanning or a complete PDF parser; the processor's full parsing/scanning remains mandatory. Neither applicant content nor filenames/provider diagnostics are logged by this route; normal API logs contain request ID/method/status only. Check infrastructure and processor logs separately. No schema migration or applicant database was added.

## Privacy and release blockers

The form requires explicit, initially unchecked acknowledgement, links to `/privacy#applicant-information`, and displays the configured processor/location/retention before submission. The Privacy page explains applicant fields, CV processing, private intake, no AI processing, retention, possible international handling and access/deletion requests. The owner must review lawful grounds, responsible-party details, real processor terms/subprocessors, locations/international safeguards, authorized reviewer access and the chosen retention period. This work makes no POPIA compliance claim. Email correspondence has a separate mailbox retention process; the UI does not claim online deletion rules apply to email.

Outstanding release requirements: provision and verify the actual private processor, scanning/quarantine, destination, authenticated retrieval, deletion/backups, idempotency, credential rotation and privacy review; apply and validate proxy limits; configure variables only after those checks. Until then, the page explains unavailability and offers `keenosmith@kailor.co.za`. The UI and backend cannot report a successful application while this policy is closed.
