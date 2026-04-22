import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Cable,
  Compass,
  Database,
  Gauge,
  Network,
  Orbit,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MysticMapExplorer } from "../components/MysticMapExplorer";
import { useCodex } from "../context/CodexContext";
import { mysticMapData, omegaDossier } from "../data/omegaDossier";

const timelineColors = {
  issue: "#ff6b6b",
  warning: "#f7d76f",
  success: "#6bcb77",
} as const;

export default function HomePage() {
  const {
    meridian,
    phi,
    readiness,
    energy,
    focusMode,
    rateLimitState,
    runtimeMode,
    hybridRuntime,
    oracleEvaluation,
    proofRecords,
  } = useCodex();
  const liveEnvelope = energy + phi + readiness * 0.5;
  const passCount = proofRecords.filter((record) => record.status === "PASS").length;
  const attractorValue = oracleEvaluation.in_phi_attractor
    ? oracleEvaluation.attractor_id ?? "G_phi"
    : "Outside G_phi";

  const liveMetrics = [
    {
      label: "Runtime",
      value: runtimeMode === "live" ? "LIVE" : "DEMO",
      note:
        runtimeMode === "live"
          ? "Connected to the full operator runtime."
          : "Hosted public runtime with local simulation and archive-backed telemetry.",
    },
    {
      label: "Active Facet",
      value: oracleEvaluation.facet,
      note:
        oracleEvaluation.facet_reason,
    },
    {
      label: "Proof Layer",
      value: `${passCount}/${proofRecords.length}`,
      note:
        passCount === proofRecords.length
          ? "All surfaced invariants are passing in the current slice."
          : `${proofRecords.length - passCount} proof records currently need attention.`,
    },
    {
      label: "Envelope",
      value: liveEnvelope.toFixed(1),
      note: `Focus ${focusMode} • Guardrail posture ${rateLimitState}.`,
    },
  ];

  const surfaceSignals = [
    {
      label: "Attractor",
      value: attractorValue,
      note: oracleEvaluation.law_phi_a.reason,
    },
    {
      label: "Next Jump",
      value: hybridRuntime.next_jump,
      note: `${hybridRuntime.next_jump_steps} step${hybridRuntime.next_jump_steps === 1 ? "" : "s"} under current thresholds.`,
    },
    {
      label: "Contract",
      value: oracleEvaluation.contract_label,
      note: `${oracleEvaluation.source_contract} • ${oracleEvaluation.weights.c_phi.toFixed(2)}, ${oracleEvaluation.weights.c_r.toFixed(2)}, ${oracleEvaluation.weights.c_s.toFixed(2)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(212,175,55,0.12),_transparent_22%),linear-gradient(180deg,_rgba(8,16,30,0.95),_rgba(5,9,20,1))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:88px_88px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071120]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-[#8bb6ff]">
              <Orbit size={14} />
              Omega Core
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-white">
              Nexus Oracle Operator Surface
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.24em] text-[#b7c9ea] md:flex">
            <a href="#verification" className="transition-colors hover:text-white">
              Verification
            </a>
            <a href="#stability" className="transition-colors hover:text-white">
              Stability
            </a>
            <a href="#map" className="transition-colors hover:text-white">
              Map
            </a>
            <a href="#vault" className="transition-colors hover:text-white">
              Vault
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/oracle"
              className="rounded-full border border-[#8bb6ff]/30 bg-[#8bb6ff]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#d8e5fb] transition-colors hover:border-[#8bb6ff]/50 hover:text-white"
            >
              Oracle
            </Link>
            <Link
              to="/console"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#c5d9ff] transition-colors hover:border-[#8bb6ff]/50 hover:text-white"
            >
              Console
            </Link>
            <Link
              to="/lattice"
              className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#f7d76f] transition-colors hover:border-[#f7d76f]/50"
            >
              Lattice
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-8">
        <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)]"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8bb6ff]/30 bg-[#8bb6ff]/10 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#bcd4ff]">
              <ShieldCheck size={14} />
              Verified Surface
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-white md:text-7xl">
              Build the Nexus Oracle using the whole dossier, not fragments.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#c9d7ef]">
              {omegaDossier.subtitle}
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-[#9fb4d6]">
              {omegaDossier.narrative}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <RouteChip icon={<ScrollText size={14} />} text="74 curated artifacts" />
              <RouteChip icon={<Network size={14} />} text="67-node symbolic graph" />
              <RouteChip icon={<Waves size={14} />} text="Golden breath @ 2.618 s" />
              <RouteChip icon={<BrainCircuit size={14} />} text="MFCS + NexusHybrid + Mystic Map" />
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {liveMetrics.map((metric) => (
                <MetricBlock
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  note={metric.note}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {surfaceSignals.map((signal) => (
                <SignalTile
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  note={signal.note}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/oracle"
                className="inline-flex items-center gap-2 rounded-full bg-[#f7d76f] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#08111f] transition-transform hover:-translate-y-0.5"
              >
                Open Oracle Workbench
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/console"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#d8e5fb] transition-colors hover:border-[#8bb6ff]/50 hover:text-white"
              >
                Open Operator Console
              </Link>
              <Link
                to="/codex"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#d8e5fb] transition-colors hover:border-[#8bb6ff]/50 hover:text-white"
              >
                Browse Codex Vault
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            <ImageCard
              className="md:col-span-2 md:h-[340px]"
              src="/reference/polarity-balanced.png"
              label="Operator Poster"
              title="Polarity Balanced"
            />
            <ImageCard
              className="h-[250px]"
              src="/reference/lattice-architecture.png"
              label="System Diagram"
              title="MFCS Lattice Architecture"
            />
            <ImageCard
              className="h-[250px]"
              src="/reference/golden-breath.png"
              label="Telemetry Figure"
              title="Golden Breath Simulation"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {omegaDossier.headlineMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                {metric.label}
              </div>
              <div className="mt-4 text-4xl font-black tracking-tight text-white">
                {metric.value}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#9eb5db]">{metric.note}</p>
            </motion.div>
          ))}
        </section>

        <section id="verification" className="mt-20">
          <SectionHeading
            eyebrow="Verification Stack"
            title="The app now tells the proof story, the recovery story, and the final green state."
            body="Instead of leaving TLC and TLAPS outputs buried in downloads, Omega Core surfaces the failed iterations, the fix sequence, and the validated result as first-class product context."
          />

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <PanelCard>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                    TLC Progression
                  </div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                    v2 {"->"} v8 repair arc
                  </h3>
                </div>
                <div className="rounded-full border border-[#6bcb77]/30 bg-[#6bcb77]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#9be2aa]">
                  Final state green
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {omegaDossier.verificationTimeline.map((step) => (
                  <div
                    key={step.version}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
                        style={{
                          borderColor: `${timelineColors[step.status]}66`,
                          backgroundColor: `${timelineColors[step.status]}1a`,
                          color: timelineColors[step.status],
                        }}
                      >
                        {step.version}
                      </span>
                      {step.distinctStates ? (
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#9eb5db]">
                          {step.distinctStates} distinct - depth {step.depth}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#9eb5db]">
                          structural error surfaced
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#d5e1f8]">{step.headline}</p>
                  </div>
                ))}
              </div>
            </PanelCard>

            <div className="space-y-6">
              {omegaDossier.formalLayers.map((layer) => (
                <PanelCard key={layer.title}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#8bb6ff]">
                    <ShieldCheck size={14} />
                    {layer.title}
                  </div>
                  <p className="mt-4 text-base leading-7 text-[#d7e2f8]">{layer.summary}</p>
                  <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-[#9eb5db]">
                    Source: {layer.source}
                  </div>
                </PanelCard>
              ))}

              <PanelCard>
                <div className="text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                  Live MFCS Telemetry
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <TelemetryTile label="Momentum" value={meridian ? meridian.operationalMomentum.toFixed(1) : "75.0"} />
                  <TelemetryTile label="Pressure" value={meridian ? meridian.anomalyPressure.toFixed(1) : "15.0"} />
                  <TelemetryTile label="Phi" value={phi.toFixed(0)} />
                  <TelemetryTile label="Readiness" value={readiness.toFixed(0)} />
                </div>
              </PanelCard>
            </div>
          </div>
        </section>

        <section id="stability" className="mt-20">
          <SectionHeading
            eyebrow="Stability Front"
            title="The reports become live surfaces: envelope bounds, breath telemetry, and conserved resources."
            body="The original diagrams are still present as visuals, but the app now recreates the key stability relation and pairs it with the telemetry snapshot that motivated the SABR and resonance work."
          />

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <PanelCard>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                <Gauge size={14} />
                Weighted Envelope Sweep
              </div>
              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={omegaDossier.stabilityFront}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="coefficient"
                      stroke="#9eb5db"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#9eb5db"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "#071120",
                      }}
                      labelStyle={{ color: "#f7d76f" }}
                    />
                    <ReferenceLine y={15} stroke="rgba(247,215,111,0.25)" />
                    <Line
                      type="monotone"
                      dataKey="bound"
                      stroke="#8bb6ff"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#f7d76f", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#b4c8ef]">
                The curve matches the report's empirical law: <span className="font-mono text-white">M_min = 5C + 5</span>.
              </p>
            </PanelCard>

            <div className="grid gap-6">
              <PanelCard>
                <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                      <Waves size={14} />
                      Golden Breath Snapshot
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <TelemetryTile label="Resonance" value={`${omegaDossier.liveSnapshot.resonanceHz} Hz`} />
                      <TelemetryTile label="Cycle" value={`${omegaDossier.liveSnapshot.cyclePeriodSeconds} s`} />
                      <TelemetryTile label="Drift" value={`${omegaDossier.liveSnapshot.driftPpm} ppm`} />
                      <TelemetryTile label="Noise Floor" value={`${omegaDossier.liveSnapshot.noiseFloorDbfs} dBFS`} />
                      <TelemetryTile label="SABR" value={omegaDossier.liveSnapshot.sabrState} />
                      <TelemetryTile label="Score" value={omegaDossier.liveSnapshot.score.toFixed(1)} />
                    </div>

                    <div className="mt-6 h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { name: "phi", value: Math.max(phi, 12) },
                            { name: "readiness", value: Math.max(readiness, 18) },
                            { name: "energy", value: Math.max(energy, 22) },
                          ]}
                        >
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                          <XAxis dataKey="name" stroke="#9eb5db" tickLine={false} axisLine={false} />
                          <YAxis hide />
                          <Area type="monotone" dataKey="value" stroke="#f7d76f" fill="#f7d76f33" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <img
                    src="/reference/golden-breath.png"
                    alt="MFCS Golden Breath Simulation"
                    className="h-full min-h-[280px] w-full rounded-[24px] border border-white/10 object-cover"
                  />
                </div>
              </PanelCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <ImageCard
                  className="h-[240px]"
                  src="/reference/stability-front.webp"
                  label="Report Figure"
                  title="Envelope Stability Front"
                />
                <ImageCard
                  className="h-[240px]"
                  src="/reference/lattice-architecture.png"
                  label="Architecture Figure"
                  title="Stations - SABR - Resonance Lock"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="map" className="mt-20">
          <SectionHeading
            eyebrow="Mystic Map"
            title="The 67-node symbolic graph is now interactive inside the app."
            body="The Lattice route is no longer just a stylized field. The actual node registry, guardian domains, condition names, and transition topology now drive the explorer."
          />

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.38fr_0.62fr]">
            <div className="space-y-6">
              <PanelCard>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                  <Compass size={14} />
                  Guardian Distribution
                </div>

                <div className="mt-6 space-y-4">
                  {omegaDossier.guardianSummaries.map((entry) => (
                    <div key={entry.guardian}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#d7e2f8]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.guardian}
                        </div>
                        <span className="font-mono text-[#9eb5db]">
                          {entry.count} nodes - {entry.share}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${entry.share}%`, backgroundColor: entry.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>

              <PanelCard>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                  <Cable size={14} />
                  Transition Families
                </div>
                <div className="mt-6 space-y-3">
                  {omegaDossier.transitionConditionSummaries.map((entry) => (
                    <div
                      key={entry.condition}
                      className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                    >
                      <span className="text-[#d7e2f8]">{entry.condition.replaceAll("_", " ")}</span>
                      <span className="font-mono text-[#9eb5db]">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </PanelCard>
            </div>

            <MysticMapExplorer data={mysticMapData} compact />
          </div>
        </section>

        <section id="vault" className="mt-20">
          <SectionHeading
            eyebrow="Codex Vault"
            title="Reports, proofs, decks, diagrams, and raw assets are grouped into a browseable archive."
            body="This is the part of the app that turns the download pile into an intelligible corpus: grouped by function, summarized for quick scanning, and linked to the routes that use the material."
          />

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {omegaDossier.artifactGroups.map((group) => (
              <PanelCard key={group.title}>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                    {group.title}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#d7e2f8]">
                    {group.count} items
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#b4c8ef]">{group.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </PanelCard>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {omegaDossier.dossierCards.map((card) => (
              <PanelCard key={card.title}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#8bb6ff]">
                  <BookOpen size={14} />
                  {card.title}
                </div>
                <p className="mt-4 text-base leading-7 text-[#d7e2f8]">{card.excerpt}</p>
                <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[#9eb5db]">
                  {card.source}
                </div>
              </PanelCard>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-8 xl:grid-cols-[0.58fr_0.42fr]">
          <PanelCard>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
              <Sparkles size={14} />
              Integration Tracks
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {omegaDossier.integrationTracks.map((track) => (
                <div
                  key={track.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="text-lg font-black tracking-tight text-white">{track.title}</div>
                  <p className="mt-3 text-sm leading-6 text-[#b4c8ef]">{track.detail}</p>
                </div>
              ))}
            </div>
          </PanelCard>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <ImageCard
              className="h-[280px]"
              src="/reference/guardian-marks.png"
              label="Identity Study"
              title="Guardian Mark Explorations"
            />
            <ImageCard
              className="h-[280px]"
              src="/reference/mystic-map-night.png"
              label="Night Variant"
              title="Mystic Map Render"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-4xl">
      <div className="text-[11px] uppercase tracking-[0.34em] text-[#8bb6ff]">{eyebrow}</div>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#a8bddd]">{body}</p>
    </div>
  );
}

function PanelCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
    >
      {children}
    </motion.div>
  );
}

function MetricBlock({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-[#8bb6ff]">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#9fb4d6]">{note}</div>
    </div>
  );
}

function TelemetryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">{label}</div>
      <div className="mt-3 text-xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function RouteChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#d8e5fb]">
      {icon}
      {text}
    </div>
  );
}

function SignalTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#081120]/70 p-4">
      <div className="text-[10px] uppercase tracking-[0.26em] text-[#f7d76f]">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#a9bfdc]">{note}</div>
    </div>
  );
}

function ImageCard({
  src,
  label,
  title,
  className,
}: {
  src: string;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1222] ${className ?? ""}`}
    >
      <img
        src={src}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071120] via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#8bb6ff]">{label}</div>
        <div className="mt-2 text-xl font-black tracking-tight text-white">{title}</div>
      </div>
    </motion.div>
  );
}
