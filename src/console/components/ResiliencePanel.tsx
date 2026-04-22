import React from "react";
import { ResilienceState } from "../types";
import { Shield, Lock, Thermometer } from "lucide-react";

interface Props {
  state: ResilienceState;
}

export const ResiliencePanel: React.FC<Props> = ({ state }) => {
  if (!state) return null;

  return (
    <div className="bg-[#05070a] border border-[#1a3a45] rounded-sm p-5 space-y-6 flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 border-b border-[#1a3a45] pb-2">
         <Shield size={14} className="text-[#00eaff]" />
         <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#8899a6]">Hardening_Resilience_State</h2>
      </div>

      <div className="space-y-6">
        <div>
           <div className="text-[8px] opacity-40 uppercase tracking-tighter mb-2 font-mono flex items-center gap-1">
              <Thermometer size={10} />
              Cache_Temp
           </div>
           <div className="flex gap-1 h-2 bg-[#1a3a4533] rounded-full overflow-hidden border border-[#1a3a45]">
              <div className={`h-full transition-all duration-500 ${
                state.cacheState === "HOT" ? "bg-[#00ff41] w-full" :
                state.cacheState === "LOCKED" ? "bg-[#00eaff] w-3/4" :
                "bg-[#1a3a45] w-1/4"
              }`} />
           </div>
           <div className="flex justify-between mt-1 text-[9px] uppercase font-mono">
              <span className={state.cacheState === "HOT" ? "text-[#00ff41]" : "opacity-30"}>{state.cacheState}</span>
              <span className="opacity-20 text-[7px]">TTL: 300s</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className={`p-3 border rounded-xs ${
             state.rateLimitState === "NORMAL" ? "border-[#00ff4133] bg-[#00ff4105]" : "border-[#1a3a45] opacity-40"
           }`}>
              <div className="text-[8px] opacity-60 uppercase mb-1">Status</div>
              <div className="text-[10px] font-bold">OPERATIONAL</div>
           </div>
           <div className={`p-3 border rounded-xs ${
             state.rateLimitState !== "NORMAL" ? "border-[#ff3b3b33] bg-[#ff3b3b05]" : "border-[#1a3a45] opacity-40"
           }`}>
              <div className="text-[8px] opacity-60 uppercase mb-1">Fallback</div>
              <div className="text-[10px] font-bold">{state.rateLimitState === "NORMAL" ? "INACTIVE" : "ENGAGED"}</div>
           </div>
        </div>
      </div>

      <div className="space-y-2 mt-4 pt-4 border-t border-[#1a3a4533]">
        <div className="flex justify-between text-[9px] font-mono opacity-50">
           <span>LAST_429:</span>
           <span>{state.last429At ? state.last429At.split('T')[1].split('.')[0] : "NONE"}</span>
        </div>
        <div className="flex justify-between text-[9px] font-mono opacity-50">
           <span>LAST_FALLBACK:</span>
           <span>{state.lastFallbackAt ? state.lastFallbackAt.split('T')[1].split('.')[0] : "NONE"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 opacity-30 text-[8px] uppercase font-bold bg-[#1a3a4522] p-2 rounded-xs">
         <Lock size={10} />
         <span>Immutable_Ingestion_Layer_Active</span>
      </div>
    </div>
  );
};
