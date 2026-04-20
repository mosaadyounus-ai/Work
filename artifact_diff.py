import json
import sys
from typing import Any, Dict, List, Tuple


def load_json(path: str) -> Any:
    with open(path, "r") as f:
        return json.load(f)

def diff_lists(a: List, b: List) -> Tuple[List, List]:
    return [x for x in a if x not in b], [x for x in b if x not in a]

def diff_dicts(a: Dict, b: Dict) -> Dict:
    diff = {}
    keys = set(a.keys()).union(b.keys())
    for k in keys:
        if a.get(k) != b.get(k):
            diff[k] = {'a': a.get(k), 'b': b.get(k)}
    return diff

def diff_facet_reports(path1: str, path2: str):
    r1 = load_json(path1)
    r2 = load_json(path2)
    print(f"Comparing facet reports: {path1} vs {path2}\n")
    # Compare facets by id
    facets1 = {f['id']: f for f in r1['facets']}
    facets2 = {f['id']: f for f in r2['facets']}
    ids1, ids2 = set(facets1), set(facets2)
    only1 = ids1 - ids2
    only2 = ids2 - ids1
    both = ids1 & ids2
    if only1:
        print(f"Facets only in {path1}: {sorted(only1)}")
    if only2:
        print(f"Facets only in {path2}: {sorted(only2)}")
    for fid in both:
        d = diff_dicts(facets1[fid], facets2[fid])
        if d:
            print(f"Facet {fid} differs:")
            for k, v in d.items():
                print(f"  {k}: {v['a']} != {v['b']}")

def diff_polyhedra(path1: str, path2: str):
    p1 = load_json(path1)
    p2 = load_json(path2)
    print(f"Comparing polyhedra: {path1} vs {path2}\n")
    # Vertices
    v1, v2 = p1['vertices'], p2['vertices']
    only1, only2 = diff_lists(v1, v2)
    if only1:
        print(f"Vertices only in {path1}: {only1}")
    if only2:
        print(f"Vertices only in {path2}: {only2}")
    # Facets
    f1, f2 = p1['facets'], p2['facets']
    only1, only2 = diff_lists(f1, f2)
    if only1:
        print(f"Facets only in {path1}: {only1}")
    if only2:
        print(f"Facets only in {path2}: {only2}")
    # Adjacency
    a1, a2 = p1['adjacency'], p2['adjacency']
    if a1 != a2:
        print(f"Adjacency differs:")
        print(f"  {path1}: {a1}")
        print(f"  {path2}: {a2}")
    # Kinks
    k1, k2 = p1['kinks'], p2['kinks']
    only1, only2 = diff_lists(k1, k2)
    if only1:
        print(f"Kinks only in {path1}: {only1}")
    if only2:
        print(f"Kinks only in {path2}: {only2}")

def main():
    if len(sys.argv) != 4:
        print("Usage: python artifact_diff.py <type> <file1.json> <file2.json>")
        print("  <type>: 'facet' or 'polyhedron'")
        sys.exit(1)
    t, f1, f2 = sys.argv[1:4]
    if t == 'facet':
        diff_facet_reports(f1, f2)
    elif t == 'polyhedron':
        diff_polyhedra(f1, f2)
    else:
        print("Unknown type. Use 'facet' or 'polyhedron'.")
        sys.exit(1)

if __name__ == "__main__":
    main()
