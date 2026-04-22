import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { useCodex } from "../../context/CodexContext";

export const GuardrailsPanel: React.FC = () => {
  const { guardrailEvents } = useCodex();

  return (
    <div className="bg-[#05070a] border border-[#1a3a45] rounded-sm p-5 space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-[#1a3a45] pb-2">
         <ShieldCheck size={14} className="text-[#00eaff]" />
         <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#8899a6]">Guardrail_Experiment_Monitor</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {(!guardrailEvents || guardrailEvents.length === 0) ? (
          <div className="text-[10px] opacity-20 uppercase h-32 flex items-center justify-center font-mono italic">No_Guardrail_Violations_Detected...</div>
        ) : (
          guardrailEvents.map((evt) => (
            <div key={evt.id} className="p-3 border border-[#ff3b3b33] bg-[#ff3b3b05] rounded-xs space-y-2">
               <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-[#ff3b3b] font-bold flex items-center gap-1">
                    <ShieldAlert size={10} />
                    {evt.guardrailId}
                  </span>
                  <span className="opacity-40">{evt.timestamp.split('T')[1].split('.')[0]}</span>
               </div>
               <div className="text-[10px] opacity-80 uppercase leading-tight font-bold">{evt.reason}</div>
               <div className="text-[8px] opacity-40 uppercase font-mono flex gap-2">
                  <span>Plate: {evt.step?.plateId || "GLOBAL"}</span>
                  <span>Vol: {evt.step?.context?.volatility.toFixed(2) || "0.00"}</span>
                  <span>Risk: {evt.step?.context?.risk.toFixed(2) || "0.00"}</span>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-[#1a3a45] flex flex-col gap-2">
         <div className="text-[8px] opacity-40 uppercase tracking-widest mb-1">Active_Guardrails</div>
         <div className="grid grid-cols-2 gap-2 text-[8px] uppercase">
            <div className="p-1 px-2 border border-[#00ff4133] text-[#00ff41] flex items-center gap-1">
               <ShieldCheck size={8} /> NO_PLATE_IV_VOL
            </div>
            <div className="p-1 px-2 border border-[#00ff4133] text-[#00ff41] flex items-center gap-1">
               <ShieldCheck size={8} /> NO_PLATE_IX_RISK
            </div>
         </div>
      </div>
    </div>
  );
};
