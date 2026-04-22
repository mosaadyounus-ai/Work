import mysticMapSource from "./mystic-map.json";

export type GuardianName =
  | "Ouroboros"
  | "Phoenix"
  | "Dragon"
  | "Lion"
  | "Raven"
  | "Butterfly";

export interface MysticNode {
  id: number;
  node_id: string;
  x: number;
  y: number;
  label: string;
  number: number;
  weight: number;
  guardian: GuardianName;
  triad: string;
  hexagram: string;
  type: "central" | "cluster" | "generic";
  transitions: number[];
  entry_conditions: string[];
  exit_conditions: string[];
  liveness_target: string;
  notes: string;
}

export interface MysticTransition {
  id: number;
  from: string;
  to: string;
  weight: number;
  condition: string;
  bidirectional: boolean;
}

export interface MysticMapData {
  project: string;
  version: string;
  node_count: number;
  transition_count: number;
  nodes: MysticNode[];
  transitions: MysticTransition[];
}

export interface ArtifactGroup {
  title: string;
  count: number;
  summary: string;
  highlights: string[];
}

export interface VerificationStep {
  version: string;
  status: "issue" | "warning" | "success";
  headline: string;
  statesGenerated?: number;
  distinctStates?: number;
  depth?: number;
}

export const guardianPalette: Record<GuardianName, string> = {
  Ouroboros: "#d4af37",
  Phoenix: "#ff6b6b",
  Dragon: "#6bcb77",
  Lion: "#ffd166",
  Raven: "#60a5fa",
  Butterfly: "#a855f7",
};

export const mysticMapData = mysticMapSource as MysticMapData;

const guardianCounts = mysticMapData.nodes.reduce<Record<GuardianName, number>>(
  (counts, node) => {
    counts[node.guardian] += 1;
    return counts;
  },
  {
    Ouroboros: 0,
    Phoenix: 0,
    Dragon: 0,
    Lion: 0,
    Raven: 0,
    Butterfly: 0,
  },
);

const transitionConditionCounts = mysticMapData.transitions.reduce<Record<string, number>>(
  (counts, transition) => {
    counts[transition.condition] = (counts[transition.condition] ?? 0) + 1;
    return counts;
  },
  {},
);

