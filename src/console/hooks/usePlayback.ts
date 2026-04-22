import { useEffect, useState } from "react";
import { CodexStep, PlaybackState } from "../types";

export function usePlayback(history: CodexStep[]) {
  const [state, setState] = useState<PlaybackState>({
    active: false,
    index: 0,
    speedMs: 800
  });

  useEffect(() => {
    if (!state.active) return;
    if (state.index >= history.length - 1) {
      setState(s => ({ ...s, active: false }));
      return;
    }
    const id = setTimeout(() => {
      setState(s => ({ ...s, index: s.index + 1 }));
    }, state.speedMs);
    return () => clearTimeout(id);
  }, [state, history.length]);

  const controls = {
    play: () => setState(s => ({ ...s, active: true })),
    pause: () => setState(s => ({ ...s, active: false })),
    reset: () => setState(s => ({ ...s, index: 0 })),
    setSpeed: (speedMs: number) => setState(s => ({ ...s, speedMs })),
    next: () => setState(s => ({ ...s, index: Math.min(history.length - 1, s.index + 1) })),
    prev: () => setState(s => ({ ...s, index: Math.max(0, s.index - 1) }))
  };

  const currentStep = history[state.index] ?? null;

  return { state, currentStep, controls };
}
