import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Camera,
  Compass,
  Cpu,
  Gauge,
  Lock,
  Orbit,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
} from "lucide-react";
import CommandInput, { type LatticeCommandAction } from "../components/CommandInput";
import { CodexSectorExplorer } from "../components/CodexSectorExplorer";
import { GuardianFilter, MysticMapExplorer } from "../components/MysticMapExplorer";
import { OperatorTopNav } from "../components/OperatorTopNav";
import LatticeScene from "../components/3d/LatticeScene";
import { useCodex } from "../context/CodexContext";
import { type CodexGuardianFilter } from "../data/latticeCodex";
import { mysticMapData } from "../data/omegaDossier";
import {
  advanceSAPClaim,
  buildRTTSEvidence,
  evaluateControlKernel,
  hasTerminalClosure,
  planAssignments,
  reduceChorusTx,
  semanticLockSatisfied,
  summarizeContamination,
  type ArbiterProfile,
  type SAPClaim,
} from "../lib/chorus-stack";
import {
  HARMONIC_SHELLS,
  LATTICE_CONTROL_LIMITS,
  buildLatticeState,
  createDefaultLatticeControls,
  getShellColor,
  makeCaptureMetadata,
  type LatticeControls,
} from "../lib/frequency-map";

const DEFAULT_CONTROLS = createDefaultLatticeControls();
const LatticeIntelligencePanel = lazy(() =>
  import("../components/lattice/LatticeIntelligencePanel").then((module) => ({
    default: module.LatticeIntelligencePanel,
  })),
);
const LatticeGovernancePanel = lazy(() =>
  import("../components/lattice/LatticeGovernancePanel").then((module) => ({
    default: module.LatticeGovernancePanel,
  })),
);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatControlValue(key: "freq" | "speed" | "complexity" | "hue", value: number) {
  if (key === "complexity" || key === "hue") {
    return value.toFixed(0);
  }

  return value.toFixed(2);
}

