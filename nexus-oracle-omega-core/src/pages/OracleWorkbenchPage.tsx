import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Archive,
  BookMarked,
  Gauge,
  MoveRight,
  Orbit,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { FacetRegionMap } from "../components/FacetRegionMap";
import { OperatorTopNav } from "../components/OperatorTopNav";
import { useCodex } from "../context/CodexContext";
import { operatorArtifacts } from "../data/operatorArtifacts";

export default function OracleWorkbenchPage() {
  const {
    runtimeMode,
    meridian,
    hybridRuntime,
    oracleControls,
    setOracleControls,
    oracleEvaluation,
    proofRecords,
  } = useCodex();

  const failingProofs = proofRecords.filter((record) => record.status === "FAIL");
  const spotlightInvariantNames =
    failingProofs.length > 0
      ? failingProofs.map((record) => record.name)
      : proofRecords.slice(0, 3).map((record) => record.name);

  const directFacetArtifacts = operatorArtifacts
    .filter(
      (artifact) =>
        artifact.associatedFacets.includes(oracleEvaluation.facet) &&
        artifact.associatedInvariants.some((invariant) => spotlightInvariantNames.includes(invariant)),
    )
    .slice(0, 6);
  const drawerArtifacts =
    directFacetArtifacts.length > 0
      ? directFacetArtifacts
      : operatorArtifacts
          .filter((artifact) =>
            artifact.associatedInvariants.some((invariant) => spotlightInvariantNames.includes(invariant)),
          )
          .slice(0, 6);

  const passCount = proofRecords.filter((record) => record.status === "PASS").length;

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(212,175,55,0.12),_transparent_22%),linear-gradient(180deg,_rgba(8,16,30,0.96),_rgba(5,9,20,1))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:88px_88px]" />

      <main className="relative z-10 mx-auto max-w-[1700px] px-4 pb-10 pt-6 md:px-6">
        <OperatorTopNav
          title="Verified Hybrid Oracle"
          subtitle="Compute active facets, inspect live state, and validate the contract against traces, proofs, and artifacts."
          badge={runtimeMode === "live" ? "Live runtime attached" : "Hosted workbench demo"}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)_360px]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Orbit size={13} />
                System State
              </div>
              <div className="mt-5 space-y-3">
                <StateLine label="Mode" value={hybridRuntime.mode} />
                <StateLine label="t" value={hybridRuntime.t.toFixed(2)} mono />
                <StateLine label="phi" value={hybridRuntime.phi.toString()} mono />
                <StateLine label="r" value={hybridRuntime.r.toString()} mono />
                <StateLine label="s" value={hybridRuntime.s.toString()} mono />
                <StateLine label="e" value={hybridRuntime.e.toString()} mono />
                <StateLine label="integ" value={hybridRuntime.integ.toString()} mono />
                <StateLine label="dwell" value={hybridRuntime.dwell.toString()} mono />
              </div>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                  Active Thresholds
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[#c8d8f0]">
                  <ThresholdLine
                    label="CanCompress"
                    value={hybridRuntime.guards.can_compress ? "true" : "false"}
                  />
                  <ThresholdLine
                    label="CanFuse"
                    value={hybridRuntime.guards.can_fuse ? "true" : "false"}
                  />
                  <ThresholdLine
                    label="Compress >= phi"
                    value={hybridRuntime.thresholds.compress.toString()}
                  />
                  <ThresholdLine label="Fuse >= r" value={hybridRuntime.thresholds.fuse.toString()} />
                  <ThresholdLine
                    label="Envelope"
                    value={hybridRuntime.thresholds.envelope.toFixed(2)}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-[#d4af37]/20 bg-[#d4af37]/8 p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#f7d76f]">
                  Next Eligible Jump
                </div>
                <div className="mt-3 text-xl font-black tracking-tight text-white">
                  {hybridRuntime.next_jump}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#d8cda1]">
                  In approximately {hybridRuntime.next_jump_steps} step
                  {hybridRuntime.next_jump_steps === 1 ? "" : "s"} under the current thresholds.
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Activity size={13} />
                Runtime Layer
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricBadge label="SVI" value={meridian ? meridian.vitalityIndex.toFixed(1) : "88.0"} />
                <MetricBadge label="OM" value={meridian ? meridian.operationalMomentum.toFixed(1) : "76.0"} />
                <MetricBadge label="AP" value={meridian ? meridian.anomalyPressure.toFixed(1) : "14.0"} />
                <MetricBadge label="Proofs" value={`${passCount}/${proofRecords.length}`} />
              </div>
            </Panel>
          </aside>

          <div className="space-y-6">
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                    Oracle Engine
                  </div>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">
                    A formally verified operator surface that fuses hybrid dynamics, envelope geometry, TLC/TLAPS evidence, and artifact context into one live decision workspace.
                  </h2>
                </div>

                <div className="rounded-[20px] border border-[#8bb6ff]/20 bg-[#8bb6ff]/10 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#bcd4ff]">
                    Active Facet
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-white">
                    {oracleEvaluation.facet}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.54fr_0.46fr]">
                <div className="space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-[10px] uppercase tracking-[0.26em] text-[#8bb6ff]">
                        Surface Mode
                      </label>
                      <span className="font-mono text-sm font-semibold text-white">
                        {oracleControls.surfaceMode === "advanced-3d" ? "ADVANCED 3D" : "VERIFIED 2D"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={() =>
                          setOracleControls({
                            surfaceMode: "verified-2d",
                            c_s: 0,
                          })
                        }
                        className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                          oracleControls.surfaceMode === "verified-2d"
                            ? "border-[#8bb6ff]/45 bg-[#8bb6ff]/14 text-white"
                            : "border-white/10 bg-white/[0.02] text-[#a9bfdc]"
                        }`}
                      >
                        Verified 2D
                      </button>
                      <button
                        onClick={() =>
                          setOracleControls({
                            surfaceMode: "advanced-3d",
                          })
                        }
                        className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                          oracleControls.surfaceMode === "advanced-3d"
                            ? "border-[#d4af37]/45 bg-[#d4af37]/12 text-white"
                            : "border-white/10 bg-white/[0.02] text-[#a9bfdc]"
                        }`}
                      >
                        Advanced 3D
                      </button>
                    </div>
                  </div>

                  <SliderControl
                    label="C_phi"
                    value={oracleControls.c_phi}
                    min={0}
                    max={0.5}
                    step={0.01}
                    onChange={(value) => setOracleControls({ c_phi: value })}
                  />
                  <SliderControl
                    label="C_r"
                    value={oracleControls.c_r}
                    min={0}
                    max={0.5}
                    step={0.01}
                    onChange={(value) => setOracleControls({ c_r: value })}
                  />
                  {oracleControls.surfaceMode === "advanced-3d" ? (
                    <SliderControl
                      label="C_s"
                      value={oracleControls.c_s}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onChange={(value) => setOracleControls({ c_s: value })}
                    />
                  ) : (
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-[10px] uppercase tracking-[0.26em] text-[#8bb6ff]">
                          C_s
                        </label>
                        <span className="font-mono text-sm font-semibold text-white">0.00</span>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-[#a8bfdc]">
                        Hidden in verified 2D mode so the deployed projection stays pinned to the
                        original two-peak contract.
                      </div>
                    </div>
                  )}
                  <SliderControl
                    label="K"
                    value={oracleControls.K}
                    min={3}
                    max={6}
                    step={0.1}
                    onChange={(value) => setOracleControls({ K: value })}
                  />
                  <SliderControl
                    label="PhiF"
                    value={oracleControls.phiF}
                    min={3}
                    max={6}
                    step={1}
                    onChange={(value) => setOracleControls({ phiF: value })}
                  />
                  <SliderControl
                    label="RF"
                    value={oracleControls.rF}
                    min={3}
                    max={6}
                    step={1}
                    onChange={(value) => setOracleControls({ rF: value })}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <SliderControl
                      label="Compression Rate"
                      value={oracleControls.compressionRate}
                      min={1}
                      max={5}
                      step={1}
                      onChange={(value) => setOracleControls({ compressionRate: value })}
                    />
                    <SliderControl
                      label="Fusion Rate"
                      value={oracleControls.fusionRate}
                      min={1}
                      max={5}
                      step={1}
                      onChange={(value) => setOracleControls({ fusionRate: value })}
                    />
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-[#a8bfdc]">
                    {oracleControls.surfaceMode === "advanced-3d"
                      ? "The advanced surface evaluates the three-peak mirror with a live C_s parameter while keeping the visible winner map projected onto the C_phi / C_r plane."
                      : "The verified 2D surface preserves the original deployment by holding C_s at zero and using the two-peak contract, even though the shared kernel already supports 3D weights."}
                  </div>
                  {oracleEvaluation.geometry_warning ? (
                    <div className="rounded-[20px] border border-[#d4af37]/24 bg-[#d4af37]/10 p-4 text-sm leading-6 text-[#e9d89b]">
                      {oracleEvaluation.geometry_warning}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <OutputCard
                    label="Active Peak"
                    value={`(phi=${oracleEvaluation.active_peak.phi}, r=${oracleEvaluation.active_peak.r}, s=${oracleEvaluation.active_peak.s}, e=${oracleEvaluation.active_peak.e})`}
                    note="Peak state selected by the winning support plane."
                  />
                  <OutputCard
                    label="Regime"
                    value={oracleEvaluation.regime}
                    note={oracleEvaluation.facet_reason}
                  />
                  <OutputCard
                    label="Predicted M_min"
                    value={oracleEvaluation.envelope.m_min.toFixed(2)}
                    note={oracleEvaluation.envelope.formula}
                  />
                  <OutputCard
                    label="Current Envelope"
                    value={oracleEvaluation.envelope.current_value.toFixed(2)}
                    note={`Margin ${oracleEvaluation.envelope.margin >= 0 ? "+" : ""}${oracleEvaluation.envelope.margin.toFixed(2)} · Facet gap ${oracleEvaluation.support_gap.toFixed(2)}`}
                  />
                  <OutputCard
                    label="Contract"
                    value={oracleEvaluation.contract_label}
                    note={`${oracleEvaluation.source_contract} · ${oracleEvaluation.projection_mode === "3d" ? "3D kernel projected to 2D map" : "2D verified projection"}`}
                  />
                  <OutputCard
                    label="In Phi Attractor"
                    value={oracleEvaluation.in_phi_attractor ? "true" : "false"}
                    note={oracleEvaluation.law_phi_a.reason}
                  />
                  <OutputCard
                    label="Attractor"
                    value={oracleEvaluation.attractor_id ?? "none"}
                    note={`${oracleEvaluation.law_phi_a.symbolic} | Phi facets: ${oracleEvaluation.law_phi_a.governing_facets.join(", ") || "none"}`}
                  />
                  <OutputCard
                    label="Weights"
                    value={`(${oracleEvaluation.weights.c_phi.toFixed(2)}, ${oracleEvaluation.weights.c_r.toFixed(2)}, ${oracleEvaluation.weights.c_s.toFixed(2)})`}
                    note={`Ordered as C_phi, C_r, C_s. ${oracleEvaluation.law_phi_a.runtime_projection ? "Law phi-A is shown here as a runtime attractor projection." : ""}`}
                  />
                </div>
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                      <Gauge size={13} />
                      Geometry Surface
                    </div>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                      {oracleControls.surfaceMode === "advanced-3d"
                        ? "Projected 2D winner map from the 3D support family"
                        : "2D winner-region map with active point and kink line"}
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#dce7fb]">
                    {oracleEvaluation.kink_line}
                  </div>
                </div>

                <div className="mt-6">
                  <FacetRegionMap controls={oracleControls} evaluation={oracleEvaluation} />
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                  <Waves size={13} />
                  Runtime Trace
                </div>
                <div className="mt-4 space-y-3">
                  {hybridRuntime.trace.map((step, index) => (
                    <div
                      key={`${step}-${index}`}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                        Step {index + 1}
                      </span>
                      <span className="text-sm font-semibold tracking-wide text-white">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-[#b8cae6]">
                  Current jump path: <span className="font-semibold text-white">{hybridRuntime.mode}</span>
                  <MoveRight className="mx-2 inline-block" size={14} />
                  <span className="font-semibold text-white">{hybridRuntime.next_jump}</span>.
                </div>
              </Panel>
            </div>

            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                    <Archive size={13} />
                    Artifact / Dossier Drawer
                  </div>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Evidence linked to the active facet and current proof slice
                  </h3>
                </div>

                <Link
                  to={`/artifacts?facet=${oracleEvaluation.facet}&invariant=${encodeURIComponent(spotlightInvariantNames[0] ?? "GlobalEnvelope2D")}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/28 bg-[#d4af37]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#f7d76f] transition-colors hover:border-[#f7d76f]/50"
                >
                  <BookMarked size={13} />
                  Open Filtered Vault
                </Link>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {drawerArtifacts.map((artifact) => (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                          {artifact.type}
                        </div>
                        <div className="mt-2 text-xl font-black tracking-tight text-white">
                          {artifact.title}
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]">
                        {artifact.associatedFacets.join(", ")}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#b6cae6]">{artifact.summary}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#8bb6ff]">
                      Origin: {artifact.origin}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {artifact.associatedInvariants.slice(0, 3).map((invariant) => (
                        <span
                          key={invariant}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]"
                        >
                          {invariant}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <ShieldCheck size={13} />
                Proof Layer
              </div>
              <div className="mt-4 rounded-[20px] border border-[#6bcb77]/20 bg-[#6bcb77]/8 p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#9be2aa]">
                  Current Status
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">
                  {passCount} passing / {proofRecords.length - passCount} failing
                </div>
              </div>
            </Panel>

            {proofRecords.map((record) => (
              <ProofCard key={record.name} record={record} />
            ))}

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Sparkles size={13} />
                Trust Summary
              </div>
              <p className="mt-4 text-sm leading-6 text-[#b8cae6]">
                The workbench keeps the Oracle, Runtime, and Proof layers visible together so coefficient
                changes immediately show their operational and verification consequences.
              </p>
            </Panel>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] md:p-6"
    >
      {children}
    </motion.div>
  );
}

function StateLine({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-2 text-sm">
      <span className="uppercase tracking-[0.2em] text-[#8bb6ff]">{label}</span>
      <span className={`${mono ? "font-mono" : ""} font-semibold text-white`}>{value}</span>
    </div>
  );
}

function ThresholdLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#9eb5db]">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function MetricBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">{label}</div>
      <div className="mt-2 text-lg font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[10px] uppercase tracking-[0.26em] text-[#8bb6ff]">{label}</label>
        <span className="font-mono text-sm font-semibold text-white">{value.toFixed(step >= 1 ? 0 : 2)}</span>
      </div>
      <input
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#8bb6ff]"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function OutputCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.26em] text-[#8bb6ff]">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#a8bfdc]">{note}</div>
    </div>
  );
}

function ProofCard({
  record,
}: {
  record: ReturnType<typeof useCodex>["proofRecords"][number];
}) {
  const statusColor = record.status === "PASS" ? "#6bcb77" : "#ff8c8c";
  const checkedAt = new Date(record.last_checked_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.26em]" style={{ color: statusColor }}>
            {record.status}
          </div>
          <div className="mt-2 text-xl font-black tracking-tight text-white">{record.name}</div>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
          style={{ borderColor: `${statusColor}55`, color: statusColor }}
        >
          {record.source}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#b8cae6]">{record.detail}</p>
      <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
        Last checked: {checkedAt}
      </div>

      {record.witness ? (
        <div className="mt-4 rounded-[18px] border border-[#ff8c8c]/25 bg-[#ff8c8c]/8 p-4 text-sm leading-6 text-[#ffd6d6]">
          Counterexample: mode={record.witness.mode}, phi={record.witness.phi}, r={record.witness.r}, s=
          {record.witness.s}, e={record.witness.e}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {record.linked_artifacts.slice(0, 2).map((artifactId) => (
          <Link
            key={artifactId}
            to={`/artifacts?invariant=${encodeURIComponent(record.name)}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]"
          >
            linked artifact
          </Link>
        ))}
      </div>
    </Panel>
  );
}
