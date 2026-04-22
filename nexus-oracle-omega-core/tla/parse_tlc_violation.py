#!/usr/bin/env python3
"""
Parse TLC counterexample trace to identify violating peak (A or B).
Usage: python3 parse_tlc_violation.py <trace_file> [--mpred N]
"""

import re
import sys
import argparse


def parse_last_state(text: str) -> dict:
    """Extract variable assignments from the last State block."""
    blocks = re.split(r'State \d+:', text)
    if not blocks:
        raise ValueError("No State blocks found")
    
    last = blocks[-1]
    state = {}
    
    for line in last.splitlines():
        match = re.match(r'\s*/\\\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)', line)
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


def classify_peak(state: dict, m_pred: float, c_phi: float, c_r: float):
    """Classify which peak (A or B) caused the violation."""
    e = state.get('e', 0)
    phi = state.get('phi', 0)
    r = state.get('r', 0)
    mode = state.get('mode', 'UNKNOWN')
    
    W = e + c_phi * phi + c_r * r
    
    print(f"\nLast State: mode={mode}, phi={phi}, r={r}, e={e}")
    print(f"Envelope: W = {e} + {c_phi}*{phi} + {c_r}*{r} = {W:.2f}")
    print(f"Bound M_pred = {m_pred}")
    print(f"Status: {'VIOLATES' if W > m_pred else 'SATISFIES'}")
    
    if phi >= 2 and r <= 3:
        return "A (high-phi, low-r)"
    elif phi <= 3 and r >= 8:
        return "B (low-phi, high-r)"
    else:
        return "Intermediate/Transition"


def main():
    parser = argparse.ArgumentParser(description="Parse TLC trace for ConversionFront")
    parser.add_argument("trace_file", help="Path to TLC stdout / trace dump")
    parser.add_argument("--mpred", type=float, default=4.0, help="M_pred value")
    parser.add_argument("--cphi", type=float, default=0.0, help="C_phi value")
    parser.add_argument("--cr", type=float, default=0.25, help="C_r value")
    args = parser.parse_args()
    
    with open(args.trace_file, 'r') as f:
        text = f.read()
    
    state = parse_last_state(text)
    peak = classify_peak(state, args.mpred, args.cphi, args.cr)
    print(f"\nPeak Classification: {peak}")


if __name__ == "__main__":
    main()
