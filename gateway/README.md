# Royal Gateway
Copyright (c) Devin B. Royal. All Rights Reserved.

Client → Gateway → Auth → Rate Limit → Backend → Response

- API key auth via `x-api-key`
- Tiered rate limiting (basic vs pro)
- Routes:
  - `/gpre/*` → GPRE API
  - `/amor/*` → AMOR API
