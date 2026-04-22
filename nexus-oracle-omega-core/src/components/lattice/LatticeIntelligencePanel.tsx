import { Lock, Waves } from "lucide-react";
import { type HarmonicDisplayRow, type NoteAnchor } from "../../lib/frequency-map";

export function LatticeIntelligencePanel({
  shells,
  noteAnchor,
  vitality,
  momentum,
  pressure,
  envelope,
  hybridMode,
  integration,
  nextJump,
  phi,
  readiness,
  energy,
}: {
  shells: HarmonicDisplayRow[];
  noteAnchor: NoteAnchor;
  vitality: number;
  momentum: number;
  pressure: number;
  envelope: number;
  hybridMode: string;
  integration: number;
  nextJump: string;
  phi: number;
  readiness: number;
  energy: number;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f7d76f]">
          <Waves size={13} />
          Intelligence Layer
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {shells.map((shell) => (
              <div
                key={shell.role}
                className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: shell.color }}>
                      {shell.label}
                    </div>
                    <div className="mt-2 text-lg font-black tracking-tight text-white">
                      {shell.hz.toFixed(2)} Hz
                    </div>
                  </div>
                  <div className="text-right text-[11px] uppercase tracking-[0.2em] text-[#9eb5db]">
                    <div>{shell.nodeCount} nodes</div>
                    <div className="mt-1">r={shell.radius.toFixed(1)}u</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#d7e2f8]">
                  <span>amp {shell.amplitude.toFixed(2)}</span>
                  <span>coh {shell.coherence.toFixed(2)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#8fa8cb]">{shell.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <MetricTile label="Nearest Note" value={noteAnchor.label} />
            <MetricTile label="Reference Hz" value={`${noteAnchor.referenceHz.toFixed(2)} Hz`} />
            <MetricTile label="Period" value={`${noteAnchor.periodMs.toFixed(2)} ms`} />
            <MetricTile label="Envelope" value={envelope.toFixed(2)} />
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f7d76f]">
          <Lock size={13} />
          Runtime Bias
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="SVI" value={vitality.toFixed(1)} />
          <MetricTile label="Momentum" value={momentum.toFixed(1)} />
          <MetricTile label="Pressure" value={pressure.toFixed(1)} />
          <MetricTile label="Hybrid Mode" value={hybridMode} />
        </div>
        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
            Integration Trace
          </div>
          <div className="mt-3 text-sm leading-6 text-[#d7e2f8]">
            integ {integration} / next {nextJump}
          </div>
          <div className="mt-3 text-sm leading-6 text-[#8fa8cb]">
            phi {phi.toFixed(1)} / readiness {readiness.toFixed(1)} / energy {energy.toFixed(1)}
          </div>
        </div>
      </div>
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
