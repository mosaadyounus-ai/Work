# OMEGA Oracle: Operational Intelligence & Monitoring

**Status:** Production Observability  
**Target:** Proactive incident detection before impact  
**Last Updated:** April 18, 2026

---

## 🎯 Overview

This guide establishes the monitoring, alerting, and observability infrastructure that keeps you informed of OMEGA's health in real-time.

---

## Layer 1: Enhanced Telemetry Endpoint

### Upgrade `/api/health` with Real-Time Metrics

Update `apps/server/server.ts`:

```typescript
import * as os from 'os';

const startTime = Date.now();
let messageCount = 0;
let connectionCount = 0;

app.get('/api/health', (req, res) => {
  const uptime = Date.now() - startTime;
  const memUsage = process.memoryUsage();

  res.json({
    ok: true,
    service: 'omega-oracle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000)
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
        userTime: process.cpuUsage().user,
        systemTime: process.cpuUsage().system
      }
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg()
    },
    engine: {
      messageCount,
      activeConnections: connectionCount,
      engineStatus: 'healthy'
    },
    environment: {
      hasMissingSecrets: !process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '8080'
    }
  });
});

// Track WebSocket connections
wss.on('connection', (ws) => {
  connectionCount++;
  console.log(`[WS_CONNECTION] Total connections: ${connectionCount}`);

  ws.on('message', (data) => {
    messageCount++;
  });

  ws.on('close', () => {
    connectionCount--;
    console.log(`[WS_DISCONNECT] Total connections: ${connectionCount}`);
  });
});
```

---

### Add Error Rate Tracking

```typescript
let errorCount = 0;
let requestCount = 0;

// Middleware to track requests
app.use((req, res, next) => {
  requestCount++;
  const originalSend = res.send;
  res.send = function(...args: any[]) {
    if (res.statusCode >= 400) {
      errorCount++;
    }
    return originalSend.apply(res, args);
  };
  next();
});

// Add error rate to health endpoint
// In /api/health response, add:
errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%'
```

---

## Layer 2: Cloud Logging Integration

### Enable Structured Logging

```typescript
// At top of server.ts
const logging = require('@google-cloud/logging');
const loggingClient = new logging.Logging({projectId: process.env.GCP_PROJECT_ID});
const log = loggingClient.log('omega-oracle');

function writeLog(severityLevel: string, message: string, metadata: any = {}) {
  const entry = log.entry(
    {severity: severityLevel},
    {
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  );
  log.write(entry);
}

// Use in your code
writeLog('INFO', 'Server started', {port: PORT});
writeLog('WARNING', 'High memory usage detected', {rss: memUsage.rss});
writeLog('ERROR', 'WebSocket connection failed', {error: err.message});
```

### Structured Log Queries

```bash
# View all errors from last hour
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity="ERROR"' \
  --limit 50 \
  --format json

# View WebSocket connection metrics
gcloud logging read \
  'jsonPayload.message=~"WS_CONNECTION|WS_DISCONNECT"' \
  --limit 100

# View memory warnings
gcloud logging read \
  'jsonPayload.message="High memory usage detected"' \
  --limit 20
```

---

## Layer 3: Custom Metrics & Dashboards

### Create Custom Metrics in Cloud Monitoring

```bash
# Define custom metric for WebSocket connections
gcloud monitoring metrics-descriptors create custom.googleapis.com/omega/active_connections \
  --display-name="Active WebSocket Connections" \
  --metric-kind=GAUGE \
  --value-type=INT64 \
  --unit="{connection}"

# Define custom metric for message throughput
gcloud monitoring metrics-descriptors create custom.googleapis.com/omega/messages_per_second \
  --display-name="Messages Per Second" \
  --metric-kind=GAUGE \
  --value-type=DOUBLE \
  --unit="{msg}/s"

# Define custom metric for p99 latency
gcloud monitoring metrics-descriptors create custom.googleapis.com/omega/message_latency_p99 \
  --display-name="Message Processing Latency (p99)" \
  --metric-kind=DISTRIBUTION \
  --value-type=DISTRIBUTION \
  --unit="ms"
```

### Emit Metrics from Your Application

Update `apps/server/server.ts`:

