import { motion } from "motion/react";
import { Search, ChevronRight } from "lucide-react";

export function CommandInput() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[600px] flex items-center space-x-4 bg-black/40 border border-chorus-primary/30 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-[0_0_50px_rgba(0,245,212,0.1)] z-50 group"
    >
      <div className="text-chorus-primary font-mono text-lg glow-text group-focus-within:animate-pulse">λ</div>
      <input 
        type="text" 
        placeholder="Enter command or neural bridge query..." 
        className="bg-transparent border-none outline-none text-white placeholder-white/20 w-full text-sm font-light tracking-wide focus:placeholder-white/40 transition-all"
      />
      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-white/30 border border-white/20 px-1.5 py-0.5 rounded font-mono">ENTER</span>
      </div>
    </motion.div>
  );
}

