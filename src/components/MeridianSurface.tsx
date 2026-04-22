import { MeridianTelemetry, GuardianState, PathState } from "../lib/types";
import { Activity, Shield, Zap, Wind, AlertTriangle, Monitor, HeartPulse, Map, Target, Crosshair, Cpu, Eye, Layout, Layers, Box, Terminal, User, History } from "lucide-react";
import { ReactNode, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MeridianSurfaceProps {
  telemetry: MeridianTelemetry | null;
  mode?: "SCAN" | "FOCUS" | "SIMULATE";
}

export default function MeridianSurface({ telemetry, mode = "SCAN" }: MeridianSurfaceProps) {
  const [activeTab, setActiveTab] = useState<'MAP' | 'ENGINE' | 'GUARDIANS'>('MAP');

  const themeColor = useMemo(() => {
    switch (mode) {
      case "SIMULATE": return "#ffcc00"; // GOLDEN / PREDICTION
      case "FOCUS": return "#ffffff";    // WHITE / TARGETED
      case "SCAN":
      default: return "#00eaff";         // CYAN / EXPLORATION
    }
  }, [mode]);

  if (!telemetry) return (
    <div className="flex-1 flex items-center justify-center bg-[#05070a] border border-[#1a3a45] text-[#00eaff] font-mono text-xs animate-pulse">
      [ INITIALIZING_LATTICE_LINK ]
    </div>
  );

  return (
    <div className={`flex-1 bg-[#05070a] text-[#8899a6] font-mono selection:bg-[#00eaff33] selection:text-[#00eaff] flex flex-col h-full overflow-hidden border-l border-[#1a3a45] transition-colors duration-500`}>
      
      {/* 1. HEADER: OPERATOR & SYSTEM SIGNATURE */}
      <header className="p-4 border-b border-[#1a3a45] flex justify-between items-center bg-[#07090c]">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-[#1a3a45] bg-[#00eaff05] flex items-center justify-center transition-colors"
                 style={{ color: themeColor, borderColor: `${themeColor}33` }}>
               <User size={18} />
            </div>
            <div>
               <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Primary_Operator</div>
               <div className="text-[12px] uppercase font-black tracking-tight" style={{ color: themeColor }}>{telemetry.operator.name}</div>
            </div>
         </div>

         <div className="flex gap-8">
            <HeaderStat label="Stability" value={`${telemetry.vitalityIndex.toFixed(1)}%`} color={telemetry.vitalityIndex < 60 ? "#ff3b3b" : "#00ff41"} />
            <HeaderStat label="Resonance" value={`${telemetry.operationalMomentum.toFixed(1)}%`} color={themeColor} />
            <HeaderStat label="Momentum" value={`${telemetry.metrics.momentum.toFixed(1)}%`} color="#00eaff" />
         </div>

         <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] opacity-30">
            LATTICE_STANCE: {mode}
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
         </div>
      </header>

      {/* 2. RECURSIVE LAYOUT: METRICS & VISUALIZER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT BAR: PRIMARY METRICS */}
        <aside className="w-64 border-r border-[#1a3a45] bg-[#05070a] flex flex-col pt-6 overflow-hidden">
           <div className="px-6 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-10">
              <div className="space-y-4">
                <h3 className="text-[9px] uppercase tracking-widest text-[#00eaff] opacity-50 flex items-center gap-2">
                  <Activity size={12} /> Primary_Metrics
                </h3>
                <div className="space-y-3">
                   <MetricBar label="Stability" value={telemetry.metrics.stability} />
                   <MetricBar label="Load" value={telemetry.metrics.load} color="#ffcc00" />
                   <MetricBar label="Clarity" value={telemetry.metrics.clarity} />
                   <MetricBar label="Momentum" value={telemetry.metrics.momentum} color="#00ff41" />
                   <MetricBar label="Risk" value={telemetry.metrics.risk} color="#ff3b3b" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#1a3a4533]">
                <h3 className="text-[9px] uppercase tracking-widest text-[#00eaff] opacity-50 flex items-center gap-2">
                  <Target size={12} /> Derived_Vectors
                </h3>
                <div className="space-y-4">
                   <DerivedMetric label="Harmonic_Alignment" value={telemetry.metrics.harmonicAlignment} sub="RESONANCE" />
                   <DerivedMetric label="Fractal_Trace_Density" value={telemetry.metrics.fractalDensity} sub="CHAOS_IDX" />
                   <DerivedMetric label="Signal_to_Noise" value={telemetry.metrics.snr} sub="ENV_CLARITY" />
                </div>
              </div>

              <div className="pt-6 border-t border-[#1a3a4533] space-y-4">
                 <h3 className="text-[9px] uppercase tracking-widest text-[#00eaff] opacity-50 flex items-center gap-2">
                    <History size={12} /> Decision_State
                 </h3>
                 <div className="space-y-2">
                    <LoopStatus label="Perception" status={telemetry.decisionLoop.perception} />
                    <LoopStatus label="Interpretation" status={telemetry.decisionLoop.interpretation} />
                    <LoopStatus label="Decision" status={telemetry.decisionLoop.decision} />
                    <LoopStatus label="Action" status={telemetry.decisionLoop.action} />
                    <LoopStatus label="Learning" status={telemetry.decisionLoop.learning} />
                 </div>
              </div>
           </div>
        </aside>

        {/* CENTER STAGE: VIZ & GUARDIANS */}
        <main className="flex-1 flex flex-col h-full bg-[#0a0c1033]">
           
           {/* NAV TABS */}
           <div className="flex border-b border-[#1a3a45] h-10 bg-[#07090c]">
              <TabButton active={activeTab === 'MAP'} onClick={() => setActiveTab('MAP')} label="96_Path_Lattice" icon={<Map size={12}/>}/>
              <TabButton active={activeTab === 'ENGINE'} onClick={() => setActiveTab('ENGINE')} label="5_Move_Engine" icon={<Cpu size={12}/>}/>
              <TabButton active={activeTab === 'GUARDIANS'} onClick={() => setActiveTab('GUARDIANS')} label="Guardian_Layer" icon={<Shield size={12}/>}/>
           </div>

           {/* CONTENT AREA */}
           <div className="flex-1 relative overflow-hidden flex flex-col p-8">
              <AnimatePresence mode="wait">
                 {activeTab === 'MAP' && <PathMapVisualizer key="map" paths={telemetry.pathMap} />}
                 {activeTab === 'ENGINE' && <EngineVisualizer key="engine" loop={telemetry.decisionLoop} />}
                 {activeTab === 'GUARDIANS' && <GuardianGrid key="guardians" guardians={telemetry.guardians} />}
              </AnimatePresence>
           </div>

           {/* OPERATOR ATTRIBUTES FOOTER */}
           <footer className="h-20 border-t border-[#1a3a45] bg-[#07090c] p-4 flex items-center justify-around px-12">
              <Attribute label="Focus_State" value={telemetry.operator.focus} />
              <Attribute label="Energy_Dist" value={telemetry.operator.energy} />
              <Attribute label="Dec_Cadence" value={telemetry.operator.cadence} unit="/s" />
              <Attribute label="Drift_Corr" value={telemetry.operator.driftCorrection} unit="x" />
           </footer>
        </main>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function HeaderStat({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] uppercase tracking-widest opacity-40 mb-1">{label}</div>
      <div className="text-xs font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function MetricBar({ label, value, color = "#00eaff" }: { label: string, value: number, color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
        <span className="opacity-40">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1 w-full bg-[#1a3a4533] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DerivedMetric({ label, value, sub }: { label: string, value: number, sub: string }) {
  return (
    <div className="border border-[#1a3a4533] p-2 bg-[#00eaff03] group hover:border-[#00eaff33] transition-colors">
       <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[9px] uppercase font-bold text-white opacity-80">{label}</span>
          <span className="text-[10px] text-[#00eaff] font-mono">{value / 100}</span>
       </div>
       <div className="text-[7px] uppercase opacity-40 group-hover:opacity-100 transition-opacity">{sub}</div>
    </div>
  );
}

function LoopStatus({ label, status }: { label: string, status: string }) {
  const isComplete = status === 'Complete';
  const isInMotion = status === 'In-Motion';
  return (
    <div className="flex items-center gap-3">
       <div className={`w-1.5 h-1.5 rounded-full ${
         isComplete ? 'bg-[#00ff41]' : isInMotion ? 'bg-[#00eaff] animate-pulse' : 'bg-[#1a3a45]'
       }`} />
       <div className="flex-1 flex justify-between items-center text-[9px] uppercase">
          <span className="opacity-40">{label}</span>
          <span className={isComplete ? 'text-[#00ff41]' : isInMotion ? 'text-[#00eaff]' : 'opacity-20'}>{status}</span>
       </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 flex items-center gap-2 border-r border-[#1a3a45] transition-all relative ${
        active ? 'bg-[#0a0c10] text-[#00eaff]' : 'opacity-40 hover:opacity-100'
      }`}
    >
      {icon}
      <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#00eaff]" />}
    </button>
  );
}

function Attribute({ label, value, unit = "" }: { label: string, value: number, unit?: string }) {
  return (
    <div className="text-center">
       <div className="text-[8px] uppercase opacity-30 mb-1">{label}</div>
       <div className="text-xs font-bold text-[#00eaff] font-mono tracking-tighter">
         {value}{unit}
       </div>
    </div>
  );
}

// --- VISUALIZERS ---

function PathMapVisualizer({ paths }: { paths: MeridianTelemetry['pathMap'] }) {
  // We'll render a recursive grid showing the 4 quadrants
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex-1 grid grid-cols-2 gap-8"
    >
       <QuadrantGrid title="NORTH: STRATEGY" paths={paths.north} color="#00eaff" />
       <QuadrantGrid title="EAST: EXECUTION" paths={paths.east} color="#00ff41" />
       <QuadrantGrid title="SOUTH: REFLECTION" paths={paths.south} color="#ff3b3b" />
       <QuadrantGrid title="WEST: SYNTHESIS" paths={paths.west} color="#ffcc00" />
    </motion.div>
  );
}

function QuadrantGrid({ title, paths, color }: { title: string, paths: PathState[], color: string }) {
  return (
    <div className="space-y-3 bg-[#00eaff03] border border-[#1a3a4533] p-4 group hover:border-[#ffffff11] transition-colors relative h-full">
       <div className="flex justify-between items-center text-[10px] font-black tracking-widest" style={{ color }}>
          {title}
          <span className="opacity-20 text-[8px] font-mono">Q_ACTIVE_PATHS: 24</span>
       </div>
       <div className="grid grid-cols-6 gap-2 pt-2">
          {paths.map(p => (
            <div 
              key={p.id} 
              className="aspect-square border border-[#1a3a4522] relative overflow-hidden group/path"
            >
               <motion.div 
                 className="absolute inset-0 bg-opacity-20 transition-all"
                 style={{ backgroundColor: color, height: `${p.value}%` }}
               />
               <div className="absolute inset-0 flex items-center justify-center text-[6px] font-mono opacity-0 group-hover/path:opacity-100 bg-[#000000dd]">
                 {p.value}
               </div>
            </div>
          ))}
       </div>
       {/* Visual Decoration */}
       <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#1a3a45] pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#1a3a45] pointer-events-none" />
    </div>
  );
}

function EngineVisualizer({ loop }: { loop: MeridianTelemetry['decisionLoop'] }) {
  const steps = [
    { key: 'perception', icon: <Eye size={24}/>, label: 'Perception' },
    { key: 'interpretation', icon: <Layers size={24}/>, label: 'Interpretation' },
    { key: 'decision', icon: <Target size={24}/>, label: 'Decision' },
    { key: 'action', icon: <Zap size={24}/>, label: 'Action' },
    { key: 'learning', icon: <Activity size={24}/>, label: 'Learning' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center space-y-12"
    >
       <div className="text-[12px] uppercase tracking-[0.4em] opacity-40 font-bold mb-8">5-Move_Engine_Operational_Flow</div>
       <div className="flex items-center gap-10">
          {steps.map((s, idx) => {
             const status = (loop as any)[s.key];
             const isComplete = status === 'Complete';
             const isInMotion = status === 'In-Motion';
             return (
               <div key={s.key} className="flex items-center gap-10">
                  <div className="flex flex-col items-center gap-4 relative">
                     <div className={`w-20 h-20 rounded-sm border flex items-center justify-center transition-all ${
                       isComplete ? 'border-[#00ff41] bg-[#00ff4108] text-[#00ff41]' :
                       isInMotion ? 'border-[#00eaff] bg-[#00eaff08] text-[#00eaff] animate-pulse shadow-[0_0_20px_#00eaff33]' :
                       'border-[#1a3a45] opacity-20'
                     }`}>
                        {s.icon}
                     </div>
                     <div className={`text-[10px] uppercase font-bold tracking-widest ${
                        isComplete ? 'text-[#00ff41]' : isInMotion ? 'text-[#00eaff]' : 'opacity-20'
                     }`}>{s.label}</div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-10 h-[1px] bg-[#1a3a45]" />
                  )}
               </div>
             );
          })}
       </div>
    </motion.div>
  );
}

function GuardianGrid({ guardians }: { guardians: GuardianState[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6"
    >
       {guardians.map((g) => (
         <div key={g.id} className="border border-[#1a3a45] p-5 bg-[#05070a] group hover:border-[#00eaff33] transition-all relative">
            <div className="flex justify-between items-start mb-4">
               <div className="text-2xl">{g.symbol}</div>
               <div className={`text-[7px] px-1.5 py-0.5 border rounded-xs ${
                 g.status === 'ACTIVE' ? 'border-[#00ff41] text-[#00ff41]' :
                 g.status === 'REGENERATING' ? 'border-[#ffcc00] text-[#ffcc00] animate-pulse' :
                 'border-[#1a3a45] opacity-40'
               }`}>{g.status}</div>
            </div>
            <div className="text-[12px] uppercase font-black tracking-tight text-white mb-1">{g.name}</div>
            <div className="flex items-center gap-2 mb-4">
               <div className="flex-1 h-0.5 bg-[#1a3a4544]">
                  <div className="h-full bg-[#00eaff]" style={{ width: `${g.alignment}%` }} />
               </div>
               <span className="text-[9px] text-[#00eaff] font-mono">{g.alignment}%</span>
            </div>
            <div className="text-[8px] opacity-30 uppercase tracking-widest leading-relaxed">
               Subsystem: {g.name}_Core_V1 <br/>
               Status: {g.alignment > 90 ? 'OPTIMAL' : 'STABILIZING'}
            </div>
            
            {/* Visual indicator of subsystem health */}
            {g.status === 'ACTIVE' && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                 <div className="w-1 h-1 bg-[#00ff41] rounded-full" />
                 <div className="w-1 h-1 bg-[#00ff41] rounded-full animate-ping" />
              </div>
            )}
         </div>
       ))}
    </motion.div>
  );
}

function StatusIndicator({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 opacity-20">
       <div className="w-1 h-1 bg-current rounded-full" />
       {children}
    </div>
  );
}
