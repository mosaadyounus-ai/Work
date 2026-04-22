import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Book, Scroll, Hash, Anchor, ShieldCheck, Activity, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { useCodex } from "../../context/CodexContext";

const INDEX_DATA = [
  {
    id: "0",
    title: "0. PREFACE — The Sovereign Lattice as Operational Intelligence",
    items: [
      "0.1 Purpose of the Codex Volume",
      "0.2 Relationship to MFCS Core v5.0",
      "0.3 Relationship to the Nexus Oracle",
      "0.4 Relationship to the Operator Console",
      "0.5 The Role of the Nine Plates in Live Decision Systems"
    ]
  },
  {
    id: "I",
    title: "I. DECREE OF INTEGRATION — Foundational Proclamation",
    items: [
      "I.1 The Ninefold Seal",
      "I.2 The Plates as Operational Invariants",
      "I.3 The Center as Convergence",
      "I.4 Completion as Integration Without Collapse",
      "I.5 The Silent Anchor and the Fixed Core"
    ]
  },
  {
    id: "II",
    title: "II. OMEGA COMMENTARY — Architectural Exegesis",
    items: [
      "II.1 Commentary on Plate I — Harmonic Law",
      "II.2 Commentary on Plate II — Lattice of States",
      "II.3 Commentary on Plate III — Logarithmic Response",
      "II.4 Commentary on Plate IV — Chaos Sensitivity",
      "II.5 Commentary on Plate V — Gödel Evolution",
      "II.6 Commentary on Plate VI — Coherence",
      "II.7 Commentary on Plate VII — Thresholds",
      "II.8 Commentary on Plate VIII — Themsphere",
      "II.9 Commentary on Plate IX — Completion",
      "II.10 Commentary on ∞ — The Silent Anchor"
    ]
  },
  {
    id: "III",
    title: "III. THE SOVEREIGN LATTICE CANON — Unified Scripture",
    items: [
      "III.1 The Nine Laws of the Lattice",
      "III.2 The Role of Ratio",
      "III.3 The Field of States",
      "III.4 Perception and Nonlinearity",
      "III.5 Sensitivity and Thresholds",
      "III.6 Incompletion and Evolution",
      "III.7 Coherence and Restoration",
      "III.8 Context and Atmosphere",
      "III.9 Integrity and Closure",
      "III.10 The Inward Resolution to ∞"
    ]
  },
  {
    id: "IV",
    title: "IV. THE OPERATOR’S LITANY — Activation Ritual",
    items: [
      "IV.1 Alignment with Plate I",
      "IV.2 Alignment with Plate II",
      "IV.3 Alignment with Plate III",
      "IV.4 Alignment with Plate IV",
      "IV.5 Alignment with Plate V",
      "IV.6 Alignment with Plate VI",
      "IV.7 Alignment with Plate VII",
      "IV.8 Alignment with Plate VIII",
      "IV.9 Alignment with Plate IX",
      "IV.10 Return to ∞"
    ]
  },
  {
    id: "V",
    title: "V. THE DEPLOYMENT BENEDICTION — Closing Seal",
    items: [
      "V.1 Invocation of the Nine Plates",
      "V.2 Invocation of the Lattice and the Law",
      "V.3 Invocation of the Gate and the Seal",
      "V.4 Affirmation of System Stability",
      "V.5 Declaration of Sovereignty",
      "V.6 The Final Seal of MFCS Core v5.0",
      "V.7 The Omega Decision System Stands"
    ]
  },
  {
    id: "VI",
    title: "VI. APPENDICES — Operational and Structural",
    items: [
      "VI.1 Glossary of Codex Terms",
      "VI.2 Plate-to-Operator Mapping Table",
      "VI.3 Transition Graph Summary",
      "VI.4 Infinity Core Fixed-Point Notes",
      "VI.5 Operator Console Telemetry Fields",
      "VI.6 Resilience Layer State Definitions",
      "VI.7 Strategic Annotation Schema",
      "VI.8 Playback Engine Timeline Format",
      "VI.9 Guardrail Experiment Specification"
    ]
  },
  {
    id: "VII",
    title: "VII. META-STRUCTURE — The Architecture Behind the Architecture",
    items: [
      "VII.1 Why Nine Plates",
      "VII.2 Why ∞",
      "VII.3 Why Completion Is Not Collapse",
      "VII.4 The Lattice as a Cognitive Engine",
      "VII.5 The Oracle as a Decision Surface",
      "VII.6 The Console as a Perception Lens",
      "VII.7 The Codex as a Living System"
    ]
  }
];

