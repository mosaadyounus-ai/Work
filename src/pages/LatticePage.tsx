import type { ReactNode } from "react";
import { useCodex } from "../context/CodexContext";
import LatticeScene from "../components/3d/LatticeScene";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Share2, Target, Zap, LayoutGrid, AlertCircle, TrendingUp, Cpu } from "lucide-react";
import CommandInput from "../components/CommandInput";
import Notifications from "../components/Notifications";

export default function LatticePage() {
  const {
    meridian,
    focusMode,
    setFocusMode,
    selectedSignalId,
    setSelectedSignal,
    phi,
    readiness,
    energy,
    rateLimitState
  } = useCodex();

  const state = meridian
    ? {
        telemetry: {
          SVI: meridian.vitalityIndex,
          OM: meridian.operationalMomentum,
          AP: meridian.anomalyPressure,
          pathMap: meridian.pathMap
        },
        ui: {
          selectedSignalId,
          focusMode
        }
      }
    : null;

  const handleSelectNode = (id: string) => {
    setSelectedSignal(id);
  };

  if (!state) {
    return (
      <div className="h-screen w-full bg-[#02050a] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-[#33e7ff] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-[10px] text-[#33e7ff] uppercase tracking-[0.4em] font-black animate-pulse">
            Initializing_Chorus_Field
          </div>
        </div>
      </div>
    );
  }

  const envelopeWeight = energy + phi + readiness * 0.5;
  const activePathCount = [
    ...state.telemetry.pathMap.north,
    ...state.telemetry.pathMap.east,
    ...state.telemetry.pathMap.south,
    ...state.telemetry.pathMap.west
  ].filter((path) => path.value > 72).length;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#02050a] text-white">
      <div className="absolute inset-0">
        <LatticeScene state={state} onSelectNode={handleSelectNode} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(51,231,255,0.05)_0%,_rgba(2,5,10,0)_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#02060de6] via-[#02060d88] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#02060de6] to-transparent" />

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <CommandInput />
      </div>

      <div className="absolute top-8 right-8 z-50 hidden md:flex items-center gap-4 pointer-events-none">
        <div className="text-right">
          <div className="text-[10px] font-display font-black tracking-[0.52em] text-[#33e7ff] leading-none">
            CHORUS
          </div>
          <div className="text-[8px] font-mono tracking-[0.28em] text-[#7e9ca9] mt-1 uppercase">
            Meridian_Core
          </div>
        </div>
        <div className="w-12 h-12 rounded-full border border-[#17313c] bg-[#33e7ff0d] flex items-center justify-center text-[#33e7ff] glow-border">
          <Share2 size={18} />
        </div>
      </div>

      <div className="absolute top-28 left-6 z-40 w-[19rem] pointer-events-none">
        <div className="glass-panel chorus-panel glow-border p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.34em] text-[#7e9ca9] font-black">System_Vitality</div>
              <div className="mt-2 text-[8px] uppercase tracking-[0.26em] text-[#33e7ff]">
                Active Voices // {activePathCount}
              </div>
            </div>
            {rateLimitState === "THROTTLED" && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#ff4d6422] border border-[#ff4d6444] rounded-full">
                <AlertCircle size={8} className="text-[#ff4d64] animate-pulse" />
                <span className="text-[7px] text-[#ff4d64] font-bold uppercase tracking-[0.18em]">Throttled</span>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <MetricTag label="Vitality" value={state.telemetry.SVI} color="#33e7ff" />
            <MetricTag label="Momentum" value={state.telemetry.OM} color="#ffcb4c" />
            <MetricTag label="Pressure" value={state.telemetry.AP} color="#ff4d64" />
          </div>

          <div className="pt-5 border-t border-[#17313c] space-y-4">
            <div className="text-[9px] uppercase tracking-[0.34em] text-[#7e9ca9] font-black">Stability_Conservation</div>

            <ResourceBar label="Phase_Poten" value={phi} max={100} color="#33e7ff" icon={<Activity size={10} />} />
            <ResourceBar label="Readiness" value={readiness} max={100} color="#18ff9c" icon={<TrendingUp size={10} />} />
            <ResourceBar label="Kinetic_En" value={energy} max={100} color="#ffcb4c" icon={<Zap size={10} />} />

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[7px] tracking-[0.22em] uppercase text-[#7e9ca9]">
                <span>Recovery_Buffer</span>
                <span className="text-[#18ff9c]">Active</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 ${i < meridian.vitalityIndex / 10 ? "bg-[#18ff9c]" : "bg-[#17313c]"} rounded-full`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#33e7ff08] border border-[#33e7ff22] rounded-[2px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[7px] uppercase tracking-[0.2em] text-[#7e9ca9]">Envelope_W</span>
                <span className="text-[8px] font-mono text-[#33e7ff]">{envelopeWeight.toFixed(1)} / 150</span>
              </div>
              <div className="w-full h-1 bg-[#17313c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#33e7ff] via-[#18ff9c] to-[#ff4d64]"
                  style={{ width: `${Math.min(100, envelopeWeight / 1.5)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.ui.selectedSignalId && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="absolute right-6 top-28 z-40 w-[21rem] pointer-events-auto"
          >
            <div className="glass-panel-heavy chorus-panel p-6 border border-[#33e7ff22] glow-border space-y-6">
              <div className="border-b border-[#33e7ff33] pb-4">
                <h2 className="text-[10px] uppercase tracking-[0.32em] text-[#33e7ff] opacity-70 mb-2 font-black">
                  Node_Focus_Engaged
                </h2>
                <div className="text-xl text-white font-black tracking-[0.08em] uppercase">{state.ui.selectedSignalId}</div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-[8px] uppercase tracking-[0.22em] text-[#7e9ca9] font-bold">Resonance_Sync</div>
                  <div className="w-full h-1 bg-[#17313c] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      className="h-full bg-gradient-to-r from-[#33e7ff] to-[#18ff9c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#05080d] p-3 border border-[#17313c]">
                    <div className="text-[7px] text-[#7e9ca9] uppercase mb-1 tracking-[0.18em]">State</div>
                    <div className="text-sm font-bold text-[#18ff9c]">Nominal</div>
                  </div>
                  <div className="bg-[#05080d] p-3 border border-[#17313c]">
                    <div className="text-[7px] text-[#7e9ca9] uppercase mb-1 tracking-[0.18em]">Drift</div>
                    <div className="text-sm font-bold text-[#ffcb4c]">Corrected</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-[#17313c]">
                <h3 className="text-[9px] uppercase tracking-[0.24em] text-[#33e7ff] font-bold">Autonomous_Operator_Logs</h3>
                <div className="space-y-2.5">
                  <LogItem text="node_activation_sequence_complete" time="0.4ms" />
                  <LogItem text="chorus_alignment_stable" time="1.2ms" />
                  <LogItem text="drift_anomaly_detected_and_purged" time="2.8ms" color="text-[#ff4d64]" />
                </div>
              </div>

              <button
                onClick={() => handleSelectNode("")}
                className="w-full py-3 border border-[#ff4d6444] text-[#ff4d64] text-[9px] uppercase font-black tracking-[0.28em] hover:bg-[#ff4d6411] transition-colors"
              >
                Disengage_Focus
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-8 glass-panel-heavy chorus-panel border border-[#33e7ff22] px-10 py-4 rounded-[2px] pointer-events-auto">
        <ModeIcon active={focusMode === "SCAN"} icon={<LayoutGrid size={14} />} label="Scan" onClick={() => setFocusMode("SCAN")} />
        <ModeIcon active={focusMode === "FOCUS"} icon={<Target size={14} />} label="Focus" onClick={() => setFocusMode("FOCUS")} />
        <ModeIcon active={focusMode === "SIMULATE"} icon={<Cpu size={14} />} label="Sim" onClick={() => setFocusMode("SIMULATE")} />
      </div>

      <Notifications />
    </div>
  );
}

function ResourceBar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[7px] tracking-[0.22em] uppercase">
        <div className="flex items-center gap-1.5 text-[#7e9ca9]">
          {icon}
          <span>{label}</span>
        </div>
        <span style={{ color }}>{value.toFixed(0)}</span>
      </div>
      <div className="w-full h-0.5 bg-[#17313c] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ModeIcon({ icon, label, onClick, active }: { icon: ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group transition-all ${active ? "scale-105" : "opacity-40 hover:opacity-90"}`}
    >
      <div className={`transition-colors ${active ? "text-[#33e7ff]" : "text-[#7e9ca9]"}`}>{icon}</div>
      <span className={`text-[7px] uppercase tracking-[0.24em] ${active ? "text-[#33e7ff] font-black" : "text-[#7e9ca9]"}`}>
        {label}
      </span>
      {active && <motion.div layoutId="lattice-mode-indicator" className="w-5 h-[1px] bg-[#33e7ff]" />}
    </button>
  );
}

function MetricTag({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[7px] uppercase tracking-[0.34em] text-[#7e9ca9] font-black">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-0.5 bg-[#17313c] overflow-hidden">
          <div className="h-full" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className="text-[10px] font-mono font-bold min-w-10 text-right" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function LogItem({ text, time, color = "text-[#7e9ca9]" }: { text: string; time: string; color?: string }) {
  return (
    <div className="flex justify-between items-center bg-[#05080d] p-2.5 border border-[#17313c]">
      <span className={`text-[8px] uppercase tracking-tight ${color}`}>{text}</span>
      <span className="text-[7px] opacity-30 font-mono">{time}</span>
    </div>
  );
}
