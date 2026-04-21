export type OracleMode = 'BUILD_COMPRESS' | 'FUSION' | 'ANALYZE' | 'IDLE';

export interface OracleState {
  mode: OracleMode;
  phi?: number;
  r?: number;
  s?: number;
  e?: number;
}

export interface FacetClassification {
  facet: string;
  label: string;
  M_min: number;
}

export interface EnvelopeInputs {
  W: number;
  inside: boolean;
  margin: number;
  gap: number;
  kink: number | null;
  weights: { C_r: number };
  classification: FacetClassification;
  state: OracleState;
}

export interface EnvelopeReport {
  W: number;
  M_min: number;
  inside: boolean;
  margin: number;
  activeFacet: string;
  facetLabel: string;
  supportGap: number;
  kinkProximity: number;
  dimension: 2 | 3;
  degenerate?: boolean;

  // Law φ-A binding
  inPhiAttractor: boolean;
  attractorId?: 'G_phi';
  lawCompliance?: {
    lawId: 'phi-A';
    nearRecursion: boolean;
    irreversible: boolean;
    inAttractor: boolean;
    premisesSatisfied: boolean;
  };
}

export const LAW_BINDING = {
  lawId: 'phi-A',
  symbolic: 'approx-loop ^ not(reverse) => G_phi',
  statement:
    '(exists n >= 1 : d(f^n(x), x) <= epsilon) and no state-preserving inverse => x_t -> G_phi',
} as const;

const PHI_FACETS = ['Facet-A', 'Facet-C'] as const;
const MAX_NEAR_RECURRENCE_STEPS = 6;
const NEAR_RECURRENCE_EPSILON = 1e-3;

type OracleStateWithCoordinates = OracleState & {
  phi: number;
  r: number;
  e: number;
};

function hasCoordinates(state: OracleState): state is OracleStateWithCoordinates {
  return (
    typeof state.phi === 'number' &&
    typeof state.r === 'number' &&
    typeof state.e === 'number'
  );
}

function distance(a: OracleStateWithCoordinates, b: OracleStateWithCoordinates): number {
  return (
    Math.abs(a.phi - b.phi) +
    Math.abs(a.r - b.r) +
    Math.abs((a.s ?? 0) - (b.s ?? 0)) +
    Math.abs(a.e - b.e)
  );
}

function step(state: OracleStateWithCoordinates): OracleStateWithCoordinates {
  switch (state.mode) {
    case 'BUILD_COMPRESS':
      return {
        ...state,
        mode: 'FUSION',
        phi: Math.max(state.phi - 1, 0),
        r: state.r + 4,
        s: (state.s ?? 0) + Math.max(state.phi - 1, 0),
      };
    case 'FUSION':
      return {
        ...state,
        mode: 'IDLE',
      };
    case 'ANALYZE':
    case 'IDLE':
      return {
        ...state,
      };
  }
}

function computeNearRecursion(state: OracleState): boolean {
  if (!hasCoordinates(state)) {
    return false;
  }

  let current: OracleStateWithCoordinates = state;
  for (let stepIndex = 1; stepIndex <= MAX_NEAR_RECURRENCE_STEPS; stepIndex += 1) {
    current = step(current);
    if (distance(current, state) <= NEAR_RECURRENCE_EPSILON) {
      return true;
    }
  }

  return false;
}

export class OracleKernelCore {
  constructor(
    private readonly dimension: 2 | 3,
    private readonly degenerate?: boolean,
  ) {}

  evaluate(input: EnvelopeInputs): EnvelopeReport {
    const { W, classification, inside, margin, gap, kink, weights, state } = input;

    const inPhiAttractor = inside && PHI_FACETS.includes(classification.facet);
    const nearRecursion = computeNearRecursion(state);
    const irreversible = state.mode === 'BUILD_COMPRESS' || state.mode === 'FUSION';

    const lawCompliance = {
      lawId: LAW_BINDING.lawId,
      nearRecursion,
      irreversible,
      inAttractor: inPhiAttractor,
      premisesSatisfied: nearRecursion && irreversible,
    };

    return {
      W,
      M_min: classification.M_min,
      inside,
      margin,
      activeFacet: classification.facet,
      facetLabel: classification.label,
      supportGap: gap,
      kinkProximity: kink !== null ? Math.abs(weights.C_r - kink) : Infinity,
      dimension: this.dimension,
      degenerate: this.degenerate,
      inPhiAttractor,
      attractorId: inPhiAttractor ? 'G_phi' : undefined,
      lawCompliance,
    };
  }
}
