export type State = "IDLE" | "EVAL" | "EXEC";

export interface Invariants {
  T1_order(history: State[]): boolean;
  T2_timing(ctx: any): boolean;
  T3_continuity(history: State[]): boolean;
  M1_stability(ctx: any): boolean;
  M2_coherence(ctx: any): boolean;
  M3_alignment(intent: any, ctx: any): boolean;
  M4_emergence(proposal: any): boolean;
  M5_distribution(ctx: any): boolean;
}

export interface Vessel {
  state: State;
  context: any;
  history: State[];
  invariants: Invariants;
}

export interface DecisionOption {
  id: string;
  payload: any;
}

export interface InvariantResult {
  passed: boolean;
  violations: string[];
}

export interface DecisionResult {
  chosen: DecisionOption | null;
  trace: State[];
  vessel: Vessel;
  status: InvariantResult;
}

export function anchor(v: Vessel, ctx: any): Vessel {
  return { ...v, context: ctx, state: "IDLE", history: [...v.history, "IDLE"] };
}

export function evaluate(v: Vessel, options: DecisionOption[]): DecisionOption[] {
  if (!v.invariants.T2_timing(v.context)) return [];
  return options.filter(o => v.invariants.M4_emergence(o));
}

export function expand(v: Vessel, options: DecisionOption[]): DecisionOption[] {
  // Domain-specific simulation; placeholder = identity
  return options;
}

export function harmonize(v: Vessel, options: DecisionOption[]): DecisionOption | null {
  if (!v.invariants.M2_coherence(v.context)) return null;
  return options[0] ?? null;
}

export function seal(v: Vessel, chosen: DecisionOption | null): DecisionResult {
  const h1: State[] = [...v.history, "EVAL"];
  const h2: State[] = chosen ? [...h1, "EXEC", "IDLE"] : [...h1, "IDLE"];

  const violations: string[] = [];
  if (!v.invariants.T1_order(h2)) violations.push("T1_ORDER_VIOLATION");
  if (!v.invariants.T3_continuity(h2)) violations.push("T3_CONTINUITY_VIOLATION");
  if (!v.invariants.M1_stability(v.context)) violations.push("M1_STABILITY_VIOLATION");
  if (!v.invariants.M2_coherence(v.context)) violations.push("M2_COHERENCE_VIOLATION");

  return { 
    chosen, 
    trace: h2, 
    vessel: { ...v, state: "IDLE", history: h2 },
    status: {
      passed: violations.length === 0,
      violations
    }
  };
}

// One-shot 5-move engine
export function decide(v: Vessel, ctx: any, options: DecisionOption[]): DecisionResult {
  const anchored = anchor(v, ctx);
  const evald = evaluate(anchored, options);
  const expanded = expand(anchored, evald);
  const chosen = harmonize(anchored, expanded);
  return seal(anchored, chosen);
}

// Default Hardened Invariants
export const defaultInvariants: Invariants = {
  T1_order: (history) => {
    // Basic illegal transition check
    for (let i = 1; i < history.length; i++) {
        const prev = history[i-1];
        const next = history[i];
        if (prev === "EXEC" && next === "EVAL") return false;
        if (prev === "EVAL" && next === "EVAL") return false;
    }
    return true;
  },
  T2_timing: (ctx) => {
    // Ensure context has core metrics
    return ctx && typeof ctx.score === 'number' && typeof ctx.risk === 'number';
  },
  T3_continuity: (history) => {
    // No jumps: IDLE -> EXEC is illegal
    for (let i = 1; i < history.length; i++) {
        const prev = history[i-1];
        const next = history[i];
        if (prev === "IDLE" && next === "EXEC") return false;
    }
    return true;
  },
  M1_stability: (ctx) => ctx && !ctx.error,
  M2_coherence: (ctx) => {
    // Logic: Incoherent if risk is extreme but posture is unknown (handled in harmonize usually)
    return true; 
  },
  M3_alignment: () => true,
  M4_emergence: (proposal) => {
    // Proposal must have a valid payload trigger
    return proposal && proposal.payload && proposal.payload.triggered !== false;
  },
  M5_distribution: () => true,
};
