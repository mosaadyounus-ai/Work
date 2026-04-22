import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, LayoutDashboard, Monitor, Bookmark, ShieldAlert } from "lucide-react";
import { useCodex } from "../context/CodexContext";
import { Link } from "react-router-dom";
import MeridianSurface from "../components/MeridianSurface";
import FuturePanel from "../components/FuturePanel";
import { StrategicAdvisor } from "../components/StrategicAdvisor";
import { config } from "../lib/config";

export default function HomePage() {
  const { 
    data, 
    meridian, 
    alerts, 
    isProcessing, 
    lastSync, 
    focusMode, 
    setFocusMode,
    stabilizeSystem 
  } = useCodex();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center py-5 px-8 border-b border-[#1a3a45] bg-[#00eaff08]">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 ${isProcessing ? 'bg-[#00ff41] animate-ping' : 'bg-[#00eaff]'}`} />
          <h1 className="text-xl font-display font-black uppercase tracking-[4px] glow-text">Chorus</h1>
          <span className="text-[10px] text-[#8899a6] font-mono">Resonance Overview</span>
        </div>

        {/* CHORUS MODE SELECTOR */}
        <div className="flex items-center bg-[#05070a] border border-[#1a3a45] p-1 rounded-sm gap-1">
          {(["SCAN", "FOCUS", "SIMULATE"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFocusMode(mode)}
              className={`px-3 py-1 text-[8px] uppercase tracking-widest transition-all ${
                focusMode === mode 
                  ? 'bg-[#00eaff] text-[#05070a] font-black' 
                  : 'text-[#8899a6] hover:text-[#fff] hover:bg-[#1a3a4533]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4 border-r border-[#1a3a45] pr-6 mr-6">
             <Link to="/overview" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00eaff] bg-[#00eaff11] px-3 py-1 border border-[#00eaff33] rounded-xs">
                <LayoutDashboard size={12} />
                Overview
             </Link>
             <Link to="/" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                <Shield size={12} />
                Chorus
             </Link>
             <Link to="/console" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                <Monitor size={12} />
                Console
             </Link>
             <Link to="/codex" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                <Bookmark size={12} />
                Codex
             </Link>
          </nav>
          <div className="hidden md:flex gap-6 text-[11px] uppercase opacity-80">
            <div className="flex items-center gap-1.5"><span className="text-[#8899a6]">STATUS:</span> {isProcessing ? 'PROCESSING' : 'IDLE'}</div>
            <div className="flex items-center gap-1.5"><span className="text-[#8899a6]">SIGNALS:</span> {data.length}</div>
          </div>
        </div>
      </header>

      {/* ALERTS */}
      <div className={`px-8 py-3 min-h-[50px] border-b border-[#1a3a45] overflow-hidden transition-colors ${
        alerts.length > 0 ? 'bg-[#ff3b3b10]' : 'bg-[#05070a]'
      }`}>
        {alerts.length > 0 ? (
          <div className="flex gap-12 items-center animate-scroll whitespace-nowrap">
             <div className="flex items-center gap-2 text-[#ff3b3b] font-black tracking-tighter text-sm uppercase">
               <ShieldAlert size={16} /> [SYSTEM_ALERT_ACTIVE]
             </div>
            {alerts.map((a, i) => (
              <span key={i} className={`flex items-center gap-2 text-[11px] uppercase font-bold ${
                a.includes("⚠") ? "text-[#ff3b3b]" : "text-[#00ff41]"
              }`}>
                {a.includes("⚠") ? <Shield size={12} /> : <Zap size={12} />}
                {a}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[10px] opacity-40 uppercase tracking-widest flex items-center gap-3">
             <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
             Strategic Buffer Stable // Continuous Chorus Synchronization Active
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN SURFACE */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,_#0a0f1f_0%,_#05070a_100%)]">
          <div className="space-y-[1px] bg-[#1a3a45]">
            <MeridianSurface telemetry={meridian} mode={focusMode} />
            <div className="p-8 space-y-8 bg-[#05070a]">
              <div className="flex justify-between items-center border-b border-[#1a3a45] pb-2">
                <h3 className="text-[10px] uppercase tracking-[0.4em] opacity-40">Strategic Operational Feed</h3>
                <div className="flex gap-4 text-[9px] uppercase opacity-40">
                  <span>Mem_Load: STABLE</span>
                  <span>Sync: {lastSync}</span>
                </div>
              </div>
              <FuturePanel data={data} />
            </div>
          </div>
        </main>

        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[300px] border-l border-[#1a3a45] p-8 gap-8 overflow-y-auto">
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase text-[#8899a6] tracking-widest font-bold">Resilience_Config</h4>
            <div className="text-[11px] bg-[#00eaff05] p-3 border border-[#1a3a45] space-y-2 opacity-80 uppercase tracking-tighter">
              <div className="flex justify-between">
                <span>Risk Tolerance:</span>
                <span className="text-[#00eaff]">{config.riskTolerance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Alert Sensitivity:</span>
                <span className="text-[#ffcc00]">{config.alertSensitivity.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <StrategicAdvisor />

          <div className="space-y-4">
            <h4 className="text-[10px] uppercase text-[#8899a6] tracking-widest font-bold">Chorus_Direct_Links</h4>
            <div className="space-y-3">
              <button 
                onClick={stabilizeSystem}
                className="w-full text-left p-3 border border-[#00eaff33] rounded-xs bg-[#00eaff05] hover:bg-[#00eaff11] transition-all flex flex-col gap-1"
              >
                  <div className="text-[9px] uppercase tracking-widest text-[#00eaff] font-black px-1 border-l-2 border-[#00eaff]">Stabilize_Lattice</div>
                  <p className="text-[8px] opacity-40 uppercase">Broadcast stabilization pulse to all nodes.</p>
              </button>

              <Link to="/" className="block p-3 border border-[#1a3a45] rounded-xs bg-[#ffffff02] hover:border-[#00ff41] transition-all">
                  <div className="text-[9px] uppercase tracking-widest text-[#00ff41] font-black">Chorus_Surface</div>
                  <p className="text-[8px] opacity-40 uppercase">Engage the live resonance lattice.</p>
              </Link>

              <Link to="/console" className="block p-3 border border-[#1a3a45] rounded-xs bg-[#ffffff02] hover:border-[#00eaff] transition-all">
                  <div className="text-[9px] uppercase tracking-widest text-[#00eaff] font-black">Operator_Console</div>
                  <p className="text-[8px] opacity-40 uppercase">Audit raw operational traces and guardrails.</p>
              </Link>
            </div>
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-[#1a3a45]">
             <div className="text-[9px] uppercase opacity-40 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ff41] rounded-full" />
                System_Integrity: 100%
             </div>
          <div className="text-[10px] text-[#8899a6] uppercase tracking-tighter italic">
                Chorus Resonance Core // Production_Runtime_Active
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
