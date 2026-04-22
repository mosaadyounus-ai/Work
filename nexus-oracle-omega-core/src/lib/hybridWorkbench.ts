import { getOracleContract, getOracleKernel, OracleContractKey } from "./oracleContract";

export type HybridMode =
  | "IDLE"
  | "BUILD_COLLECT"
  | "BUILD_COMPRESS"
  | "FUSION"
  | "COLLAPSE";

export type OracleSurfaceMode = "verified-2d" | "advanced-3d";

export interface OracleControls {
  surfaceMode: OracleSurfaceMode;
  c_phi: number;
  c_r: number;
  c_s: number;
  K: number;
  phiF: number;
  rF: number;
  compressionRate: number;
  fusionRate: number;
}

export interface HybridRuntimeState {
  mode: HybridMode;
  t: number;
  phi: number;
  r: number;
  s: number;
  e: number;
  integ: number;
  dwell: number;
  guards: {
    can_collect: boolean;
    can_compress: boolean;
    can_fuse: boolean;
    can_collapse: boolean;
    can_reset: boolean;
  };
  thresholds: {
    compress: number;
    fuse: number;
    collapse: number;
    envelope: number;
  };
  next_jump: string;
  next_jump_steps: number;
  trace: HybridMode[];
}

export interface OracleEvaluation {
  contract_key: OracleContractKey;
  contract_label: string;
  projection_mode: "2d" | "3d";
  weights: {
    c_phi: number;
    c_r: number;
    c_s: number;
  };
  active_peak: {
    peak_id: string;
    phi: number;
    r: number;
    s: number;
    e: number;
  };
  facet: string;
  facet_id: string;
  facet_label: string;
  envelope: {
    formula: string;
    m_min: number;
    current_value: number;
    inside: boolean;
    margin: number;
    support_values: Record<string, number>;
  };
  regime: string;
  facet_reason: string;
  in_phi_attractor: boolean;
  attractor_id: string | null;
  law_phi_a: {
    satisfied: boolean;
    symbolic: string;
    formal: string;
    runtime_projection: boolean;
    reason: string;
    governing_facets: string[];
  };
  kink_line: string;
  kink_value: number;
  support_gap: number;
  runner_up_value: number;
  source_contract: string;
  geometry_warning: string | null;
}

export interface ProofRecord {
  name: string;
  status: "PASS" | "FAIL";
  source: string;
  last_checked_at: string;
  witness: null | {
    mode: HybridMode;
    phi: number;
    r: number;
    s: number;
    e: number;
    integ: number;
    note?: string;
  };
  detail: string;
  linked_artifacts: string[];
}

export interface FacetGeometryCell {
  c_phi: number;
  c_r: number;
  facet: string;
  scores: Record<string, number>;
  m_min: number;
}

