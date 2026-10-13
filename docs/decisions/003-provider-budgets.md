# ADR 003: Keyless default and reserved inference allowances

Status: accepted, 2026-10-13.

Use a deterministic labelled provider by default. Remote inference requires explicit opt-in and credentials. Reserve each attempt transactionally under a PostgreSQL advisory lock before sending it, count failures, cap requested output and use a timeout without retries. Default assessment remains rules-based. Tradeoff: limits are conservative call/output allowances, not a currency budget; billing-aware usage accounting is deferred and required before a paid rollout.
