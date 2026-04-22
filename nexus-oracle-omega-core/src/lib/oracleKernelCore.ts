export interface Weights3D {
  C_phi: number;
  C_r: number;
  C_s: number;
}

export interface PeakCoordinates {
  phi: number;
  r: number;
  s: number;
  e: number;
}

export interface Peak {
  peak_id: string;
  cluster_id: string;
  coordinates: PeakCoordinates;
  envelope_value: number;
  facet_assignment: string;
  dominance_condition: string;
}

export interface FacetWeights {
  C_phi: number;
  C_r: number;
  C_s: number;
}

export interface Facet {
  facet_id: string;
  offset: number;
  plane_equation: string;
  dominance_region?: Record<string, number>;
  peak_id?: string;
  label?: string;
  phi_governed?: boolean;
  weights?: Partial<FacetWeights>;
  normal?: number[];
}

export interface MirrorLawAttractor {
  id: string;
  governing_facets: string[];
  admissibility: string;
  description?: string;
}

export interface MirrorLaw {
  id: string;
  name: string;
  symbolic: string;
  formal: string;
  informal?: string;
  attractor?: MirrorLawAttractor;
}

export interface MirrorMetadata {
  dimension?: number;
  degenerate?: boolean;
  epsilon?: number;
  laws?: MirrorLaw[];
}

export interface BoundaryCoefficients {
  C_phi: number;
  C_r: number;
  C_s: number;
  const: number;
}

export interface KinkEdge {
  edge_id: string;
  vertices: [string, string];
  tie_hyperplane?: {
    coefficients: Partial<BoundaryCoefficients>;
    equation: string;
  };
  projected_line?: {
    slope_on_c_phi: number;
    intercept_constant: number;
    intercept_c_s?: number;
    formula: string;
  };
  kink_equation?: {
    slope: number;
    intercept: number;
    formula: string;
  };
}

export interface MirrorContract {
  schema_version: string;
  metadata?: MirrorMetadata;
  embedding: {
    type: string;
    coordinates: string[];
  };
  envelope: {
    parameters: Partial<Weights3D> & {
      M: number;
    };
    functional: string;
  };
  peaks: Peak[];
  facets: Facet[];
  adjacency: KinkEdge[];
  geometry?: {
    degenerate?: boolean;
    accepted?: boolean;
    affine_rank?: number;
    relation?: {
      type?: string;
      equation?: string;
      residuals?: Record<string, number>;
    };
    warnings?: string[];
  };
}

export interface HybridState {
  phi: number;
  r: number;
  s?: number;
  e: number;
  mode: string;
  integ?: number;
  dwell?: number;
}

export interface FacetScore {
  id: string;
  value: number;
  label: string;
  facet: Facet;
}

export interface FacetClassification {
  facet: string;
  label: string;
  value: number;
  peak: Peak | null;
}

export interface KinkValue {
  edge_id: string;
  value: number;
  slope: number;
  intercept: number;
  intercept_c_s: number;
  formula: string;
  vertices: [string, string];
  projected_at_c_s: number;
}

export interface KernelEvaluation {
  state: HybridState;
  weights: Weights3D;
  envelope: {
    W: number;
    M_min: number;
    inside: boolean;
    margin: number;
  };
  facet: FacetClassification;
  gap: {
    current: number;
    next: number;
    gap: number;
  };
  kink: KinkValue;
  attractor: {
    in_phi_attractor: boolean;
    attractor_id?: string;
    phi_facets: string[];
    law_status: {
      phiA: {
        satisfied: boolean;
        symbolic: string;
        formal: string;
        runtime_projection: boolean;
        reason: string;
      };
    };
  };
  timestamp: string;
}

type WeightInput = Partial<Weights3D> | number | undefined;

function round6(value: number) {
  return Number(value.toFixed(6));
}