```typescript
import {MetricServiceClient} = require('@google-cloud/monitoring').v3;

const client = new MetricServiceClient();
const projectName = client.projectPath(process.env.GCP_PROJECT_ID);

async function reportMetric(metricType: string, value: number, labels: any = {}) {
  const dataPoint = {
    interval: {
      endTime: {seconds: Math.floor(Date.now() / 1000)},
    },
    value: {doubleValue: value},
  };

  const timeSeries = {
    metric: {type: metricType, labels},
    points: [dataPoint],
  };

  await client.createTimeSeries({
    name: projectName,
    timeSeries: [timeSeries],
  });
}

// Report metrics every 10 seconds
setInterval(() => {
  reportMetric('custom.googleapis.com/omega/active_connections', connectionCount);
  reportMetric('custom.googleapis.com/omega/messages_per_second', messageCount / 10);
  messageCount = 0; // Reset counter
}, 10000);
```

---

## Layer 4: Cloud Monitoring Dashboard

### Create Dashboard via Terraform (or CLI)

```bash
# Create monitoring dashboard
gcloud monitoring dashboards create --config-from-file=- <<EOF
{
  "displayName": "OMEGA Oracle Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "xPos": 0, "yPos": 0, "width": 6, "height": 4,
        "title": "Active WebSocket Connections",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/omega/active_connections\""
              }
            }
          }]
        }
      },
      {
        "xPos": 6, "yPos": 0, "width": 6, "height": 4,
        "title": "Error Rate",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"cloud_run_revision\" resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\""
              }
            }
          }]
        }
      },
      {
        "xPos": 0, "yPos": 4, "width": 6, "height": 4,
        "title": "Memory Usage (RSS)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\""
              }
            }
          }]
        }
      },
      {
        "xPos": 6, "yPos": 4, "width": 6, "height": 4,
        "title": "Message Throughput",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"custom.googleapis.com/omega/messages_per_second\""
              }
            }
          }]
        }
      }
    ]
  }
}
EOF
```

---

## Layer 5: Proactive Alerting

### Create Alert Policies

```bash
# Alert: Error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="OMEGA: High Error Rate" \
  --condition-display-name="Error rate exceeds 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s

# Alert: Memory usage > 512 MB
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="OMEGA: High Memory Usage" \
  --condition-display-name="RSS > 512 MB" \
  --condition-threshold-value=536870912 \
  --condition-threshold-duration=180s

# Alert: p99 Latency > 1000ms
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="OMEGA: High Latency" \
  --condition-display-name="p99 latency > 1000ms" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s

# Alert: No active connections for 5 minutes
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="OMEGA: Zero Active Connections" \
  --condition-display-name="No WS connections" \
  --condition-threshold-value=0 \
  --condition-threshold-duration=300s \
  --condition-threshold-comparison=COMPARISON_LT
```

### Configure Notification Channels

```bash
# Create email notification channel
gcloud alpha monitoring channels create \
  --display-name="OMEGA Operations Team" \
  --type=email \
  --channel-labels=email_address=ops@yourdomain.com

# Create Slack notification channel (if configured)
gcloud alpha monitoring channels create \
  --display-name="OMEGA Alerts Slack" \
  --type=slack_channel \
  --channel-labels=channel_name=#omega-alerts
```

---

## Layer 6: Logging Insights & Troubleshooting

### Pre-built Query Library

```bash
# Query 1: Find connection errors
gcloud logging read 'severity="ERROR" AND jsonPayload.message=~"connection|upgrade"' --limit 20

# Query 2: Track memory spikes
gcloud logging read 'jsonPayload.rss > 400' --limit 10

# Query 3: Identify slow message processing
gcloud logging read 'jsonPayload.latency > 1000' --limit 15

# Query 4: Find configuration issues
gcloud logging read 'severity="WARNING" AND jsonPayload.message=~"missing|invalid|config"' --limit 20

# Query 5: View all WebSocket lifecycle events
gcloud logging read 'jsonPayload.message=~"WS_CONNECTION|WS_DISCONNECT|WS_UPGRADE|WS_ERROR"' --limit 50
```

### Export Logs for Analysis

