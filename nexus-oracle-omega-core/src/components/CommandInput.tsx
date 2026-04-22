import { useState } from "react";
import { useCodex } from "../context/CodexContext";
import {
  Terminal,
  Send,
  Zap,
  Shield,
  Cpu,
  History,
  Sparkles,
  Camera,
  RefreshCcw,
  Waves,
  SlidersHorizontal,
  Palette,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LATTICE_CONTROL_LIMITS } from "../lib/frequency-map";

export type LatticeCommandAction =
  | { type: "set"; key: "freq" | "speed" | "complexity" | "hue"; value: number }
  | { type: "reset" }
  | { type: "capture" };

interface CommandInputProps {
  latticeMode?: boolean;
  onLatticeCommand?: (command: LatticeCommandAction) => Promise<string | void> | string | void;
  className?: string;
}

const defaultCommands = [
  { id: "STABILIZE", icon: Shield, label: "Stabilize" },
  { id: "BOOST", icon: Zap, label: "Boost" },
  { id: "PREDICTION", icon: Cpu, label: "Simulate" },
  { id: "TRACE", icon: History, label: "Trace" },
  { id: "ORACLE", icon: Sparkles, label: "Oracle" },
] as const;

const latticeCommands = [
  { id: "freq 1.00", icon: Waves, label: "Freq" },
  { id: "speed 1.20", icon: SlidersHorizontal, label: "Speed" },
  { id: "complexity 4", icon: Cpu, label: "Complexity" },
  { id: "hue 0", icon: Palette, label: "Hue" },
  { id: "reset", icon: RefreshCcw, label: "Reset" },
  { id: "capture", icon: Camera, label: "Capture" },
] as const;

function parseLatticeCommand(raw: string): LatticeCommandAction | { error: string } {
  const [head, value] = raw.trim().split(/\s+/, 2);
  const command = head?.toLowerCase();

  if (!command) {
    return { error: "Command is required." };
  }

  if (command === "reset") {
    return { type: "reset" };
  }

  if (command === "capture") {
    return { type: "capture" };
  }

  if (!["freq", "speed", "complexity", "hue"].includes(command)) {
    return { error: `Unknown lattice command: ${command}` };
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { error: `${command} expects a numeric value.` };
  }

  const limits = LATTICE_CONTROL_LIMITS[command as "freq" | "speed" | "complexity" | "hue"];
  const normalized =
    command === "complexity" ? Math.round(numeric) : numeric;

  if (normalized < limits.min || normalized > limits.max) {
    return {
      error: `${command} must be between ${limits.min} and ${limits.max}.`,
    };
  }

  return {
    type: "set",
    key: command as "freq" | "speed" | "complexity" | "hue",
    value: normalized,
  };
}