export const omegaDossier = {
  title: "Nexus Oracle / Omega Core",
  subtitle:
    "A formally verified decision surface that fuses MFCS, the NexusHybrid contract, the 67-node Mystic Map, and a curated artifact vault into one operator experience.",
  narrative:
    "Omega Core now acts like a living briefing room instead of a themed shell. The app combines the existing console runtime with the surrounding reports, TLC/TLAPS traces, lattice documents, telemetry snapshots, images, and design studies so the system story, the proof story, and the symbolic map all live in one place.",
  headlineMetrics: [
    {
      label: "Artifact Corpus",
      value: "74",
      note: "31 text logs, 15 reports, 9 PDFs, 8 data files, 2 decks",
    },
    {
      label: "Mystic Map",
      value: `${mysticMapData.node_count} / ${mysticMapData.transition_count}`,
      note: "Nodes / transitions in the canonical lattice graph",
    },
    {
      label: "MFCS TLC",
      value: "4,396",
      note: "Distinct states explored with all four invariants passing",
    },
    {
      label: "TLAPS",
      value: "25 / 25",
      note: "SelectProof obligations discharged in the mechanized proof summary",
    },
  ],
  liveSnapshot: {
    resonanceHz: 0.381966,
    cyclePeriodSeconds: 2.618,
    driftPpm: 0.0042,
    noiseFloorDbfs: -96.3,
    thresholdDbfs: -90,
    activePaths: 4,
    cyclesDone: 33042,
    uptimeHours: 24.03,
    score: 1.0,
    sabrState: "BREATHING",
  },
  stabilityFront: [
    { coefficient: 1, bound: 10 },
    { coefficient: 2, bound: 15 },
    { coefficient: 3, bound: 20 },
  ],
  verificationTimeline: [
    {
      version: "v2",
      status: "issue" as const,
      headline:
        "EventuallyCompress, EventuallyFusion, and EventuallyCollapse were violated.",
      statesGenerated: 225,
      distinctStates: 170,
      depth: 18,
    },
    {
      version: "v3",
      status: "issue" as const,
      headline:
        "The initial build split still failed the same temporal properties.",
      statesGenerated: 225,
      distinctStates: 170,
      depth: 18,
    },
    {
      version: "v4",
      status: "issue" as const,
      headline:
        "Structural tweaks did not clear the liveness failure yet.",
      statesGenerated: 225,
      distinctStates: 170,
      depth: 18,
    },
    {
      version: "v5",
      status: "issue" as const,
      headline:
        "The spec introduced multiple `[][Next]_v` conjuncts and TLC rejected the structure.",
    },
    {
      version: "v6",
      status: "issue" as const,
      headline:
        "CollapseFlow left `e`, `integ`, and `phi` unspecified in successor states.",
      statesGenerated: 16,
      distinctStates: 15,
      depth: 14,
    },
    {
      version: "v7",
      status: "warning" as const,
      headline: "Only EventuallyCollapse remained violated after the repair pass.",
      statesGenerated: 26,
      distinctStates: 23,
      depth: 18,
    },
    {
      version: "v8",
      status: "success" as const,
      headline: "No error has been found. The BUILD split contract closed green.",
      statesGenerated: 26,
      distinctStates: 23,
      depth: 18,
    },
  ] satisfies VerificationStep[],
  formalLayers: [
    {
      title: "MFCS lattice proof stack",
      summary:
        "TLC explored 14,827 states with 4,396 distinct states and found no invariant or liveness failures in the representative three-component model.",
      source: "MFCS.tla.out.txt / verification_layers.md.txt",
    },
    {
      title: "SelectProof mechanization",
      summary:
        "The TLAPS summary discharges all 25 obligations across ZERO_BLEED, NOISE_FLOOR, PHASE_CANCELLATION, and combined safety.",
      source: "TLAPS-summary.txt",
    },
    {
      title: "Hybrid contract stabilization",
      summary:
        "The canonical NexusHybrid contract settled at 38 distinct states with depth 13 and no errors once the terminal absorbing state was modeled explicitly.",
      source: "NexusHybrid Canonical Contract_ TLC Model Check Results.md",
    },
  ],
  guardianSummaries: (Object.entries(guardianCounts) as [GuardianName, number][])
    .map(([guardian, count]) => ({
      guardian,
      count,
      color: guardianPalette[guardian],
      share: Math.round((count / mysticMapData.node_count) * 100),
    }))
    .sort((left, right) => right.count - left.count),
  transitionConditionSummaries: Object.entries(transitionConditionCounts)
    .map(([condition, count]) => ({ condition, count }))
    .sort((left, right) => right.count - left.count),
  artifactGroups: [
    {
      title: "Formal Verification",
      count: 18,
      summary:
        "TLA+ modules, TLC runs, TLAPS logs, contracts, theorem reports, and envelope analyses.",
      highlights: [
        "NexusHybrid_BuildSplit.tla",
        "NexusHybrid.tla",
        "MFCS.tla.txt",
        "TLAPS-summary.txt",
        "MFCS.tla.out.txt",
        "Parametric_Theorem_Verification_Report.docx",
      ],
    },
    {
      title: "Codex and Lattice Research",
      count: 17,
      summary:
        "The 96-path model, guardian tables, angular maps, codex references, and symbolic guides.",
      highlights: [
        "Full 96-Path Index.docx",
        "Appendix B - The 96-Path Mathematical Model.docx",
        "Appendix C - Guardian State Tables.docx",
        "Lattice Angular Map.docx",
        "The Five Guardians - Sovereign Lattice Codex.docx",
        "Dual-Mode Reference Card - Codex x MFCS.docx",
      ],
    },
    {
      title: "Visual Systems",
      count: 13,
      summary:
        "Architecture posters, crest explorations, rendered map variants, and stability / breath figures.",
      highlights: [
        "stability-front.webp",
        "lattice-architecture.png",
        "golden-breath.png",
        "polarity-balanced.png",
        "guardian-marks.png",
        "mystic-map-night.png",
      ],
    },
    {
      title: "Operational Data and Decks",
      count: 12,
      summary:
        "Telemetry snapshots, Excel registries, slide decks, manifests, and integration packaging.",
      highlights: [
        "telemetry-snapshot-20260417.csv",
        "telemetry-card-20260417.txt",
        "MFCS Metrics Dashboard v2.0.xlsx",
        "Codex 96-Path Mathematical Model - Data Tables.xlsx",
        "MFCS - Meridian Formal Control Surface for Microsoft.pptx",
        "Meta AI / xAI / Google AI - MFCS Integration Blueprint.pptx",
      ],
    },
  ] satisfies ArtifactGroup[],
  dossierCards: [
    {
      title: "MFCS as the invariant core",
      excerpt:
        "MFCS is presented as a ring-structured cognitive-operational architecture whose safety and liveness properties are established by construction and confirmed through exhaustive model checking.",
      source: "MFCS - A Formally Verified Ring-Structured Cognitive Architecture.docx",
    },
    {
      title: "Hybrid BUILD split",
      excerpt:
        "NexusHybrid_BuildSplit decomposes BUILD into BUILD_COLLECT and BUILD_COMPRESS, introducing a thresholded shift from passive accumulation to active compression before fusion.",
      source: "Technical_Analysis.docx",
    },
    {
      title: "Linear stability front",
      excerpt:
        "The envelope sweep produced the empirical relation M_min = 5C + 5 with stable points at (1,10), (2,15), and (3,20).",
      source: "Stability_Front_Analysis.docx",
    },
    {
      title: "Multi-resource conservation law",
      excerpt:
        "The multi-resource model extends the envelope to e + C_phi*phi + C_r*r <= M and reports a planar linear stability surface across the sweep.",
      source: "Stability_Front_Analysis_(Multi-Resource_Model).docx",
    },
    {
      title: "TLC-ready discretization",
      excerpt:
        "The TLC-ready revision replaces Reals with Integers and converts continuous values into ticks so the full state space can be explored finitely.",
      source: "Summary_of_Changes_to_(TLC-Ready_Version).docx",
    },
    {
      title: "Mystic Map topology",
      excerpt:
        "The symbolic-topological map organizes 67 nodes into five creature clusters, 36 interstitial nodes, and one central Nexus with 108 transitions.",
      source: "README.txt / node_map.json",
    },
  ],
  integrationTracks: [
    {
      title: "Verification-first AI routing",
      detail:
        "The integration blueprint frames Gemini as the verification layer with structured routing for theorem checks, manifests, and proof-aware orchestration.",
    },
    {
      title: "Copilot post-generation guardrail",
      detail:
        "The Microsoft deck proposes a post-generation verification layer so outputs are checked against MFCS invariants before operator delivery.",
    },
    {
      title: "Digital mirror delivery",
      detail:
        "Artifacts, diagrams, manifests, and telemetry are meant to travel together as a self-checking package, not as disconnected files.",
    },
  ],
  paletteNotes: [
    "Mystic Gold `#D4AF37` anchors the central nexus and Ouroboros domain.",
    "Cyan Spark `#00E5FF` and Azure Depth `#4D96FF` carry active-state telemetry and connective edges.",
    "The palette notes and accessibility notes target WCAG AA/AAA contrast on deep midnight backgrounds.",
  ],
};

export type OmegaDossier = typeof omegaDossier;
