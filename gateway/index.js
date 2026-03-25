// Copyright (c) Devin B. Royal. All Rights Reserved.
import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const GPRE_TARGET = process.env.GPRE_TARGET || 'http://localhost:4001';
const AMOR_TARGET = process.env.AMOR_TARGET || 'http://localhost:4002';

const apiKeys = (process.env.GATEWAY_API_KEYS || 'demo-key-basic').split(',');
const BASIC_TIER_LIMIT = Number(process.env.BASIC_TIER_LIMIT || 60);
const PRO_TIER_LIMIT = Number(process.env.PRO_TIER_LIMIT || 600);

const tierForKey = (key) => {
  if (!key) return 'none';
  if (key.endsWith('-pro')) return 'pro';
  return 'basic';
};

const limitForTier = (tier) => {
  if (tier === 'pro') return PRO_TIER_LIMIT;
  if (tier === 'basic') return BASIC_TIER_LIMIT;
  return 10;
};

const authMiddleware = (req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || !apiKeys.includes(key)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  req.apiKey = key;
  req.tier = tierForKey(key);
  next();
};

const dynamicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: (req, res) => limitForTier(req.tier || 'none'),
  keyGenerator: (req, res) => req.apiKey || req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(authMiddleware, dynamicRateLimit);

const proxy = async (targetBase, req, res) => {
  try {
    const url = `${targetBase}${req.originalUrl.replace(/^\/(gpre|amor)/, '')}`;
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: { 'x-forwarded-api-key': req.apiKey || '' }
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(502).json({ error: 'Upstream service unavailable' });
  }
};

app.use('/gpre', (req, res) => proxy(GPRE_TARGET, req, res));
app.use('/amor', (req, res) => proxy(AMOR_TARGET, req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
});
