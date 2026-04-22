#!/usr/bin/env python3
"""
Validate the exported polyhedron artifact and accept v0.3.0 degeneracy with explicit warnings.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(messages: list[str]) -> None:
    print("POLYHEDRON INVALID")
    for message in messages:
        print(f"  - {message}")
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a v0.3.0 polyhedron export.")
    parser.add_argument("--poly", required=True)
    parser.add_argument("--schema")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    poly_path = Path(args.poly)
    poly = load_json(poly_path)
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

    vertices = poly.get("vertices", [])
    facets = poly.get("facets", [])
    edges = poly.get("edges", [])
    geometry = poly.get("geometry", {})

    if len(vertices) != 3:
        errors.append(f"Expected 3 vertices, found {len(vertices)}")
    if len(facets) != 3:
        errors.append(f"Expected 3 facets, found {len(facets)}")
    if len(edges) != 3:
        errors.append(f"Expected 3 edges, found {len(edges)}")

    vertex_ids = {vertex.get("vertex_id") for vertex in vertices}
    extremal = set(geometry.get("extremal_vertex_ids", []))
    redundant = set(geometry.get("redundant_vertex_ids", []))

    if not extremal.issubset(vertex_ids):
        errors.append("Extremal vertex ids reference unknown vertices.")
    if not redundant.issubset(vertex_ids):
        errors.append("Redundant vertex ids reference unknown vertices.")

    if int(geometry.get("affine_rank", -1)) != 1:
        errors.append(f"Expected affine rank 1, found {geometry.get('affine_rank')}.")

    if geometry.get("degenerate", False):
        warnings.extend(geometry.get("warnings", []))
        if args.strict and not geometry.get("accepted", False):
            errors.append("Strict validation requires accepted degenerate geometry to be explicitly declared.")
    else:
        errors.append("Expected the v0.3.0 polyhedron export to declare degenerate geometry.")

    relation = geometry.get("relation", {})
    if relation.get("equation") != "s = (r - 2) / 4":
        errors.append("Expected canonical degenerate relation s = (r - 2) / 4.")

    if errors:
        fail(errors)

    if warnings:
        print("POLYHEDRON VALID WITH WARNING")
        for warning in warnings:
            print(f"  - {warning}")
    else:
        print("POLYHEDRON VALID")
    print(f"  vertices: {len(vertices)}")
    print(f"  affine_rank: {geometry.get('affine_rank')}")
    print(f"  extremal: {', '.join(sorted(extremal))}")
    print(f"  redundant: {', '.join(sorted(redundant))}")


if __name__ == "__main__":
    main()
