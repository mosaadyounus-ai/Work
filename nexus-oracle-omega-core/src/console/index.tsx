import React from "react";
import { StatusHeader } from "./components/StatusHeader";
import { SignalPanel } from "./components/SignalPanel";
import { TraceTimeline } from "./components/TraceTimeline";
import { ResiliencePanel } from "./components/ResiliencePanel";
import { GuardrailsPanel } from "./components/GuardrailsPanel";
import { useSignalStream } from "./hooks/useSignalStream";
import { useCodexRuntime } from "./hooks/useCodexRuntime";
import { useResilienceState } from "./hooks/useResilienceState";
import { usePlayback } from "./hooks/usePlayback";
import { DEFAULT_PLATES } from "../lib/codex/engine";
import { Link } from "react-router-dom";
import { ChevronLeft, Play, Pause, RotateCcw, FastForward, Rewind, History, Zap, Bookmark, LayoutDashboard, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useCodex } from "../context/CodexContext";

export const OperatorConsole: React.FC = () => {
  const { codexHistory } = useCodex();
  const { signal, alignment } = useSignalStream();
  const { currentPlate, currentOperator } = useCodexRuntime();
  const resilience = useResilienceState();
  const [isPlaybackMode, setIsPlaybackMode] = React.useState(false);
  
  const { state: playback, currentStep: pStep, controls } = usePlayback(codexHistory);

  const activePlateId = isPlaybackMode ? pStep?.plateId : currentPlate;
  const activePlate = DEFAULT_PLATES.find(p => p.id === activePlateId);
  const plateName = activePlate?.name || null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#05070a] text-[#00eaff] font-mono flex flex-col selection:bg-[#00eaff] selection:text-[#05070a]"
    >
      <StatusHeader
        plateId={activePlateId || null}
        plateName={plateName}
        operator={currentOperator}
        rateLimitState={resilience.rateLimitState}
      />

      <div className="p-8 pb-4 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <Link to="/oracle" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <ChevronLeft size={14} />
               [ Return_to_Oracle ]
            </Link>

            <Link to="/lattice" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <LayoutDashboard size={12} className="rotate-45" />
               [ View_Lattice ]
            </Link>

            <Link to="/proof" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <ShieldCheck size={12} />
               [ View_Proof ]
            </Link>

            <Link to="/artifacts" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
               <Bookmark size={12} />
               [ View_Artifacts ]
            </Link>
            
            <div className="h-4 w-[1px] bg-[#1a3a45]" />
            
            <button 
              onClick={() => setIsPlaybackMode(!isPlaybackMode)}
              className={`flex items-center gap-2 text-[10px] uppercase tracking-widest border px-3 py-1 rounded-xs transition-all ${
                isPlaybackMode ? "border-[#00ff41] text-[#00ff41] bg-[#00ff4108]" : "border-[#1a3a45] opacity-40"
              }`}
            >
              <History size={12} />
              {isPlaybackMode ? "Playback_Engaged" : "Live_Stream_Active"}
            </button>
         </div>
         
         {isPlaybackMode && (
           <div className="flex items-center gap-4 bg-[#00ff4105] border border-[#00ff4133] p-1 px-3 rounded-full">
              <button onClick={controls.reset} className="p-1 hover:text-[#00ff41]"><RotateCcw size={14} /></button>
              <button onClick={controls.prev} className="p-1 hover:text-[#00ff41]"><Rewind size={14} /></button>
              <button onClick={playback.active ? controls.pause : controls.play} className="p-1 hover:text-[#00ff41]">
                {playback.active ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={controls.next} className="p-1 hover:text-[#00ff41]"><FastForward size={14} /></button>
              <div className="text-[10px] font-bold text-[#00ff41] ml-2">
                {playback.index + 1} / {codexHistory.length}
              </div>
           </div>
         )}
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 pt-0 overflow-hidden">
        {/* Left Column (Resilience & Guardrails) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <ResiliencePanel state={resilience} />
           <GuardrailsPanel />
        </div>

        {/* Center Column (Signal & Alignment) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <SignalPanel 
             signal={isPlaybackMode ? {
               id: pStep?.signalId || "",
               name: "Playback Signal",
               momentum: pStep?.context?.momentum || 0,
               volatility: pStep?.context?.volatility || 0,
               source: "history_replay",
               timestamp: pStep?.timestamp || ""
             } : signal} 
             alignment={isPlaybackMode ? {
               plateId: pStep?.plateId || "I",
               reason: "Historical context replay"
             } : alignment} 
           />
           
           <div className="mt-auto bg-[#00eaff05] border border-[#1a3a45] p-6 rounded-sm space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#00eaff]" />
                <h3 className="text-[10px] uppercase tracking-widest text-[#8899a6]">Strategic_Lab_Core</h3>
              </div>
              <div className="text-[11px] opacity-60 leading-relaxed font-mono">
                 Lab Mode active. Current session state is optimized for recursive inspection. 
                 Use playback for longitudinal analysis or anchor judgment via annotations.
              </div>
              <div className="flex gap-2">
                 <div className={`w-2 h-2 rounded-full ${isPlaybackMode ? 'bg-[#00ff41]' : 'bg-[#00eaff33]'}`} />
                 <div className={`w-2 h-2 rounded-full ${!isPlaybackMode ? 'bg-[#00eaff] animate-pulse' : 'bg-[#00eaff33]'}`} />
                 <div className="w-2 h-2 bg-[#ff3b3b33] rounded-full" />
              </div>
           </div>
        </div>

        {/* Right Column (Trace Timeline) */}
        <div className="lg:col-span-5 overflow-hidden border-l border-[#1a3a4533] pl-6">
           <TraceTimeline steps={codexHistory} />
        </div>
      </main>

      <footer className="border-t border-[#1a3a45] p-4 px-8 bg-[#00eaff03]">
         <div className="flex justify-between items-baseline">
            <div className="text-[9px] opacity-30 uppercase tracking-[0.2em]">Strategic_Lab // Experimental_Vault // 001</div>
            <div className="flex gap-6 text-[8px] opacity-40 uppercase">
               <span>Lattice: {isPlaybackMode ? "BUFFERED" : "LOCKED"}</span>
               <span>Anchor: {isPlaybackMode ? "EPHEMERAL" : "STABLE"}</span>
               <span>Records: {codexHistory.length}</span>
            </div>
         </div>
      </footer>
    </motion.div>
  );
};
