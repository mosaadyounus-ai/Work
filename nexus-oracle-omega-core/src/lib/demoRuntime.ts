import { omegaDossier, mysticMapData } from "../data/omegaDossier";
import {
  CodexStep,
  GuardrailEvent,
  MeridianTelemetry,
  PathState,
  PlateId,
  ProcessedSignal,
  TraceAnnotation,
} from "./types";
import { processSignals } from "./engine";
import { normalizeSignals } from "./connectors";
import { signals as seedSignals } from "./signals";

export const DEMO_ANNOTATIONS_STORAGE_KEY = "omega-core-demo-annotations-v1";

const ZERO_PLATE_COUNTS: Record<PlateId, number> = {
  I: 0,
  II: 0,
  III: 0,
  IV: 0,
  V: 0,
  VI: 0,
  VII: 0,
  VIII: 0,
  IX: 0,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function simpleHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function buildRawSignals(now: number) {
  return normalizeSignals([
    {
      ...seedSignals[0],
      timestamp: new Date(now - 60_000).toISOString(),
      source: "omega_demo",
      payload: {
        ...seedSignals[0].payload,
        price: 64200,
        headline: "Envelope stability front holding inside nominal range.",
      },
    },
    {
      ...seedSignals[1],
      timestamp: new Date(now - 45_000).toISOString(),
      source: "omega_demo",
      payload: {
        headline: "Guardian transfer load remains inside the conserved build envelope.",
      },
    },
    {
      ...seedSignals[2],
      timestamp: new Date(now - 30_000).toISOString(),
      source: "omega_demo",
      payload: {
        headline: "Proof-guided routing remains aligned with MFCS and NexusHybrid outputs.",
      },
    },
    {
      id: "sig-omega-buildsplit",
      name: "NexusHybrid Build Split",
      type: "event",
      timestamp: new Date(now - 15_000).toISOString(),
      source: "omega_demo",
      source_reputation: 0.96,
      momentum: 0.68,
      volatility: 0.12,
      confidence: 0.94,
      entities: ["BUILD_COLLECT", "BUILD_COMPRESS", "TLC"],
      payload: {
        headline: "The BUILD split contract is green and ready for operator review.",
      },
    },
  ]);
}

function createPathState(node: (typeof mysticMapData.nodes)[number], activatedAt: string): PathState {
  const baseValue = 26 + node.weight * 10 + node.transitions.length * 2;
  const bonus = node.type === "central" ? 18 : node.type === "cluster" ? 8 : 0;

  return {
    id: node.node_id,
    value: clamp(baseValue + bonus, 12, 96),
    drift: ((node.id % 7) - 3) * 0.42,
    risk: clamp(18 + node.entry_conditions.length * 6 + (node.type === "generic" ? 7 : 0), 5, 92),
    momentum: clamp(38 + node.exit_conditions.length * 7 + node.weight, 22, 100),
    importance: clamp(node.type === "central" ? 1 : 0.18 + node.transitions.length / 22, 0.1, 0.92),
    lastActivation: activatedAt,
  };
}

function buildPathMap(now: number): MeridianTelemetry["pathMap"] {
  const activatedAt = new Date(now).toISOString();
  const centerNode = mysticMapData.nodes.find((node) => node.type === "central") ?? mysticMapData.nodes[0];
  const centerX = centerNode?.x ?? 0;
  const centerY = centerNode?.y ?? 0;

  const pathMap: MeridianTelemetry["pathMap"] = {
    north: [],
    east: [],
    south: [],
    west: [],
  };

  mysticMapData.nodes.forEach((node) => {
    const dx = node.x - centerX;
    const dy = node.y - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      pathMap[dx >= 0 ? "east" : "west"].push(createPathState(node, activatedAt));
      return;
    }

    pathMap[dy >= 0 ? "south" : "north"].push(createPathState(node, activatedAt));
  });

  return pathMap;
}

