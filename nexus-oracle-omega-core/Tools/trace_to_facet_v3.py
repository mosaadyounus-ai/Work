#!/usr/bin/env python3
"""
Reconstruct a 3-peak facet report from TLC traces for ConversionFront_v3.
Accepts the degenerate v0.3.0 geometry explicitly and records that status.
"""

from __future__ import annotations

import argparse
import json
import re
from itertools import combinations
from pathlib import Path
from typing import Any


def read_text_with_fallback(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-16")


def parse_last_state(text: str) -> dict[str, int | str]:
    blocks = re.split(r"State \d+:", text)
    if len(blocks) < 2:
        raise ValueError("No TLC state blocks found.")

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


def parse_cfg_constants(path: Path) -> dict[str, float]:
    constants: dict[str, float] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*$", line)
        if match:
            constants[match.group(1)] = float(match.group(2))
    return constants


def canonical_peak_label(phi: int, r: int, s: int) -> str:
    if (phi, r, s) == (4, 2, 0):
        return "high-phi, low-r, low-s"
    if (phi, r, s) == (3, 6, 1):
        return "moderate-phi, high-r, low-s"
    if (phi, r, s) == (2, 10, 2):
        return "low-phi, very-high-r, moderate-s"
    return "unclassified"


def round6(value: float) -> float:
    return round(float(value), 6)


def is_close(a: float, b: float, tol: float = 1e-9) -> bool:
    return abs(a - b) <= tol


def affine_rank(points: list[dict[str, Any]]) -> int:
    if len(points) <= 1:
        return 0

    base = points[0]
    vectors = []
    for point in points[1:]:
        vectors.append(
            (
                float(point["phi"]) - float(base["phi"]),
                float(point["r"]) - float(base["r"]),
                float(point["s"]) - float(base["s"]),
            )
        )

    if not vectors:
        return 0

    first = vectors[0]
    if all(is_close(component, 0.0) for component in first):
        return 0

    rank = 1
    for vector in vectors[1:]:
        cross = (
            first[1] * vector[2] - first[2] * vector[1],
            first[2] * vector[0] - first[0] * vector[2],
            first[0] * vector[1] - first[1] * vector[0],
        )
        if any(not is_close(component, 0.0) for component in cross):
            rank = 2
            break
    return rank


def build_boundary(peak_a: dict[str, Any], peak_b: dict[str, Any]) -> dict[str, Any]:
    delta_const = peak_a["coordinates"]["e"] - peak_b["coordinates"]["e"]
    delta_phi = peak_a["coordinates"]["phi"] - peak_b["coordinates"]["phi"]
    delta_r = peak_a["coordinates"]["r"] - peak_b["coordinates"]["r"]
    delta_s = peak_a["coordinates"]["s"] - peak_b["coordinates"]["s"]

    lhs_terms = []
    if not is_close(delta_phi, 0.0):
        lhs_terms.append(f"{delta_phi:+g}*C_phi")
    if not is_close(delta_r, 0.0):
        lhs_terms.append(f"{delta_r:+g}*C_r")
    if not is_close(delta_s, 0.0):
        lhs_terms.append(f"{delta_s:+g}*C_s")
    lhs_terms.append(f"{delta_const:+g}")
    lhs = " ".join(lhs_terms).lstrip("+").replace("+ -", "- ")

    return {
        "boundary_id": f"{peak_a['peak_id']}-{peak_b['peak_id']}",
        "peaks": [peak_a["peak_id"], peak_b["peak_id"]],
        "tie_hyperplane": {
            "coefficients": {
                "C_phi": delta_phi,
                "C_r": delta_r,
                "C_s": delta_s,
                "const": delta_const,
            },
            "equation": f"{lhs} = 0",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Reconstruct the v0.3.0 facet report from three TLC traces.")
    parser.add_argument("--trace-A", required=True)
    parser.add_argument("--trace-B", required=True)
    parser.add_argument("--trace-C", required=True)
    parser.add_argument("--config-A", default="tla/Peak_A.cfg")
    parser.add_argument("--config-B", default="tla/Peak_B.cfg")
    parser.add_argument("--config-C", default="tla/Peak_C.cfg")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    traces = [
        ("A", Path(args.trace_A), Path(args.config_A)),
        ("B", Path(args.trace_B), Path(args.config_B)),
        ("C", Path(args.trace_C), Path(args.config_C)),
    ]

    peaks: list[dict[str, Any]] = []
    trace_records: list[dict[str, Any]] = []

    for trace_id, trace_path, config_path in traces:
        state = parse_last_state(read_text_with_fallback(trace_path))
        constants = parse_cfg_constants(config_path)

        phi = int(state["phi"])
        r = int(state["r"])
        s = int(state["s"])
        e = int(state["e"])
        t = int(state["t"])
        mode = str(state["mode"])

        c_phi = constants.get("C_phi", 0.0)
        c_r = constants.get("C_r", 0.0)
        c_s = constants.get("C_s", 0.0)
        m_pred = constants.get("M_pred", 0.0)

        W = e + c_phi * phi + c_r * r + c_s * s
        peak_id = f"P{trace_id}"

        peak = {
            "peak_id": peak_id,
            "trace_id": trace_id,
            "coordinates": {
                "phi": phi,
                "r": r,
                "s": s,
                "e": e,
            },
            "mode": mode,
            "t": t,
            "classification": canonical_peak_label(phi, r, s),
            "run_weights": {
                "C_phi": c_phi,
                "C_r": c_r,
                "C_s": c_s,
            },
            "envelope": {
                "value": W,
                "bound": m_pred,
                "margin": W - m_pred,
                "violates": W > m_pred,
            },
        }
        peaks.append(peak)

        trace_records.append(
            {
                "trace_id": trace_id,
                "trace_file": str(trace_path).replace("\\", "/"),
                "config_file": str(config_path).replace("\\", "/"),
                "peak_id": peak_id,
                "weights": peak["run_weights"],
                "bound": m_pred,
                "envelope_value": W,
            }
        )

    peaks.sort(key=lambda peak: (-peak["coordinates"]["phi"], peak["coordinates"]["r"], peak["coordinates"]["s"]))
    peak_id_map = {peak["trace_id"]: f"P{index + 1}" for index, peak in enumerate(peaks)}
    for peak in peaks:
        peak["peak_id"] = peak_id_map[peak["trace_id"]]
    for record in trace_records:
        record["peak_id"] = peak_id_map[record["trace_id"]]

    facets = []
    for peak in peaks:
        coords = peak["coordinates"]
        facet_id = f"Facet-{peak['peak_id']}"
        peak["facet_id"] = facet_id
        facets.append(
            {
                "facet_id": facet_id,
                "peak_id": peak["peak_id"],
                "normal": [coords["phi"], coords["r"], coords["s"], 1],
                "offset": coords["e"],
                "plane_equation": (
                    f"M = {coords['e']} + {coords['phi']}*C_phi + "
                    f"{coords['r']}*C_r + {coords['s']}*C_s"
                ),
            }
        )

    residuals = {}
    for peak in peaks:
        r = peak["coordinates"]["r"]
        s = peak["coordinates"]["s"]
        residuals[peak["peak_id"]] = round6(s - ((r - 2) / 4))

    boundaries = [build_boundary(a, b) for a, b in combinations(peaks, 2)]

    points = [peak["coordinates"] for peak in peaks]
    rank = affine_rank(points)
    sorted_by_r = sorted(peaks, key=lambda peak: peak["coordinates"]["r"])
    redundant = [sorted_by_r[1]["peak_id"]] if len(sorted_by_r) == 3 else []
    extremal = [sorted_by_r[0]["peak_id"], sorted_by_r[-1]["peak_id"]] if len(sorted_by_r) >= 2 else []

    report = {
        "schema_version": "0.3.0",
        "model": {
            "module": "ConversionFront_v3",
            "title": "Three-Peak Conversion Front",
            "accepted_geometry": "degenerate_collinear_peaks",
            "notes": [
                "v0.3.0 accepts collinear peak discovery to prove the multi-peak pipeline.",
                "A non-degenerate triangular surface is deferred to v0.4.0.",
            ],
        },
        "envelope": {
            "functional": "M = e + C_phi*phi + C_r*r + C_s*s",
            "coordinates": ["C_phi", "C_r", "C_s", "M"],
        },
        "traces": trace_records,
        "peaks": peaks,
        "facets": facets,
        "boundaries": boundaries,
        "geometry": {
            "degenerate": rank < 2,
            "accepted": True,
            "affine_rank": rank,
            "relation": {
                "type": "collinear",
                "equation": "s = (r - 2) / 4",
                "residuals": residuals,
            },
            "extremal_peak_ids": extremal,
            "redundant_peak_ids": redundant,
        },
    }

    output_path = Path(args.out)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
