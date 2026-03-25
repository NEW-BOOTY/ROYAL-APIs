// Copyright (c) Devin B. Royal. All Rights Reserved.
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

// In-memory DSAR + orchestration store
const dsarStore = new Map(); // ticketId -> record

const upstreamAuth = (req, res, next) => {
  const key = req.header('x-forwarded-api-key');
  if (!key) {
    return res.status(401).json({ error: 'Missing upstream API key' });
  }
  next();
};

app.use(upstreamAuth);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gpre-api', mode: 'option-b-orchestrator' });
});

// Build a lawful execution plan for a DSAR
const buildExecutionPlan = (record) => {
  const systems = record.targets && Array.isArray(record.targets) && record.targets.length
    ? record.targets
    : ['crm', 'billing', 'analytics'];

  const steps = [];

  for (const system of systems) {
    steps.push({
      id: `${record.ticketId}_${system}_1`,
      system,
      type: 'locate',
      description: `Locate all personal data for user ${record.userId} in ${system}.`,
      status: 'pending'
    });
    steps.push({
      id: `${record.ticketId}_${system}_2`,
      system,
      type: 'evaluate',
      description: `Evaluate legal basis and retention obligations for data in ${system}.`,
      status: 'pending'
    });
    steps.push({
      id: `${record.ticketId}_${system}_3`,
      system,
      type: 'action',
      description: `Apply DSAR action "${record.action}" in ${system} (delete, restrict, export, etc.).`,
      status: 'pending'
    });
    steps.push({
      id: `${record.ticketId}_${system}_4`,
      system,
      type: 'evidence',
      description: `Capture evidence and log completion for ${system}.`,
      status: 'pending'
    });
  }

  return steps;
};

// Create DSAR request + orchestration plan
app.post('/v1/privacy/request', (req, res) => {
  const { userId, action, jurisdiction, contactChannel, targets, slaDays } = req.body || {};
  if (!userId || !action) {
    return res.status(400).json({ error: 'userId and action are required' });
  }

  const ticketId = `gpre_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const now = new Date();
  const sla = Number.isFinite(Number(slaDays)) ? Number(slaDays) : 30;
  const deadline = new Date(now.getTime() + sla * 24 * 60 * 60 * 1000);

  const record = {
    ticketId,
    userId,
    action,
    jurisdiction: jurisdiction || 'auto-detect',
    contactChannel: contactChannel || 'email',
    targets: Array.isArray(targets) ? targets : [],
    slaDays: sla,
    deadline: deadline.toISOString(),
    status: 'received',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    auditLog: [
      {
        at: now.toISOString(),
        event: 'DSAR_RECEIVED',
        details: { action, jurisdiction, slaDays: sla }
      }
    ],
    steps: []
  };

  record.steps = buildExecutionPlan(record);
  dsarStore.set(ticketId, record);

  res.json({
    ticketId,
    status: record.status,
    deadline: record.deadline,
    stepsPlanned: record.steps.length,
    message: 'DSAR request accepted with an execution plan. Manual or external automation can consume this plan.'
  });
});

// Get DSAR status + plan
app.get('/v1/privacy/request/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const record = dsarStore.get(ticketId);
  if (!record) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(record);
});

// Get only the execution plan
app.get('/v1/privacy/request/:ticketId/plan', (req, res) => {
  const { ticketId } = req.params;
  const record = dsarStore.get(ticketId);
  if (!record) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json({
    ticketId,
    userId: record.userId,
    action: record.action,
    jurisdiction: record.jurisdiction,
    steps: record.steps
  });
});

// Mark a step as completed / in-progress / failed
app.post('/v1/privacy/request/:ticketId/step/:stepId', (req, res) => {
  const { ticketId, stepId } = req.params;
  const { status, note } = req.body || {};
  const record = dsarStore.get(ticketId);
  if (!record) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const step = record.steps.find((s) => s.id === stepId);
  if (!step) {
    return res.status(404).json({ error: 'Step not found' });
  }

  step.status = status;
  step.note = note || '';
  record.updatedAt = new Date().toISOString();
  record.auditLog.push({
    at: new Date().toISOString(),
    event: 'STEP_UPDATED',
    details: { stepId, status, note: note || '' }
  });

  dsarStore.set(ticketId, record);
  res.json({ ticketId, stepId, status: step.status });
});

// Update DSAR high-level status
app.post('/v1/privacy/request/:ticketId/status', (req, res) => {
  const { ticketId } = req.params;
  const { status, note } = req.body || {};
  const record = dsarStore.get(ticketId);
  if (!record) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  record.status = status;
  record.updatedAt = new Date().toISOString();
  record.auditLog.push({
    at: new Date().toISOString(),
    event: 'STATUS_UPDATED',
    details: { status, note: note || '' }
  });

  dsarStore.set(ticketId, record);
  res.json({ ticketId, status: record.status });
});

// List DSARs (dev)
app.get('/v1/privacy/requests', (req, res) => {
  res.json(Array.from(dsarStore.values()));
});

app.listen(PORT, () => {
  console.log(`GPRE API (Option B) listening on port ${PORT}`);
});
