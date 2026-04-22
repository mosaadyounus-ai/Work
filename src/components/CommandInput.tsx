import React, { useState } from "react";
import { useCodex } from "../context/CodexContext";
import { Terminal, Send, Zap, Shield, Cpu, History, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const commands = [
  { id: "STABILIZE", icon: Shield, label: "Stabilize", desc: "Dampen lattice variance" },
  { id: "BOOST", icon: Zap, label: "Boost", desc: "Ignite system energy" },
  { id: "PREDICTION", icon: Cpu, label: "Simulate", desc: "Project ghost futures" },
  { id: "TRACE", icon: History, label: "Trace", desc: "Recall state history" },
  { id: "ORACLE", icon: Sparkles, label: "Oracle", desc: "AI strategic analysis" }
] as const;

export default function CommandInput() {
  const [input, setInput] = useState("");
  const { sendIntent, lastAck, runOracleAnalysis, isAnalyzing } = useCodex();
  const [isFocused, setIsFocused] = useState(false);

  const handleCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    const action = cmd.toUpperCase();
    
    if (action === "ORACLE") {
      runOracleAnalysis();
      setInput("");
      return;
    }

    // Auto-meta for specific commands
    const meta = action === "PREDICTION" ? { steps: 50 } : (action === "TRACE" ? { limit: 100 } : undefined);
    
    sendIntent(action, meta);
    setInput("");
  };

  return (
    <div className="w-[min(54rem,calc(100vw-3rem))] group">
      <div className={`relative flex items-center bg-[#081019dd] border transition-all duration-300 backdrop-blur-xl px-5 py-3 rounded-[2px] shadow-[0_0_25px_rgba(0,0,0,0.55)] chorus-panel ${
        isFocused ? 'border-[#33e7ff] shadow-[0_0_18px_rgba(51,231,255,0.14)]' : 'border-[#17313c]'
      }`}>
        <Terminal size={14} className={`mr-4 ${isFocused || isAnalyzing ? 'text-[#33e7ff]' : 'text-[#8899a6]'}`} />
        
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isAnalyzing ? "Chorus inference in progress..." : "SYSTEM COMMAND ENTRY [INTENT_INITIATE]..."}
          disabled={isAnalyzing}
          className="flex-1 bg-transparent border-none outline-none text-[11px] uppercase tracking-[0.28em] text-[#dffaff] placeholder:text-[#21414f] placeholder:italic"
        />

        <button 
          onClick={() => handleCommand(input)}
          disabled={isAnalyzing}
          className="ml-4 p-2 border border-transparent hover:border-[#33e7ff33] hover:bg-[#33e7ff11] rounded-[2px] transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? <div className="w-3.5 h-3.5 border-2 border-[#33e7ff] border-t-transparent rounded-full animate-spin" /> : <Send size={14} className="text-[#33e7ff]" />}
        </button>

        {/* ACK Indicator */}
        <AnimatePresence>
          {lastAck && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-[#18ff9c] rounded-full shadow-[0_0_12px_rgba(24,255,156,0.8)]"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Command Chips */}
      <div className="flex flex-wrap gap-2 mt-4 overflow-hidden">
        {commands.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => handleCommand(cmd.id)}
            className="flex items-center gap-2 px-4 py-2 bg-[#05080dba] border border-[#17313c] hover:border-[#33e7ff33] hover:bg-[#33e7ff08] transition-all group/btn"
          >
            <cmd.icon size={12} className="text-[#8899a6] group-hover/btn:text-[#33e7ff] transition-colors" />
            <span className="text-[8px] uppercase tracking-[0.22em] text-[#8899a6] group-hover/btn:text-[#fff]">{cmd.label}</span>
          </button>
        ))}
      </div>

      {/* History / Status Tooltip */}
      <div className="mt-3 pl-2">
        {lastAck ? (
          <div className="text-[7px] uppercase tracking-[0.28em] text-[#18ff9c] flex items-center gap-2 opacity-70">
            <div className="w-1 h-1 rounded-full bg-[#18ff9c] animate-pulse" />
            Last_Chorus_Command: {lastAck.action} // Status: {lastAck.status}
          </div>
        ) : (
          <div className="text-[7px] uppercase tracking-[0.28em] text-[#21414f] italic">
            Awaiting operator intent...
          </div>
        )}
      </div>
    </div>
  );
}
