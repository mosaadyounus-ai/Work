import React from "react";
import { useCompletion } from "@ai-sdk/react";
import { Terminal, BrainCircuit, Loader2, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const StrategicAdvisor: React.FC = () => {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/advisor",
    onFinish: () => {
      console.log("[ADVISOR] Strategic Briefing Complete.");
    },
    onError: (err) => {
      console.error("[ADVISOR_ERR]", err);
    }
  });

  const handleRequestBriefing = () => {
    complete("Execute a high-fidelity strategic audit of the CHORUS lattice current state. Focus on variance mitigation, stability conservation, and resonance optimization.");
  };

  return (
    <div className="bg-[#05070a] border border-[#1a3a45] rounded-sm p-4 space-y-4 shadow-[0_0_20px_rgba(0,234,255,0.05)]">
      <div className="flex justify-between items-center border-b border-[#1a3a45] pb-2">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-[#00eaff]" />
          <h4 className="text-[10px] uppercase tracking-widest text-[#00eaff] font-bold">Strategic_Chorus_Advisor</h4>
        </div>
        {!isLoading && (
          <button 
            onClick={handleRequestBriefing}
            className="text-[8px] uppercase bg-[#00eaff22] hover:bg-[#00eaff33] text-[#00eaff] px-2 py-1 rounded-xs flex items-center gap-1 transition-all"
          >
            <PlayCircle size={10} />
            Request_Briefing
          </button>
        )}
      </div>

      <div className="min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar bg-[#00eaff03] p-3 rounded-xs border border-[#1a3a4533]">
        <AnimatePresence mode="wait">
          {!completion && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
              <Terminal size={24} className="mb-2" />
              <p className="text-[9px] uppercase tracking-widest font-mono text-center">Chorus_Advisor_Standby // Waiting for Initialization Intent...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] leading-relaxed text-[#8899a6] uppercase tracking-tight font-mono"
            >
              <div className="flex items-center gap-2 mb-2 text-[#fff] opacity-60">
                 <Terminal size={10} />
                 <span>[STREMAING_INFERENCE_DATA]</span>
              </div>
              <p className="whitespace-pre-wrap">{completion}</p>
              {isLoading && (
                <span className="inline-block w-1.5 h-3 bg-[#00eaff] animate-pulse ml-1 align-middle" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-[8px] opacity-40 uppercase tracking-widest">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-[#00ff41] animate-ping' : 'bg-[#1a3a45]'}`} />
            {isLoading ? 'Inference_In_Progress' : 'Standby_Ready'}
         </div>
         <div className="flex items-center gap-2">
            PROVIDER: GEMINI_3.0_FLASH
         </div>
      </div>
    </div>
  );
};
