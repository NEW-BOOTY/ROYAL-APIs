# AMOR API (Option B – Multi-Provider Routing)
Copyright (c) Devin B. Royal. All Rights Reserved.

Strategy-based, legally-safe routing:

- `cheap`    → local mock engine (zero cost, dev/testing)
- `balanced` → OpenAI (smaller model, cheaper)
- `accurate` → OpenAI (larger model, higher quality)

Env:

- `OPENAI_API_KEY`            – required for OpenAI strategies
- `OPENAI_MODEL_BALANCED`     – default: `gpt-4o-mini`
- `OPENAI_MODEL_ACCURATE`     – default: `gpt-4o`

Endpoint:

- POST `/v1/ai/route`
  Body:
  {
    "prompt": "...",
    "strategy": "cheap|balanced|accurate"
  }

Response includes provider, strategy, output, and usage/meta.
