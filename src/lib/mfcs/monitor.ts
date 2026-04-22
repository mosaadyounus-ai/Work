import { DecisionResult, DecisionOption, State } from "./kernel";

export interface MonitorLog {
  timestamp: string;
  trace: State[];
  chosen: string | null;
  passed: boolean;
  violations: string[];
}

class MFCSMonitor {
  private logs: MonitorLog[] = [];
  private maxLogs = 100;

  public log(result: DecisionResult) {
    const logEntry: MonitorLog = {
      timestamp: new Date().toISOString(),
      trace: result.trace,
      chosen: result.chosen?.id || null,
      passed: result.status.passed,
      violations: result.status.violations
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Runtime Anomaly Detection
    this.detectAnomalies(result);
  }

  private detectAnomalies(result: DecisionResult) {
    const trace = result.trace;
    
    // 1. Trace Integrity
    if (trace[trace.length - 1] !== "IDLE") {
        console.error("[CRITICAL] MFCS_MONITOR: Vessel state leak. Trace did not return to IDLE.", trace);
    }

    // 2. Invariant Breach
    if (!result.status.passed) {
        console.warn(`[WARNING] MFCS_MONITOR: Invariant violation detected: ${result.status.violations.join(", ")}`);
    }

    // 3. Sequence Validation
    const sequence = trace.join("->");
    const allowed = ["IDLE->EVAL->EXEC->IDLE", "IDLE->EVAL->IDLE", "IDLE->IDLE"];
    if (!allowed.includes(sequence)) {
        console.error(`[CRITICAL] MFCS_MONITOR: Illegal transition sequence detected: ${sequence}`);
    }
  }

  public getLogs() {
    return this.logs;
  }
}

export const monitor = new MFCSMonitor();
