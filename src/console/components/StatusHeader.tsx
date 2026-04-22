import React from "react";
import { RateLimitState } from "../types";
import { Shield, Activity } from "lucide-react";

interface Props {
  plateId: string | null;
  plateName: string | null;
  operator: string | null;
  rateLimitState: RateLimitState;
}

const OmegaLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#00eaff] drop-shadow-[0_0_8px_rgba(0,234,255,0.4)]">
    <path 
      d="M5.5 19H3V17H6.17C6.8 14.6 8.5 12.6 11 12.1V9C11 8.45 11.45 8 12 8C12.55 8 13 8.45 13 9V12.1C15.5 12.6 17.2 14.6 17.83 17H21V19H18.5C18.2 19 18 18.8 18 18.5C18 16 16 14 13.5 14H10.5C8 14 6 16 6 18.5C6 18.8 5.8 19 5.5 19Z" 
      fill="currentColor" 
    />
    <circle cx="12" cy="6" r="2" fill="currentColor" />
  </svg>
);

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
          <OmegaLogo />
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
