export type HarmonicRole =
  | "core"
  | "mirror"
  | "triad"
  | "envelope"
  | "telemetry"
  | "threshold";

export type FrequencyNodeState = "active" | "staged" | "monitor" | "sealed";

export interface HarmonicShell {
  id: HarmonicRole;
  label: string;
  hz: number;
  radius: number;
  baseCount: number;
  falloff: number;
  hue: number;
  channel: "harmonic" | "mirror" | "telemetry" | "threshold";
  description: string;
}

export interface FrequencyNode {
  id: string;
  shellId: HarmonicRole;
  label: string;
  position: [number, number, number];
  baseHz: number;
  amplitude: number;
  phase: number;
  coherence: number;
  falloff: number;
  influenceRadius: number;
  state: FrequencyNodeState;
}

export interface LatticeEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  strength: number;
  channel: "harmonic" | "mirror" | "telemetry" | "threshold";
}

export interface LatticeControls {
  freq: number;
  speed: number;
  complexity: number;
  hue: number;
  autoRotate: boolean;
}

export interface RuntimeFieldBias {
  vitality: number;
  momentum: number;
  pressure: number;
  runtimeMode: "live" | "demo";
  rateLimitState: "STABLE" | "THROTTLED";
}

export interface FieldSample {
  intensity: number;
  normalized: number;
  dominantRole: HarmonicRole;
  strongestContribution: number;
}

export interface HarmonicDisplayRow {
  role: HarmonicRole;
  label: string;
  hz: number;
  radius: number;
  nodeCount: number;
  amplitude: number;
  coherence: number;
  color: string;
  description: string;
}

export interface NoteAnchor {
  note: string;
  referenceHz: number;
  centsOffset: number;
  periodMs: number;
  label: string;
}

export interface LatticeState {
  nodes: FrequencyNode[];
  edges: LatticeEdge[];
  shells: HarmonicDisplayRow[];
  controls: LatticeControls;
  summary: {
    coreHz: number;
    nodeCount: number;
    shellRadius: number;
    fieldDrive: number;
    fieldStatus: "STABLE" | "THROTTLED";
    sample: FieldSample;
    noteAnchor: NoteAnchor;
  };
}

export interface CaptureMetadata {
  timestamp: string;
  coreHz: number;
  drive: number;
  speed: number;
  complexity: number;
  hue: number;
  nodeCount: number;
  runtimeMode: "live" | "demo";
}

export const CORE_FREQUENCY = 167.89;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const LATTICE_CONTROL_LIMITS = {
  freq: { min: 0.5, max: 2.5, step: 0.01 },
  speed: { min: 0.25, max: 3, step: 0.01 },
  complexity: { min: 1, max: 6, step: 1 },
  hue: { min: -180, max: 180, step: 1 },
} as const;

export const HARMONIC_SHELLS: HarmonicShell[] = [
  {
    id: "core",
    label: "Core Carrier",
    hz: CORE_FREQUENCY,
    radius: 0,
    baseCount: 1,
    falloff: 0.9,
    hue: 4,
    channel: "harmonic",
    description: "Anchor / source oscillation",
  },
  {
    id: "mirror",
    label: "Mirror Layer",
    hz: CORE_FREQUENCY * 2,
    radius: 1,
    baseCount: 12,
    falloff: 0.72,
    hue: 26,
    channel: "mirror",
    description: "Synchronization / stabilization shell",
  },
  {
    id: "triad",
    label: "Triadic Expansion",
    hz: CORE_FREQUENCY * 3,
    radius: 1.8,
    baseCount: 24,
    falloff: 0.56,
    hue: 52,
    channel: "harmonic",
    description: "Propagation and directional clarity",
  },
  {
    id: "envelope",
    label: "Lattice Envelope",
    hz: CORE_FREQUENCY * 4,
    radius: 2.7,
    baseCount: 48,
    falloff: 0.42,
    hue: 138,
    channel: "harmonic",
    description: "Containment and field geometry",
  },
  {
    id: "telemetry",
    label: "Telemetry Edge",
    hz: CORE_FREQUENCY * 5,
    radius: 3.7,
    baseCount: 72,
    falloff: 0.3,
    hue: 198,
    channel: "telemetry",
    description: "Edge sensing and dissipation",
  },
  {
    id: "threshold",
    label: "Threshold Band",
    hz: CORE_FREQUENCY * 6,
    radius: 4.8,
    baseCount: 124,
    falloff: 0.21,
    hue: 224,
    channel: "threshold",
    description: "Boundary / feedback return",
  },
];

const DEFAULT_BIAS: RuntimeFieldBias = {
  vitality: 88,
  momentum: 76,
  pressure: 14,
  runtimeMode: "demo",
  rateLimitState: "STABLE",
};

const DENSITY_MULTIPLIER: Record<number, number> = {
  1: 0.4,
  2: 0.65,
  3: 0.82,
  4: 1,
  5: 1.2,
  6: 1.4,
};

