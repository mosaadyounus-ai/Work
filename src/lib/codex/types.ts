export type PlateId =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VII"
  | "VIII"
  | "IX";

export const INFINITY_CORE = "∞" as const;

export interface Plate {
  id: PlateId;
  name: string;
  role: string;
  stateType:
    | "Active"
    | "Structural"
    | "Transform"
    | "Perturbation"
    | "Stabilization"
    | "Merge"
    | "Invocation"
    | "Recurrence"
    | "Terminal";
}

export interface OperatorContext<State = unknown> {
  state: State;
  metadata?: Record<string, unknown>;
}

export type OperatorFn<State = unknown> = (
  ctx: OperatorContext<State>
) => OperatorContext<State>;

export interface NonagramCodexConfig<State = unknown> {
  plates: Plate[];
  operators: Record<PlateId, OperatorFn<State>>;
  transitionGraph: Record<PlateId, PlateId | typeof INFINITY_CORE>;
  maxRecursionDepth: number;
  spiralGrowthFactor: number;
}
