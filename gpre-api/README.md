# GPRE API (Option B – Orchestration Engine)
Copyright (c) Devin B. Royal. All Rights Reserved.

Legally-compliant DSAR orchestration:

- Builds an execution plan per DSAR (systems, steps, evidence)
- Does NOT bypass or force actions on third-party systems
- Designed for lawful, auditable automation layers to consume

Key endpoints:

- POST `/v1/privacy/request`
  - Body: `{ "userId", "action", "jurisdiction?", "contactChannel?", "targets?: string[]", "slaDays?: number" }`
  - Returns ticket + deadline + planned steps count

- GET  `/v1/privacy/request/:ticketId`
  - Full DSAR record + steps + audit log

- GET  `/v1/privacy/request/:ticketId/plan`
  - Just the execution plan (for external automation engines)

- POST `/v1/privacy/request/:ticketId/step/:stepId`
  - Body: `{ "status": "pending|in-progress|completed|failed", "note?" }`

- POST `/v1/privacy/request/:ticketId/status`
  - Body: `{ "status": "received|in-progress|completed|rejected", "note?" }`

- GET  `/v1/privacy/requests`
  - List all DSARs (dev)
