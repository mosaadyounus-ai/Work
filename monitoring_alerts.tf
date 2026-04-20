# OMEGA Oracle Cloud Monitoring Alerts (Terraform)

# 1. Notification Channel (Email)
resource "google_monitoring_notification_channel" "email" {
  display_name = "OMEGA Oracle Email Alerts"
  type         = "email"
  labels = {
    email_address = "your-alerts@yourdomain.com" # <-- Set your alert email here
  }
  project = "gen-lang-client-0791737538"
}

# 2. High Latency Alert (>1s, 95th percentile)
resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "OMEGA Oracle High Latency"
  combiner     = "OR"
  conditions {
    display_name = "High Latency (>1s) on oracle.yourdomain.com"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"oracle\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1.0
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
      trigger {
        count = 1
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled = true
  project = "gen-lang-client-0791737538"
}

# 3. Elevated Error Rate Alert (>5% 5xx)
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "OMEGA Oracle Elevated Error Rate"
  combiner     = "OR"
  conditions {
    display_name = "Error Rate >5% on oracle.yourdomain.com"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"oracle\" metric.label.\"response_code_class\"=\"5xx\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATIO"
      }
      trigger {
        count = 1
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled = true
  project = "gen-lang-client-0791737538"
}

# 4. SSL Certificate Expiry Alert (<30 days)
resource "google_monitoring_alert_policy" "ssl_expiry" {
  display_name = "OMEGA Oracle SSL Certificate Expiry"
  combiner     = "OR"
  conditions {
    display_name = "SSL Certificate Expiry < 30 days for oracle.yourdomain.com"
    condition_threshold {
      filter          = "metric.type=\"loadbalancing.googleapis.com/https/ssl_cert_expiration\" resource.type=\"https_lb_rule\" resource.label.\"forwarding_rule_name\"=\"omega-oracle-forwarding-rule\""
      duration        = "60s"
      comparison      = "COMPARISON_LT"
      threshold_value = 30
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MIN"
      }
      trigger {
        count = 1
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled = true
  project = "gen-lang-client-0791737538"
}

# ---
# Replace "omega-oracle-forwarding-rule" with your actual forwarding rule name if different.
# You can add more notification channels (SMS, webhook, etc.) as needed.
