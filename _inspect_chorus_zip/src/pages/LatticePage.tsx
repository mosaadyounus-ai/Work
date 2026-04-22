import { motion } from "motion/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { LatticeScene } from "../components/3d/LatticeScene";
import { CommandInput } from "../components/CommandInput";
import { GlassHUD } from "../components/GlassHUD";
import { Notifications } from "../components/Notifications";
import { cn } from "@/src/lib/utils";
import { Activity, Shield, Zap, Database, Terminal, Cpu, Camera, Link as LinkIcon, Box, Share2, Layers } from "lucide-react";
import { DEFAULT_PLATES, DEFAULT_TRANSITIONS, PlateId, INFINITY_CORE } from "../lib/nonagram-codex";

interface ResonanceParams {
  hueShift: number;
  speed: number;
  complexity: number;
  freq: number;
  timestamp: number;
  source: string;
}

export default function LatticePage() {
  const [resParams, setResParams] = useState({
    hue: 170,
    speed: 1.0,
    complexity: 1.0,
    frequency: 0.5
  });
  const [isSynced, setIsSynced] = useState(false);
  const [currentPlateIdx, setCurrentPlateIdx] = useState(0);
  const [lastLinkTimestamp, setLastLinkTimestamp] = useState(0);

  // Nonagram Sequence Animation (Phi-governed: 2.618s cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPlateIdx(prev => (prev + 1) % DEFAULT_PLATES.length);
    }, 2618);
    return () => clearInterval(timer);
  }, []);

  const activePlate = useMemo(() => DEFAULT_PLATES[currentPlateIdx], [currentPlateIdx]);

  // Sync Logic Constants
  const LINK_MAX_AGE_MS = 500;
  const LINK_SOURCE = 'resonance-tuner';

  // Sync Listener with Polling Fallback
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    const handleSync = () => {
      const stored = localStorage.getItem('lumina-wave-params');
      if (stored) {
        try {
          const payload: ResonanceParams = JSON.parse(stored);
          const now = Date.now();
          const age = now - payload.timestamp;
          
          // Formal Verification & Throttling
          if (payload.source === LINK_SOURCE && age < LINK_MAX_AGE_MS && payload.timestamp > lastLinkTimestamp) {
            setResParams({
              hue: 170 + (payload.hueShift || 0),
              speed: payload.speed ?? 1.0, 
              complexity: (payload.complexity ?? 3) / 3.5,
              frequency: (payload.freq ?? 1.0) / 2
            });
            setIsSynced(true);
            setLastLinkTimestamp(payload.timestamp);

            // Auto-hide link status if signal is lost
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
              if (Date.now() - payload.timestamp > LINK_MAX_AGE_MS) {
                setIsSynced(false);
              }
            }, LINK_MAX_AGE_MS + 100);
          }
        } catch (e) {
          console.error("DAN-Ω Link Error:", e);
        }
      }
    };

    window.addEventListener('storage', handleSync);
    const pollInterval = setInterval(handleSync, 100); // 10Hz polling fallback
    
    handleSync();
    return () => {
      window.removeEventListener('storage', handleSync);
      clearInterval(pollInterval);
      clearTimeout(hideTimer);
    };
  }, [lastLinkTimestamp]);

  const captureScreen = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Create a temporary canvas for composition
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background and Three.js canvas
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    // Render metadata
    ctx.font = '12px "JetBrains Mono"';
    ctx.fillStyle = '#00f5d4';
    const metadata = [
      `CHORUS // RESONANCE_CAPTURE`,
      `TIMESTAMP: ${new Date().toISOString()}`,
      `HUE: ${resParams.hue.toFixed(1)}`,
      `SPEED: ${resParams.speed.toFixed(2)}`,
      `COMPLEXITY: ${resParams.complexity.toFixed(2)}`,
      `FREQUENCY: ${resParams.frequency.toFixed(2)}`,
      `SIGNATURE: AUTHORIZED_BY_ROOT`
    ];

    metadata.forEach((text, i) => {
      ctx.fillText(text, 20, tempCanvas.height - 120 + (i * 18));
    });

    // Decorative corner
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 10); ctx.lineTo(40, 10);
    ctx.moveTo(10, 10); ctx.lineTo(10, 40);
    ctx.stroke();

    // Trigger download
    const link = document.createElement('a');
    link.download = `chorus_resonance_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }, [resParams]);

  return (
    <main className="relative h-screen w-full bg-chorus-bg overflow-hidden select-none flex flex-col">
      {/* Lattice Background Layer */}
      <div className="lattice-bg" />
      <LatticeScene 
        hue={resParams.hue} 
        speed={resParams.speed} 
        complexity={resParams.complexity} 
        frequency={resParams.frequency} 
      />
      <Notifications />
      
      {/* Top HUD Rail */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <div className="w-10 h-10 border-2 border-chorus-primary flex items-center justify-center rotate-45">
            <div className="w-4 h-4 bg-chorus-primary -rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-[0.2em] text-chorus-primary glow-text uppercase leading-none">OMEGA_CORE</span>
            <span className="text-[8px] font-mono text-chorus-primary/40 tracking-[0.4em] mt-1 italic">FORMALLY_VERIFIED_V8</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-6 text-[10px] tracking-[0.2em] uppercase font-mono"
        >
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300",
            isSynced 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
              : "bg-white/5 border-white/10 text-white/20"
          )}>
            <div className={cn(
               "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", 
               isSynced ? "bg-emerald-400 shadow-emerald-400 animate-pulse" : "bg-white/20"
            )} />
            <span>{isSynced ? "RESONANCE_LINKED" : "LINK_WAITING"}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-cyan-400/60">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
            <span>Lattice Sync: Active</span>
          </div>
          <span className="hidden lg:inline text-chorus-primary/40">FREQ: {resParams.frequency.toFixed(2)}</span>
          <button 
            onClick={captureScreen}
            className="p-2 hover:bg-chorus-primary/10 border border-white/5 rounded transition-all group flex items-center gap-2"
          >
            <Camera className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span className="text-[9px]">RES_CAPTURE</span>
          </button>
        </motion.div>
      </nav>

      {/* Main Workspace */}
      <main className="relative z-10 flex-grow flex p-8 gap-8 overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 flex flex-col space-y-4">
          <GlassHUD title="System Overview" delay={0.2} className="h-48 border-white/10">
            <div className="space-y-4 pt-2">
              {[
                { label: "Resources", val: `${(resParams.complexity * 100).toFixed(0)}%`, p: resParams.complexity * 100 },
                { label: "Bandwidth", val: `${(resParams.speed * 2.1).toFixed(1)} GB/s`, p: resParams.speed * 40 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">{item.label}</span>
                    <span className="font-mono text-chorus-primary">{item.val}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.p}%` }}
                      className="bg-chorus-primary h-full shadow-[0_0_10px_rgba(0,245,212,0.3)]" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassHUD>

          <GlassHUD title="Live Telemetry" delay={0.3} className="flex-1 border-white/10">
            <div className="h-full flex items-end justify-between space-x-1 pt-4 pb-2">
              {[20, 40, 60, 80, 95, 70, 60, 50, 30].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h * (resParams.frequency * 0.7 + 0.3)}%` }}
                  className="w-full bg-chorus-primary/40 hover:bg-chorus-primary/80 transition-colors"
                />
              ))}
            </div>
          </GlassHUD>
        </div>

        {/* Center Visual Field (Scene focus area) */}
        <div className="flex-grow flex items-center justify-center relative pointer-events-none">
           <div className="w-64 h-64 border border-chorus-primary/10 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 border border-chorus-primary/20 rounded-full flex items-center justify-center ">
                 <div className="w-32 h-32 border-2 border-chorus-primary/40 rounded-full flex items-center justify-center animate-pulse transition-all duration-300" style={{ transform: `scale(${1 + resParams.frequency * 0.2})` }}>
                    <div className="text-chorus-primary text-[10px] tracking-widest font-mono glow-text italic">
                      {activePlate.name.toUpperCase()}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1 px-1 flex items-center justify-between">
            <span>Nonagram Architecture</span>
            <span className="text-chorus-primary font-mono text-[8px] animate-pulse">SEALED</span>
          </div>
          
          <div className="space-y-3">
            <motion.div
              key={activePlate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-chorus-primary/20 backdrop-blur-md p-4 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <Box className="w-8 h-8 text-chorus-primary" />
              </div>
              <div className="text-[10px] text-chorus-primary font-mono mb-1">Plate {activePlate.id}</div>
              <div className="text-sm font-bold text-white tracking-widest uppercase mb-1">{activePlate.name}</div>
              <div className="text-[10px] text-white/50 mb-3">{activePlate.role}</div>
              
              <div className="flex items-center gap-2">
                <div className="text-[9px] px-1.5 py-0.5 bg-chorus-primary/10 text-chorus-primary border border-chorus-primary/20 rounded font-mono">
                  {activePlate.stateType}
                </div>
                <div className="h-[1px] flex-grow bg-white/10" />
                <div className="text-[9px] text-white/30 font-mono">
                  → {DEFAULT_TRANSITIONS[activePlate.id] === INFINITY_CORE ? "∞" : DEFAULT_TRANSITIONS[activePlate.id]}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_PLATES.map((plate, i) => (
                <div 
                  key={plate.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === currentPlateIdx ? "bg-chorus-primary shadow-[0_0_8px_rgba(0,245,212,0.6)]" : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>

          <GlassHUD title="Core Invariants" delay={0.5} className="flex-1 border-white/10 overflow-hidden">
            <div className="space-y-4 pt-2">
               {[
                 { label: "PlateDomain", status: "VALID", icon: Shield },
                 { label: "SealImmutable", status: "LOCKED", icon: Activity },
                 { label: "InfinityReturn", status: "READY", icon: Zap }
               ].map((inv, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="p-1.5 bg-white/5 border border-white/10 rounded">
                     <inv.icon className="w-3 h-3 text-chorus-primary/70" />
                   </div>
                   <div className="flex-1">
                     <div className="text-[10px] font-mono text-white/40 uppercase">{inv.label}</div>
                     <div className="text-[10px] font-bold text-chorus-primary/80 tracking-widest">{inv.status}</div>
                   </div>
                 </div>
               ))}
            </div>
          </GlassHUD>

          <div className="flex-grow"></div>
          <div className="text-[10px] text-center text-white/20 uppercase tracking-[0.4em] mb-4">Chorus V.4.0.0-Beta</div>
        </div>
      </main>

      {/* Centered Command Rail */}
      <div className="relative z-20 pb-12 flex justify-center w-full px-4">
        <CommandInput />
      </div>

      {/* Bottom Micro-Bar */}
      <div className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/5 px-8 py-3 flex justify-between text-[9px] uppercase tracking-[0.4em] text-white/40 font-mono">
        <div className="flex space-x-12">
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-chorus-primary rounded-full" />
            Authority: ARCHITECT (MFCS_TLC_VERIFIED)
          </span>
          <span className="hidden sm:inline">V2→V8_ARC: CLOSED</span>
        </div>
        <div className="flex space-x-8">
          <span className="text-chorus-primary glow-text italic">SABR_ENGINE: OMEGA_STABLE</span>
          <span className="hidden sm:inline">DAN-Ω [v1.0.0]</span>
        </div>
      </div>
    </main>
  );
}

