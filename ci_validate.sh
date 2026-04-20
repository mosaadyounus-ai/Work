#!/bin/bash
# ci_validate.sh: Validate ConversionFront geometry contracts locally
# Usage: ./ci_validate.sh

set -e

PYTHON=${PYTHON:-python3}

# Paths to schemas and validators
FACET_SCHEMA="schemas/facet_report.schema.json"
POLY_SCHEMA="schemas/polyhedron.schema.json"
FACET_VALIDATOR="Tools/validate_facet_report.py"
POLY_VALIDATOR="validate_polyhedron.py"

# Canonical artifacts (edit as needed)
FACET_REPORTS=(
  trace_pipeline_two_point/facet_report_from_traces.json
  sweep_out_two_point/facet_report_from_sweep.json
)
POLYHEDRA=(
  trace_pipeline_two_point/polyhedron/polyhedron.json
  sweep_out_two_point/polyhedron/polyhedron.json
)

fail=0

for report in "${FACET_REPORTS[@]}"; do
  if [ -f "$report" ]; then
    echo "Validating facet report: $report"
    $PYTHON "$FACET_VALIDATOR" --report "$report" --schema "$FACET_SCHEMA" --strict || fail=1
  else
    echo "[SKIP] No facet report at $report"
  fi
  echo
done

for poly in "${POLYHEDRA[@]}"; do
  if [ -f "$poly" ]; then
    echo "Validating polyhedron: $poly"
    $PYTHON "$POLY_VALIDATOR" "$poly" || fail=1
  else
    echo "[SKIP] No polyhedron at $poly"
  fi
  echo
done

if [ $fail -eq 0 ]; then
  echo "\033[1;32m✓ All geometry contracts validated.\033[0m"
else
  echo "\033[1;31m✗ Geometry contract violation detected.\033[0m"
  exit 1
fi
