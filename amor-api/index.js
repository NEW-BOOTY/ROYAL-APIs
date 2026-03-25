// Copyright (c) Devin B. Royal. All Rights Reserved.
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

// Provider keys (optional)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL_BALANCED = process.env.OPENAI_MODEL_BALANCED || 'gpt-4o-mini';
const OPENAI_MODEL_ACCURATE = process.env.OPENAI_MODEL_ACCURATE || 'gpt-4o';

const upstreamAuth = (req, res, next) => {
  const key = req.header('x-forwarded-api-key');
  if (!key) {
    return res.status(401).json({ error: 'Missing upstream API key' });
  }
  next();
};

app.use(upstreamAuth);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'amor-api', mode: 'option-b-multi-provider' });
});

// Strategy-based router:
// - cheap    → local mock
// - balanced → OpenAI (smaller model)
// - accurate → OpenAI (larger model)
const chooseEngine = (strategy) => {
  if (strategy === 'cheap') return { provider: 'local-mock' };
  if (strategy === 'accurate') return { provider: 'openai', model: OPENAI_MODEL_ACCURATE };
  return { provider: 'openai', model: OPENAI_MODEL_BALANCED };
};

const callOpenAI = async (prompt, model) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ]
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  return {
    model: data.model,
    output: content,
    usage: data.usage || {}
  };
};

app.post('/v1/ai/route', async (req, res) => {
  const { prompt, strategy } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const chosenStrategy = strategy || 'balanced';
  const engine = chooseEngine(chosenStrategy);

  try {
    if (engine.provider === 'local-mock') {
      return res.json({
        provider: engine.provider,
        strategy: chosenStrategy,
        output: `Local mock response for prompt: ${prompt}`,
        meta: {
          latencyMs: 5,
          costEstimate: 0
        }
      });
    }

    const result = await callOpenAI(prompt, engine.model);
    return res.json({
      provider: engine.provider,
      strategy: chosenStrategy,
      output: result.output,
      meta: {
        model: result.model,
        usage: result.usage
      }
    });
  } catch (err) {
    console.error('Routing error:', err.message);
    return res.status(502).json({ error: 'Model routing failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AMOR API (Option B) listening on port ${PORT}`);
});
