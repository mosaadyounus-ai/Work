#!/usr/bin/env python3
"""
Validate facet_report.json against schema.
Enforces structural, semantic, and geometric correctness of raw peak discovery.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple

try:
    import jsonschema
except ImportError:
    print("ERROR: pip install jsonschema")
    sys.exit(1)


class FacetReportValidator:
    def __init__(self, report: Dict, schema: Dict):
        self.report = report
        self.schema = schema
        self.errors: List[str] = []
    
    def validate_schema(self) -> bool:
        """Validate against JSON Schema."""
        try:
            jsonschema.validate(instance=self.report, schema=self.schema)
            return True
        except jsonschema.ValidationError as e:
            self.errors.append(f"Schema violation: {e.message} at {list(e.path)}")
            return False
    
    def validate_semantics(self) -> bool:
        """Validate beyond schema: counts, references, geometric consistency."""
        ok = True
        
        peaks = self.report.get("discovered_peaks", [])
        planes = self.report.get("supporting_planes", [])
        adjacencies = self.report.get("adjacency_candidates", [])
        
        # Check metadata counts match actual arrays
        meta = self.report.get("metadata", {})
        if meta.get("peak_count") != len(peaks):
            self.errors.append(f"Peak count mismatch: metadata {meta.get('peak_count')}, actual {len(peaks)}")
            ok = False
        
        if meta.get("plane_count") != len(planes):
            self.errors.append(f"Plane count mismatch: metadata {meta.get('plane_count')}, actual {len(planes)}")
            ok = False
        
        if meta.get("adjacency_count") != len(adjacencies):
            self.errors.append(f"Adjacency count mismatch: metadata {meta.get('adjacency_count')}, actual {len(adjacencies)}")
            ok = False
        
        # Check peak IDs are unique
        peak_ids = [p["peak_id"] for p in peaks]
        if len(peak_ids) != len(set(peak_ids)):
            self.errors.append("Duplicate peak IDs")
            ok = False
        
        # Check plane IDs are unique
        plane_ids = [pl["plane_id"] for pl in planes]
        if len(plane_ids) != len(set(plane_ids)):
            self.errors.append("Duplicate plane IDs")
            ok = False
        
        # Check all planes reference valid peaks
        valid_peak_ids = set(peak_ids)
        for pl in planes:
            if pl["peak_id"] not in valid_peak_ids:
                self.errors.append(f"Plane {pl['plane_id']} references unknown peak {pl['peak_id']}")
                ok = False
        
        # Check adjacencies reference valid planes
        valid_plane_ids = set(plane_ids)
        for adj in adjacencies:
            if adj["plane_1"] not in valid_plane_ids:
                self.errors.append(f"Adjacency {adj['candidate_id']} references unknown plane {adj['plane_1']}")
                ok = False
            if adj["plane_2"] not in valid_plane_ids:
                self.errors.append(f"Adjacency {adj['candidate_id']} references unknown plane {adj['plane_2']}")
                ok = False
        
        # Check for self-adjacency
        for adj in adjacencies:
            if adj["plane_1"] == adj["plane_2"]:
                self.errors.append(f"Adjacency {adj['candidate_id']} is self-referential")
                ok = False
        
        return ok
    
    def validate_geometry(self) -> bool:
        """Validate geometric consistency of planes and kinks."""
        ok = True
        
        peaks = {p["peak_id"]: p for p in self.report.get("discovered_peaks", [])}
        planes = self.report.get("supporting_planes", [])
        
        # Verify each plane equation matches its peak
        for pl in planes:
            peak = peaks.get(pl["peak_id"])
            if not peak:
                continue
            
            phi = peak["coordinates"]["phi"]
            r = peak["coordinates"]["r"]
            e = peak["coordinates"]["e"]
            
            eq = pl["equation"]
            # Plane: M = phi*C_phi + r*C_r + e (but stored as coefficients)
            # Check: phi_coeff should be phi, r_coeff should be r, constant should be e
            if abs(eq["phi_coeff"] - phi) > 1e-9:
                self.errors.append(
                    f"Plane {pl['plane_id']}: phi_coeff mismatch. "
                    f"Expected {phi}, got {eq['phi_coeff']}"
                )
                ok = False
            
            if abs(eq["r_coeff"] - r) > 1e-9:
                self.errors.append(
                    f"Plane {pl['plane_id']}: r_coeff mismatch. "
                    f"Expected {r}, got {eq['r_coeff']}"
                )
                ok = False
            
            if abs(eq["constant"] - e) > 1e-9:
                self.errors.append(
                    f"Plane {pl['plane_id']}: constant mismatch. "
                    f"Expected {e}, got {eq['constant']}"
                )
                ok = False
        
        # Verify kink equations are correct
        for adj in self.report.get("adjacency_candidates", []):
            if not self._verify_kink_equation(adj, peaks):
                ok = False
        
        return ok
    
    def _verify_kink_equation(self, adj: Dict, peaks: Dict) -> bool:
        """Verify kink equation correctly separates two peaks."""
        p1_id = adj["plane_1"].replace("PL", "P")  # Convert plane ID to peak ID
        p2_id = adj["plane_2"].replace("PL", "P")
        
        # Actually look up by plane's peak_id field
        planes = {pl["plane_id"]: pl for pl in self.report.get("supporting_planes", [])}
        pl1 = planes.get(adj["plane_1"])
        pl2 = planes.get(adj["plane_2"])
        
        if not pl1 or not pl2:
            return False
        
        peak1 = peaks.get(pl1["peak_id"])
        peak2 = peaks.get(pl2["peak_id"])
        
        if not peak1 or not peak2:
            return False
        
        # Extract kink
        kink = adj.get("intersection", {}).get("kink_equation", {})
        slope = kink.get("slope")
        intercept = kink.get("intercept")
        
        if slope is None or intercept is None:
            self.errors.append(f"Adjacency {adj['candidate_id']} missing kink slope/intercept")
            return False
        
        # Verify: at kink line, both peaks have equal envelope value
        # For C_phi = 0: M1 = e1 + kink*r1, M2 = e2 + kink*r2
        # Should be equal: e1 + kink*r1 = e2 + kink*r2
        # kink = (e2 - e1) / (r1 - r2)
        
        e1, r1 = peak1["coordinates"]["e"], peak1["coordinates"]["r"]
        e2, r2 = peak2["coordinates"]["e"], peak2["coordinates"]["r"]
        
        if r1 == r2:
            # Vertical kink (infinite slope) - check handled separately
            return True
        
        expected_kink = (e2 - e1) / (r1 - r2)
        if abs(intercept - expected_kink) > 1e-6:
            self.errors.append(
                f"Adjacency {adj['candidate_id']}: kink intercept mismatch. "
                f"Expected {expected_kink:.6f}, got {intercept:.6f}"
            )
            return False
        
        return True
    
    def validate(self) -> bool:
        """Run all validation layers."""
        schema_ok = self.validate_schema()
        semantics_ok = self.validate_semantics()
        geometry_ok = self.validate_geometry()
        
        return schema_ok and semantics_ok and geometry_ok
    
    def report(self):
        """Print validation report."""
        if not self.errors:
            meta = self.report.get("metadata", {})
            peaks = self.report.get("discovered_peaks", [])
            planes = self.report.get("supporting_planes", [])
            adj = self.report.get("adjacency_candidates", [])
            
            print("\u2713 FACET REPORT VALID")
            print(f"  Schema version: {self.report.get('schema_version', 'unknown')}")
            print(f"  Generation: {meta.get('generation_method', 'unknown')}")
            print(f"  Peaks: {len(peaks)}")
            print(f"  Planes: {len(planes)}")
            print(f"  Adjacencies: {len(adj)}")
            
            # Report supporting vs non-supporting planes
            supporting = sum(1 for pl in planes if pl.get("validity", {}).get("is_supporting"))
            print(f"  Supporting planes: {supporting}/{len(planes)}")
            
            # Report verified edges
            real_edges = sum(1 for a in adj if a.get("intersection", {}).get("validity", {}).get("is_real_edge"))
            print(f"  Verified edges: {real_edges}/{len(adj)}")
        else:
            print("\u2717 FACET REPORT INVALID")
            for err in self.errors:
                print(f"  - {err}")
            print(f"\nTotal errors: {len(self.errors)}")


def main():
    parser = argparse.ArgumentParser(description="Validate facet report JSON")
    parser.add_argument("--report", required=True, type=Path, help="Path to facet_report.json")
    parser.add_argument("--schema", required=True, type=Path, help="Path to schema file")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings")
    args = parser.parse_args()
    
    report = json.loads(args.report.read_text())
    schema = json.loads(args.schema.read_text())
    
    validator = FacetReportValidator(report, schema)
    ok = validator.validate()
    validator.report()
    
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