export function createDefaultLatticeControls(): LatticeControls {
  return {
    freq: 1,
    speed: 1.2,
    complexity: 4,
    hue: 0,
    autoRotate: true,
  };
}

export function identifyNoteAnchor(frequency: number): NoteAnchor {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const referenceHz = 440 * Math.pow(2, (midi - 69) / 12);
  const centsOffset = Math.round(1200 * Math.log2(frequency / referenceHz));
  const periodMs = 1000 / frequency;
  const centsLabel =
    centsOffset === 0 ? "in tune" : `${centsOffset > 0 ? "+" : ""}${centsOffset} cents`;

  return {
    note: `${noteName}${octave}`,
    referenceHz: Number(referenceHz.toFixed(2)),
    centsOffset,
    periodMs: Number(periodMs.toFixed(2)),
    label: `${noteName}${octave} (${centsLabel})`,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function densityForComplexity(complexity: number) {
  const key = clamp(Math.round(complexity), 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  return DENSITY_MULTIPLIER[key];
}

function shellCount(shell: HarmonicShell, controls: LatticeControls) {
  if (shell.id === "core") {
    return 1;
  }

  return Math.max(4, Math.round(shell.baseCount * densityForComplexity(controls.complexity)));
}

function seededOffset(seed: number) {
  return Math.sin(seed * 12.9898) * 43758.5453;
}

function fractional(value: number) {
  return value - Math.floor(value);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getShellColor(shell: HarmonicShell, hueShift: number) {
  const lightness =
    shell.id === "core" ? 54 : shell.id === "threshold" ? 48 : shell.id === "telemetry" ? 58 : 62;
  const saturation =
    shell.id === "telemetry" || shell.id === "threshold" ? 72 : 84;
  return hslToHex(shell.hue + hueShift, saturation, lightness);
}

function fibonacciPoint(index: number, count: number, radius: number): [number, number, number] {
  if (count <= 1) {
    return [0, 0, 0];
  }

  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = ((index * offset) - 1) + offset / 2;
  const radial = Math.sqrt(1 - y * y);
  const phi = index * increment;

  return [
    Math.cos(phi) * radial * radius,
    y * radius,
    Math.sin(phi) * radial * radius,
  ];
}

function stateForNode(amplitude: number, coherence: number): FrequencyNodeState {
  const signal = amplitude * coherence;
  if (signal > 0.78) {
    return "active";
  }
  if (signal > 0.52) {
    return "staged";
  }
  if (signal > 0.22) {
    return "monitor";
  }
  return "sealed";
}

function buildShellNodes(
  shell: HarmonicShell,
  controls: LatticeControls,
  bias: RuntimeFieldBias,
) {
  const count = shellCount(shell, controls);
  const vitality = clamp(bias.vitality / 100, 0, 1);
  const momentum = clamp(bias.momentum / 100, 0, 1);
  const pressure = clamp(bias.pressure / 100, 0, 1);
  const drive = controls.freq;
  const shellIndex = HARMONIC_SHELLS.findIndex((entry) => entry.id === shell.id);
  const shellEnergy = clamp(1 - shellIndex * 0.12 + vitality * 0.24 - pressure * 0.15, 0.14, 1);
  const coherenceBase = clamp(0.95 - shellIndex * 0.1 + vitality * 0.12 - pressure * 0.12, 0.18, 1);
  const radius = shell.radius === 0 ? 0 : shell.radius * (0.9 + controls.complexity * 0.06);
  const nodes: FrequencyNode[] = [];

  for (let index = 0; index < count; index += 1) {
    const anchor = shell.id === "core" ? [0, 0, 0] : fibonacciPoint(index, count, radius);
    const jitterSeed = fractional(seededOffset(index + shellIndex * 91));
    const lift = shell.id === "core" ? 0 : (jitterSeed - 0.5) * 0.18 * shell.radius;
    const position: [number, number, number] = [
      anchor[0] * (1 + (jitterSeed - 0.5) * 0.12),
      anchor[1] + lift,
      anchor[2] * (1 + (fractional(seededOffset(index + 17)) - 0.5) * 0.12),
    ];
    const phaseOffset = shellIndex * 0.63 + index * 0.19;
    const amplitude = clamp(shellEnergy * (1 - index / Math.max(count * 1.8, 1)) + momentum * 0.08, 0.08, 1);
    const coherence = clamp(coherenceBase - index / Math.max(count * 4.6, 1) + momentum * 0.05, 0.08, 1);
    nodes.push({
      id: `${shell.id}-${index + 1}`,
      shellId: shell.id,
      label: `${shell.label} ${index + 1}`,
      position,
      baseHz: shell.hz * drive,
      amplitude,
      phase: phaseOffset,
      coherence,
      falloff: shell.falloff,
      influenceRadius: Math.max(0.6, shell.radius * 1.2),
      state: stateForNode(amplitude, coherence),
    });
  }

  return nodes;
}

export function interactionStrength(a: FrequencyNode, b: FrequencyNode) {
  const phaseAlignment = Math.cos(a.phase - b.phase);
  const freqRatio = Math.min(a.baseHz, b.baseHz) / Math.max(a.baseHz, b.baseHz);
  return phaseAlignment * freqRatio * a.coherence * b.coherence;
}

export function sampleFieldAtPoint(
  point: [number, number, number],
  time: number,
  nodes: FrequencyNode[],
) {
  let total = 0;
  let dominantRole: HarmonicRole = "core";
  let strongestContribution = 0;

  for (const node of nodes) {
    const dx = point[0] - node.position[0];
    const dy = point[1] - node.position[1];
    const dz = point[2] - node.position[2];
    const r2 = dx * dx + dy * dy + dz * dz;
    const wave = Math.sin(2 * Math.PI * node.baseHz * time + node.phase);
    const fall = Math.exp(-node.falloff * r2);
    const contribution = node.amplitude * node.coherence * wave * fall;
    total += contribution;

    if (Math.abs(contribution) > strongestContribution) {
      strongestContribution = Math.abs(contribution);
      dominantRole = node.shellId;
    }
  }

  const intensity = Math.abs(total);
  return {
    intensity,
    normalized: clamp(Math.pow(intensity * 0.62, 0.72), 0, 1),
    dominantRole,
    strongestContribution,
  } satisfies FieldSample;
}

export function buildFieldRepresentativeNodes(nodes: FrequencyNode[], limit = 24) {
  return [...nodes]
    .sort(
      (left, right) =>
        right.amplitude * right.coherence - left.amplitude * left.coherence,
    )
    .slice(0, limit);
}

export function buildLatticeState(
  controls: LatticeControls,
  runtimeBias?: Partial<RuntimeFieldBias>,
) {
  const bias = {
    ...DEFAULT_BIAS,
    ...runtimeBias,
  } satisfies RuntimeFieldBias;

  const nodes = HARMONIC_SHELLS.flatMap((shell) => buildShellNodes(shell, controls, bias));
  const shellGroups = HARMONIC_SHELLS.map((shell) => ({
    shell,
    nodes: nodes.filter((node) => node.shellId === shell.id),
  }));

  const edges: LatticeEdge[] = [];

  for (let index = 0; index < shellGroups.length; index += 1) {
    const current = shellGroups[index];
    const next = shellGroups[(index + 1) % shellGroups.length];

    current.nodes.forEach((node, nodeIndex) => {
      if (current.nodes.length > 1) {
        const sibling = current.nodes[(nodeIndex + 1) % current.nodes.length];
        edges.push({
          id: `${node.id}->${sibling.id}`,
          source: node.id,
          target: sibling.id,
          weight: 0.36,
          strength: Math.abs(interactionStrength(node, sibling)),
          channel: current.shell.channel,
        });
      }

      const nextIndex =
        next.nodes.length === 1
          ? 0
          : Math.floor((nodeIndex / current.nodes.length) * next.nodes.length) % next.nodes.length;
      const target = next.nodes[nextIndex];
      edges.push({
        id: `${node.id}->${target.id}`,
        source: node.id,
        target: target.id,
        weight: 0.8,
        strength: Math.abs(interactionStrength(node, target)),
        channel: current.shell.channel,
      });
    });
  }

  const sample = sampleFieldAtPoint([0, 0, 0], controls.speed * 0.0015, nodes);
  const shellRows = shellGroups.map(({ shell, nodes: shellNodes }) => ({
    role: shell.id,
    label: shell.label,
    hz: Number((shell.hz * controls.freq).toFixed(2)),
    radius: shell.radius,
    nodeCount: shellNodes.length,
    amplitude:
      shellNodes.reduce((sum, node) => sum + node.amplitude, 0) /
      Math.max(shellNodes.length, 1),
    coherence:
      shellNodes.reduce((sum, node) => sum + node.coherence, 0) /
      Math.max(shellNodes.length, 1),
    color: getShellColor(shell, controls.hue),
    description: shell.description,
  })) satisfies HarmonicDisplayRow[];

  return {
    nodes,
    edges,
    shells: shellRows,
    controls,
    summary: {
      coreHz: Number((CORE_FREQUENCY * controls.freq).toFixed(2)),
      nodeCount: nodes.length,
      shellRadius: HARMONIC_SHELLS[HARMONIC_SHELLS.length - 1].radius,
      fieldDrive: controls.freq,
      fieldStatus: bias.rateLimitState,
      sample,
      noteAnchor: identifyNoteAnchor(CORE_FREQUENCY * controls.freq),
    },
  } satisfies LatticeState;
}

export function makeCaptureMetadata(
  state: LatticeState,
  runtimeMode: "live" | "demo",
): CaptureMetadata {
  return {
    timestamp: new Date().toISOString(),
    coreHz: state.summary.coreHz,
    drive: state.controls.freq,
    speed: state.controls.speed,
    complexity: state.controls.complexity,
    hue: state.controls.hue,
    nodeCount: state.summary.nodeCount,
    runtimeMode,
  };
}
