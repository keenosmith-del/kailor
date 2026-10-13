# ADR 004: Private admin sessions

Status: accepted, 2026-10-13.

Use scrypt password hashes, random hashed session tokens, strict HttpOnly cookies, explicit origin checks, request validation, bounded bodies and login throttling. Avoid frontend tokens and customer authentication. Session reads enforce ownership; reusable knowledge is a founder-wide private library. Tradeoff: no SSO, MFA or distributed rate-limit storage yet. Public deployment is a separate hardening task.
