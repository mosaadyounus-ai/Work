/**
 * Operator Console Data Layer
 *
 * Handles state management, signal routing, telemetry aggregation,
 * and command processing for the Nonogram Codex.
 */

import {
  NonogramCodex,
  createNonogramCodex,
} from './engine';
import {
  CodexState,
  MarketSignal,
  SignalAlignment,
  CycleRecord,
  ConsoleCommand,
  ConsoleCommandType,
  ConsoleCommandResult,
  TelemetrySnapshot,
  OperatorConsoleState,
  PlateId,
  OperatorName,
} from './types';

/**
 * OperatorConsole: Main facade for console state and operations
 */
export class OperatorConsole {
  private codex: NonogramCodex;
  private commandHistory: ConsoleCommand[] = [];
  private commandResultHistory: ConsoleCommandResult[] = [];
  private telemetryHistory: TelemetrySnapshot[] = [];
  private signalBuffer: SignalAlignment[] = [];
  private cycleBuffer: CycleRecord[] = [];

  private plateCounts: Map<PlateId, number> = new Map();
  private operatorCounts: Map<OperatorName, number> = new Map();
  private fallbackActivations = 0;

  private listeners: Set<(state: OperatorConsoleState) => void> = new Set();

  constructor() {
    this.codex = createNonogramCodex({
      initialPlate: 'I',
      telemetry: { enableTracing: true, enableMetrics: true },
    });

    // Initialize counts
    const plateMetadata = this.codex.getPlateMetadata();
    Object.keys(plateMetadata).forEach((key) => {
      this.plateCounts.set(key as PlateId, 0);
    });

    const opNames: OperatorName[] = [
      'op_generate',
      'op_structure',
      'op_scale',
      'op_disturb',
      'op_order',
      'op_merge',
      'op_invoke',
      'op_cycle',
      'op_resolve',
    ];
    opNames.forEach((op) => {
      this.operatorCounts.set(op, 0);
    });
  }