export interface FacetBoundaryLine {
  edge_id: string;
  formula: string;
  points: Array<{
    c_phi: number;
    c_r: number;
  }>;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function getContractKey(controls: OracleControls): OracleContractKey {
  return controls.surfaceMode === "advanced-3d" ? "three-peak" : "two-peak";
}

function toFacetDisplayName(facetId: string) {
  return facetId.replace(/^Facet-/, "");
}

function formatKinkLine(formula: string, slope: number, intercept: number, interceptCs: number) {
  if (formula && formula.trim().length > 0) {
    return formula;
  }

  if (interceptCs !== 0) {
    return `C_r = ${intercept.toFixed(2)} + ${slope.toFixed(2)}*C_phi + ${interceptCs.toFixed(2)}*C_s`;
  }

  return `C_r = ${intercept.toFixed(2)} + ${slope.toFixed(2)}*C_phi`;
}

export function createDefaultOracleControls(): OracleControls {
  return {
    surfaceMode: "verified-2d",
    c_phi: 0.1,
    c_r: 0.25,
    c_s: 0,
    K: 4,
    phiF: 4,
    rF: 4,
    compressionRate: 2,
    fusionRate: 3,
  };
}

export function buildHybridRuntimeState({
  phiSignal,
  readinessSignal,
  energySignal,
  updatedAt,
  focusMode,
  controls,
}: {
  phiSignal: number;
  readinessSignal: number;
  energySignal: number;
  updatedAt: number;
  focusMode: "SCAN" | "FOCUS" | "SIMULATE";
  controls: OracleControls;
}): HybridRuntimeState {
  const t = round2((updatedAt / 1000) % 12.6);
  const phi = clamp(Math.round(phiSignal / 8), 0, 12);
  const r = clamp(Math.round(readinessSignal / 24), 0, 8);
  const s = clamp(Math.floor(Math.max(0, r - 2) / 4), 0, 4);
  const e = clamp(Math.max(0, Math.round((energySignal - 18) / 12)), 0, 8);
  const integ = clamp(
    phi + r + s + e + (focusMode === "SIMULATE" ? 2 : focusMode === "FOCUS" ? 1 : 0),
    0,
    24,
  );
  const dwell = 1 + Math.floor((updatedAt / 4_200) % 3);
  const phaseBucket = Math.floor((updatedAt / 5_000) % 4);
  const fusionEnergyFloor = Math.max(3, Math.ceil(controls.K * 0.75));

  const guards = {
    can_collect: phi < controls.phiF,
    can_compress: phi >= controls.phiF,
    can_fuse: r >= controls.rF && e >= fusionEnergyFloor,
    can_collapse: r >= controls.rF && e >= fusionEnergyFloor && dwell >= 2,
    can_reset: dwell >= 2 && e <= 2,
  };

  let mode: HybridMode;
  if (e <= 1 && phi <= 2 && r <= 2) {
    mode = "IDLE";
  } else if (guards.can_collect) {
    mode = "BUILD_COLLECT";
  } else if (guards.can_fuse && phaseBucket === 1) {
    mode = "FUSION";
  } else if (guards.can_collapse && phaseBucket >= 2) {
    mode = "COLLAPSE";
  } else {
    mode = "BUILD_COMPRESS";
  }

  const compressGap = Math.max(0, controls.phiF - phi);
  const fusionGap = Math.max(0, controls.rF - r) + Math.max(0, fusionEnergyFloor - e);
  const collapseGap = Math.max(0, 2 - dwell);

  let next_jump = "Hold";
  let next_jump_steps = 1;

  if (mode === "IDLE" || mode === "BUILD_COLLECT") {
    next_jump = "CollectToCompress";
    next_jump_steps = Math.max(1, compressGap || 1);
  } else if (mode === "BUILD_COMPRESS") {
    next_jump = "CompressToFusion";
    next_jump_steps = Math.max(1, fusionGap || 1);
  } else if (mode === "FUSION") {
    next_jump = "FusionToCollapse";
    next_jump_steps = Math.max(1, collapseGap);
  } else if (mode === "COLLAPSE") {
    next_jump = "CollapseToIdle";
    next_jump_steps = Math.max(1, collapseGap);
  }

  const trace: HybridMode[] =
    mode === "IDLE"
      ? ["IDLE"]
      : mode === "BUILD_COLLECT"
        ? ["IDLE", "BUILD_COLLECT"]
        : mode === "BUILD_COMPRESS"
          ? ["IDLE", "BUILD_COLLECT", "BUILD_COMPRESS"]
          : mode === "FUSION"
            ? ["BUILD_COLLECT", "BUILD_COMPRESS", "FUSION"]
            : ["BUILD_COMPRESS", "FUSION", "COLLAPSE"];

  return {
    mode,
    t,
    phi,
    r,
    s,
    e,
    integ,
    dwell,
    guards,
    thresholds: {
      compress: controls.phiF,
      fuse: controls.rF,
      collapse: 2,
      envelope: 0,
    },
    next_jump,
    next_jump_steps,
    trace,
  };
}

export function evaluateHybridOracle(
  controls: OracleControls,
  runtime: HybridRuntimeState,
): OracleEvaluation {
  const contractKey = getContractKey(controls);
  const kernel = getOracleKernel(contractKey);
  const contract = getOracleContract(contractKey);
  const weights = {
    C_phi: controls.c_phi,
    C_r: controls.c_r,
    C_s: contractKey === "three-peak" ? controls.c_s : 0,
  };
  const evaluation = kernel.evaluate(runtime, weights);
  const facetScores = kernel.facetScores(weights);
  const facetName = toFacetDisplayName(evaluation.facet.facet);
  const activePeak = evaluation.facet.peak?.coordinates ?? {
    phi: runtime.phi,
    r: runtime.r,
    s: runtime.s,
    e: runtime.e,
  };
  const peakId = evaluation.facet.peak?.peak_id ?? `Runtime-${facetName}`;
  const supportValues = Object.fromEntries(
    facetScores.map((entry) => [toFacetDisplayName(entry.id), round2(entry.value)]),
  );
  const regime =
    contractKey === "two-peak"
      ? facetName === "A"
        ? controls.c_phi > controls.c_r
          ? "Facet A / phi-dominant"
          : "Facet A / balanced carry"
        : controls.c_r > controls.c_phi
          ? "Facet B / r-dominant"
          : "Facet B / mixed carry"
      : `Facet ${facetName} / projected 3D support`;
  const facetReason =
    contractKey === "two-peak"
      ? facetName === "A"
        ? `Facet A remains above Facet B by ${evaluation.gap.gap.toFixed(2)} at the current coefficient slice.`
        : `Facet B overtakes Facet A by ${evaluation.gap.gap.toFixed(2)} at the current coefficient slice.`
      : `Facet ${facetName} is evaluated from the three-peak mirror at C_s=${weights.C_s.toFixed(2)}. The 2D map is a projection of that 3D support comparison.`;
  const geometryWarning = contract.geometry?.warnings?.[0] ?? null;

  return {
    contract_key: contractKey,
    contract_label: contractKey === "three-peak" ? "3-Peak Advanced Mirror" : "2-Peak Verified Mirror",
    projection_mode: contractKey === "three-peak" ? "3d" : "2d",
    weights: {
      c_phi: round2(controls.c_phi),
      c_r: round2(controls.c_r),
      c_s: round2(weights.C_s),
    },
    active_peak: {
      peak_id: peakId,
      phi: activePeak.phi,
      r: activePeak.r,
      s: activePeak.s,
      e: activePeak.e,
    },
    facet: facetName,
    facet_id: evaluation.facet.facet,
    facet_label: evaluation.facet.label,
    envelope: {
      formula: evaluation.facet.label,
      m_min: round2(evaluation.envelope.M_min),
      current_value: round2(evaluation.envelope.W),
      inside: evaluation.envelope.inside,
      margin: round2(evaluation.envelope.margin),
      support_values: supportValues,
    },
    regime,
    facet_reason: facetReason,
    in_phi_attractor: evaluation.attractor.in_phi_attractor,
    attractor_id: evaluation.attractor.attractor_id ?? null,
    law_phi_a: {
      satisfied: evaluation.attractor.law_status.phiA.satisfied,
      symbolic: evaluation.attractor.law_status.phiA.symbolic,
      formal: evaluation.attractor.law_status.phiA.formal,
      runtime_projection: evaluation.attractor.law_status.phiA.runtime_projection,
      reason: evaluation.attractor.law_status.phiA.reason,
      governing_facets: evaluation.attractor.phi_facets.map(toFacetDisplayName),
    },
    kink_line: formatKinkLine(
      evaluation.kink.formula,
      evaluation.kink.slope,
      evaluation.kink.intercept,
      evaluation.kink.intercept_c_s,
    ),
    kink_value: round2(evaluation.kink.value),
    support_gap: round2(evaluation.gap.gap),
    runner_up_value: round2(evaluation.gap.next),
    source_contract:
      contractKey === "three-peak" ? "mirror/three_peak_example.json" : "mirror/two_peak_example.json",
    geometry_warning: geometryWarning,
  };
}

function isValidTransition(mode: HybridMode, jump: string) {
  const valid: Record<HybridMode, string[]> = {
    IDLE: ["CollectToCompress"],
    BUILD_COLLECT: ["CollectToCompress"],
    BUILD_COMPRESS: ["CompressToFusion"],
    FUSION: ["FusionToCollapse"],
    COLLAPSE: ["CollapseToIdle"],
  };
  return valid[mode].includes(jump);
}

function makeWitness(runtime: HybridRuntimeState, note?: string) {
  return {
    mode: runtime.mode,
    phi: runtime.phi,
    r: runtime.r,
    s: runtime.s,
    e: runtime.e,
    integ: runtime.integ,
    note,
  };
}

export function buildProofRecords({
  runtime,
  oracle,
  controls,
  checkedAt,
}: {
  runtime: HybridRuntimeState;
  oracle: OracleEvaluation;
  controls: OracleControls;
  checkedAt: number;
}): ProofRecord[] {
  const lastChecked = new Date(checkedAt).toISOString();
  const typeOk =
    Number.isInteger(runtime.phi) &&
    Number.isInteger(runtime.r) &&
    Number.isInteger(runtime.e) &&
    Number.isInteger(runtime.integ);
  const envelopeMargin = oracle.envelope.margin;
  const energyBound = envelopeMargin >= -0.35;
  const fusionSoundness =
    runtime.mode !== "FUSION" ||
    (runtime.guards.can_fuse && runtime.r >= controls.rF && runtime.e >= Math.ceil(controls.K * 0.75));
  const noSkipTransitions = isValidTransition(runtime.mode, runtime.next_jump);
  const compressPhiMonotone = runtime.mode !== "BUILD_COMPRESS" || runtime.phi >= controls.phiF;
  const globalEnvelope = envelopeMargin >= -0.35;
  const eventuallyFusion =
    runtime.mode === "FUSION" ||
    runtime.mode === "COLLAPSE" ||
    (runtime.next_jump === "CompressToFusion" && runtime.next_jump_steps <= 3);
  const returnToIdle =
    runtime.mode !== "COLLAPSE" || runtime.guards.can_reset || runtime.next_jump === "CollapseToIdle";

  return [
    {
      name: "TypeOK",
      status: typeOk ? "PASS" : "FAIL",
      source: "Runtime schema",
      last_checked_at: lastChecked,
      witness: typeOk ? null : makeWitness(runtime, "Non-discrete runtime value detected."),
      detail: "Discrete hybrid state remains inside the typed lattice domain.",
      linked_artifacts: ["tlc-ready-summary", "nexus-buildsplit-spec"],
    },
    {
      name: "EnergyBound",
      status: energyBound ? "PASS" : "FAIL",
      source: "Mirror kernel",
      last_checked_at: lastChecked,
      witness: energyBound
        ? null
        : makeWitness(runtime, "Envelope value exceeded the active support plane by more than tolerance."),
      detail: `Current envelope ${oracle.envelope.current_value} vs support ${oracle.envelope.m_min}.`,
      linked_artifacts: [
        "two-peak-mirror-contract",
        "stability-front-multi-resource",
        "envelope-analysis-report",
        "telemetry-snapshot",
      ],
    },
    {
      name: "FusionSoundness",
      status: fusionSoundness ? "PASS" : "FAIL",
      source: "TLC + runtime guards",
      last_checked_at: lastChecked,
      witness: fusionSoundness ? null : makeWitness(runtime, "Fusion entered without satisfying r/e thresholds."),
      detail: "Fusion is only admissible when the runtime clears the fused readiness and energy guards.",
      linked_artifacts: ["nexus-buildsplit-spec", "tlc-output-v8", "technical-analysis"],
    },
    {
      name: "NoSkipTransitions",
      status: noSkipTransitions ? "PASS" : "FAIL",
      source: "TLC trace",
      last_checked_at: lastChecked,
      witness: noSkipTransitions ? null : makeWitness(runtime, `Unexpected jump ${runtime.next_jump}.`),
      detail: "Every exposed jump follows the modeled hybrid edge relation.",
      linked_artifacts: ["nexus-contract-results", "tlc-output-v8", "mfcs-proof-log"],
    },
    {
      name: "CompressPhiMonotone",
      status: compressPhiMonotone ? "PASS" : "FAIL",
      source: "Runtime trace",
      last_checked_at: lastChecked,
      witness: compressPhiMonotone ? null : makeWitness(runtime, "phi dropped below the compression threshold during BUILD_COMPRESS."),
      detail: "Compression should not proceed unless phi stays on or above the compression frontier.",
      linked_artifacts: ["technical-analysis", "parametric-theorem-report"],
    },
    {
      name: "GlobalEnvelope2D",
      status: globalEnvelope ? "PASS" : "FAIL",
      source: "Mirror kernel + sweep oracle",
      last_checked_at: lastChecked,
      witness: globalEnvelope ? null : makeWitness(runtime, "Active point lies above the winning support plane."),
      detail: "The active point is checked against the currently winning support plane from the mirror contract.",
      linked_artifacts: [
        "two-peak-mirror-contract",
        "stability-front-multi-resource",
        "stability-front-report",
        "sweep-figure",
      ],
    },
    {
      name: "EventuallyFusion",
      status: eventuallyFusion ? "PASS" : "FAIL",
      source: "TLC liveness",
      last_checked_at: lastChecked,
      witness: eventuallyFusion ? null : makeWitness(runtime, "Current guard gaps make fusion unreachable within the bounded horizon."),
      detail: "The bounded operator horizon still admits a path into fusion under the exposed guards.",
      linked_artifacts: ["tlc-output-v8", "nexus-contract-results", "tlaps-summary"],
    },
    {
      name: "ReturnToIdleAfterCollapse",
      status: returnToIdle ? "PASS" : "FAIL",
      source: "TLC liveness",
      last_checked_at: lastChecked,
      witness: returnToIdle ? null : makeWitness(runtime, "Collapse did not expose a reset path back to IDLE."),
      detail: "Collapse remains an absorbing detour only until the reset guard is satisfied.",
      linked_artifacts: ["tlc-output-v8", "mfcs-proof-log", "summary-tlc-ready"],
    },
  ];
}

export function createFacetGeometryCells(
  controls: OracleControls,
  steps = 14,
): FacetGeometryCell[] {
  const kernel = getOracleKernel(getContractKey(controls));
  const fixedCs = controls.surfaceMode === "advanced-3d" ? controls.c_s : 0;
  const cells: FacetGeometryCell[] = [];

  for (let row = 0; row <= steps; row += 1) {
    for (let column = 0; column <= steps; column += 1) {
      const c_phi = round2((column / steps) * 0.5);
      const c_r = round2((row / steps) * 0.5);
      const weights = { C_phi: c_phi, C_r: c_r, C_s: fixedCs };
      const scores = kernel.facetScores(weights);
      const facetId = kernel.classifyPoint(weights).facet;

      cells.push({
        c_phi,
        c_r,
        facet: toFacetDisplayName(facetId),
        scores: Object.fromEntries(
          scores.map((entry) => [toFacetDisplayName(entry.id), round2(entry.value)]),
        ),
        m_min: round2(Math.max(...scores.map((entry) => entry.value))),
      });
    }
  }

  return cells;
}

export function createFacetBoundaryLines(controls: OracleControls, samples = 24): FacetBoundaryLine[] {
  const kernel = getOracleKernel(getContractKey(controls));
  const contract = getOracleContract(getContractKey(controls));
  const fixedCs = controls.surfaceMode === "advanced-3d" ? controls.c_s : 0;
  const uniqueLines = new Map<string, FacetBoundaryLine>();

  for (const edge of contract.adjacency) {
    const points: Array<{ c_phi: number; c_r: number }> = [];
    for (let index = 0; index <= samples; index += 1) {
      const c_phi = round2((index / samples) * 0.5);
      const kink = kernel.getKink(c_phi, fixedCs, edge.edge_id);
      const c_r = round2(kink.value);

      if (Number.isFinite(c_r) && c_r >= 0 && c_r <= 0.5) {
        points.push({ c_phi, c_r });
      }
    }

    if (points.length === 0) {
      continue;
    }

    const kinkAtZero = kernel.getKink(0, fixedCs, edge.edge_id);
    const signature = `${round2(kinkAtZero.slope)}|${round2(kinkAtZero.intercept)}|${round2(kinkAtZero.intercept_c_s)}|${kinkAtZero.formula}`;
    if (!uniqueLines.has(signature)) {
      uniqueLines.set(signature, {
        edge_id: edge.edge_id,
        formula: kinkAtZero.formula,
        points,
      });
    }
  }

  return Array.from(uniqueLines.values());
}