function isDefaultControls(controls: LatticeControls) {
  return (
    controls.freq === DEFAULT_CONTROLS.freq &&
    controls.speed === DEFAULT_CONTROLS.speed &&
    controls.complexity === DEFAULT_CONTROLS.complexity &&
    controls.hue === DEFAULT_CONTROLS.hue
  );
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function LatticePage() {
  const {
    meridian,
    focusMode,
    runtimeMode,
    setFocusMode,
    rateLimitState,
    phi,
    readiness,
    energy,
    proofRecords,
    oracleEvaluation,
    hybridRuntime,
  } = useCodex();

  const [controls, setControls] = useState<LatticeControls>(DEFAULT_CONTROLS);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("core-1");
  const [interactionActive, setInteractionActive] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianFilter>("All");
  const [lastCapture, setLastCapture] = useState<{
    url: string;
    filename: string;
    metadata: ReturnType<typeof makeCaptureMetadata>;
  } | null>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const runtimeBias = useMemo(
    () => ({
      vitality: meridian?.vitalityIndex ?? 88,
      momentum: meridian?.operationalMomentum ?? 76,
      pressure: meridian?.anomalyPressure ?? 14,
      runtimeMode,
      rateLimitState,
    }),
    [meridian?.anomalyPressure, meridian?.operationalMomentum, meridian?.vitalityIndex, rateLimitState, runtimeMode],
  );

  const latticeState = useMemo(
    () => buildLatticeState(controls, runtimeBias),
    [controls, runtimeBias],
  );

  useEffect(() => {
    if (!latticeState.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(latticeState.nodes[0]?.id ?? "core-1");
    }
  }, [latticeState.nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => latticeState.nodes.find((node) => node.id === selectedNodeId) ?? latticeState.nodes[0],
    [latticeState.nodes, selectedNodeId],
  );

  const selectedShell = useMemo(
    () =>
      HARMONIC_SHELLS.find((shell) => shell.id === selectedNode?.shellId) ?? HARMONIC_SHELLS[0],
    [selectedNode?.shellId],
  );

  const proofPassCount = useMemo(
    () => proofRecords.filter((record) => record.status === "PASS").length,
    [proofRecords],
  );

  const isOverridden = useMemo(() => !isDefaultControls(controls), [controls]);

  const kernelInput = useMemo(() => {
    const queueDepth = Math.round(
      28 + latticeState.summary.nodeCount * 0.16 + controls.speed * 12 + controls.complexity * 6,
    );
    const queueThreshold = 140;
    const reliabilityCorrelation = Number(
      clamp(runtimeBias.pressure / 100 * 0.78 + (controls.freq - 1) * 0.12 - 0.18, -1, 1).toFixed(2),
    );
    const fallbackCorrelation = Number(
      clamp(
        runtimeBias.pressure / 100 * 0.66 +
          (controls.complexity - 4) * 0.08 +
          (controls.speed - 1.2) * 0.06 -
          0.12,
        -1,
        1,
      ).toFixed(2),
    );

    return {
      queueDepth,
      queueThreshold,
      reliabilityCorrelation,
      fallbackCorrelation,
      stressSignal:
        rateLimitState === "THROTTLED" ||
        focusMode === "SIMULATE" ||
        queueDepth >= Math.round(queueThreshold * 1.05),
    };
  }, [
    controls.complexity,
    controls.freq,
    controls.speed,
    focusMode,
    latticeState.summary.nodeCount,
    rateLimitState,
    runtimeBias.pressure,
  ]);

  const modeState = useMemo(() => evaluateControlKernel(kernelInput), [kernelInput]);
  const contamination = useMemo(
    () =>
      summarizeContamination(
        kernelInput.reliabilityCorrelation,
        kernelInput.fallbackCorrelation,
      ),
    [kernelInput.fallbackCorrelation, kernelInput.reliabilityCorrelation],
  );

  const arbiterProfiles = useMemo<ArbiterProfile[]>(
    () =>
      latticeState.shells.map((shell, index) => ({
        arbiterId: `${shell.role}-arbiter`,
        qualityScore: Number(clamp(shell.coherence, 0.1, 1).toFixed(2)),
        serviceScore: Number(clamp(shell.amplitude * 0.94, 0.1, 1).toFixed(2)),
        currentLoad: Math.max(4, Math.round(kernelInput.queueDepth / (index + 2))),
        concentrationRisk: Number(
          clamp(index * 0.09 + (1 - shell.coherence) * 0.35, 0.06, 0.96).toFixed(2),
        ),
        available: true,
        band: index <= 1 ? "A" : index <= 3 ? "B" : "C",
      })),
    [kernelInput.queueDepth, latticeState.shells],
  );

  const signalState = contamination.contaminated
    ? "contaminated"
    : modeState.mode === "STRESS"
      ? "stress"
      : "clean";

  const evidenceRows = useMemo(
    () => arbiterProfiles.map((profile) => buildRTTSEvidence(profile, signalState)),
    [arbiterProfiles, signalState],
  );

  const assignmentPreview = useMemo(
    () =>
      planAssignments({
        arbiters: arbiterProfiles,
        batchSize: 3,
        modeState,
        seed: Math.round(latticeState.summary.coreHz * 100),
      }),
    [arbiterProfiles, latticeState.summary.coreHz, modeState],
  );

  const chorusTx = useMemo(() => {
    const base = {
      txId: "tx-field-engine",
      payloadHash: `field-${Math.round(latticeState.summary.coreHz * 100)}`,
      status: "REGISTERED" as const,
      signatures: contamination.contaminated ? 0 : 2,
      deadline: Date.now() + 45_000,
      recordedAt: Date.now(),
    };

    return reduceChorusTx(
      base,
      contamination.contaminated
        ? { type: "TIMEOUT", now: Date.now() }
        : { type: "EXECUTE", now: Date.now() },
    );
  }, [contamination.contaminated, latticeState.summary.coreHz]);

  const sapClaim = useMemo(() => {
    let claim: SAPClaim = {
      claimId: "claim-field-engine",
      chorusTxId: chorusTx.txId,
      status: "REGISTERED" as const,
      synthesis: null,
      unresolvedCount: contamination.contaminated ? 2 : 0,
      uncontested: false,
      staleReference: false,
      disputeTypes: contamination.contaminated ? ["evidence", "mapping"] : [],
    };

    claim = advanceSAPClaim(claim, { type: "OPEN_COUNTER_WINDOW" });
    claim = advanceSAPClaim(claim, { type: "ASSIGN_ARBITER" });
    claim = advanceSAPClaim(claim, {
      type: "SYNTHESIZE",
      synthesis: contamination.contaminated
        ? "disputed harmonic interpretation"
        : "harmonic consensus committed",
      unresolvedCount: contamination.contaminated ? 2 : 0,
      disputeTypes: contamination.contaminated ? ["evidence", "mapping"] : [],
    });
    claim = advanceSAPClaim(claim, { type: "OPEN_ACCEPTANCE" });

    return contamination.contaminated
      ? advanceSAPClaim(advanceSAPClaim(claim, { type: "ESCALATE" }), { type: "VOID" })
      : advanceSAPClaim(claim, { type: "COMMIT" });
  }, [chorusTx.txId, contamination.contaminated]);

  const updateControl = useCallback(
    (
      key: "freq" | "speed" | "complexity" | "hue" | "autoRotate",
      value: number | boolean,
    ) => {
      startTransition(() => {
        setControls((current) => ({
          ...current,
          [key]: value,
        }));
      });
    },
    [],
  );

  const resetControls = useCallback(() => {
    startTransition(() => {
      setControls(createDefaultLatticeControls());
      setFocusMode("SCAN");
    });
  }, [setFocusMode]);

  const captureField = useCallback(() => {
    const canvas = sceneCanvasRef.current;
    if (!canvas) {
      return "Capture surface unavailable.";
    }

    const metadata = makeCaptureMetadata(latticeState, runtimeMode);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const context = exportCanvas.getContext("2d");
    if (!context) {
      return "Capture encoder unavailable.";
    }

    context.drawImage(canvas, 0, 0);

    const pad = Math.max(24, Math.round(exportCanvas.width * 0.018));
    const panelWidth = Math.min(Math.round(exportCanvas.width * 0.36), 520);
    const lineHeight = Math.round(exportCanvas.height * 0.032);
    const panelHeight = pad * 2 + lineHeight * 7;
    const panelX = pad;
    const panelY = exportCanvas.height - panelHeight - pad;

    drawRoundedRect(context, panelX, panelY, panelWidth, panelHeight, 22);
    context.fillStyle = "rgba(4, 14, 20, 0.84)";
    context.fill();
    context.strokeStyle = "rgba(0, 229, 255, 0.45)";
    context.lineWidth = 2;
    context.stroke();

    const lines = [
      "CHORUS // RESONANCE_CAPTURE",
      `TIMESTAMP: ${new Date(metadata.timestamp).toLocaleString()}`,
      `CORE: ${metadata.coreHz.toFixed(2)} HZ`,
      `DRIVE: ${metadata.drive.toFixed(2)}x`,
      `SPEED: ${metadata.speed.toFixed(2)}x`,
      `NODE_COUNT: ${metadata.nodeCount}`,
      `COMPLEXITY: ${metadata.complexity.toFixed(0)} / HUE: ${metadata.hue.toFixed(0)} / ${metadata.runtimeMode.toUpperCase()}`,
    ];

    context.font = `${Math.max(16, Math.round(exportCanvas.width * 0.012))}px monospace`;
    context.fillStyle = "#00e5ff";
    lines.forEach((line, index) => {
      context.fillText(line, panelX + pad, panelY + pad + lineHeight * (index + 0.8));
    });

    const filename = `chorus_resonance_${Date.now()}.png`;
    const url = exportCanvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setLastCapture({
      url,
      filename,
      metadata,
    });

    return `PNG exported as ${filename}.`;
  }, [latticeState, runtimeMode]);

  const handleLatticeCommand = useCallback(
    (command: LatticeCommandAction) => {
      if (command.type === "reset") {
        resetControls();
        return "Local field engine restored to canonical defaults.";
      }

      if (command.type === "capture") {
        return captureField();
      }

      updateControl(command.key, command.value);
      return `${command.key} committed to the local 167.89 field engine.`;
    },
    [captureField, resetControls, updateControl],
  );

  const handleSelectNode = useCallback(
    (id: string) => {
      setSelectedNodeId(id);
      if (focusMode === "SCAN") {
        setFocusMode("FOCUS");
      }
    },
    [focusMode, setFocusMode],
  );

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,109,59,0.12),_transparent_26%),radial-gradient(circle_at_85%_20%,_rgba(0,229,255,0.13),_transparent_24%),linear-gradient(180deg,_rgba(5,7,15,0.98),_rgba(4,8,16,1))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,140,96,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.8)_1px,transparent_1px)] [background-size:56px_56px]" />

      <main className="relative z-10 mx-auto max-w-[1680px] px-4 pb-20 pt-6 md:px-6">
        <OperatorTopNav
          title="167.89 Field Engine"
          subtitle="The lattice route is now the canonical local manifestation engine: multi-node interference math, shell-governed 3D structure, live shader field, operator capture, and a deterministic Chorus governance preview layered beside it."
          badge={runtimeMode === "live" ? "Live runtime bias engaged" : "Hosted demo bias engaged"}
        />

        <section className="mt-6 grid gap-4 xl:grid-cols-7">
          <StatusBadge
            icon={<Orbit size={12} />}
            label="Runtime"
            value={runtimeMode.toUpperCase()}
            note={rateLimitState === "THROTTLED" ? "Guardrail throttled" : "Nominal carrier"}
            tone={runtimeMode === "live" ? "#00e5ff" : "#f7d76f"}
          />
          <StatusBadge
            icon={<Waves size={12} />}
            label="Note Anchor"
            value={latticeState.summary.noteAnchor.note}
            note={latticeState.summary.noteAnchor.label}
            tone="#8ae6b0"
          />
          <StatusBadge
            icon={<Gauge size={12} />}
            label="Kernel Mode"
            value={modeState.mode}
            note={modeState.rationale[0] ?? "evaluated"}
            tone={modeState.mode === "INVERTED" ? "#ff8c8c" : "#8ae6b0"}
          />
          <StatusBadge
            icon={<Activity size={12} />}
            label="Field Status"
            value={latticeState.summary.fieldStatus}
            note={`${latticeState.summary.nodeCount} shell-governed nodes`}
            tone={latticeState.summary.fieldStatus === "THROTTLED" ? "#ffb469" : "#77c9ff"}
          />
          <StatusBadge
            icon={<ShieldCheck size={12} />}
            label="Proof Surface"
            value={`${proofPassCount}/${proofRecords.length}`}
            note={oracleEvaluation.envelope.inside ? "Envelope inside" : "Envelope drift"}
            tone={oracleEvaluation.envelope.inside ? "#8ae6b0" : "#ff8c8c"}
          />
          <StatusBadge
            icon={<Compass size={12} />}
            label="Selection"
            value={selectedNode?.shellId.toUpperCase() ?? "CORE"}
            note={selectedNode?.id ?? "core-1"}
            tone={getShellColor(selectedShell, controls.hue)}
          />
          <StatusBadge
            icon={<Camera size={12} />}
            label="Capture"
            value={lastCapture ? "READY" : "IDLE"}
            note={lastCapture ? lastCapture.filename : "PNG overlay export"}
            tone={lastCapture ? "#00e5ff" : "#6f87ad"}
          />
        </section>

        <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-6">
            <LatticeScene
              latticeState={latticeState}
              focusMode={focusMode}
              selectedNodeId={selectedNode?.id}
              onSelectNode={handleSelectNode}
              onInteractionChange={setInteractionActive}
              onCanvasReady={(canvas) => {
                sceneCanvasRef.current = canvas;
              }}
            />

            <SurfacePanel>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <SectionLabel icon={<TerminalGlyph />}>Operator Commands</SectionLabel>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#9eb5db]">
                    Numeric commands now target the local field engine only. They do not
                    mutate the shared runtime, which keeps `/lattice` deterministic while
                    still letting us tune the visual field, capture it, and reset it cleanly.
                  </p>
                  <CommandInput
                    latticeMode
                    onLatticeCommand={handleLatticeCommand}
                    className="mt-4"
                  />
                </div>

                <div className="rounded-[24px] border border-[#00e5ff]/14 bg-[#07111c]/88 p-5">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#77c9ff]">
                    Interaction State
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-[#d7e2f8]">
                    <div className="flex items-center justify-between">
                      <span>Focus Mode</span>
                      <span className="font-mono text-white">{focusMode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auto Rotation</span>
                      <span className="font-mono text-white">
                        {controls.autoRotate ? "ENABLED" : "PAUSED"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>User Input</span>
                      <span className="font-mono text-white">
                        {interactionActive ? "ACTIVE" : "IDLE"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Overrides</span>
                      <span className="font-mono text-white">
                        {isOverridden ? "LOCAL" : "CANONICAL"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SurfacePanel>
          </div>

          <div className="space-y-6">
            <SurfacePanel>
              <SectionLabel icon={<SlidersHorizontal size={13} />}>Local Controls</SectionLabel>
              <div className="mt-5 space-y-4">
                <ControlSlider
                  label="freq"
                  value={controls.freq}
                  onChange={(value) => updateControl("freq", value)}
                />
                <ControlSlider
                  label="speed"
                  value={controls.speed}
                  onChange={(value) => updateControl("speed", value)}
                />
                <ControlSlider
                  label="complexity"
                  value={controls.complexity}
                  onChange={(value) => updateControl("complexity", value)}
                />
                <ControlSlider
                  label="hue"
                  value={controls.hue}
                  onChange={(value) => updateControl("hue", value)}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton onClick={() => updateControl("autoRotate", !controls.autoRotate)}>
                  <Orbit size={13} />
                  {controls.autoRotate ? "Pause Auto Rotate" : "Resume Auto Rotate"}
                </ActionButton>
                <ActionButton onClick={resetControls}>
                  <RefreshCcw size={13} />
                  Reset
                </ActionButton>
                <ActionButton onClick={() => void captureField()}>
                  <Camera size={13} />
                  Capture PNG
                </ActionButton>
              </div>
            </SurfacePanel>

            <SurfacePanel>
              <SectionLabel icon={<Sparkles size={13} />}>Selected Node</SectionLabel>
              {selectedNode ? (
                <>
                  <div className="mt-4 flex items-start gap-3">
                    <div
                      className="mt-1 h-3 w-3 rounded-full"
                      style={{ backgroundColor: getShellColor(selectedShell, controls.hue) }}
                    />
                    <div>
                      <div className="text-xl font-black tracking-tight text-white">
                        {selectedNode.label}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                        {selectedShell.label} / {selectedNode.state}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MetricTile label="Frequency" value={`${selectedNode.baseHz.toFixed(2)} Hz`} />
                    <MetricTile label="Amplitude" value={selectedNode.amplitude.toFixed(2)} />
                    <MetricTile label="Coherence" value={selectedNode.coherence.toFixed(2)} />
                    <MetricTile label="Falloff" value={selectedNode.falloff.toFixed(2)} />
                  </div>

                  <div className="mt-5 text-sm leading-6 text-[#9eb5db]">
                    Position [{selectedNode.position.map((value) => value.toFixed(2)).join(", ")}]
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-[#9eb5db]">No node selected.</div>
              )}
            </SurfacePanel>

            <SurfacePanel>
              <SectionLabel icon={<Camera size={13} />}>Capture Preview</SectionLabel>
              {lastCapture ? (
                <div className="mt-4 space-y-4">
                  <img
                    src={lastCapture.url}
                    alt="Latest lattice capture"
                    className="w-full rounded-[20px] border border-white/10"
                  />
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-[#9eb5db]">
                    {lastCapture.filename}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[#7f93b3]">
                  Capture the current field to export a PNG with live metadata burned into the image.
                </div>
              )}
            </SurfacePanel>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          <Suspense fallback={<PanelSkeleton label="Intelligence panel" />}>
            <LatticeIntelligencePanel
              shells={latticeState.shells}
              noteAnchor={latticeState.summary.noteAnchor}
              vitality={meridian?.vitalityIndex ?? 88}
              momentum={meridian?.operationalMomentum ?? 76}
              pressure={meridian?.anomalyPressure ?? 14}
              envelope={oracleEvaluation.envelope.current_value}
              hybridMode={hybridRuntime.mode}
              integration={hybridRuntime.integ}
              nextJump={hybridRuntime.next_jump}
              phi={phi}
              readiness={readiness}
              energy={energy}
            />
          </Suspense>

          <Suspense fallback={<PanelSkeleton label="Governance panel" />}>
            <LatticeGovernancePanel
              modeState={modeState}
              queueDepth={kernelInput.queueDepth}
              queueThreshold={kernelInput.queueThreshold}
              contaminationSeverity={contamination.severity}
              assignmentPreview={assignmentPreview}
              sapStatus={sapClaim.status}
              semanticLockOpen={semanticLockSatisfied(sapClaim)}
              terminalClosure={hasTerminalClosure(chorusTx)}
              evidenceRows={evidenceRows}
            />
          </Suspense>

          <SurfacePanel>
            <SectionLabel icon={<Lock size={13} />}>Runtime Bias</SectionLabel>
            <div className="mt-5 space-y-4">
              <MetricTile label="SVI" value={(meridian?.vitalityIndex ?? 88).toFixed(1)} />
              <MetricTile label="Momentum" value={(meridian?.operationalMomentum ?? 76).toFixed(1)} />
              <MetricTile label="Pressure" value={(meridian?.anomalyPressure ?? 14).toFixed(1)} />
              <MetricTile label="Envelope" value={oracleEvaluation.envelope.current_value.toFixed(2)} />
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                  Hybrid Runtime
                </div>
                <div className="mt-3 text-sm leading-6 text-[#d7e2f8]">
                  Mode {hybridRuntime.mode} / integ {hybridRuntime.integ} / next {hybridRuntime.next_jump}
                </div>
                <div className="mt-3 text-sm leading-6 text-[#8fa8cb]">
                  phi {phi.toFixed(1)} / readiness {readiness.toFixed(1)} / energy {energy.toFixed(1)}
                </div>
              </div>
            </div>
          </SurfacePanel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <details className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
              Secondary Registry Context
            </summary>
            <div className="mt-5">
              <MysticMapExplorer
                data={mysticMapData}
                compact
                guardianFilter={selectedGuardian}
                onGuardianFilterChange={(guardian) => setSelectedGuardian(guardian)}
              />
            </div>
          </details>

          <details className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.3em] text-[#f7d76f]">
              Secondary Codex Sector View
            </summary>
            <div className="mt-5">
              <CodexSectorExplorer
                selectedGuardian={selectedGuardian as CodexGuardianFilter}
                onSelectGuardian={(guardian) => setSelectedGuardian(guardian as GuardianFilter)}
              />
            </div>
          </details>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SurfacePanel>
            <SectionLabel icon={<Gauge size={13} />}>Field Signature</SectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MetricTile label="Nearest Note" value={latticeState.summary.noteAnchor.note} />
              <MetricTile
                label="Cents Offset"
                value={`${latticeState.summary.noteAnchor.centsOffset > 0 ? "+" : ""}${latticeState.summary.noteAnchor.centsOffset}`}
              />
              <MetricTile
                label="Reference Hz"
                value={latticeState.summary.noteAnchor.referenceHz.toFixed(2)}
              />
              <MetricTile
                label="Period"
                value={`${latticeState.summary.noteAnchor.periodMs.toFixed(2)} ms`}
              />
            </div>
          </SurfacePanel>

          <SurfacePanel>
            <SectionLabel icon={<ShieldCheck size={13} />}>Field Sample</SectionLabel>
            <div className="mt-5 space-y-4">
              <MetricTile label="Intensity" value={latticeState.summary.sample.intensity.toFixed(3)} />
              <MetricTile label="Normalized" value={latticeState.summary.sample.normalized.toFixed(3)} />
              <MetricTile
                label="Dominant Role"
                value={latticeState.summary.sample.dominantRole.toUpperCase()}
              />
              <MetricTile
                label="Strongest Contribution"
                value={latticeState.summary.sample.strongestContribution.toFixed(3)}
              />
            </div>
          </SurfacePanel>
        </section>
      </main>
    </div>
  );
}

function TerminalGlyph() {
  return <span className="text-[12px] font-bold text-[#77c9ff]">&gt;_</span>;
}

function SurfacePanel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]"
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f7d76f]">
      {icon}
      {children}
    </div>
  );
}

function StatusBadge({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#6f87ad]">
        <span style={{ color: tone }}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#9eb5db]">{note}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#6f87ad]">{label}</div>
      <div className="mt-2 text-lg font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
      <div className="text-[10px] uppercase tracking-[0.28em] text-[#6f87ad]">{label}</div>
      <div className="mt-4 space-y-3">
        <div className="h-20 rounded-[18px] bg-white/[0.04]" />
        <div className="h-20 rounded-[18px] bg-white/[0.04]" />
        <div className="h-20 rounded-[18px] bg-white/[0.04]" />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#d7e2f8] transition-all hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function ControlSlider({
  label,
  value,
  onChange,
}: {
  label: "freq" | "speed" | "complexity" | "hue";
  value: number;
  onChange: (value: number) => void;
}) {
  const limits = LATTICE_CONTROL_LIMITS[label];

  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">{label}</span>
        <span className="font-mono text-sm font-bold text-white">
          {formatControlValue(label, value)}
        </span>
      </div>
      <input
        type="range"
        min={limits.min}
        max={limits.max}
        step={limits.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#152131]"
      />
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#6f87ad]">
        <span>{formatControlValue(label, limits.min)}</span>
        <span>{formatControlValue(label, limits.max)}</span>
      </div>
    </div>
  );
}
