# OMEGA Oracle: Operational Hardening Guide

This guide details how to implement **Option B** for the Nexus Oracle: ensuring high availability and proactive monitoring.

## 📊 1. OMEGA Monitoring Dashboard
Building a custom dashboard in the Google Cloud Console gives you a real-time view of the Oracle's health.

### Recommended Metrics to Track:
1.  **Request Count:** `run.googleapis.com/container/request_count` (filtered by service).
2.  **Latency (p95/p99):** `run.googleapis.com/container/request_latencies`.
3.  **Active Connections:** For WebSockets, track the established connection count.
4.  **Resource Usage:** CPU and Memory utilization per instance.

### Setup Steps:
1.  Go to **Monitoring > Dashboards**.
2.  Click **Create Dashboard**.
3.  Add widgets for the metrics listed above.
4.  Group by `revision_name` to monitor new rollouts.

## ⏱️ 2. Uptime Checks
Ensure the OMEGA Oracle is reachable from global locations.

1.  Go to **Monitoring > Uptime Checks**.
2.  **Endpoint:** URL of your Cloud Run service.
3.  **Path:** `/api/health`.
4.  **Check Frequency:** 1 minute.
5.  **Regions:** Select key global regions (e.g., USA, Europe, Singapore).

## 🚨 3. Alerting Policies
Get notified before your users do.

### Recommended Alerts:
-   **High Error Rate:** Trigger if `status_code >= 500` exceeds 5% of traffic.
-   **Latency Spike:** Trigger if p99 latency > 1500ms for 5 minutes.
-   **Memory Exhaustion:** Trigger if memory utilization > 85%.

### Notification Channels:
-   **Email:** Professional operator notifications.
-   **Slack/PagerDuty:** Real-time incident response.

## ログ 4. Structured Logging (Log Explorer)
Use the Log Explorer to trace OMEGA's internal MFCS cycles.
-   **Filter:** `resource.type="cloud_run_revision" AND severity>=DEFAULT`
-   **Search:** Use `jsonPayload.plateId` or `jsonPayload.operatorId` if logged as structured JSON.