function buildMeridian(
  now: number,
  pathMap: MeridianTelemetry["pathMap"],
  processedSignals: ProcessedSignal[],
  overrides?: Partial<Pick<MeridianTelemetry, "vitalityIndex" | "operationalMomentum" | "anomalyPressure">>,
): MeridianTelemetry {
  const averageScore =
    processedSignals.reduce((sum, signal) => sum + signal.score, 0) / Math.max(processedSignals.length, 1);
  const averageRisk =
    processedSignals.reduce((sum, signal) => sum + signal.risk, 0) / Math.max(processedSignals.length, 1);

  return {
    vitalityIndex: overrides?.vitalityIndex ?? 88.6,
    cognitiveBandwidth: 63.8,
    environmentalQuality: 92.4,
    operationalMomentum: overrides?.operationalMomentum ?? 76.4,
    anomalyPressure: overrides?.anomalyPressure ?? 14.2,
    decisionLoop: {
      perception: "Complete",
      interpretation: "Complete",
      decision: "In-Motion",
      action: "Open",
      learning: "Open",
    },
    pathMap,
    metrics: {
      stability: clamp(averageScore, 0, 100),
      load: 63.8,
      clarity: 92.4,
      momentum: overrides?.operationalMomentum ?? 76.4,
      risk: clamp(averageRisk, 0, 100),
      harmonicAlignment: 93,
      fractalDensity: 45,
      snr: 12.5,
    },
    guardians: omegaDossier.guardianSummaries.map((entry) => ({
      id: entry.guardian.toLowerCase(),
      name: entry.guardian,
      symbol: entry.guardian[0],
      status: entry.share > 15 ? "ACTIVE" : "IDLE",
      alignment: clamp(68 + entry.share, 55, 99),
    })),
    operator: {
      name: "Mohammad Saad Younus",
      focus: 0.93,
      energy: 0.86,
      cadence: omegaDossier.liveSnapshot.cyclePeriodSeconds,
      driftCorrection: omegaDossier.liveSnapshot.driftPpm,
    },
    resilience: {
      rateLimitState: "NORMAL",
      cacheState: "HOT",
    },
    world: {
      globalPulse: "Transitional",
      marketTemperature: "Neutral",
      techSignal: "Accelerating",
      weather: {
        location: "Hosted demo",
        temp: 22,
        condition: "Clear",
        visibility: "Stable",
      },
    },
    health: {
      heartbeat: true,
      artifactIntegrity: true,
      guardianAlignment: true,
      pathMapPosition: 0.42,
    },
    statusManifest: {
      system: "DEMO_LOCKED",
      sentinel: "ACTIVE",
      guardians: "BALANCED",
      lattice: "VERIFIED",
    },
  };
}

function buildPlateCounts(processedSignals: ProcessedSignal[]) {
  return processedSignals.reduce<Record<PlateId, number>>((counts, signal) => {
    if (signal.codex_alignment) {
      counts[signal.codex_alignment] += 1;
    }
    return counts;
  }, { ...ZERO_PLATE_COUNTS });
}

