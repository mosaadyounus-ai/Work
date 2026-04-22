import React from "react";
import { List, ArrowRight, MessageSquarePlus, Tag } from "lucide-react";
import { useCodex } from "../../context/CodexContext";
import { AnnotationSeverity, CodexStep } from "../types";

export const TraceTimeline: React.FC<{ steps: CodexStep[] }> = ({ steps }) => {
  const { annotations, addAnnotation } = useCodex();
  const [annotatingId, setAnnotatingId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [label, setLabel] = React.useState("GOOD_TRAVERSAL");
  const [severity, setSeverity] = React.useState<AnnotationSeverity>("INFO");

  const handleSubmit = async (e: React.FormEvent, signalId: string) => {
    e.preventDefault();
    await addAnnotation({
      signalId,
      label,
      note,
      severity
    });
    setAnnotatingId(null);
    setNote("");
  };

  return (
    <div className="bg-[#05070a] border border-[#1a3a45] rounded-sm p-5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#1a3a45] pb-2 mb-4">
         <List size={14} className="text-[#00eaff]" />
         <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#8899a6]">Codex_Lattice_Trace</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {(!steps || steps.length === 0) ? (
          <div className="text-[10px] opacity-20 uppercase h-32 flex items-center justify-center font-mono italic">Trace_Buffer_Empty...</div>
        ) : (
          steps.map((s) => {
            const stepAnnotations = (annotations || []).filter(a => a.signalId === s.signalId);
            return (
              <div key={s.id} className="group flex flex-col gap-1 border-b border-[#1a3a4533] pb-2">
                <div className="hover:bg-[#ffffff03] p-2 flex items-center gap-4 transition-colors">
                  <span className="text-[8px] opacity-20 font-mono w-16">{s.timestamp.split('T')[1].split('.')[0]}</span>
                  
                  <div className="flex items-center gap-2 flex-1">
                     <div className="w-8 h-8 rounded-full border border-[#00eaff33] flex items-center justify-center text-[10px] bg-[#00eaff05] font-black text-[#00eaff]">
                       {s.plateId}
                     </div>
                     
                     <ArrowRight size={10} className="opacity-20 translate-x-1" />
                     
                     <div className="flex-1">
                        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                          {s.trace?.map((t, tidx) => (
                            <span key={tidx} className={`text-[7px] px-1 border rounded-xs font-mono uppercase ${
                              t.includes('EXEC') ? 'border-[#00ff4133] text-[#00ff41] bg-[#00ff4105]' : 
                              t.includes('EVAL') ? 'border-[#00eaff33] text-[#00eaff] bg-[#00eaff05]' :
                              'border-[#1a3a45] text-[#8899a6] opacity-40'
                            }`}>
                              {t.split(':')[0]}
                            </span>
                          ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setAnnotatingId(annotatingId === s.signalId ? null : s.signalId)}
                      className="opacity-0 group-hover:opacity-100 hover:text-[#00ff41] p-1 transition-all"
                    >
                      <MessageSquarePlus size={12} />
                    </button>
                    <div className="text-[9px] opacity-30 font-mono hidden md:block">
                       ID: {s.signalId.substring(0, 8)}
                    </div>
                  </div>
                </div>

                {/* Annotation List */}
                {stepAnnotations?.length > 0 && (
                  <div className="px-10 space-y-1">
                    {stepAnnotations.map(a => (
                      <div key={a.id} className={`text-[8px] p-1.5 px-2 border border-[#1a3a45] bg-[#00eaff03] rounded-xs flex items-center gap-2 ${
                        a.severity === 'CRITICAL' ? 'border-[#ff3b3b33] text-[#ff3b3b]' :
                        a.severity === 'WARN' ? 'border-[#ffcc0033] text-[#ffcc00]' : ''
                      }`}>
                        <Tag size={8} />
                        <span className="font-bold">[{a.label}]</span>
                        <span className="opacity-60">{a.note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Annotation Form */}
                {annotatingId === s.signalId && (
                  <form 
                    onSubmit={(e) => handleSubmit(e, s.signalId)}
                    className="mx-10 mt-2 p-3 border border-[#00eaff33] bg-[#00eaff05] rounded-sm space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                       <select 
                         value={label}
                         onChange={(e) => setLabel(e.target.value)}
                         className="bg-[#05070a] border border-[#1a3a45] text-[9px] p-1 rounded-xs uppercase outline-none focus:border-[#00eaff]"
                       >
                         <option value="GOOD_TRAVERSAL">Good Traversal</option>
                         <option value="FRAGILE_LATTICE">Fragile Lattice</option>
                         <option value="RISK_OVERLOAD">Risk Overload</option>
                         <option value="PATTERN_MATCH">Pattern Match</option>
                       </select>
                       <select 
                         value={severity}
                         onChange={(e) => setSeverity(e.target.value as AnnotationSeverity)}
                         className="bg-[#05070a] border border-[#1a3a45] text-[9px] p-1 rounded-xs uppercase outline-none focus:border-[#00eaff]"
                       >
                         <option value="INFO">Info</option>
                         <option value="WARN">Warn</option>
                         <option value="CRITICAL">Critical</option>
                       </select>
                    </div>
                    <textarea 
                      placeholder="Operational notes..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-[#05070a] border border-[#1a3a45] text-[9px] p-2 rounded-xs outline-none focus:border-[#00eaff] h-12"
                    />
                    <div className="flex justify-end gap-2">
                       <button type="button" onClick={() => setAnnotatingId(null)} className="text-[8px] uppercase opacity-40">Cancel</button>
                       <button type="submit" className="text-[8px] uppercase bg-[#00eaff22] px-2 py-1 rounded-xs hover:bg-[#00eaff33]">Commit</button>
                    </div>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-[#1a3a45] text-[8px] opacity-20 uppercase tracking-widest flex justify-between">
         <span>Trace_Buffer_Capacity: 50</span>
         <span>Latency: ~5ms</span>
      </div>
    </div>
  );
};
