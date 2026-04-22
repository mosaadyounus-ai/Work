import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, Database, ShieldCheck, Workflow } from "lucide-react";
import { OperatorTopNav } from "../components/OperatorTopNav";
import { useCodex } from "../context/CodexContext";
import { operatorArtifacts } from "../data/operatorArtifacts";
import { omegaDossier } from "../data/omegaDossier";

export default function ProofPage() {
  const { proofRecords, hybridRuntime, oracleEvaluation } = useCodex();
  const failedRecord = proofRecords.find((record) => record.status === "FAIL") ?? null;
  const passing = proofRecords.filter((record) => record.status === "PASS").length;
  const linkedArtifacts = operatorArtifacts.filter((artifact) =>
    artifact.associatedInvariants.some((invariant) => proofRecords.some((record) => record.name === invariant)),
  );

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_24%),radial-gradient(circle_at_80%_0%,_rgba(107,203,119,0.11),_transparent_24%),linear-gradient(180deg,_rgba(8,16,30,0.95),_rgba(5,9,20,1))]" />

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 pb-10 pt-6 md:px-6">
        <OperatorTopNav
          title="Proof Surface"
          subtitle="Inspect invariant status, latest proof evidence, counterexamples, and the supporting artifact chain behind the live operator surface."
          badge={`${passing} / ${proofRecords.length} checks passing`}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
          <div className="space-y-6">
            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <ShieldCheck size={13} />
                Verification Summary
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryTile label="Passing" value={passing.toString()} icon={<CheckCircle2 size={16} />} tone="#6bcb77" />
                <SummaryTile label="Failing" value={(proofRecords.length - passing).toString()} icon={<AlertTriangle size={16} />} tone="#ff8c8c" />
                <SummaryTile label="Active Facet" value={oracleEvaluation.facet} icon={<Workflow size={16} />} tone="#8bb6ff" />
                <SummaryTile label="Runtime Mode" value={hybridRuntime.mode} icon={<Clock3 size={16} />} tone="#f7d76f" />
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Database size={13} />
                Latest TLC Arc
              </div>
              <div className="mt-4 space-y-3">
                {omegaDossier.verificationTimeline.map((step) => (
                  <div
                    key={step.version}
                    className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                        {step.version}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]">
                        {step.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#b7cae7]">{step.headline}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">Witness Focus</div>
              <div className="mt-4 text-sm leading-6 text-[#c8d8f0]">
                {failedRecord?.witness ? (
                  <>
                    Current counterexample candidate: mode={failedRecord.witness.mode}, phi=
                    {failedRecord.witness.phi}, r={failedRecord.witness.r}, s={failedRecord.witness.s}, e=
                    {failedRecord.witness.e}, integ={failedRecord.witness.integ}.
                  </>
                ) : (
                  <>
                    No live failing witness is exposed right now. The active runtime remains inside the
                    proof-valid corridor for the currently selected coefficients.
                  </>
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {proofRecords.map((record) => {
                const statusColor = record.status === "PASS" ? "#6bcb77" : "#ff8c8c";
                return (
                  <motion.div
                    key={record.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: statusColor }}>
                          {record.status}
                        </div>
                        <div className="mt-2 text-xl font-black tracking-tight text-white">{record.name}</div>
                      </div>
                      <span
                        className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                        style={{ borderColor: `${statusColor}55`, color: statusColor }}
                      >
                        {record.source}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[#b8cae6]">{record.detail}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                      Last checked: {new Date(record.last_checked_at).toLocaleString("en-US")}
                    </div>

                    {record.witness ? (
                      <div className="mt-4 rounded-[18px] border border-[#ff8c8c]/25 bg-[#ff8c8c]/8 p-4 text-sm leading-6 text-[#ffd8d8]">
                        mode={record.witness.mode}, phi={record.witness.phi}, r={record.witness.r}, s=
                        {record.witness.s}, e={record.witness.e}, integ={record.witness.integ}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[18px] border border-[#6bcb77]/20 bg-[#6bcb77]/8 p-4 text-sm leading-6 text-[#cff6d6]">
                        Witness: live runtime is consistent with the stored proof corridor for this check.
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {record.linked_artifacts.slice(0, 3).map((artifactId) => (
                        <Link
                          key={artifactId}
                          to={`/artifacts?invariant=${encodeURIComponent(record.name)}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]"
                        >
                          supporting artifact
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Panel>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">Source Layers</div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {omegaDossier.formalLayers.map((layer) => (
                  <div
                    key={layer.title}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-lg font-black tracking-tight text-white">{layer.title}</div>
                    <p className="mt-3 text-sm leading-6 text-[#b8cae6]">{layer.summary}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8bb6ff]">
                      {layer.source}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">Artifact Coverage</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {linkedArtifacts.slice(0, 6).map((artifact) => (
                  <div
                    key={artifact.id}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                      {artifact.type}
                    </div>
                    <div className="mt-2 text-lg font-black tracking-tight text-white">{artifact.title}</div>
                    <p className="mt-2 text-sm leading-6 text-[#b8cae6]">{artifact.summary}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
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
      className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] md:p-6"
    >
      {children}
    </motion.div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: tone }}>
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}