function buildDerivedFormula(coefficients: BoundaryCoefficients) {
  const parts: string[] = [];
  if (coefficients.C_phi !== 0) {
    parts.push(`${coefficients.C_phi}*C_phi`);
  }
  if (coefficients.C_r !== 0) {
    parts.push(`${coefficients.C_r >= 0 ? "+" : "-"} ${Math.abs(coefficients.C_r)}*C_r`);
  }
  if (coefficients.C_s !== 0) {
    parts.push(`${coefficients.C_s >= 0 ? "+" : "-"} ${Math.abs(coefficients.C_s)}*C_s`);
  }
  if (coefficients.const !== 0) {
    parts.push(`${coefficients.const >= 0 ? "+" : "-"} ${Math.abs(coefficients.const)}`);
  }

  return `${parts.join(" ").replace(/\+\s-/g, "- ").replace(/^\+\s/, "")} = 0`;
}

export class OracleKernelCore {
  protected readonly contract: MirrorContract;
  protected activeFacet: string | null = null;

  constructor(contract: MirrorContract) {
    OracleKernelCore.validateContract(contract);
    this.contract = OracleKernelCore.normalizeContract(contract);
  }

  static validateContract(contract: MirrorContract) {
    if (!["1.0.0", "1.1.0"].includes(contract.schema_version)) {
      throw new Error(`Unsupported mirror schema: ${contract.schema_version}`);
    }

    if (!Array.isArray(contract.peaks) || contract.peaks.length === 0) {
      throw new Error("Mirror contract must include at least one peak.");
    }

    if (!Array.isArray(contract.facets) || contract.facets.length === 0) {
      throw new Error("Mirror contract must include at least one facet.");
    }

    if (!Array.isArray(contract.adjacency) || contract.adjacency.length === 0) {
      throw new Error("Mirror contract must include at least one boundary edge.");
    }
  }

  static normalizeContract(contract: MirrorContract): MirrorContract {
    const parameters: Partial<Weights3D> & { M: number } = contract.envelope.parameters;
    const laws =
      contract.metadata?.laws?.map((law) => ({
        ...law,
        attractor: law.attractor
          ? {
              ...law.attractor,
              governing_facets: law.attractor.governing_facets ?? [],
            }
          : undefined,
      })) ?? [];
    const phiFacetSet = new Set(
      laws.flatMap((law) => law.attractor?.governing_facets ?? []),
    );

    return {
      ...contract,
      metadata:
        contract.metadata || contract.geometry
          ? {
              dimension:
                contract.metadata?.dimension ??
                Math.max((contract.embedding.coordinates?.length ?? 2) - 1, 2),
              degenerate: contract.metadata?.degenerate ?? contract.geometry?.degenerate,
              epsilon: contract.metadata?.epsilon ?? 0,
              laws,
            }
          : undefined,
      envelope: {
        ...contract.envelope,
        parameters: {
          C_phi: parameters.C_phi ?? 0,
          C_r: parameters.C_r ?? 0,
          C_s: parameters.C_s ?? 0,
          M: parameters.M,
        },
      },
      peaks: contract.peaks.map((peak) => ({
        ...peak,
        coordinates: {
          ...peak.coordinates,
          s: peak.coordinates.s ?? 0,
        },
      })),
      facets: contract.facets.map((facet) => ({
        ...facet,
        label: facet.label ?? facet.facet_id,
        phi_governed: facet.phi_governed ?? phiFacetSet.has(facet.facet_id),
        weights: OracleKernelCore.resolveFacetWeights(facet),
      })),
      adjacency: contract.adjacency.map((edge) => ({
        ...edge,
        tie_hyperplane: edge.tie_hyperplane
          ? {
              equation: edge.tie_hyperplane.equation,
              coefficients: {
                C_phi: edge.tie_hyperplane.coefficients.C_phi ?? 0,
                C_r: edge.tie_hyperplane.coefficients.C_r ?? 0,
                C_s: edge.tie_hyperplane.coefficients.C_s ?? 0,
                const: edge.tie_hyperplane.coefficients.const ?? 0,
              },
            }
          : edge.kink_equation
            ? {
                equation: buildDerivedFormula({
                  C_phi: edge.kink_equation.slope,
                  C_r: -1,
                  C_s: 0,
                  const: edge.kink_equation.intercept,
                }),
                coefficients: {
                  C_phi: edge.kink_equation.slope,
                  C_r: -1,
                  C_s: 0,
                  const: edge.kink_equation.intercept,
                },
              }
            : undefined,
        projected_line:
          edge.projected_line ??
          (edge.kink_equation
            ? {
                slope_on_c_phi: edge.kink_equation.slope,
                intercept_constant: edge.kink_equation.intercept,
                intercept_c_s: 0,
                formula: edge.kink_equation.formula,
              }
            : undefined),
      })),
    };
  }

