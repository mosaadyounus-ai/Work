import { useCodex } from "../../context/CodexContext";

export function useCodexRuntime() {
  const { codexHistory, data } = useCodex();
  
  // Find the primary active plate from the most recent market signal
  const marketSignal = data.find(s => s.type === "market");
  const currentPlate = marketSignal?.codex_alignment || null;
  
  // Mapping operators based on plate logic
  const plateToOperator: Record<string, string> = {
    "I": "op_generate",
    "II": "op_structure",
    "III": "op_scale",
    "IV": "op_disturb",
    "V": "op_order",
    "VI": "op_merge",
    "VII": "op_invoke",
    "VIII": "op_cycle",
    "IX": "op_resolve"
  };

  const currentOperator = currentPlate ? plateToOperator[currentPlate] : null;

  return { steps: codexHistory, currentPlate, currentOperator };
}
