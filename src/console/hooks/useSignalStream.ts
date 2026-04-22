import { useCodex } from "../../context/CodexContext";
import { SignalSnapshot, PlateAlignment } from "../types";

export function useSignalStream() {
  const { data } = useCodex();
  
  // We'll focus on the most recent market signal for the primary console view
  const marketSignal = data.find(s => s.type === "market");
  
  const signal: SignalSnapshot | null = marketSignal ? {
    id: marketSignal.id,
    name: marketSignal.name,
    price: marketSignal.payload.price,
    momentum: marketSignal.momentum,
    volatility: marketSignal.volatility,
    source: marketSignal.source,
    timestamp: marketSignal.timestamp
  } : null;

  const alignment: PlateAlignment | null = marketSignal && marketSignal.codex_alignment ? {
    plateId: marketSignal.codex_alignment,
    reason: marketSignal.volatility > 0.6 ? "High Volatility detected" : 
            marketSignal.momentum > 0.5 ? "Strong Momentum shift" : "Baseline Liquidity alignment"
  } : null;

  return { signal, alignment };
}
