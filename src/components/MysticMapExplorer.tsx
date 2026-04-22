import React from "react";
import { motion } from "framer-motion";
import { Bookmark, Shield, Zap, Search } from "lucide-react";
import { omegaDossier, DossierEntry } from "../data/omegaDossier";

export const MysticMapExplorer: React.FC = () => {
  const [selected, setSelected] = React.useState<DossierEntry | null>(omegaDossier[0]);
  const [search, setSearch] = React.useState("");

  const filtered = omegaDossier.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#05070a] border border-[#1a3a45] rounded-sm overflow-hidden">
      <div className="p-6 border-b border-[#1a3a45] bg-[#00eaff05] flex justify-between items-center">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Bookmark className="text-[#ffcc00]" size={16} />
            Codex_Vault_Explorer
          </h2>
          <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1">Accessing archived strategic protocols and real-time intel.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input 
            type="text" 
            placeholder="Search Codex..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#05070a] border border-[#1a3a45] text-[10px] pl-9 pr-4 py-2 rounded-xs outline-none focus:border-[#00eaff33] w-64 uppercase"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#1a3a45] overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className={`w-full text-left p-4 border transition-all rounded-xs flex flex-col gap-1 ${
                selected?.id === d.id 
                  ? 'border-[#00eaff33] bg-[#00eaff05]' 
                  : 'border-transparent hover:bg-[#ffffff03]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] opacity-40 uppercase font-mono">{d.category}</span>
                <span className="text-[8px] opacity-20 font-mono tracking-tighter">{d.id}</span>
              </div>
              <h3 className={`text-[11px] font-bold uppercase ${selected?.id === d.id ? 'text-[#00eaff]' : 'text-[#8899a6]'}`}>{d.title}</h3>
              <p className="text-[9px] opacity-30 line-clamp-2 uppercase tracking-tight">{d.summary}</p>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_50%_0%,_#00eaff05_0%,_transparent_70%)]">
          {selected ? (
            <motion.div 
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[10px] font-mono opacity-40 uppercase">
                  <span className="bg-[#1a3a45] px-2 py-0.5 rounded-xs text-white">{selected.category}</span>
                  <span>Updated: {selected.lastUpdated}</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-[0.2em]">{selected.title}</h1>
                <p className="text-sm opacity-60 leading-relaxed uppercase">{selected.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-[#1a3a45] bg-[#00eaff03] rounded-sm space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#ffcc00] font-black">
                     <Shield size={14} /> Protocol_Specs
                  </div>
                  <ul className="space-y-3">
                    {selected.details.map((detail, i) => (
                      <li key={i} className="flex gap-3 text-[11px] uppercase tracking-tight opacity-50">
                        <span className="text-[#00eaff] font-mono">0{i+1}:</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="p-4 border border-[#1a3a45] rounded-xs space-y-2 opacity-40">
                      <div className="text-[9px] uppercase font-black flex items-center gap-2">
                        <Zap size={10} /> Operational_Note
                      </div>
                      <p className="text-[8px] uppercase">This codex entry is synchronized with the live OMEGA core. Any local deviations must be authorized via direct console command.</p>
                   </div>
                   <button className="w-full py-3 bg-[#00eaff22] hover:bg-[#00eaff33] text-[#00eaff] text-[10px] uppercase font-black tracking-widest rounded-xs transition-all border border-[#00eaff33]">
                      Execute_Protocol_Test
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] opacity-20 uppercase tracking-[0.5em] font-mono italic">
               Select_Codex_Segment_To_Decrypt...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
