// Copyright (c) Devin B. Royal. All Rights Reserved.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'openapi');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeSpec(name, spec) {
  const filePath = path.join(OUTPUT_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf8');
  console.log(`Wrote OpenAPI spec: ${filePath}`);
}

// ---------- Specs ----------

function gatewaySpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Royal Gateway API',
      version: '1.0.0',
      description: 'Client → Gateway → Auth → Rate Limit → Backend → Response',
      license: {
        name: 'Copyright (c) Devin B. Royal. All Rights Reserved.'
      }
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local gateway' }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Gateway health check',
          responses: {
            '200': {
              description: 'Gateway is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      service: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/gpre/v1/privacy/request': {
        post: {
          summary: 'Proxy to GPRE DSAR creation',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    action: { type: 'string' },
                    jurisdiction: { type: 'string' },
                    contactChannel: { type: 'string' },
                    targets: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    slaDays: { type: 'integer' }
                  },
                  required: ['userId', 'action']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'DSAR ticket created via GPRE',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '401': { description: 'Invalid or missing API key' }
          }
        }
      },
      '/amor/v1/ai/route': {
        post: {
          summary: 'Proxy to AMOR AI routing',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string' },
                    strategy: {
                      type: 'string',
                      enum: ['cheap', 'balanced', 'accurate']
                    }
                  },
                  required: ['prompt']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'AI routing result',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '401': { description: 'Invalid or missing API key' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    }
  };
}

function gpreSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'GPRE API (Global Privacy Rights Enforcement)',
      version: '1.0.0',
      description: 'DSAR orchestration engine with execution plans and audit logs.',
      license: {
        name: 'Copyright (c) Devin B. Royal. All Rights Reserved.'
      }
    },
    servers: [
      { url: 'http://localhost:4001', description: 'Local GPRE' }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      service: { type: 'string' },
                      mode: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/v1/privacy/request': {
        post: {
          summary: 'Create DSAR request and execution plan',
          security: [{ UpstreamKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    action: { type: 'string' },
                    jurisdiction: { type: 'string' },
                    contactChannel: { type: 'string' },
                    targets: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    slaDays: { type: 'integer' }
                  },
                  required: ['userId', 'action']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'DSAR ticket created with plan',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '400': { description: 'Validation error' },
            '401': { description: 'Missing upstream API key' }
          }
        }
      },
      '/v1/privacy/request/{ticketId}': {
        get: {
          summary: 'Get DSAR record',
          security: [{ UpstreamKey: [] }],
          parameters: [
            {
              name: 'ticketId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'DSAR record',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '404': { description: 'Ticket not found' }
          }
        }
      },
      '/v1/privacy/request/{ticketId}/plan': {
        get: {
          summary: 'Get DSAR execution plan',
          security: [{ UpstreamKey: [] }],
          parameters: [
            {
              name: 'ticketId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Execution plan',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '404': { description: 'Ticket not found' }
          }
        }
      },
      '/v1/privacy/request/{ticketId}/step/{stepId}': {
        post: {
          summary: 'Update DSAR step status',
          security: [{ UpstreamKey: [] }],
          parameters: [
            { name: 'ticketId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'stepId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['pending', 'in-progress', 'completed', 'failed']
                    },
                    note: { type: 'string' }
                  },
                  required: ['status']
                }
              }
            }
          },
          responses: {
            '200': { description: 'Step updated' },
            '400': { description: 'Validation error' },
            '404': { description: 'Ticket or step not found' }
          }
        }
      },
      '/v1/privacy/request/{ticketId}/status': {
        post: {
          summary: 'Update DSAR overall status',
          security: [{ UpstreamKey: [] }],
          parameters: [
            { name: 'ticketId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    note: { type: 'string' }
                  },
                  required: ['status']
                }
              }
            }
          },
          responses: {
            '200': { description: 'Status updated' },
            '400': { description: 'Validation error' },
            '404': { description: 'Ticket not found' }
          }
        }
      },
      '/v1/privacy/requests': {
        get: {
          summary: 'List DSARs (dev)',
          security: [{ UpstreamKey: [] }],
          responses: {
            '200': {
              description: 'List of DSARs',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        UpstreamKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-forwarded-api-key'
        }
      }
    }
  };
}

function amorSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'AMOR API (Autonomous Multi-AI Orchestration & Routing)',
      version: '1.0.0',
      description: 'Strategy-based routing across local mock and OpenAI models.',
      license: {
        name: 'Copyright (c) Devin B. Royal. All Rights Reserved.'
      }
    },
    servers: [
      { url: 'http://localhost:4002', description: 'Local AMOR' }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      service: { type: 'string' },
                      mode: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/v1/ai/route': {
        post: {
          summary: 'Route AI request based on strategy',
          security: [{ UpstreamKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string' },
                    strategy: {
                      type: 'string',
                      enum: ['cheap', 'balanced', 'accurate']
                    }
                  },
                  required: ['prompt']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'AI routing result',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '400': { description: 'Validation error' },
            '401': { description: 'Missing upstream API key' },
            '502': { description: 'Model routing failed' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        UpstreamKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-forwarded-api-key'
        }
      }
    }
  };
}

function fullSuiteSpec(gateway, gpre, amor) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Royal APIs Suite (Gateway + GPRE + AMOR)',
      version: '1.0.0',
      description: 'Unified spec for the Royal Gateway, GPRE, and AMOR services.',
      license: {
        name: 'Copyright (c) Devin B. Royal. All Rights Reserved.'
      }
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Gateway' },
      { url: 'http://localhost:4001', description: 'GPRE' },
      { url: 'http://localhost:4002', description: 'AMOR' }
    ],
    paths: {
      ...(gateway.paths || {}),
      ...(gpre.paths || {}),
      ...(amor.paths || {})
    },
    components: {
      securitySchemes: {
        ...(gateway.components?.securitySchemes || {}),
        ...(gpre.components?.securitySchemes || {}),
        ...(amor.components?.securitySchemes || {})
      }
    }
  };
}

// ---------- Main ----------

function main() {
  console.log('Generating OpenAPI specs (Node)…');

  ensureOutputDir();

  const gw = gatewaySpec();
  const gp = gpreSpec();
  const am = amorSpec();
  const full = fullSuiteSpec(gw, gp, am);

  writeSpec('gateway', gw);
  writeSpec('gpre', gp);
  writeSpec('amor', am);
  writeSpec('full-suite', full);

  console.log('All OpenAPI specs generated.');
}

main();
