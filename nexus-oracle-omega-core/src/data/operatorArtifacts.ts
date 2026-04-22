import type { HybridMode } from "../lib/hybridWorkbench";

export type ArtifactType =
  | "report"
  | "trace"
  | "proof"
  | "model"
  | "image"
  | "data"
  | "deck"
  | "note";

export interface OperatorArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  origin: string;
  summary: string;
  associatedModes: HybridMode[];
  associatedInvariants: string[];
  associatedFacets: string[];
  run: string | null;
  tags: string[];
}

export const operatorArtifacts: OperatorArtifact[] = [
  {
    id: "two-peak-mirror-contract",
    title: "Two-Peak Mirror Contract",
    type: "model",
    origin: "mirror/two_peak_example.json",
    summary:
      "Typed mirror artifact carrying the verified peaks, support planes, and the corrected kink line C_r = (1 + C_phi) / 4.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["A", "B"],
    run: "milestone-1-mirror",
    tags: ["mirror", "contract", "kink", "typed-envelope"],
  },
  {
    id: "envelope-laws-doc",
    title: "Envelope Laws",
    type: "note",
    origin: "docs/envelope-laws.md",
    summary:
      "Documents Law phi-A, the G_phi attractor, and the runtime projection that now appears in the Oracle output.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["A", "P1"],
    run: "law-phi-a",
    tags: ["law", "phi-A", "attractor", "documentation"],
  },
  {
    id: "three-peak-mirror-contract",
    title: "Three-Peak Mirror Contract",
    type: "model",
    origin: "mirror/three_peak_example.json",
    summary:
      "Advanced mirror artifact carrying the degenerate three-peak support family, projected boundary formula, and explicit collinearity warning.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["P1", "P2", "P3"],
    run: "milestone-2-advanced-mirror",
    tags: ["mirror", "3d", "degenerate", "projection"],
  },
  {
    id: "facet-report-v3",
    title: "Facet Report v0.3.0",
    type: "model",
    origin: "facet_report_v3.json",
    summary:
      "Reconstructed three-peak facet report showing affine rank 1, three pairwise boundaries, and P2 as a redundant witness on the degenerate line.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["P1", "P2", "P3"],
    run: "facet-reconstruction-v3",
    tags: ["facet-report", "3-peak", "degenerate"],
  },
  {
    id: "polyhedron-v3",
    title: "Polyhedron Export v0.3.0",
    type: "model",
    origin: "polyhedron_v3.json",
    summary:
      "Polyhedron-style export that preserves all three vertices while flagging the geometry as a line segment with an intermediate witness vertex.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["P1", "P2", "P3"],
    run: "polyhedron-v3",
    tags: ["polyhedron", "export", "degenerate"],
  },
  {
    id: "stability-front-multi-resource",
    title: "Multi-Resource Stability Front",
    type: "report",
    origin: "Stability_Front_Analysis_(Multi-Resource_Model).docx",
    summary:
      "Extends the envelope into the two-weight plane e + C_phi*phi + C_r*r <= M and motivates the active facet surface used by the Oracle tab.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["GlobalEnvelope2D", "EnergyBound"],
    associatedFacets: ["A", "B"],
    run: "sweep-oracle",
    tags: ["envelope", "multi-resource", "facet", "oracle"],
  },
  {
    id: "stability-front-report",
    title: "Linear Stability Front",
    type: "report",
    origin: "Stability_Front_Analysis.docx",
    summary:
      "Documents the baseline linear sweep M_min = 5C + 5 and anchors the simplified scalar front behind the workbench geometry.",
    associatedModes: ["BUILD_COLLECT", "BUILD_COMPRESS"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["A"],
    run: "scalar-front",
    tags: ["stability", "front", "baseline"],
  },
  {
    id: "envelope-analysis-report",
    title: "Envelope Analysis Report",
    type: "report",
    origin: "Envelope_Analysis_Report.docx",
    summary:
      "Connects the conserved envelope law to operational thresholds and gives the report basis for the active support gap shown in the Oracle output.",
    associatedModes: ["BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["A", "B"],
    run: "envelope-study",
    tags: ["envelope", "analysis", "thresholds"],
  },
  {
    id: "parametric-theorem-report",
    title: "Parametric Theorem Verification",
    type: "proof",
    origin: "Parametric_Theorem_Verification_Report.docx",
    summary:
      "Summarizes parameter-sensitive safety results and informs the proof cards that depend on threshold changes rather than one fixed model.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["CompressPhiMonotone", "FusionSoundness"],
    associatedFacets: ["A", "B"],
    run: "parametric-proof",
    tags: ["theorem", "parameter", "proof"],
  },
  {
    id: "summary-tlc-ready",
    title: "TLC-Ready Revision Summary",
    type: "note",
    origin: "Summary_of_Changes_to_(TLC-Ready_Version).docx",
    summary:
      "Explains the integerized model that makes the hybrid contract finite enough for exhaustive TLC runs and discrete proof cards.",
    associatedModes: ["BUILD_COLLECT", "BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: ["TypeOK", "NoSkipTransitions"],
    associatedFacets: ["A", "B"],
    run: "tlc-ready",
    tags: ["TLC", "integerized", "contract"],
  },
  {
    id: "technical-analysis",
    title: "Hybrid BUILD Split Analysis",
    type: "report",
    origin: "Technical_Analysis.docx",
    summary:
      "Explains the BUILD_COLLECT -> BUILD_COMPRESS split and the thresholded path into fusion that now appears as the runtime next-jump logic.",
    associatedModes: ["BUILD_COLLECT", "BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["CompressPhiMonotone", "FusionSoundness", "NoSkipTransitions"],
    associatedFacets: ["A"],
    run: "buildsplit-analysis",
    tags: ["buildsplit", "hybrid", "thresholds"],
  },
  {
    id: "nexus-buildsplit-spec",
    title: "NexusHybrid BUILD Split Spec",
    type: "model",
    origin: "NexusHybrid_BuildSplit.tla",
    summary:
      "Primary hybrid-state machine with the BUILD split and discrete jumps that back the Runtime and Proof tabs.",
    associatedModes: ["IDLE", "BUILD_COLLECT", "BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: ["TypeOK", "FusionSoundness", "NoSkipTransitions"],
    associatedFacets: ["A", "B"],
    run: "buildsplit-v8",
    tags: ["TLA+", "runtime", "hybrid-contract"],
  },
  {
    id: "nexus-contract-results",
    title: "Canonical NexusHybrid TLC Results",
    type: "trace",
    origin: "NexusHybrid Canonical Contract_ TLC Model Check Results.md",
    summary:
      "Canonical contract result note showing the stabilized state count and the final green verification posture.",
    associatedModes: ["FUSION", "COLLAPSE", "IDLE"],
    associatedInvariants: ["NoSkipTransitions", "EventuallyFusion", "ReturnToIdleAfterCollapse"],
    associatedFacets: ["A", "B"],
    run: "canonical-contract",
    tags: ["TLC", "contract", "results"],
  },
  {
    id: "tlc-output-v8",
    title: "TLC Output v8",
    type: "trace",
    origin: "tlc_output_v8.txt",
    summary:
      "Final BUILD split trace with the last green run; used as the main source for liveness and no-skip checks.",
    associatedModes: ["BUILD_COMPRESS", "FUSION", "COLLAPSE", "IDLE"],
    associatedInvariants: ["FusionSoundness", "EventuallyFusion", "ReturnToIdleAfterCollapse", "NoSkipTransitions"],
    associatedFacets: ["A", "B"],
    run: "v8",
    tags: ["TLC", "trace", "green-run"],
  },
  {
    id: "mfcs-proof-log",
    title: "MFCS Proof and TLC Log",
    type: "proof",
    origin: "MFCS.tla.out.txt / TLAPS-summary.txt",
    summary:
      "Combines the exhaustive MFCS model check output with the TLAPS proof summary to anchor the stronger trust claims in the Proof tab.",
    associatedModes: ["IDLE", "BUILD_COLLECT", "BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: ["TypeOK", "EventuallyFusion", "ReturnToIdleAfterCollapse"],
    associatedFacets: ["A", "B"],
    run: "mfcs-mainline",
    tags: ["MFCS", "TLAPS", "TLC", "proof-stack"],
  },
  {
    id: "tlaps-summary",
    title: "TLAPS Summary",
    type: "proof",
    origin: "TLAPS-summary.txt",
    summary:
      "Mechanized proof summary covering discharged obligations that support the proof-layer confidence model.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["TypeOK", "EventuallyFusion"],
    associatedFacets: ["A", "B"],
    run: "tlaps-selectproof",
    tags: ["TLAPS", "mechanized", "invariants"],
  },
  {
    id: "telemetry-snapshot",
    title: "Telemetry Snapshot",
    type: "data",
    origin: "telemetry-snapshot-20260417.csv",
    summary:
      "Operational telemetry capture used to seed the public runtime rail and relate proof claims back to observed state.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound"],
    associatedFacets: ["A", "B"],
    run: "telemetry-20260417",
    tags: ["telemetry", "csv", "runtime"],
  },
  {
    id: "telemetry-card",
    title: "Telemetry Card",
    type: "note",
    origin: "telemetry-card-20260417.txt",
    summary:
      "Compact operational brief associated with the telemetry capture; useful when correlating runtime values with artifact context.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound", "GlobalEnvelope2D"],
    associatedFacets: ["A", "B"],
    run: "telemetry-20260417",
    tags: ["telemetry", "briefing"],
  },
  {
    id: "mystic-map-registry",
    title: "Mystic Map Registry",
    type: "data",
    origin: "node_map.json / README.txt",
    summary:
      "Canonical 67-node registry that powers the Lattice tab and links facets to symbolic topology.",
    associatedModes: ["IDLE", "BUILD_COLLECT", "BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: ["NoSkipTransitions"],
    associatedFacets: ["A", "B"],
    run: null,
    tags: ["lattice", "registry", "graph"],
  },
  {
    id: "guardian-state-tables",
    title: "Guardian State Tables",
    type: "report",
    origin: "Appendix C - Guardian State Tables.docx",
    summary:
      "Maps guardian domains to state behavior and helps interpret the Lattice route as an operational adjacency view rather than ornament.",
    associatedModes: ["BUILD_COLLECT", "BUILD_COMPRESS", "FUSION"],
    associatedInvariants: [],
    associatedFacets: ["A", "B"],
    run: null,
    tags: ["guardians", "state", "lattice"],
  },
  {
    id: "ninety-six-path-model",
    title: "96-Path Mathematical Model",
    type: "report",
    origin: "Appendix B - The 96-Path Mathematical Model.docx",
    summary:
      "Background codex mathematics that informs the lattice partitioning and symbolic navigation layer.",
    associatedModes: ["IDLE", "BUILD_COLLECT", "BUILD_COMPRESS", "FUSION", "COLLAPSE"],
    associatedInvariants: [],
    associatedFacets: ["A", "B"],
    run: null,
    tags: ["96-path", "codex", "math"],
  },
  {
    id: "sweep-figure",
    title: "Envelope Stability Front Figure",
    type: "image",
    origin: "QaKzjFZCDBvsgRy6QA53yA...stability_front.webp",
    summary:
      "Visual figure for the scalar stability front; now represented as a live geometry panel with an active-point overlay.",
    associatedModes: ["BUILD_COMPRESS"],
    associatedInvariants: ["GlobalEnvelope2D", "EnergyBound"],
    associatedFacets: ["A", "B"],
    run: "scalar-front",
    tags: ["figure", "front", "image"],
  },
  {
    id: "mfcs-architecture-figure",
    title: "MFCS Lattice Architecture Figure",
    type: "image",
    origin: "Copilot_20260418_233630.png",
    summary:
      "Station-to-engine architecture figure used as conceptual scaffolding for the current operator surface.",
    associatedModes: ["BUILD_COLLECT", "BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["NoSkipTransitions"],
    associatedFacets: ["A", "B"],
    run: null,
    tags: ["architecture", "MFCS", "image"],
  },
  {
    id: "metrics-dashboard",
    title: "MFCS Metrics Dashboard",
    type: "data",
    origin: "MFCS Metrics Dashboard v2.0.xlsx",
    summary:
      "Dashboard workbook backing the metrics framing and readiness/vitality instrumentation carried into the runtime rail.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: ["EnergyBound"],
    associatedFacets: ["A", "B"],
    run: "metrics-v2",
    tags: ["dashboard", "xlsx", "metrics"],
  },
  {
    id: "integration-blueprint",
    title: "MFCS Integration Blueprint",
    type: "deck",
    origin: "Meta AI · xAI · Google AI — MFCS Integration Blueprint.pptx",
    summary:
      "Integration blueprint explaining how verification-aware orchestration can frame the broader product direction.",
    associatedModes: ["BUILD_COMPRESS", "FUSION"],
    associatedInvariants: [],
    associatedFacets: ["A", "B"],
    run: null,
    tags: ["integration", "deck", "strategy"],
  },
];