  static resolveFacetWeights(facet: Facet): FacetWeights {
    if (facet.weights) {
      return {
        C_phi: facet.weights.C_phi ?? 0,
        C_r: facet.weights.C_r ?? 0,
        C_s: facet.weights.C_s ?? 0,
      };
    }

    if (Array.isArray(facet.normal)) {
      if (facet.normal.length >= 4) {
        return {
          C_phi: facet.normal[0] ?? 0,
          C_r: facet.normal[1] ?? 0,
          C_s: facet.normal[2] ?? 0,
        };
      }

      return {
        C_phi: facet.normal[0] ?? 0,
        C_r: facet.normal[1] ?? 0,
        C_s: 0,
      };
    }

    return { C_phi: 0, C_r: 0, C_s: 0 };
  }

  getContract() {
    return this.contract;
  }

  getLaw(lawId: string) {
    return this.contract.metadata?.laws?.find((law) => law.id === lawId);
  }

  getPhiFacets() {
    const lawFacets = this.getLaw("phi-A")?.attractor?.governing_facets ?? [];
    const explicitFacets = this.contract.facets
      .filter((facet) => facet.phi_governed)
      .map((facet) => facet.facet_id);

    return Array.from(new Set([...lawFacets, ...explicitFacets]));
  }

  protected resolveWeights(
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): Weights3D {
    if (typeof weightsOrCphi === "number") {
      return {
        C_phi: weightsOrCphi,
        C_r: maybeCr ?? this.contract.envelope.parameters.C_r ?? 0,
        C_s: maybeCs ?? this.contract.envelope.parameters.C_s ?? 0,
      };
    }

    return {
      C_phi: weightsOrCphi?.C_phi ?? this.contract.envelope.parameters.C_phi ?? 0,
      C_r: weightsOrCphi?.C_r ?? this.contract.envelope.parameters.C_r ?? 0,
      C_s: weightsOrCphi?.C_s ?? this.contract.envelope.parameters.C_s ?? 0,
    };
  }

  protected getPeakForFacet(facet: Facet) {
    if (facet.peak_id) {
      return this.contract.peaks.find((peak) => peak.peak_id === facet.peak_id) ?? null;
    }

    return this.contract.peaks.find((peak) => peak.facet_assignment === facet.facet_id) ?? null;
  }

  protected getBoundaryCoefficients(edge: KinkEdge): BoundaryCoefficients {
    if (edge.tie_hyperplane?.coefficients) {
      return {
        C_phi: edge.tie_hyperplane.coefficients.C_phi ?? 0,
        C_r: edge.tie_hyperplane.coefficients.C_r ?? 0,
        C_s: edge.tie_hyperplane.coefficients.C_s ?? 0,
        const: edge.tie_hyperplane.coefficients.const ?? 0,
      };
    }

    if (edge.kink_equation) {
      return {
        C_phi: edge.kink_equation.slope,
        C_r: -1,
        C_s: 0,
        const: edge.kink_equation.intercept,
      };
    }

    return {
      C_phi: 0,
      C_r: 0,
      C_s: 0,
      const: 0,
    };
  }

