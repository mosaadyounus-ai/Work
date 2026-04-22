import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Monitor, Bookmark, ArrowLeft } from "lucide-react";
import { MysticMapExplorer } from "../components/MysticMapExplorer";
import { useCodex } from "../context/CodexContext";

export default function CodexPage() {
  const { isProcessing, lastSync, data } = useCodex();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#05070a] text-[#00eaff]">
      {/* SHARED HEADER */}
      <header className="flex justify-between items-center py-5 px-8 border-b border-[#1a3a45] bg-[#00eaff08]">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className={`w-3 h-3 ${isProcessing ? 'bg-[#00ff41] animate-ping' : 'bg-[#00eaff]'}`} />
          <h1 className="text-xl font-display font-black uppercase tracking-[4px] glow-text">Codex_Vault</h1>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4 border-r border-[#1a3a45] pr-6 mr-6">
             <Link to="/" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                <LayoutDashboard size={12} />
                Surface
             </Link>
             <Link to="/console" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                <Monitor size={12} />
                Console
             </Link>
             <Link to="/codex" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#ffcc00] bg-[#ffcc0011] px-3 py-1 border border-[#ffcc0033] rounded-xs">
                <Bookmark size={12} />
                Codex
             </Link>
          </nav>
          <div className="hidden md:flex gap-6 text-[11px] uppercase opacity-80">
            <div className="flex items-center gap-1.5"><span className="text-[#8899a6]">SYNC:</span> {lastSync}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden">
        <MysticMapExplorer />
      </main>
    </div>
  );
}