function buildCodexHistory(processedSignals: ProcessedSignal[], now: number): CodexStep[] {
  const plates: PlateId[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

  return omegaDossier.verificationTimeline.map((entry, index) => {
    const sourceSignal = processedSignals[index % processedSignals.length];
    const plateId = sourceSignal.codex_alignment ?? plates[index % plates.length];

    return {
      id: `demo-step-${entry.version}`,
      timestamp: new Date(now - (omegaDossier.verificationTimeline.length - index) * 90_000).toISOString(),
      plateId,
      plateName: `Plate_${plateId}`,
      operator: "OMEGA_CORE",
      signalId: sourceSignal.id,
      trace: ["IDLE", "EVAL", "EXEC", "IDLE"],
      metrics: {
        stability: entry.status === "success" ? 92 : entry.status === "warning" ? 78 : 61,
        risk: entry.status === "issue" ? 67 : entry.status === "warning" ? 42 : 18,
        momentum: clamp(56 + index * 4, 40, 96),
      },
      context: {
        version: entry.version,
        headline: entry.headline,
        momentum: sourceSignal.momentum,
        volatility: sourceSignal.volatility,
      },
    };
  });
}

function buildSeedAnnotations(processedSignals: ProcessedSignal[], now: number): TraceAnnotation[] {
  return [
    {
      id: "demo-ann-proof",
      createdAt: new Date(now - 8 * 60_000).toISOString(),
      author: "OMEGA",
      signalId: processedSignals[0]?.id ?? "demo-signal-0",
      label: "Proof State",
      note: "Hosted runtime is pinned to the final green verification state for public review.",
      severity: "INFO",
    },
    {
      id: "demo-ann-map",
      createdAt: new Date(now - 4 * 60_000).toISOString(),
      author: "OMEGA",
      signalId: processedSignals[1]?.id ?? "demo-signal-1",
      label: "Map Import",
      note: "The lattice explorer is driven by the canonical 67-node registry imported from node_map.json.",
      severity: "WARN",
    },
  ];
}

export function loadDemoAnnotations(processedSignals: ProcessedSignal[], now = Date.now()): TraceAnnotation[] {
  if (typeof window === "undefined") {
    return buildSeedAnnotations(processedSignals, now);
  }

  try {
    const stored = window.localStorage.getItem(DEMO_ANNOTATIONS_STORAGE_KEY);
    if (!stored) {
      return buildSeedAnnotations(processedSignals, now);
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return buildSeedAnnotations(processedSignals, now);
    }

    return parsed as TraceAnnotation[];
  } catch {
    return buildSeedAnnotations(processedSignals, now);
  }
}

export function saveDemoAnnotations(annotations: TraceAnnotation[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_ANNOTATIONS_STORAGE_KEY, JSON.stringify(annotations));
}

function buildGuardrailEvents(processedSignals: ProcessedSignal[], now: number): GuardrailEvent[] {
  return [
    {
      id: "demo-guardrail-envelope",
      timestamp: new Date(now - 3 * 60_000).toISOString(),
      guardrailId: "ENVELOPE_MARGIN",
      severity: "LOW",
      reason: "Hosted runtime is operating with a comfortable envelope margin under the public demo profile.",
      step: undefined,
    },
    {
      id: "demo-guardrail-proof",
      timestamp: new Date(now - 90_000).toISOString(),
      guardrailId: "PROOF_LOCK",
      severity: "MED",
      reason: "The public surface is locked to the proof-valid state rather than the mutable dev runtime.",
      step: processedSignals[0]
        ? {
            id: "demo-proof-step",
            timestamp: new Date(now - 90_000).toISOString(),
            plateId: processedSignals[0].codex_alignment ?? "II",
            plateName: `Plate_${processedSignals[0].codex_alignment ?? "II"}`,
            operator: "OMEGA_CORE",
            signalId: processedSignals[0].id,
            metrics: {
              stability: 91,
              risk: 18,
              momentum: 73,
            },
          }
        : undefined,
    },
  ];
}

function timestampLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export interface DemoRuntimeSnapshot {
  data: ProcessedSignal[];
  meridian: MeridianTelemetry;
  codexHistory: CodexStep[];
  annotations: TraceAnnotation[];
  guardrailEvents: GuardrailEvent[];
  plateCounts: Record<PlateId, number>;
  phi: number;
  readiness: number;
  energy: number;
  rateLimitState: "STABLE" | "THROTTLED";
  lastSync: string;
  updatedAt: number;
}

export function createDemoRuntimeSnapshot(now = Date.now()): DemoRuntimeSnapshot {
  const processedSignals = processSignals(buildRawSignals(now));
  const pathMap = buildPathMap(now);

  return {
    data: processedSignals,
    meridian: buildMeridian(now, pathMap, processedSignals),
    codexHistory: buildCodexHistory(processedSignals, now),
    annotations: loadDemoAnnotations(processedSignals, now),
    guardrailEvents: buildGuardrailEvents(processedSignals, now),
    plateCounts: buildPlateCounts(processedSignals),
    phi: 55,
    readiness: 72,
    energy: 34,
    rateLimitState: "STABLE",
    lastSync: timestampLabel(now),
    updatedAt: now,
  };
}

export function tickDemoRuntimeSnapshot(previous: DemoRuntimeSnapshot, now = Date.now()): DemoRuntimeSnapshot {
  const phaseWave = Math.sin(now / 4_000);
  const pressureWave = Math.cos(now / 5_500);
  const vitalityIndex = clamp(88 + phaseWave * 4, 80, 96);
  const operationalMomentum = clamp(76 + Math.sin(now / 4_800 + 0.5) * 6, 65, 90);
  const anomalyPressure = clamp(14 + pressureWave * 3.2, 8, 22);
  const nextPhi = clamp(previous.phi + phaseWave * 1.6, 34, 82);
  const nextReadiness = clamp(previous.readiness + Math.cos(now / 5_100) * 1.1, 52, 88);
  const nextEnergy = clamp(previous.energy + Math.sin(now / 3_800 + 0.8) * 1.7, 18, 58);

  const nextPathMap = Object.fromEntries(
    Object.entries(previous.meridian.pathMap).map(([quadrant, paths]) => [
      quadrant,
      paths.map((path, index) => ({
        ...path,
        value: clamp(path.value + Math.sin(now / 5_200 + index) * 0.9, 10, 98),
        drift: clamp(path.drift + Math.cos(now / 4_300 + index) * 0.08, -5, 5),
        momentum: clamp(path.momentum + Math.sin(now / 4_700 + index) * 0.7, 0, 100),
        lastActivation: new Date(now).toISOString(),
      })),
    ]),
  ) as MeridianTelemetry["pathMap"];

  return {
    ...previous,
    meridian: buildMeridian(now, nextPathMap, previous.data, {
      vitalityIndex,
      operationalMomentum,
      anomalyPressure,
    }),
    phi: nextPhi,
    readiness: nextReadiness,
    energy: nextEnergy,
    rateLimitState: anomalyPressure > 18 ? "THROTTLED" : "STABLE",
    lastSync: timestampLabel(now),
    updatedAt: now,
  };
}

export function createDemoPredictions(
  steps: number,
  seed: Pick<DemoRuntimeSnapshot, "phi" | "readiness" | "energy">,
) {
  let phi = seed.phi;
  let readiness = seed.readiness;
  let energy = seed.energy;

  return Array.from({ length: steps }, (_, index) => {
    phi = clamp(phi + 0.8 - index * 0.02, 0, 100);
    readiness = clamp(readiness + 0.4 - index * 0.015, 0, 100);
    energy = clamp(energy + 0.2 - index * 0.04, 0, 100);

    return {
      tick: index + 1,
      phi: Number(phi.toFixed(2)),
      readiness: Number(readiness.toFixed(2)),
      energy: Number(energy.toFixed(2)),
    };
  });
}

export function createDemoTraceEntries(limit: number, steps: CodexStep[]) {
  return steps.slice(-limit).reverse().map((step, index) => ({
    tick: index + 1,
    hash: `${simpleHash(`${step.id}:${step.timestamp}:${step.plateId}`)}${simpleHash(step.signalId)}`,
  }));
}