  protected getProjectedLine(edge: KinkEdge) {
    if (edge.projected_line) {
      return {
        slope_on_c_phi: edge.projected_line.slope_on_c_phi,
        intercept_constant: edge.projected_line.intercept_constant,
        intercept_c_s: edge.projected_line.intercept_c_s ?? 0,
        formula: edge.projected_line.formula,
      };
    }

    const coefficients = this.getBoundaryCoefficients(edge);
    if (coefficients.C_r === 0) {
      return null;
    }

    const slope_on_c_phi = -coefficients.C_phi / coefficients.C_r;
    const intercept_constant = -coefficients.const / coefficients.C_r;
    const intercept_c_s = -coefficients.C_s / coefficients.C_r;
    const formula =
      coefficients.C_s === 0
        ? `C_r = ${round6(intercept_constant)} + ${round6(slope_on_c_phi)}*C_phi`
        : `C_r = ${round6(intercept_constant)} + ${round6(slope_on_c_phi)}*C_phi + ${round6(intercept_c_s)}*C_s`;

    return {
      slope_on_c_phi,
      intercept_constant,
      intercept_c_s,
      formula,
    };
  }

  evaluateEnvelope(
    state: HybridState,
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): number {
    const weights = this.resolveWeights(weightsOrCphi, maybeCr, maybeCs);
    return (
      state.e +
      weights.C_phi * state.phi +
      weights.C_r * state.r +
      weights.C_s * (state.s ?? 0)
    );
  }

  inEnvelope(
    state: HybridState,
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): boolean {
    const W = this.evaluateEnvelope(state, weightsOrCphi, maybeCr, maybeCs);
    return W <= this.contract.envelope.parameters.M;
  }

  facetScores(
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): FacetScore[] {
    const weights = this.resolveWeights(weightsOrCphi, maybeCr, maybeCs);

    return this.contract.facets.map((facet) => {
      const coefficients = OracleKernelCore.resolveFacetWeights(facet);
      return {
        id: facet.facet_id,
        value:
          facet.offset +
          coefficients.C_phi * weights.C_phi +
          coefficients.C_r * weights.C_r +
          coefficients.C_s * weights.C_s,
        label: facet.plane_equation,
        facet,
      };
    });
  }

  classifyPoint(
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): FacetClassification {
    const values = this.facetScores(weightsOrCphi, maybeCr, maybeCs);
    const winner = values.reduce((best, current) =>
      current.value > best.value ? current : best,
    );
    const peak = this.getPeakForFacet(winner.facet);

    this.activeFacet = winner.id;

    return {
      facet: winner.id,
      label: winner.label,
      value: round6(winner.value),
      peak,
    };
  }

  classifyPoint2D(C_phi: number, C_r: number) {
    return this.classifyPoint({ C_phi, C_r, C_s: 0 });
  }

  computeMmin(
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): number {
    return this.classifyPoint(weightsOrCphi, maybeCr, maybeCs).value;
  }

  computeMmin2D(C_phi: number, C_r: number) {
    return this.computeMmin({ C_phi, C_r, C_s: 0 });
  }

  supportGap(
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ) {
    const values = this.facetScores(weightsOrCphi, maybeCr, maybeCs)
      .map((entry) => ({ id: entry.id, value: round6(entry.value) }))
      .sort((left, right) => right.value - left.value);

    const current = values[0]?.value ?? 0;
    const next = values[1]?.value ?? current;

    return {
      current,
      next,
      gap: round6(current - next),
    };
  }

  supportGap2D(C_phi: number, C_r: number) {
    return this.supportGap({ C_phi, C_r, C_s: 0 });
  }

