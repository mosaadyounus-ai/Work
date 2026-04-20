/**
 * Nonogram Codex Package
 *
 * Sealed nine-plate recursive operator engine with Operator Console interface
 */

export type {
  PlateId,
  OperatorName,
  SignalType,
  SignalSource,
  PlateMetadata,
  MarketSignal,
  SignalAlignment,
  OperatorExecution,
  PlateRecord,
  CycleRecord,
  CodexState,
  NonogramTransitionGraph,
  TransitionGraphEdge,
  CodexConfig,
  OperatorParams,
  ConsoleCommand,
  ConsoleCommandType,
  ConsoleCommandResult,
  TelemetrySnapshot,
  OperatorConsoleState,
} from './types';

export {
  NonogramCodex,
  createNonogramCodex,
} from './engine';

export {
  OperatorConsole,
  createOperatorConsole,
} from './console';