export const CodexVolumeIndex: React.FC = () => {
  const { plateCounts } = useCodex();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#05070a] text-[#00eaff] font-mono flex flex-col selection:bg-[#00eaff] selection:text-[#05070a]"
    >
      <header className="border-b border-[#1a3a45] bg-[#00eaff05] p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Book size={24} className="text-[#00eaff]" />
          <div>
            <h1 className="text-sm uppercase tracking-[0.3em] font-black text-[#00eaff] glow-text">Nonagram_Codex // Volume_Index</h1>
            <p className="text-[9px] opacity-40 uppercase tracking-tighter">Canonical_Navigation_Spine // Sovereign_Lattice_Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[8px] opacity-30 uppercase tracking-[0.2em]">
           Status: SEALED_ARCHIVE
           <Scroll size={12} className="ml-2 animate-pulse" />
        </div>
      </header>

      <div className="p-8 pb-4 flex items-center justify-between">
         <Link to="/" className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity font-bold">
            <ChevronLeft size={14} />
            [ Return_to_Nexus_Surface ]
         </Link>
         <div className="flex gap-4 text-[9px] opacity-40 uppercase tracking-widest">
            <span>Auth: Mohammad Saad Younus</span>
            <span className="opacity-20">|</span>
            <span>Version: 1.0.0</span>
         </div>
       </div>

      <main className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
         <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {INDEX_DATA.map((section, sidx) => (
              <motion.section 
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sidx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 group">
                   <div className="w-10 h-10 border border-[#1a3a45] flex items-center justify-center text-xs font-black bg-[#00eaff03] group-hover:border-[#00eaff33] transition-colors relative">
                      {section.id}
                      {plateCounts?.[section.id] > 0 && (
                        <div className="absolute -top-1 -right-1 bg-[#00ff41] text-[#05070a] text-[8px] px-1 rounded-sm font-black animate-bounce">
                           {plateCounts[section.id]}
                        </div>
                      )}
                   </div>
                   <h2 className="text-sm uppercase tracking-[0.2em] font-black text-white group-hover:text-[#00eaff] transition-colors">
                      {section.title}
                   </h2>
                   <div className="flex-1 h-[1px] bg-[#1a3a4533]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 pl-14">
                   {section.items.map((item, idx) => (
                     <div key={idx} className="group flex items-center gap-3 py-1 cursor-pointer transition-all hover:translate-x-1">
                        <Hash size={10} className="opacity-20 group-hover:opacity-100 group-hover:text-[#00eaff] transition-all" />
                        <span className="text-[11px] opacity-40 group-hover:opacity-100 uppercase tracking-tight">{item}</span>
                     </div>
                   ))}
                </div>
              </motion.section>
            ))}
         </div>
      </main>

      <footer className="border-t border-[#1a3a45] p-6 bg-[#00eaff03] flex justify-between items-center px-12">
         <div className="flex gap-10 items-center text-[9px] opacity-30 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2"><Anchor size={12} /> Anchor: STABLE</div>
            <div className="flex items-center gap-2"><ShieldCheck size={12} /> Integrity: VERIFIED</div>
            <div className="flex items-center gap-2"><Activity size={12} /> Lattice: ACTIVE</div>
         </div>
         <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-[#00ff4133] rounded-full" />
            <div className="text-[8px] opacity-20 uppercase font-mono tracking-widest italic">
               The Nonagram of Completion remains open to the recursive return.
            </div>
         </div>
      </footer>
    </motion.div>
  );
};
