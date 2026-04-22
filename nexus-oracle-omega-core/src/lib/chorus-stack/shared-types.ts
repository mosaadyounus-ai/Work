export type ChorusTxStatus =
  | "REGISTERED"
  | "EXECUTED"
  | "REJECTED"
  | "TIMEOUT_RESOLVED";

export type SAPClaimStatus =
  | "REGISTERED"
  | "COUNTER_WINDOW"
  | "ARBITER_ASSIGNED"
  | "SYNTHESIZED"
  | "ACCEPTANCE_WINDOW"
  | "COMMITTED"
  | "ESCALATED"
  | "VOID";

export type SAPDisputeType =
  | "scope"
  | "intent"
  | "obligation"
  | "evidence"
  | "timeline"
  | "authority"
  | "mapping"
  | "definition";

export type SignalState = "clean" | "stress" | "contaminated";

export type ChorusMode =
  | "NORMAL"
  | "THROTTLED"
  | "STRESS"
  | "INVERTED"
  | "RECOVERY";

export type EligibilityBand = "A" | "B" | "C" | "FROZEN";

export interface ChorusTx {
  txId: string;
  payloadHash: string;
  status: ChorusTxStatus;
  signatures: number;
  deadline: number;
  recordedAt: number;
}

export interface SAPClaim {
  claimId: string;
  chorusTxId: string;
  status: SAPClaimStatus;
  synthesis: string | null;
  unresolvedCount: number;
  uncontested: boolean;
  staleReference: boolean;
  disputeTypes: SAPDisputeType[];
}

export interface RTTSEvidence {
  arbiterId: string;
  qualityScore: number;
  serviceScore: number;
  loadNormalizedServiceScore: number;
  currentLoad: number;
  signalState: SignalState;
  concentrationRisk: number;
  band: EligibilityBand;
}

export interface ModeState {
  mode: ChorusMode;
  demotionsFrozen: boolean;
  rankingEnabled: boolean;
  manualAuditRequired: boolean;
  rationale: string[];
}

export interface KernelEvaluationInput {
  queueDepth: number;
  queueThreshold: number;
  reliabilityCorrelation: number;
  fallbackCorrelation: number;
  stressSignal: boolean;
  previousMode?: ChorusMode;
}

export interface ContaminationSummary {
  contaminated: boolean;
  severity: "nominal" | "warning" | "critical";
  reliabilityCorrelation: number;
  fallbackCorrelation: number;
  recommendations: string[];
}

export interface ArbiterProfile {
  arbiterId: string;
  qualityScore: number;
  serviceScore: number;
  currentLoad: number;
  concentrationRisk: number;
  available: boolean;
  band: Exclude<EligibilityBand, "FROZEN">;
}

export interface AssignmentRequest {
  arbiters: ArbiterProfile[];
  batchSize: number;
  modeState: ModeState;
  seed?: number;
}

export interface AssignmentResult {
  assignments: Array<{
    slot: number;
    arbiterId: string;
    reason: string;
  }>;
  strategy: string;
  frozen: boolean;
}

export interface ChorusEvent {
  type: "SIGN" | "EXECUTE" | "REJECT" | "TIMEOUT";
  signatures?: number;
  now?: number;
}

export interface SAPEvent {
  type:
    | "OPEN_COUNTER_WINDOW"
    | "ASSIGN_ARBITER"
    | "SYNTHESIZE"
    | "OPEN_ACCEPTANCE"
    | "COMMIT"
    | "ESCALATE"
    | "VOID";
  synthesis?: string;
  unresolvedCount?: number;
  disputeTypes?: SAPDisputeType[];
}
