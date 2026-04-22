import { ProcessedSignal } from "../lib/types";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Radio, Filter, AlertTriangle, Activity, CheckCircle2, ChevronDown, ChevronUp, Layers, Cpu, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import React, { useState, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FuturePanelProps {
  data: ProcessedSignal[];
}

type FilterStatus = "ALL" | "EXEC" | "CRITICAL_FAIL" | "RISK_HIGH";

export default function FuturePanel({ data }: FuturePanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "EXEC") return d.trace?.includes("EXEC");
      if (activeFilter === "CRITICAL_FAIL") return d.invariantStatus && !d.invariantStatus.passed;
      if (activeFilter === "RISK_HIGH") return d.risk > 70;
      return true;
    });
  }, [data, activeFilter]);

  return (
    <div className="space-y-4">
      {/* 1. FILTER_BAR: TACTICAL SELECTION */}
      <div className="flex flex-wrap gap-2 items-center px-4 py-3 bg-[#0a1118] border border-[#1a3a45] rounded-xs shadow-inner">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#00eaff] opacity-60 mr-4 font-black">
          <Filter size={12} className="animate-pulse" />
          <span>Audit_Filter_Lattice</span>
        </div>
        
        <FilterChip 
          label="All_Signals" 
          active={activeFilter === "ALL"} 
          onClick={() => setActiveFilter("ALL")} 
          count={data.length}
        />
        <FilterChip 
          label="Exec_Cycles" 
          icon={<CheckCircle2 size={10} />}
          active={activeFilter === "EXEC"} 
          onClick={() => setActiveFilter("EXEC")} 
          count={data.filter(d => d.trace?.includes("EXEC")).length}
          color="text-[#00ff41]"
        />
        <FilterChip 
          label="Invariants" 
          icon={<AlertTriangle size={10} />}
          active={activeFilter === "CRITICAL_FAIL"} 
          onClick={() => setActiveFilter("CRITICAL_FAIL")} 
          count={data.filter(d => d.invariantStatus && !d.invariantStatus.passed).length}
          color="text-[#ff3b3b]"
        />
        <FilterChip 
          label="Risk_Spikes" 
          icon={<Activity size={10} />}
          active={activeFilter === "RISK_HIGH"} 
          onClick={() => setActiveFilter("RISK_HIGH")} 
          count={data.filter(d => d.risk > 70).length}
          color="text-[#ffcc00]"
        />
      </div>

      {/* 2. SIGNAL_GRID: ANIMATED TRAVERSAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-[#1a3a4533]">
        <AnimatePresence mode="popLayout">
          {filteredData.map((d) => (
            <SignalCard 
              key={d.id} 
              signal={d} 
              isExpanded={expandedId === d.id}
              onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
            />
          ))}
        </AnimatePresence>

        {/* 3. WORLD_EVENT_MONITOR: PERSISTENT CONTEXT */}
        <motion.div 
          layout
          className="bg-[#05070a] p-6 flex flex-col min-h-[480px] border border-[#1a3a45] relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #05070a 0%, #0a1118 100%)' }}
        >
          <div className="flex justify-between items-baseline mb-6 border-b border-[#1a3a45] pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#8899a6] font-black">World Event Monitor</h2>
            <div className="flex items-center gap-2">
               <span className="text-[8px] text-[#00ff41] animate-pulse font-mono font-bold tracking-widest">LIVE_DENSE_FEED</span>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 h-full overflow-y-auto no-scrollbar">
            {data.filter(d => d.type === 'news' || d.type === 'event').slice(0, 4).map((news, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="border-l-2 border-[#1a3a45] pl-4 py-2 bg-[#00eaff03] hover:bg-[#00eaff08] transition-colors"
              >
                <div className="text-[10px] text-white opacity-90 font-black tracking-tight leading-relaxed">{news.payload.headline || news.name}</div>
                <div className="flex justify-between mt-2 items-center">
                  <span className="text-[7px] opacity-40 uppercase tracking-widest font-mono">{news.source}</span>
                  <div className={`text-[9px] font-bold ${news.score < 0 ? 'text-[#ff3b3b]' : 'text-[#00ff41]'}`}>
                    {news.score.toFixed(1)} <span className="text-[7px] opacity-30 tracking-tight">SIG_RES</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="pt-6 border-t border-[#1a3a4533]">
               <div className="text-[9px] opacity-30 uppercase tracking-[0.3em] font-bold mb-4">Lattice Convergence Analytics</div>
               <div className="flex items-end gap-1.5 h-12">
                 {[40, 70, 45, 90, 65, 80, 50, 30, 85, 45].map((h, i) => (
                   <div key={i} className="flex-1 bg-[#00eaff11] relative group overflow-hidden">
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-[#00eaff33] group-hover:bg-[#00eaff88] transition-colors" 
                     />
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#1a3a4533] flex justify-between items-center text-[8px] opacity-30 font-mono tracking-widest">
             <div className="flex gap-4">
                <span>DEDUPLICATION: NOMINAL</span>
                <span>SYNC_LATENCY: 4MS</span>
             </div>
             <ShieldCheck size={12} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- SIGNAL_CARD: HIGH-FIDELITY COMPONENT ---

const SignalCard = React.forwardRef<HTMLDivElement, { signal: ProcessedSignal, isExpanded: boolean, onToggle: () => void }>(({ signal: d, isExpanded, onToggle }, ref) => {
  return (
    <motion.div 
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`bg-[#05070a] p-6 flex flex-col border border-[#1a3a45] relative group overflow-hidden transition-colors ${
        isExpanded ? 'md:col-span-2 lg:col-span-2 z-10' : 'hover:border-[#00eaff33]'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] text-white font-black glow-text mb-1">{d.name}</h2>
          <div className="flex items-center gap-3">
             <span className="text-[8px] text-[#00eaff] font-mono tracking-widest bg-[#00eaff11] px-1.5 py-0.5 border border-[#00eaff33]">{d.type.toUpperCase()}</span>
             <span className="text-[8px] opacity-50 font-mono uppercase">ID: {d.id.substring(0,8)}</span>
          </div>
        </div>
        <button 
          onClick={onToggle}
          className="p-1.5 border border-[#1a3a45] bg-[#1a3a4533] text-[#8899a6] hover:text-[#00eaff] hover:border-[#00eaff33] transition-all"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      {/* Dynamic Summary View */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="h-24 w-full bg-[#00eaff03] border border-[#1a3a45] p-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.history}>
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#00eaff" 
                fill="#00eaff33" 
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute top-1 right-2 text-[7px] opacity-30 font-bold uppercase">Trace_Persistence</div>
        </div>
        
        <div className="flex flex-col justify-between py-1">
           <div className="space-y-3">
              <PostureIndicator label="Posture" value={d.decision} />
              <PostureIndicator label="Confidence" value={`${(d.confidence * 100).toFixed(0)}%`} color="#00eaff" />
              <PostureIndicator label="Risk_Idx" value={d.risk.toFixed(1)} color={d.risk > 70 ? "#ff3b3b" : "#ffcc00"} />
           </div>
        </div>
      </div>

      {/* Expanded Signal Engine */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#1a3a4533] mb-6">
               <div className="space-y-4">
                  <h4 className="text-[9px] uppercase tracking-[0.2em] text-[#00eaff] opacity-60 font-black flex items-center gap-2">
                     <Cpu size={12} /> Decision_Evidence_Matrix
                  </h4>
                  <div className="space-y-2 bg-[#00eaff03] p-4 border border-[#1a3a4533] rounded-sm">
                    {d.scenarios.map((s) => (
                      <div key={s.name} className="flex justify-between items-center text-[10px]">
                        <span className="opacity-60">{s.name}</span>
                        <div className="flex items-center gap-3">
                           <div className="w-24 h-1 bg-[#1a3a4544] rounded-full overflow-hidden">
                              <div className={`h-full ${s.impact < 0 ? 'bg-[#ff3b3b]' : 'bg-[#00ff41]'}`} style={{ width: `${Math.abs(s.impact) * 4}%` }} />
                           </div>
                           <span className={`font-mono font-bold ${s.impact < 0 ? 'text-[#ff3b3b]' : 'text-[#00ff41]'}`}>
                              {s.impact > 0 ? '+' : ''}{s.impact.toFixed(1)}%
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[9px] uppercase tracking-[0.2em] text-[#00eaff] opacity-60 font-black flex items-center gap-2">
                     <Layers size={12} /> Lattice_Alignment_Traces
                  </h4>
                  <div className="space-y-3">
                     <div className="flex gap-1.5 flex-wrap">
                        {d.entities.map(ent => (
                          <span key={ent} className="text-[8px] uppercase px-2 py-0.5 border border-[#1a3a45] bg-[#05070a] hover:border-[#00eaff33] transition-colors">
                             {ent}
                          </span>
                        ))}
                     </div>
                     <div className="p-3 bg-[#0a0c10] border border-[#1a3a45] rounded-xs font-mono">
                        <div className="text-[9px] text-[#00eaff] mb-2 border-b border-[#1a3a4533] pb-1 uppercase font-black opacity-80">Codex_Execution_Path</div>
                        <div className="flex items-center gap-2">
                           <div className="text-[10px] text-[#00ff41] bg-[#00ff4111] px-1.5 rounded-sm">{d.vesselState}</div>
                           <div className="h-[1px] w-4 bg-[#1a3a45]" />
                           <div className="flex gap-1">
                              {d.trace?.map((step, idx) => (
                                <div key={idx} className={`text-[8px] px-1.5 py-0.5 border rounded-xs ${
                                  step === 'EXEC' ? 'border-[#00ff41] text-[#00ff41]' : 'border-[#1a3a45] opacity-40'
                                }`}>{step}</div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#0a0c10] p-4 border border-[#1a3a45] mb-6">
                <div className="flex justify-between items-center mb-3">
                   <div className="text-[9px] uppercase font-bold text-[#8899a6]">Context_Snapshot_Direct_Buffer</div>
                   <ExternalLink size={10} className="opacity-40" />
                </div>
                <div className="max-h-40 overflow-y-auto no-scrollbar font-mono text-[9px] text-[#00eaff55] leading-relaxed italic">
                   {JSON.stringify(d.contextSnapshot, null, 2)}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-4 border-t border-[#1a3a45] flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${d.invariantStatus?.passed ? 'bg-[#00ff41]' : 'bg-[#ff3b3b]'}`} />
            <span className="text-[9px] uppercase opacity-40 tracking-widest font-bold">
               {d.invariantStatus?.passed ? 'SYNC_NOMINAL' : 'INVARIANT_FAILURE'}
            </span>
         </div>
         <div className="text-[9px] font-black tracking-widest text-[#00eaff] opacity-60">
            {d.score.toFixed(1)} <span className="opacity-30">P_SCORE</span>
         </div>
      </div>
    </motion.div>
  );
});

// --- UTILITIES ---

function FilterChip({ label, active, onClick, count, icon, color = "text-[#00eaff]" }: { 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  count: number,
  icon?: ReactNode,
  color?: string
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-1.5 rounded-xs border transition-all cursor-pointer ${
        active 
          ? `bg-[#00eaff11] border-[#00eaff44] ${color}` 
          : 'bg-transparent border-[#1a3a45] text-[#8899a6] opacity-60 hover:opacity-100 hover:border-[#1a3a45bb]'
      }`}
    >
      {icon}
      <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
      <span className={`text-[9px] font-mono px-1.5 border rounded-sm ${
        active ? 'bg-[#00eaff22] border-[#00eaff33]' : 'bg-[#1a3a4533] border-[#1a3a45]'
      }`}>
        {count}
      </span>
    </button>
  );
}

function PostureIndicator({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center group">
       <span className="text-[8px] uppercase tracking-widest opacity-30 font-bold group-hover:opacity-100 transition-opacity">{label}</span>
       <span className="text-[12px] font-black uppercase tracking-tighter" style={{ color: color || '#8899a6' }}>{value}</span>
    </div>
  );
}



