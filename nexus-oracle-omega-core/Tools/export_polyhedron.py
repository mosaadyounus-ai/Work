#!/usr/bin/env python3
"""
Export a polyhedron-style artifact from a facet reconstruction report.
For v0.3.0 the exported geometry may be degenerate and is labeled as such.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Export polyhedron artifacts from a facet report.")
    parser.add_argument("--json", required=True, help="Facet report JSON input")
    parser.add_argument("--outdir", required=True, help="Directory for exported artifacts")
    parser.add_argument("--out", help="Optional direct path for the exported polyhedron JSON")
    args = parser.parse_args()

    report_path = Path(args.json)
    report = load_json(report_path)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    default_out = outdir.parent / f"{outdir.name}.json"
    out_path = Path(args.out) if args.out else default_out

    peaks = report["peaks"]
    facets = report["facets"]
    boundaries = report["boundaries"]
    geometry = report["geometry"]

    polyhedron = {
        "schema_version": report["schema_version"],
        "kind": "degenerate_polyhedron" if geometry.get("degenerate") else "polyhedron",
        "source_report": str(report_path).replace("\\", "/"),
        "embedding": {
            "type": "peak_state_space",
            "coordinates": ["phi", "r", "s", "e"],
        },
        "vertices": [
            {
                "vertex_id": peak["peak_id"],
                "point": peak["coordinates"],
                "facet_id": peak["facet_id"],
                "classification": peak["classification"],
            }
            for peak in peaks
        ],
        "facets": facets,
        "edges": [
            {
                "edge_id": f"Edge-{boundary['boundary_id']}",
                "vertices": boundary["peaks"],
                "tie_hyperplane": boundary["tie_hyperplane"],
            }
            for boundary in boundaries
        ],
        "geometry": {
            "degenerate": geometry["degenerate"],
            "accepted": geometry["accepted"],
            "affine_rank": geometry["affine_rank"],
            "extremal_vertex_ids": geometry["extremal_peak_ids"],
            "redundant_vertex_ids": geometry["redundant_peak_ids"],
            "relation": geometry["relation"],
            "warnings": [
                "Vertices are collinear; the exported object is a line segment with an intermediate witness vertex."
            ]
            if geometry["degenerate"]
            else [],
        },
    }

    out_path.write_text(json.dumps(polyhedron, indent=2), encoding="utf-8")
    (outdir / "polyhedron_v3.json").write_text(json.dumps(polyhedron, indent=2), encoding="utf-8")
    (outdir / "manifest.json").write_text(
        json.dumps(
            {
                "report": str(report_path).replace("\\", "/"),
                "polyhedron": str(out_path).replace("\\", "/"),
                "degenerate": geometry["degenerate"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {out_path}")
    print(f"Wrote {outdir / 'polyhedron_v3.json'}")


if __name__ == "__main__":
    main()
