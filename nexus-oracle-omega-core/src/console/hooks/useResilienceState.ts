import { useCodex } from "../../context/CodexContext";
import { ResilienceState } from "../types";

export function useResilienceState(): ResilienceState {
  const { meridian } = useCodex();
  
  if (!meridian || !meridian.resilience) {
    return {
      rateLimitState: "NORMAL",
      cacheState: "COLD"
    };
  }

  return meridian.resilience as ResilienceState;
}
