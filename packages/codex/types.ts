/**
 * Nonogram Codex Type Definitions
 * 
 * Sealed architecture: immutable Plate topology, operators, and transitions.
 * Authority: Nonogram Codex Specification (v1.0)
 */

/**
 * PlateId: Nine sealed states of the Nonogram Codex
 */
export type PlateId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | '∞';

/**
 * OperatorName: Nine sealed operators, one per Plate
 */
export type OperatorName =
  | 'op_generate'
  | 'op_structure'
  | 'op_scale'
  | 'op_disturb'
  | 'op_order'
  | 'op_merge'
  | 'op_invoke'
  | 'op_cycle'
  | 'op_resolve';

/**
 * SignalType: Classification of incoming market signals
 */
export type SignalType = 'market' | 'trend' | 'anomaly' | 'user-injected';

/**
 * SignalSource: Origin of the signal data
 */
export type SignalSource = 'live' | 'cached' | 'heuristic';

/**
 * PlateMetadata: Semantic and operational definition of a Plate
 */
export interface PlateMetadata {
  id: PlateId;
  name: string;
  semantics: string;
  operator: OperatorName;
  order: number; // 0-8 for I-IX, 9 for ∞
  triggerConditions: string[];
  description: string;
}

/**
 * MarketSignal: Raw incoming data from market ingestion layer
 */
export interface MarketSignal {
  id: string;
  timestamp: Date;
  type: SignalType;
  data: {
    momentum: number;
    volatility: number; // in sigma units
    price?: number;
    volume?: number;
    [key: string]: any;
  };
  source: SignalSource;
  fallbackMode: boolean;
}

/**
 * SignalAlignment: Result of mapping a signal to a Plate
 */
export interface SignalAlignment {
  signalId: string;
  timestamp: Date;
  plateId: PlateId;
  operator: OperatorName;
  alignmentScore: number; // 0-1 confidence
  alignmentReason: string;
  fallbackMode: boolean;
}

/**
 * OperatorExecution: Result of applying an operator
 */
export interface OperatorExecution {
  operator: OperatorName;
  plateId: PlateId;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  input: any;
  output: any;
  nextPlate: PlateId;
  status: 'success' | 'warning' | 'error';
  message?: string;
}

/**
 * PlateRecord: State snapshot when entering a Plate
 */
export interface PlateRecord {
  plateId: PlateId;
  plateMetadata: PlateMetadata;
  entryTime: Date;
  durationMs: number;
  operator: OperatorName;
  signal?: SignalAlignment;
  execution: OperatorExecution;
  nextPlate: PlateId;
  metadata: {
    operatorParams: Record<string, any>;
    thresholdsMet: string[];
  };
}

/**
 * CycleRecord: Complete record of a full Nonogram cycle (I–IX → ∞)
 */
export interface CycleRecord {
  cycleId: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  startingPlate: PlateId;
  path: PlateId[]; // sequence of plates visited
  plates: PlateRecord[]; // detailed record of each plate
  returnedToInfinity: boolean;
  infinityTime?: Date;
  fallbackActivated: boolean;
  fallbackReason?: string;
  totalSteps: number;
  status: 'complete' | 'interrupted' | 'error';
}

/**
 * CodexState: Current state of the entire Nonogram Codex engine
 */
export interface CodexState {
  currentPlate: PlateId;
  cycleId: string;
  cycleStartTime: Date;
  totalCycles: number;
  lastSignal?: MarketSignal;
  lastAlignment?: SignalAlignment;
  lastExecution?: OperatorExecution;
  lastPlateRecord?: PlateRecord;
  fallbackMode: boolean;
  fallbackReason?: string;
  fallbackActivatedAt?: Date;
  locked: boolean; // Seal = true
  metadata: {
    invariantsViolated: number;
    transitionsCorrect: number;
    transitionsTotal: number;
    infinityReturns: number;
  };
}

/**
 * TransitionGraphEdge: Definition of a transition from one Plate to another
 */
export interface TransitionGraphEdge {
  from: PlateId;
  to: PlateId;
  operator: OperatorName;
  label: string;
}

/**
 * NonogramTransitionGraph: Sealed definition of all valid transitions
 */
export interface NonogramTransitionGraph {
  edges: TransitionGraphEdge[];
  locked: true; // immutable marker
}

/**
 * OperatorParams: Configuration for operator execution
 */
export interface OperatorParams {
  maxChaos?: number;
  scaleBase?: number;
  mergeThreshold?: number;
  [key: string]: any;
}

/**
 * CodexConfig: Configuration for the Codex engine
 */
export interface CodexConfig {
  initialPlate: PlateId;
  sealed: true; // immutable architecture
  params: OperatorParams;
  telemetry: {
    enableTracing: boolean;
    enableMetrics: boolean;
  };
}

/**
 * ConsoleCommand: Commands that can be sent to the Operator Console
 */
export type ConsoleCommandType =
  | 'step'
  | 'cycle'
  | 'inject_signal'
  | 'toggle_fallback'
  | 'flush_cache'
  | 'lock_cache'
  | 'reset';

export interface ConsoleCommand {
  type: ConsoleCommandType;
  payload?: any;
  timestamp: Date;
  requestId: string;
}

/**
 * ConsoleCommandResult: Result of executing a console command
 */
export interface ConsoleCommandResult {
  commandType: ConsoleCommandType;
  requestId: string;
  success: boolean;
  executedAt: Date;
  durationMs: number;
  result?: any;
  error?: string;
  trace?: PlateRecord[];
}

/**
 * TelemetrySnapshot: Aggregated telemetry data
 */
export interface TelemetrySnapshot {
  timestamp: Date;
  currentPlate: PlateId;
  cycleCount: number;
  signalArrivalRate: number; // signals/sec
  plateDistribution: Record<PlateId, number>;
  operatorInvocations: Record<OperatorName, number>;
  fallbackActivations: number;
  fallbackPercentage: number;
  meanCycleLatency: number;
  transitionCorrectness: number; // 0-1
  infinityReturnRate: number; // 0-1
}

/**
 * OperatorConsoleState: Full state of the Operator Console
 */
export interface OperatorConsoleState {
  codexState: CodexState;
  currentCycle: CycleRecord;
  recentCycles: CycleRecord[]; // last N cycles
  recentSignals: SignalAlignment[]; // last N signal alignments
  telemetry: TelemetrySnapshot;
  commands: ConsoleCommand[];
}
