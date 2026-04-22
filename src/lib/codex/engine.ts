import { PlateId, INFINITY_CORE, Plate, NonagramCodexConfig, OperatorContext } from "./types";

export class NonagramCodex<State = unknown> {
  readonly plates: Plate[];
  readonly operators: Record<PlateId, any>;
  readonly transitionGraph: Record<PlateId, PlateId | typeof INFINITY_CORE>;
  readonly maxRecursionDepth: number;
  readonly spiralGrowthFactor: number;
  readonly seal: boolean = true;

  constructor(config: NonagramCodexConfig<State>) {
    this.plates = config.plates;
    this.operators = config.operators;
    this.transitionGraph = config.transitionGraph;
    this.maxRecursionDepth = config.maxRecursionDepth;
    this.spiralGrowthFactor = config.spiralGrowthFactor;
    Object.freeze(this.plates);
    Object.freeze(this.operators);
    Object.freeze(this.transitionGraph);
    Object.freeze(this);
  }

  private nextPlate(current: PlateId): PlateId | typeof INFINITY_CORE {
    const next = this.transitionGraph[current];
    if (!next) {
      throw new Error(`Invalid transition from plate ${current}`);
    }
    return next;
  }

  runCycle(
    startPlate: PlateId,
    initialState: State
  ): { finalPlate: PlateId | typeof INFINITY_CORE; state: State; trace: string[] } {
    let plate: PlateId | typeof INFINITY_CORE = startPlate;
    let ctx: OperatorContext<State> = { state: initialState };
    let depth = 0;
    const trace: string[] = [];

    while ((plate as string) !== (INFINITY_CORE as string)) {
      if (depth >= this.maxRecursionDepth) {
        trace.push(`MAX_DEPTH_REACHED -> ${INFINITY_CORE}`);
        return { finalPlate: INFINITY_CORE, state: ctx.state, trace };
      }

      const op = this.operators[plate as PlateId];
      trace.push(`${plate}:OP_EXEC`);
      
      if (op) {
        ctx = op(ctx);
      }

      const next = this.nextPlate(plate as PlateId);
      trace.push(`${plate}->${next}`);
      
      if (next === INFINITY_CORE) {
        return { finalPlate: INFINITY_CORE, state: ctx.state, trace };
      }

      plate = next;
      depth++;
    }

    return { finalPlate: INFINITY_CORE, state: ctx.state, trace };
  }
}

export const DEFAULT_PLATES: Plate[] = [
  { id: "I", name: "Golden Ratio", role: "Generative expansion", stateType: "Active" },
  { id: "II", name: "96-Surface Lattice", role: "Structural ontology", stateType: "Structural" },
  { id: "III", name: "Logarithmic Scale", role: "Perceptual scaling", stateType: "Transform" },
  { id: "IV", name: "Chaos & Symmetry", role: "Controlled disturbance", stateType: "Perturbation" },
  { id: "V", name: "Order & Evolution", role: "Temporal structuring", stateType: "Stabilization" },
  { id: "VI", name: "Convergence", role: "Field unification", stateType: "Merge" },
  { id: "VII", name: "The Source", role: "Prime resonance", stateType: "Invocation" },
  { id: "VIII", name: "The Cycles", role: "Harmonic recurrence", stateType: "Recurrence" },
  { id: "IX", name: "Completion", role: "Resolution & return", stateType: "Terminal" }
];

export const DEFAULT_TRANSITIONS: Record<PlateId, PlateId | typeof INFINITY_CORE> = {
  I: "V",
  II: "VI",
  III: "I",
  IV: "III",
  V: "IX",
  VI: "VII",
  VII: "II",
  VIII: "IV",
  IX: INFINITY_CORE
};