  getKink(C_phi: number, C_s = 0, edgeId?: string): KinkValue {
    const edge =
      (edgeId
        ? this.contract.adjacency.find((candidate) => candidate.edge_id === edgeId)
        : this.contract.adjacency[0]) ?? null;

    if (!edge) {
      return {
        edge_id: "none",
        value: Number.POSITIVE_INFINITY,
        slope: Number.POSITIVE_INFINITY,
        intercept: Number.POSITIVE_INFINITY,
        intercept_c_s: 0,
        formula: "No finite kink line",
        vertices: ["", ""],
        projected_at_c_s: C_s,
      };
    }

    const projectedLine = this.getProjectedLine(edge);
    if (!projectedLine) {
      return {
        edge_id: edge.edge_id,
        value: Number.POSITIVE_INFINITY,
        slope: Number.POSITIVE_INFINITY,
        intercept: Number.POSITIVE_INFINITY,
        intercept_c_s: Number.POSITIVE_INFINITY,
        formula: edge.tie_hyperplane?.equation ?? "No projected C_r line",
        vertices: edge.vertices,
        projected_at_c_s: C_s,
      };
    }

    return {
      edge_id: edge.edge_id,
      value: round6(
        projectedLine.intercept_constant +
          projectedLine.slope_on_c_phi * C_phi +
          projectedLine.intercept_c_s * C_s,
      ),
      slope: round6(projectedLine.slope_on_c_phi),
      intercept: round6(projectedLine.intercept_constant),
      intercept_c_s: round6(projectedLine.intercept_c_s),
      formula: projectedLine.formula,
      vertices: edge.vertices,
      projected_at_c_s: round6(C_s),
    };
  }

  getAllKinks(C_s = 0) {
    return this.contract.adjacency.map((edge) => this.getKink(0, C_s, edge.edge_id));
  }

  protected evaluatePhiAttractor(
    facet: FacetClassification,
    inside: boolean,
  ): KernelEvaluation["attractor"] {
    const law = this.getLaw("phi-A");
    const phiFacets = this.getPhiFacets();
    const isPhiFacet = phiFacets.includes(facet.facet);
    const inPhiAttractor = inside && isPhiFacet;
    const activeFacetLabel =
      this.contract.facets.find((candidate) => candidate.facet_id === facet.facet)?.label ??
      facet.facet;

    let reason = "Runtime projection: no phi-governed attractor metadata is present in the contract.";
    if (law && phiFacets.length > 0) {
      if (inPhiAttractor) {
        reason = `Runtime projection: ${activeFacetLabel} is phi-governed and the state is envelope-admissible, so it lies in G_phi.`;
      } else if (!isPhiFacet) {
        reason = `Runtime projection: ${activeFacetLabel} is not in the phi-governed facet family [${phiFacets.join(", ")}].`;
      } else {
        reason =
          "Runtime projection: the active facet is phi-governed, but the state is above the current support plane and therefore outside G_phi.";
      }
    }

    return {
      in_phi_attractor: inPhiAttractor,
      attractor_id: inPhiAttractor ? law?.attractor?.id ?? "G_phi" : undefined,
      phi_facets: phiFacets,
      law_status: {
        phiA: {
          satisfied: inPhiAttractor,
          symbolic: law?.symbolic ?? "≈↻ ∧ ¬(↺) ⇒ G_phi",
          formal:
            law?.formal ??
            "(∃ n ≥ 1: d(f^n(x), x) ≤ ε) ∧ ¬∃ f⁻¹ (state-preserving) ⇒ x_t → G_phi",
          runtime_projection: true,
          reason,
        },
      },
    };
  }

  evaluate(
    state: HybridState,
    weightsOrCphi?: WeightInput,
    maybeCr?: number,
    maybeCs?: number,
  ): KernelEvaluation {
    const weights = this.resolveWeights(weightsOrCphi, maybeCr, maybeCs);
    const W = this.evaluateEnvelope(state, weights);
    const facet = this.classifyPoint(weights);
    const gap = this.supportGap(weights);
    const kink = this.getKink(weights.C_phi, weights.C_s);
    const inside = W <= facet.value;
    const attractor = this.evaluatePhiAttractor(facet, inside);

    return {
      state,
      weights: {
        C_phi: round6(weights.C_phi),
        C_r: round6(weights.C_r),
        C_s: round6(weights.C_s),
      },
      envelope: {
        W: round6(W),
        M_min: round6(facet.value),
        inside,
        margin: round6(facet.value - W),
      },
      facet,
      gap,
      kink,
      attractor,
      timestamp: new Date().toISOString(),
    };
  }

  evaluate2D(state: HybridState, C_phi: number, C_r: number) {
    return this.evaluate(state, { C_phi, C_r, C_s: 0 });
  }
}
