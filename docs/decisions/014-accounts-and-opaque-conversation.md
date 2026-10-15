# ADR 014 — member accounts, conversational epochs and opaque controls

Status: accepted for iteration 008.

New authenticated accounts default to member; founder capabilities require an explicit admin role and server middleware. Registration defaults to hashed, email-bound, expiring, atomically single-use invitations. A guarded migration helper preserves only the configured existing founder. Authentication keeps scrypt, opaque hashed session tokens, HttpOnly cookies, same-origin checks and rate limits. Legacy Prisma model names remain to avoid an unnecessary ownership rewrite.

New conversation creates a fresh session in the current plan. Clear conversation retains raw history and audit records but excludes the old transcript from retrieval and future summaries, retires pending proposals and preserves confirmed knowledge and immutable reports. The operation uses the session lock and revision check.

Natural reply quality and proposed state changes have separate validation boundaries. Invalid extraction does not discard safe conversational text; invalid proposals never mutate authoritative facts. Unsafe replies and provider failures still fall back locally. The existing provider-neutral adapter uses Workers AI JSON mode and accepts string/object responses.

Section 44 explicitly removes glassmorphism. Shared opaque cream/paper controls replace translucent controls. Conversation is a bounded dynamic-viewport layout with a fixed sitting image, internal transcript scrolling, inline decisions and an anchored composer. Whole-page transitions change opacity only. Kai is a read-only visual reference, not a source repository to modify.

See [iteration 008](../iterations/008-ai-conversation-and-auth.md) and the [design system](../frontend/DESIGN_SYSTEM.md) for evidence and limitations.
