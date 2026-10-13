# ADR 001: Modular monolith and relational sessions

Status: accepted, 2026-10-13.

A single consultant needs cohesive behaviour without distributed deployment overhead. Use one Express API, one PostgreSQL database and a React frontend in npm workspaces. Store identity/history-bearing records relationally; use JSON for bounded answer values, reference definitions and report snapshots. Services own domain behaviour and are reused by simulations. Tradeoff: scaling and deployment are coupled initially, but client channels remain replaceable through REST.
