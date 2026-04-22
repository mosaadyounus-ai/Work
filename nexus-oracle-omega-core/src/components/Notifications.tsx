import React from "react";
import { useCodex } from "../context/CodexContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Cpu, History, ChevronRight, Sparkles, X } from "lucide-react";

export default function Notifications() {
  const { lastAck, predictions, trace, oracleInsight, isAnalyzing } = useCodex();

  return (
    <div className="fixed bottom-24 right-6 w-72 pointer-events-none flex flex-col gap-4">
      <AnimatePresence>
        {/* Command ACKs */}
        {lastAck && (
          <motion.div
            key={lastAck.timestamp}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="pointer-events-auto glass-panel border-l-2 border-[#00ff41] p-3 shadow-xl space-y-2 glow-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00ff41]">
                <CheckCircle2 size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Protocol_ACK</span>
              </div>
              <span className="text-[8px] opacity-30 font-mono italic">
                {new Date(lastAck.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-[10px] text-white uppercase tracking-tight">
              {lastAck.result || `Action ${lastAck.action} executed successfully.`}
            </div>
          </motion.div>
        )}

        {/* Prediction Intelligence */}
        {predictions.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto glass-panel border-l-2 border-[#ffcc00] p-3 shadow-xl space-y-3 glow-border"
          >
            <div className="flex items-center gap-2 text-[#ffcc00]">
              <Cpu size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Foresight_Engine</span>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] text-white uppercase flex justify-between">
                <span>Simulated Steps</span>
                <span className="text-[#ffcc00] font-mono">{predictions.length}</span>
              </div>
              <div className="w-full bg-[#1a3a45] h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5 }}
                  className="bg-[#ffcc00] h-full" 
                />
              </div>
              <div className="text-[8px] text-[#8899a6] leading-relaxed italic uppercase italic">
                Zero-bleed simulation confirmed. Ghost futures show resonance stability at 82%.
              </div>
            </div>
          </motion.div>
        )}

        {/* Trace Diagnostics */}
        {trace.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto glass-panel border-l-2 border-[#00eaff] p-3 shadow-xl glow-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#00eaff]">
                <History size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Archive_Trace</span>
              </div>
              <div className="text-[8px] opacity-40 font-mono">{trace.length}pts</div>
            </div>
            
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
              {trace.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-[8px] uppercase tracking-tighter hover:bg-[#00eaff11] p-1 rounded-xs transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="opacity-40">T-{entry.tick}</span>
                    <span className="text-white font-mono truncate max-w-[80px]">{(entry.hash || 'null').slice(0, 8)}</span>
                  </div>
                  <ChevronRight size={8} className="text-[#00eaff] opacity-40" />
                </div>
              ))}
              {trace.length > 5 && (
                <div className="text-[7px] text-center opacity-40 italic mt-2">
                  ... {trace.length - 5} additional forensic points
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Oracle Strategic Insight */}
        {oracleInsight && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="pointer-events-auto glass-panel-heavy border border-[#00eaff44] p-5 shadow-2xl relative overflow-hidden glow-border"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00eaff] to-transparent" />
            
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-[#00eaff]">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Oracle_Inference</span>
               </div>
               <div className="px-2 py-0.5 bg-[#00eaff22] border border-[#00eaff33] text-[8px] text-[#00eaff] font-bold">
                  {oracleInsight.strategicPosture}
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[11px] text-white/90 leading-relaxed uppercase tracking-tight italic">
                  "{oracleInsight.synthesis}"
               </p>

               <div className="space-y-2">
                  <div className="text-[8px] text-[#8899a6] uppercase font-black tracking-widest">Identified_Risks</div>
                  {oracleInsight.risks.map((risk: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[9px] text-[#ff3b3b] uppercase">
                       <span className="opacity-40">[{i+1}]</span>
                       <span>{risk}</span>
                    </div>
                  ))}
               </div>

               <div className="space-y-2">
                  <div className="text-[8px] text-[#8899a6] uppercase font-black tracking-widest">Tactical_Directives</div>
                  {oracleInsight.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[9px] text-[#00ff41] uppercase">
                       <span className="opacity-40">{">"}</span>
                       <span>{rec}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1a3a45] flex justify-between items-center opacity-40">
               <span className="text-[7px] uppercase tracking-widest">Source: Gemini 3.0 Flash // Grounding: Standard</span>
               <span className="text-[7px] font-mono">ID: {Math.random().toString(36).slice(2, 10)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
