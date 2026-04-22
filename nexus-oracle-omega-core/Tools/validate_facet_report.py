#!/usr/bin/env python3
"""
Validate the facet reconstruction report structure and its degenerate-geometry declarations.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(messages: list[str]) -> None:
    print("FACET REPORT INVALID")
    for message in messages:
        print(f"  - {message}")
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a v0.3.0 facet report.")
    parser.add_argument("--report", required=True)
    parser.add_argument("--schema")
    args = parser.parse_args()

    report_path = Path(args.report)
    report = load_json(report_path)
    errors: list[str] = []
    warnings: list[str] = []

    if args.schema:
        schema_path = Path(args.schema)
        if not schema_path.exists():
            errors.append(f"Schema file not found: {schema_path}")
        else:
            try:
                load_json(schema_path)
            except json.JSONDecodeError as exc:
                errors.append(f"Schema file is not valid JSON: {exc}")

    required_top = {"schema_version", "model", "envelope", "traces", "peaks", "facets", "boundaries", "geometry"}
    missing = sorted(required_top.difference(report))
    if missing:
        errors.append(f"Missing top-level fields: {', '.join(missing)}")

    peaks = report.get("peaks", [])
    facets = report.get("facets", [])
    traces = report.get("traces", [])
    boundaries = report.get("boundaries", [])
    geometry = report.get("geometry", {})

    if len(peaks) != 3:
        errors.append(f"Expected 3 peaks, found {len(peaks)}")
    if len(facets) != 3:
        errors.append(f"Expected 3 facets, found {len(facets)}")
    if len(traces) != 3:
        errors.append(f"Expected 3 traces, found {len(traces)}")
    if len(boundaries) != 3:
        errors.append(f"Expected 3 pairwise boundaries, found {len(boundaries)}")

    peak_ids = {peak.get("peak_id") for peak in peaks}
    facet_peak_ids = {facet.get("peak_id") for facet in facets}
    trace_peak_ids = {trace.get("peak_id") for trace in traces}

    if peak_ids != facet_peak_ids:
        errors.append("Facet-to-peak assignments do not cover the same peak ids.")
    if peak_ids != trace_peak_ids:
        errors.append("Trace-to-peak assignments do not cover the same peak ids.")

    for peak in peaks:
        envelope = peak.get("envelope", {})
        if not envelope.get("violates", False):
            errors.append(f"{peak.get('peak_id')} does not violate its claimed envelope bound.")

    relation = geometry.get("relation", {})
    residuals = relation.get("residuals", {})
    if relation.get("equation") != "s = (r - 2) / 4":
        errors.append("Expected canonical line equation s = (r - 2) / 4.")

    for peak_id in peak_ids:
        residual = abs(float(residuals.get(peak_id, 999)))
        if residual > 1e-9:
            errors.append(f"{peak_id} residual is {residual}, expected 0 on the degenerate line.")

    if not geometry.get("degenerate", False):
        warnings.append("Geometry is not marked degenerate even though v0.3.0 expects collinear peaks.")
    if int(geometry.get("affine_rank", -1)) != 1:
        errors.append(f"Expected affine rank 1, found {geometry.get('affine_rank')}.")

    if errors:
        fail(errors)

    if warnings:
        print("FACET REPORT VALID WITH WARNING")
        for warning in warnings:
            print(f"  - {warning}")
    else:
        print("FACET REPORT VALID")
    print(f"  peaks: {len(peaks)}")
    print(f"  facets: {len(facets)}")
    print(f"  boundaries: {len(boundaries)}")
    print(f"  affine_rank: {geometry.get('affine_rank')}")


if __name__ == "__main__":
    main()