  /**
   * Subscribe to state updates
   */
  subscribe(listener: (state: OperatorConsoleState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit state update to all listeners
   */
  private emit(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Process an incoming market signal
   */
  async processSignal(signal: MarketSignal): Promise<void> {
    try {
      // Align signal to Plate
      const alignment = this.codex.alignSignalToPlate(signal);
      this.signalBuffer.push(alignment);

      // Step through the Codex with this signal
      const plateRecord = await this.codex.step(signal);

      // Update counts
      this.plateCounts.set(plateRecord.plateId, this.plateCounts.get(plateRecord.plateId)! + 1);
      this.operatorCounts.set(plateRecord.operator, this.operatorCounts.get(plateRecord.operator)! + 1);

      // Check for fallback activation
      if (alignment.fallbackMode && !this.codex.getState().fallbackMode) {
        this.fallbackActivations++;
      }

      this.emit();
    } catch (error) {
      console.error('Error processing signal:', error);
    }
  }

  /**
   * Inject a signal manually (console command)
   */
  async injectSignal(signal: MarketSignal): Promise<ConsoleCommandResult> {
    const requestId = this.generateRequestId();
    const command: ConsoleCommand = {
      type: 'inject_signal',
      payload: signal,
      timestamp: new Date(),
      requestId,
    };

    this.commandHistory.push(command);
    const startTime = Date.now();

    try {
      await this.processSignal(signal);
      const durationMs = Date.now() - startTime;

      const result: ConsoleCommandResult = {
        commandType: 'inject_signal',
        requestId,
        success: true,
        executedAt: new Date(),
        durationMs,
        result: {
          signalId: signal.id,
          alignedPlate: this.codex.getState().currentPlate,
        },
      };

      this.commandResultHistory.push(result);
      this.emit();
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const result: ConsoleCommandResult = {
        commandType: 'inject_signal',
        requestId,
        success: false,
        executedAt: new Date(),
        durationMs,
        error: String(error),
      };

      this.commandResultHistory.push(result);
      return result;
    }
  }

  /**
   * Step to next Plate
   */
  async step(signal?: MarketSignal): Promise<ConsoleCommandResult> {
    const requestId = this.generateRequestId();
    const command: ConsoleCommand = {
      type: 'step',
      payload: signal,
      timestamp: new Date(),
      requestId,
    };

    this.commandHistory.push(command);
    const startTime = Date.now();

    try {
      const plateRecord = await this.codex.step(signal);
      const durationMs = Date.now() - startTime;

      this.plateCounts.set(plateRecord.plateId, this.plateCounts.get(plateRecord.plateId)! + 1);
      this.operatorCounts.set(plateRecord.operator, this.operatorCounts.get(plateRecord.operator)! + 1);

      const result: ConsoleCommandResult = {
        commandType: 'step',
        requestId,
        success: true,
        executedAt: new Date(),
        durationMs,
        result: {
          plateId: plateRecord.plateId,
          operator: plateRecord.operator,
          nextPlate: plateRecord.nextPlate,
        },
        trace: [plateRecord],
      };

      this.commandResultHistory.push(result);
      this.emit();
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const result: ConsoleCommandResult = {
        commandType: 'step',
        requestId,
        success: false,
        executedAt: new Date(),
        durationMs,
        error: String(error),
      };

      this.commandResultHistory.push(result);
      return result;
    }
  }

  /**
   * Run a complete cycle to ∞
   */
  async runCycle(maxSteps = 10): Promise<ConsoleCommandResult> {
    const requestId = this.generateRequestId();
    const command: ConsoleCommand = {
      type: 'cycle',
      payload: { maxSteps },
      timestamp: new Date(),
      requestId,
    };

    this.commandHistory.push(command);
    const startTime = Date.now();

    try {
      const cycle = await this.codex.runCycle(maxSteps);
      const durationMs = Date.now() - startTime;

      this.cycleBuffer.push(cycle);

      // Update counts
      cycle.plates.forEach((pr) => {
        this.plateCounts.set(pr.plateId, this.plateCounts.get(pr.plateId)! + 1);
        this.operatorCounts.set(pr.operator, this.operatorCounts.get(pr.operator)! + 1);
      });

      if (cycle.fallbackActivated) {
        this.fallbackActivations++;
      }

      const result: ConsoleCommandResult = {
        commandType: 'cycle',
        requestId,
        success: true,
        executedAt: new Date(),
        durationMs,
        result: {
          cycleId: cycle.cycleId,
          path: cycle.path,
          returnedToInfinity: cycle.returnedToInfinity,
          totalSteps: cycle.totalSteps,
        },
        trace: cycle.plates,
      };

      this.commandResultHistory.push(result);
      this.emit();
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const result: ConsoleCommandResult = {
        commandType: 'cycle',
        requestId,
        success: false,
        executedAt: new Date(),
        durationMs,
        error: String(error),
      };

      this.commandResultHistory.push(result);
      return result;
    }
  }

  /**
   * Toggle fallback mode
   */
  toggleFallback(active: boolean, reason?: string): ConsoleCommandResult {
    const requestId = this.generateRequestId();
    const command: ConsoleCommand = {
      type: 'toggle_fallback',
      payload: { active, reason },
      timestamp: new Date(),
      requestId,
    };

    this.commandHistory.push(command);

    this.codex.setFallbackMode(active, reason);
    if (active) {
      this.fallbackActivations++;
    }

    const result: ConsoleCommandResult = {
      commandType: 'toggle_fallback',
      requestId,
      success: true,
      executedAt: new Date(),
      durationMs: 0,
      result: { fallbackMode: active, reason },
    };

    this.commandResultHistory.push(result);
    this.emit();
    return result;
  }

  /**
   * Generate telemetry snapshot
   */
  private generateTelemetry(): TelemetrySnapshot {
    const state = this.codex.getState();

    const totalSignals = this.signalBuffer.length || 1;
    const signalArrivalRate = totalSignals / (state.totalCycles || 1);

    let transitionCorrectness = 1.0;
    if (state.metadata.transitionsTotal > 0) {
      transitionCorrectness = state.metadata.transitionsCorrect / state.metadata.transitionsTotal;
    }

    let infinityReturnRate = 0;
    const completedCycles = this.cycleBuffer.filter((c) => c.returnedToInfinity).length;
    if (this.cycleBuffer.length > 0) {
      infinityReturnRate = completedCycles / this.cycleBuffer.length;
    }

    const meanCycleLatency =
      this.cycleBuffer.length > 0
        ? this.cycleBuffer.reduce((sum, c) => sum + c.durationMs, 0) / this.cycleBuffer.length
        : 0;

    return {
      timestamp: new Date(),
      currentPlate: state.currentPlate,
      cycleCount: state.totalCycles,
      signalArrivalRate,
      plateDistribution: Object.fromEntries(this.plateCounts) as Record<PlateId, number>,
      operatorInvocations: Object.fromEntries(this.operatorCounts) as Record<OperatorName, number>,
      fallbackActivations: this.fallbackActivations,
      fallbackPercentage: this.cycleBuffer.length > 0
        ? (this.cycleBuffer.filter((c) => c.fallbackActivated).length / this.cycleBuffer.length) * 100
        : 0,
      meanCycleLatency,
      transitionCorrectness,
      infinityReturnRate,
    };
  }

  /**
   * Get current console state
   */
  getState(): OperatorConsoleState {
    const telemetry = this.generateTelemetry();
    this.telemetryHistory.push(telemetry);

    const state: OperatorConsoleState = {
      codexState: this.codex.getState(),
      currentCycle: null as any, // would be current cycle if in progress
      recentCycles: this.codex.getRecentCycles(5),
      recentSignals: this.signalBuffer.slice(-10),
      telemetry,
      commands: this.commandHistory.slice(-20),
    };

    return state;
  }

  /**
   * Get command history
   */
  getCommandHistory(limit = 50): ConsoleCommand[] {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Get command result history
   */
  getCommandResults(limit = 50): ConsoleCommandResult[] {
    return this.commandResultHistory.slice(-limit);
  }

  /**
   * Get telemetry history
   */
  getTelemetryHistory(limit = 100): TelemetrySnapshot[] {
    return this.telemetryHistory.slice(-limit);
  }

  /**
   * Verify all invariants
   */
  verifyInvariants(): { valid: boolean; violations: string[] } {
    return this.codex.verifyInvariants();
  }

  /**
   * Reset console (for testing)
   */
  reset(): void {
    this.codex = createNonogramCodex();
    this.commandHistory = [];
    this.commandResultHistory = [];
    this.telemetryHistory = [];
    this.signalBuffer = [];
    this.cycleBuffer = [];
    this.fallbackActivations = 0;

    const plateMetadata = this.codex.getPlateMetadata();
    Object.keys(plateMetadata).forEach((key) => {
      this.plateCounts.set(key as PlateId, 0);
    });

    const opNames: OperatorName[] = [
      'op_generate',
      'op_structure',
      'op_scale',
      'op_disturb',
      'op_order',
      'op_merge',
      'op_invoke',
      'op_cycle',
      'op_resolve',
    ];
    opNames.forEach((op) => {
      this.operatorCounts.set(op, 0);
    });

    this.emit();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a new Operator Console instance
 */
export function createOperatorConsole(): OperatorConsole {
  return new OperatorConsole();
}
