#!/usr/bin/env python3
"""
Parse TLC counterexample trace for 3-resource ConversionFront_v3.
Extracts (phi, r, s, e) from the violating fusion-entry state.
"""

import re
import sys
import argparse


def parse_last_state(text: str) -> dict:
    blocks = re.split(r'State \d+:', text)
    if not blocks:
        raise ValueError("No State blocks found")
    
    last = blocks[-1]
    state = {}
    
    for line in last.splitlines():
        match = re.match(r'\s*/\\\s+([a-z_][a-z0-9_]*)\s*=\s*(.+)', line)
        if match:
            var, val = match.group(1), match.group(2).strip()
            try:
                state[var] = int(val)
            except ValueError:
                if val.startswith('"') and val.endswith('"'):
                    state[var] = val[1:-1]
                else:
                    state[var] = val
    return state


def classify_peak_3d(state: dict, c_phi: float, c_r: float, c_s: float):
    e = state.get('e', 0)
    phi = state.get('phi', 0)
    r = state.get('r', 0)
    s = state.get('s', 0)
    mode = state.get('mode', 'UNKNOWN')
    
    W = e + c_phi * phi + c_r * r + c_s * s
    
    print(f"\nLast State: mode={mode}")
    print(f"  phi={phi}, r={r}, s={s}, e={e}")
    print(f"  W = {e} + {c_phi}*{phi} + {c_r}*{r} + {c_s}*{s} = {W:.2f}")
    
    # Classify by dominance pattern
    if phi >= 6 and r <= 6 and s <= 1:
        return "Peak A (high-phi, low-r, low-s)"
    elif phi <= 6 and r >= 12 and s <= 2:
        return "Peak B (low-phi, high-r, low-s)"
    elif phi <= 5 and r >= 8 and s >= 3:
        return "Peak C (low-phi, moderate-r, high-s)"
    else:
        return "Intermediate/Transition"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("trace_file")
    parser.add_argument("--cphi", type=float, default=0)
    parser.add_argument("--cr", type=float, default=0)
    parser.add_argument("--cs", type=float, default=0)
    args = parser.parse_args()
    
    with open(args.trace_file, 'r') as f:
        text = f.read()
    
    state = parse_last_state(text)
    peak = classify_peak_3d(state, args.cphi, args.cr, args.cs)
    print(f"  Classification: {peak}")


if __name__ == "__main__":
    main()