export default function CommandInput({
  latticeMode = false,
  onLatticeCommand,
  className,
}: CommandInputProps) {
  const [input, setInput] = useState("");
  const { sendIntent, lastAck, runOracleAnalysis, isAnalyzing } = useCodex();
  const [isFocused, setIsFocused] = useState(false);
  const [localAck, setLocalAck] = useState<{
    action: string;
    status: string;
    result?: string;
    timestamp: number;
  } | null>(null);

  const displayAck = latticeMode ? localAck : lastAck;
  const commandChips = latticeMode ? latticeCommands : defaultCommands;

  const handleDefaultCommand = async (cmd: string) => {
    const action = cmd.toUpperCase();

    if (action === "ORACLE") {
      await runOracleAnalysis();
      return;
    }

    const meta =
      action === "PREDICTION"
        ? { steps: 50 }
        : action === "TRACE"
          ? { limit: 100 }
          : undefined;

    sendIntent(action, meta);
  };

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) {
      return;
    }

    if (latticeMode && onLatticeCommand) {
      const parsed = parseLatticeCommand(cmd);
      if ("error" in parsed) {
        setLocalAck({
          action: cmd,
          status: "REJECTED",
          result: parsed.error,
          timestamp: Date.now(),
        });
        return;
      }

      const result = await onLatticeCommand(parsed);
      const ackResult =
        typeof result === "string"
          ? result
          : parsed.type === "capture"
            ? "Capture emitted."
            : parsed.type === "reset"
              ? "Local lattice controls restored."
              : `${parsed.key} updated.`;
      setLocalAck({
        action:
          parsed.type === "set"
            ? `${parsed.key} ${parsed.value}`
            : parsed.type === "capture"
              ? "capture"
              : "reset",
        status: "OK",
        result: ackResult,
        timestamp: Date.now(),
      });
      setInput("");
      return;
    }

    await handleDefaultCommand(cmd);
    setInput("");
  };

  return (
    <div className={`group ${className ?? ""}`}>
      <div
        className={`relative flex items-center rounded-[18px] border bg-[#0a1118cc] px-4 py-3 shadow-[0_0_25px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 ${
          isFocused
            ? "border-[#00eaff] shadow-[0_0_15px_rgba(0,234,255,0.15)]"
            : "border-[#1a3a45]"
        }`}
      >
        <Terminal
          size={14}
          className={`mr-4 ${
            isFocused || isAnalyzing ? "text-[#00eaff]" : "text-[#8899a6]"
          }`}
        />

        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleCommand(input)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            latticeMode
              ? "freq 1.00 / speed 1.20 / complexity 4 / hue 0 / capture"
              : isAnalyzing
                ? "Oracle Inference in progress..."
                : "System Command Entry [intent_initiate]..."
          }
          disabled={isAnalyzing && !latticeMode}
          className="flex-1 bg-transparent text-[11px] uppercase tracking-widest text-[#00eaff] outline-none placeholder:italic placeholder:text-[#1a3a45]"
        />

        <button
          onClick={() => handleCommand(input)}
          disabled={isAnalyzing && !latticeMode}
          className="ml-4 rounded-[10px] p-1.5 transition-colors hover:bg-[#00eaff11] disabled:opacity-50"
        >
          {isAnalyzing && !latticeMode ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#00eaff] border-t-transparent" />
          ) : (
            <Send size={14} className="text-[#00eaff]" />
          )}
        </button>

        <AnimatePresence>
          {displayAck ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`absolute -right-1 -top-1 h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,255,65,0.8)] ${
                displayAck.status === "REJECTED" ? "bg-[#ff8c8c]" : "bg-[#00ff41]"
              }`}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 overflow-hidden">
        {commandChips.map((command) => (
          <button
            key={command.id}
            onClick={() => handleCommand(command.id)}
            className="group/btn flex items-center gap-2 rounded-[14px] border border-[#1a3a4566] bg-[#05070a99] px-3 py-1.5 transition-all hover:border-[#00eaff33] hover:bg-[#00eaff08]"
          >
            <command.icon
              size={10}
              className="text-[#8899a6] transition-colors group-hover/btn:text-[#00eaff]"
            />
            <span className="text-[8px] uppercase tracking-wider text-[#8899a6] group-hover/btn:text-[#fff]">
              {command.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 pl-2">
        {displayAck ? (
          <div
            className={`flex items-center gap-2 text-[8px] uppercase tracking-widest opacity-70 ${
              displayAck.status === "REJECTED" ? "text-[#ff8c8c]" : "text-[#00ff41]"
            }`}
          >
            <div
              className={`h-1 w-1 rounded-full ${
                displayAck.status === "REJECTED" ? "bg-[#ff8c8c]" : "bg-[#00ff41]"
              }`}
            />
            {displayAck.action} // {displayAck.status}
            {displayAck.result ? ` // ${displayAck.result}` : ""}
          </div>
        ) : latticeMode ? (
          <div className="text-[7px] uppercase tracking-widest text-[#1a3a45] italic">
            Local lattice controls only. Use reset to clear overrides.
          </div>
        ) : (
          <div className="text-[7px] uppercase tracking-widest text-[#1a3a45] italic">
            Waiting for operator intent...
          </div>
        )}
      </div>
    </div>
  );
}
