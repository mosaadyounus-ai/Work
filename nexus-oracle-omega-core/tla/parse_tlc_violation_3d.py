#!/usr/bin/env python3
"""
Parse a TLC counterexample trace for the 3-peak ConversionFront_v3 model.
Usage:
  python tla/parse_tlc_violation_3d.py trace_v3_A.txt --cphi 10 --cr 0 --cs 0 --mpred 43
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def parse_last_state(text: str) -> dict[str, int | str]:
    blocks = re.split(r"State \d+:", text)
    if len(blocks) < 2:
        raise ValueError("No TLC state blocks found in trace output.")

    state: dict[str, int | str] = {}
    for line in blocks[-1].splitlines():
        match = re.match(r'\s*/\\\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)', line)
        if not match:
            continue

        key, raw_value = match.group(1), match.group(2).strip()
        if raw_value.startswith('"') and raw_value.endswith('"'):
            state[key] = raw_value[1:-1]
            continue

        try:
            state[key] = int(raw_value)
        except ValueError:
            state[key] = raw_value

    return state


def classify_peak(phi: int, r: int, s: int) -> str:
    if (phi, r, s) == (4, 2, 0):
        return "P1 (high-phi, low-r, low-s)"
    if (phi, r, s) == (3, 6, 1):
        return "P2 (moderate-phi, high-r, low-s)"
    if (phi, r, s) == (2, 10, 2):
        return "P3 (low-phi, very-high-r, moderate-s)"
    return "Intermediate/transition"


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse TLC trace for ConversionFront_v3")
    parser.add_argument("trace_file", help="Path to the TLC stdout / trace dump")
    parser.add_argument("--cphi", type=float, default=0.0, help="Weight on phi")
    parser.add_argument("--cr", type=float, default=0.0, help="Weight on r")
    parser.add_argument("--cs", type=float, default=0.0, help="Weight on s")
    parser.add_argument("--mpred", type=float, default=0.0, help="Envelope bound used in the run")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON instead of the human summary.",
    )
    args = parser.parse_args()

    trace_path = Path(args.trace_file)
    try:
        text = trace_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = trace_path.read_text(encoding="utf-16")
    state = parse_last_state(text)

    mode = str(state.get("mode", "UNKNOWN"))
    phi = int(state.get("phi", 0))
    r = int(state.get("r", 0))
    s = int(state.get("s", 0))
    e = int(state.get("e", 0))
    t = int(state.get("t", 0))

    W = e + args.cphi * phi + args.cr * r + args.cs * s
    expected_s = (r - 2) / 4 if r >= 2 else float("nan")
    residual = s - expected_s if r >= 2 else float("nan")
    classification = classify_peak(phi, r, s)

    payload = {
        "trace_file": args.trace_file,
        "state": {
            "mode": mode,
            "phi": phi,
            "r": r,
            "s": s,
            "e": e,
            "t": t,
        },
        "weights": {
            "c_phi": args.cphi,
            "c_r": args.cr,
            "c_s": args.cs,
        },
        "envelope": {
            "functional": "W = e + C_phi*phi + C_r*r + C_s*s",
            "value": W,
            "bound": args.mpred,
            "violates": W > args.mpred,
            "margin": W - args.mpred,
        },
        "collinearity_check": {
            "equation": "s = (r - 2) / 4",
            "expected_s": expected_s if r >= 2 else None,
            "residual": residual if r >= 2 else None,
        },
        "classification": classification,
    }

    if args.json:
        print(json.dumps(payload, indent=2))
        return

    print(f"Last State: mode={mode}, phi={phi}, r={r}, s={s}, e={e}, t={t}")
    print(f"Envelope: W = {e} + {args.cphi}*{phi} + {args.cr}*{r} + {args.cs}*{s} = {W:.2f}")
    print(f"Bound M_pred = {args.mpred:.2f}")
    print(f"Status: {'VIOLATES' if W > args.mpred else 'SATISFIES'}")
    if r >= 2:
        print(f"Collinearity check: s = (r - 2) / 4 -> expected {expected_s:.2f}, residual {residual:.2f}")
    print(f"Peak Classification: {classification}")


if __name__ == "__main__":
    main()
