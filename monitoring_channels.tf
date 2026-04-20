resource "google_monitoring_notification_channel" "slack" {
  display_name = "OMEGA Oracle Slack Alerts"
  type         = "slack"
  labels = {
    channel_name = "#alerts" # Update to your Slack channel
    team         = "TXXXXXXX" # Update to your Slack team ID
  }
  verification_status = "VERIFIED" # Set to VERIFIED after Slack webhook is confirmed
  project = "gen-lang-client-0791737538"
}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "OMEGA Oracle PagerDuty Alerts"
  type         = "pagerduty"
  labels = {
    service_key = "YOUR_PAGERDUTY_SERVICE_KEY" # Update to your PagerDuty integration key
  }
  project = "gen-lang-client-0791737538"
}

# Add these channel IDs to your alert policies' notification_channels list as needed.
