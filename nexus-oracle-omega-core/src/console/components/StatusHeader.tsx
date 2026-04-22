import React from "react";
import { RateLimitState } from "../types";
import { Terminal, Shield, Activity } from "lucide-react";

interface Props {
  plateId: string | null;
  plateName: string | null;
  operator: string | null;
  rateLimitState: RateLimitState;
}

export const StatusHeader: React.FC<Props> = ({
  plateId,
  plateName,
  operator,
  rateLimitState
}) => {
  return (
    <header className="border-b border-[#1a3a45] bg-[#00eaff05] p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Terminal size={24} className="text-[#00eaff]" />
          <div>
            <h1 className="text-sm uppercase tracking-[0.3em] font-black text-[#00eaff] glow-text">Operator_Console // v1.0</h1>
            <p className="text-[9px] opacity-40 uppercase tracking-tighter">Strategic_Lens_Module // Active_Watch_Protocol</p>
          </div>
        </div>

        <div className="flex gap-8 items-center font-mono">
           <div className="text-center">
              <div className="text-[8px] opacity-40 uppercase mb-1">Plate_Anchor</div>
              <div className="text-lg font-bold text-[#00eaff]">{plateId ?? "—"}</div>
              <div className="text-[9px] opacity-60 uppercase">{plateName ?? "IDLE"}</div>
           </div>
           
           <div className="text-center border-l border-[#1a3a45] pl-8">
              <div className="text-[8px] opacity-40 uppercase mb-1">Active_Operator</div>
              <div className="text-lg font-bold text-[#00ff41]">{operator ?? "—"}</div>
           </div>

           <div className="text-center border-l border-[#1a3a45] pl-8">
              <div className="text-[8px] opacity-40 uppercase mb-1">Rate_Limit_Posture</div>
              <div className={`text-[10px] font-bold px-2 py-0.5 border rounded-xs ${
                rateLimitState === "NORMAL" ? "text-[#00ff41] border-[#00ff4133] bg-[#00ff4108]" :
                rateLimitState === "LOCKED_CACHE" ? "text-[#ffcc00] border-[#ffcc0033] bg-[#ffcc0008]" :
                "text-[#ff3b3b] border-[#ff3b3b33] bg-[#ff3b3b08]"
              }`}>
                {rateLimitState}
              </div>
           </div>
        </div>
      </div>
    </header>
  );
};
