import express from 'express';
import bodyParser from 'body-parser';
import { Readable } from 'stream';
import * as http from 'http';
import * as os from 'os';
import { WebSocketServer } from 'ws';
import { ConsoleServerManager } from './consoleManager';

// Dummy streaming model generator (replace with real model call)
async function* fakeModelStream(prompt: string) {
  const words = `The sky is blue because of Rayleigh scattering. Sunlight hits the atmosphere and blue wavelengths scatter more than red.`.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise(r => setTimeout(r, 80));
  }
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = express();
const server = http.createServer(app);
const manager = new ConsoleServerManager();
const wss = new WebSocketServer({ server });

// Initialize telemetry counters
const startTime = Date.now();
let messageCount = 0;
let errorCount = 0;
let requestCount = 0;
let connectionCount = 0;

app.use(bodyParser.json());

// Streaming Oracle endpoint
app.post('/api/oracle', async (req, res) => {
  requestCount++;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  const prompt = req.body?.prompt || '';
  try {
    for await (const chunk of fakeModelStream(prompt)) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    errorCount++;
    res.write(`\n[error] ${(err as Error).message}`);
    res.end();
  }
});
/**
 * OMEGA Lattice Server
 *
 * HTTP API server for the Nexus Oracle OMEGA
 * Production-hardened with telemetry and security checks
 */


app.disable('x-powered-by');
app.set('trust proxy', true);

// Security validation
const REQUIRED_SECRETS = ['GEMINI_API_KEY'];

function validateSecrets() {
  const missing = REQUIRED_SECRETS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[SECURITY_WARNING] Missing secrets: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      console.error(`[CRITICAL] Production environment missing secrets. Service will fail.`);
    }
  }
}

validateSecrets();

// Enhanced health endpoint with real-time telemetry
app.get('/api/health', (req, res) => {
  const uptime = Date.now() - startTime;
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const errorRate = requestCount > 0 
    ? ((errorCount / requestCount) * 100).toFixed(2) 
    : '0';

  res.json({
    ok: true,
    service: 'omega-oracle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000)
    },
    process: {
      pid: process.pid,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      cpu: {
        userMicros: cpuUsage.user,
        systemMicros: cpuUsage.system
      }
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024)
    },
    engine: {
      totalMessages: messageCount,
      activeConnections: connectionCount,
      totalRequests: requestCount,
      totalErrors: errorCount,
      errorRate: errorRate + '%',
      status: 'healthy'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      hasMissingSecrets: !process.env.GEMINI_API_KEY,
      secretsValidated: !REQUIRED_SECRETS.some(key => !process.env[key])
    }
  });
});

app.get('/api/codex/annotations', (req, res) => {
  requestCount++;
  const state = manager.getState();
  res.json({ annotations: state.recentSignals, timestamp: new Date().toISOString() });
});

app.get('/api/codex/guardrails/events', (req, res) => {
  requestCount++;
  const state = manager.getState();
  res.json({ events: state.commands, timestamp: new Date().toISOString() });
});


// 404 handler
app.use((req, res) => {
  requestCount++;
  errorCount++;
  res.status(404).json({ error: 'Not found' });
});

// WebSocket server logic
wss.on('connection', (ws) => {
  connectionCount++;
  console.log('[WS_CONNECTION] New client connected. Total connections:', connectionCount);

  ws.send(JSON.stringify({
    type: 'connected',
    ts: Date.now()
  }));

  ws.on('message', async (data: any) => {
    messageCount++;
    try {
      const message = JSON.parse(data.toString());
      console.log('[WS_MESSAGE]', message);

      if (message.type === 'subscribe' && message.channel === 'console') {
        manager.subscribe(ws);
      } else if (message.type === 'console-command') {
        const result = await manager.handleCommand(message.commandType, message.payload);
        ws.send(JSON.stringify({
          type: 'console-command-result',
          requestId: message.requestId,
          success: true,
          result
        }));
      }
    } catch (error) {
      errorCount++;
      console.error('[WS_ERROR]', error);
      if ((ws as any).readyState === (ws as any).OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }
  });

  ws.on('close', () => {
    connectionCount--;
    console.log('[WS_DISCONNECT] Client disconnected. Total connections:', connectionCount);
  });

  ws.on('error', (error: any) => {
    errorCount++;
    console.log('[WS_DISCONNECT] Client disconnected');
    console.error('[WS_ERROR]', error);
  });
});


server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/' && req.url !== '/ws') {
    socket.destroy();
    return;
  }
  console.log('[WS_UPGRADE] incoming upgrade', req.url, 'httpVersion=', req.httpVersion);
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, () => {
  console.log('OMEGA Server running on port', PORT);
});