# Intelligence design

Three routes exist:

1. Rules select questions, classify services, match references and generate draft reports without model calls.
2. Conversation uses the provider-neutral `AiProvider.infer` interface for clarification and structured proposals.
3. Explicit “Explore alternatives” selects analysis mode on the same provider interface. It receives instructions to evaluate evidence, alternatives and constraints. This iteration does not claim a separate research agent or an AI-verified assessment engine.

The default `MockProvider` labels every reply as **Development mode — deterministic guidance, not AI analysis**. It includes current context and the next relevant question. Explicit `set goals: ...` syntax creates a proposal. Multi-select fields accept comma-separated option IDs. Arbitrary prose is saved but is not falsely presented as parsed requirements.

Cloudflare uses `POST https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}` with a server-side bearer token, messages and `max_tokens`. Enable only by setting all of `AI_PROVIDER=cloudflare`, `AI_ALLOW_REMOTE=true`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Otherwise the mock is used. Credentials never enter frontend bundles.

The remote provider receives confirmed discovery and the latest eight chat messages. JSON output is validated with Zod and each proposed answer is checked against the question definition before anything is saved. Even a valid proposal is inferred, never authoritative. No model output performs tools, executes code, or approves cases.

Timeouts, HTTP errors, 429s, invalid JSON and invalid proposals produce a safe labelled fallback. There are no automatic retries. A remote attempt reserves one durable usage record and the configured maximum output tokens. A PostgreSQL advisory lock makes daily and session ceilings safe under concurrency. Failed attempts still consume the reservation. Calls rejected by the budget never reach the provider. Reservations use UTC days. Simulations always force mock mode.

Limits bound call count and requested output tokens, **not monetary spend** or total input tokens. Remote mode may incur provider charges if the operator explicitly enables it; this app does not activate a paid plan or configure provider billing. Keep remote disabled until account-level limits and model pricing have been reviewed. A future paid budget needs actual input/output usage, per-model tariffs, monthly monetary reservations, billing reconciliation and a kill switch.

Recommending AI is independent of using it for discovery. The AI service exists in the catalogue but no industry automatically triggers it. Recurring-work proposals include a manual-template alternative and a conditional AI pilot only after privacy, accuracy, source rights and costs are reviewed.

To add a provider: implement the interface, preserve structured validation and confirmation, route through durable reservations, add timeout/fallback contract tests, and document the account-level billing gate.

The Cloudflare wire contract is tested with mocked HTTP responses. A credentialed live call was intentionally not made.
