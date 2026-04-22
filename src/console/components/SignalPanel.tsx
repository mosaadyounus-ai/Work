import React from "react";
import { SignalSnapshot, PlateAlignment } from "../types";
import { Radio, Database, Activity } from "lucide-react";

interface Props {
  signal: SignalSnapshot | null;
  alignment: PlateAlignment | null;
}

export const SignalPanel: React.FC<Props> = ({ signal, alignment }) => {
  return (
    <div className="bg-[#05070a] border border-[#1a3a45] rounded-sm p-5 space-y-6">
      <div className="flex items-center gap-2 border-b border-[#1a3a45] pb-2">
         <Radio size={14} className="text-[#00eaff]" />
         <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#8899a6]">Perception_Ingest_Surface</h2>
      </div>

      {!signal ? (
        <div className="text-[10px] opacity-20 uppercase tracking-[0.2em] h-32 flex items-center justify-center italic">Waiting for signal convergence...</div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="group">
                <div className="text-[8px] opacity-40 uppercase tracking-tighter mb-1 font-mono">Signal_Identifier</div>
                <div className="text-sm font-bold border-l-2 border-[#00eaff44] pl-2">{signal.name}</div>
             </div>
             
             <div className="flex gap-12">
                <div>
                   <div className="text-[8px] opacity-40 uppercase tracking-tighter mb-1 font-mono">Last_Value</div>
                   <div className="text-lg text-[#00eaff] font-bold tracking-tight">${signal.price?.toLocaleString() ?? "—"}</div>
                </div>
                <div>
                   <div className="text-[8px] opacity-40 uppercase tracking-tighter mb-1 font-mono">Momentum</div>
                   <div className="text-lg font-bold tracking-tight text-[#00ff41]">{(signal.momentum * 100).toFixed(1)}%</div>
                </div>
             </div>

             <div className="flex items-center gap-2 text-[9px] opacity-40 uppercase font-mono mt-4 pt-4 border-t border-[#1a3a4533]">
                <Database size={10} />
                <span>Source: {signal.source}</span>
                <span className="mx-2 opacity-20">|</span>
                <Activity size={10} />
                <span>Vol: {(signal.volatility * 100).toFixed(1)}</span>
             </div>
          </div>

          {alignment && (
            <div className="bg-[#00eaff05] border border-[#00eaff11] p-4 rounded-xs space-y-3">
               <div className="text-[9px] uppercase tracking-widest text-[#00eaff] opacity-60">Plate_Alignment_Logic</div>
               <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#00eaff]">{alignment.plateId}</span>
                  <span className="text-[11px] opacity-80 uppercase tracking-tighter">Resolved_Vector</span>
               </div>
               <div className="text-[10px] opacity-50 uppercase tracking-tight italic border-t border-[#1a3a45] pt-2">
                  {alignment.reason}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