```bash
# Export to BigQuery for long-term analysis
gcloud logging sinks create omega-bigquery \
  bigquery.googleapis.com/projects/$PROJECT_ID/datasets/omega_logs \
  --log-filter='resource.type="cloud_run_revision"'

# Export to Cloud Storage for compliance archival
gcloud logging sinks create omega-storage \
  gs://omega-logs-archive \
  --log-filter='resource.type="cloud_run_revision"'
```

---

## Layer 7: Performance Profiling

### Periodic Health Checks

```bash
# Set up Uptime Check (Cloud Run built-in)
gcloud monitoring uptime create omega-uptime \
  --display-name="OMEGA Oracle Health Check" \
  --monitored-resource=uptime-url \
  --http-check-path=/api/health \
  --http-check-port=443 \
  --period=60 \
  --timeout=10
```

### Synthetic Monitoring (Load Testing)

```bash
# Create synthetic WebSocket test
cat > /tmp/omega-load-test.sh <<'EOF'
#!/bin/bash

SERVICE_URL=$(gcloud run services describe omega-server \
  --region us-west1 --format='value(status.url)')

# Test 1: HTTP endpoint
echo "Testing HTTP endpoint..."
curl -w "\nStatus: %{http_code}\n" $SERVICE_URL/api/health

# Test 2: WebSocket upgrade
echo "Testing WebSocket upgrade..."
curl -i -N -H "Upgrade: websocket" -H "Connection: Upgrade" $SERVICE_URL/ | head -20

# Test 3: API endpoints
echo "Testing API endpoints..."
curl $SERVICE_URL/api/codex/annotations | jq .
EOF

chmod +x /tmp/omega-load-test.sh
/tmp/omega-load-test.sh
```

---

## Monitoring Checklist

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Page on-call engineer |
| Memory (RSS) | > 512 MB | Check for leak, restart if needed |
| p99 Latency | > 1,000 ms | Investigate database/API slowdown |
| Active Connections | = 0 for 5 min | Check for client-side connectivity issues |
| CPU Usage | > 80% | Consider scaling up or optimization |
| 5xx Errors | Any | Immediately review logs |
| SSL Certificate | < 7 days to expiry | Auto-renewed by Cloud Run |

---

## Incident Response Playbook

### If Alert Fires: "High Error Rate"

1. **Immediate:** Check Cloud Logging for recent ERROR entries
   ```bash
   gcloud logging read 'severity="ERROR"' --limit 20
   ```

2. **Diagnose:** Review service logs and metrics
   ```bash
   gcloud run logs read omega-server --region us-west1 --limit 50
   ```

3. **Respond:**
   - If application bug: Deploy fix via CI/CD
   - If resource exhaustion: Scale up via `--cpu 2`
   - If API dependency: Check external service status

4. **Verify:** Confirm error rate drops below threshold

### If Alert Fires: "High Memory Usage"

1. **Immediate:** Check process memory composition
   ```bash
   curl $(gcloud run services describe omega-server --region us-west1 --format='value(status.url)')/api/health | jq .process.memory
   ```

2. **Potential Causes:**
   - Memory leak in WebSocket handler
   - Large cached dataset
   - Node.js heap fragmentation

3. **Actions:**
   - Restart service: `gcloud run deploy omega-server --region us-west1` (reuses existing image)
   - If persistent: Add heap dump capture and analyze
   - Implement connection pooling limits

### If Alert Fires: "Zero Active Connections"

1. **Check:** Is this expected (off-peak)?
2. **Test:** Manually connect and verify
3. **If broken:** Check WebSocket path and SSL certificate
4. **Review:** Recent code changes that might affect WS handling

---

## Summary

Your OMEGA Oracle now has:
- ✅ **Real-time telemetry** via enhanced `/api/health`
- ✅ **Structured logging** via Cloud Logging
- ✅ **Custom metrics** for WebSocket, message, and latency tracking
- ✅ **Dashboards** visualizing key performance indicators
- ✅ **Proactive alerts** for error rate, memory, latency, and connectivity
- ✅ **Incident playbooks** for common failure scenarios
- ✅ **Long-term analysis** via BigQuery exports

**Next Step:** Deploy with `./apps/server/deploy.sh` and monitor your first incident alert.
