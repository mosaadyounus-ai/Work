# Envelope Laws

## Overview

The Envelope Laws define how hybrid states are embedded into a geometric space
where safety and optimality become linear predicates. This document traces the
full chain from state embedding through facet discovery to operator-visible
classification.

## 1. Embedding (Embed)

A hybrid state `s` is a record with fields `phi`, `r`, `e`, `integ`, `dwell`,
`mode`. The embedding maps `s` into a coordinate frame where the envelope
functional is linear.

### Variants

- **Embed2D(s)** = `(phi, r)` — the resource plane
- **Embed3D(s)** = `(phi, r, e)` — energy + resources
- **EmbedParametric(s)** = `(phi, r, e, integ, dwell)` — extended state
- **EmbedBuild(s)** = `(phi, r, e)` if `mode = "BUILD_COMPRESS"`, else `(0,0,0)`

### Why this matters

The envelope is a half-space in the embedded space. Linearity means TLC can
check it as a simple arithmetic invariant, and the Oracle can evaluate it as a
runtime predicate without solving differential equations.

## 2. Envelope Functional

```
EnvelopeValue(s) = e + C_phi * phi + C_r * r
InEnvelope(s)    = EnvelopeValue(s) <= M
```

- `C_phi` — weight on integration constant
- `C_r`   — weight on readiness
- `M`     — bound (tightest value from facet discovery)

This is the **supporting functional** whose level sets are hyperplanes in
`(C_phi, C_r, M)`-space.

## 3. Facets

A facet is a supporting plane derived from an extremal peak in the reachable
set.

### Facet Record

| Field       | Meaning                          |
|-------------|----------------------------------|
| `id`        | Facet identifier                 |
| `label`     | Human-readable description       |
| `modeGuard` | Mode where this facet is active  |
| `normal`    | Coefficients `[phi, r, 1]`       |
| `offset`    | The `e` value at the peak        |
| `peakState` | The extremal state that spawned it |

### Concrete Facets (ConversionFront)

| Facet   | Peak      | Normal    | Offset | Plane Equation            |
|---------|-----------|-----------|--------|---------------------------|
| Facet-A | (4, 2, 4) | [4, 2, 1] | 4      | `M = 4 + 4*C_phi + 2*C_r` |
| Facet-B | (3, 6, 3) | [3, 6, 1] | 3      | `M = 3 + 3*C_phi + 6*C_r` |

## 4. Peak-to-Facet Mapping

Given a peak `(phi, r, e)` discovered by TLC, the mapping finds the facet
whose normal matches the peak coordinates:

```
PeakToFacet(peak, facets) = CHOOSE f in facets :
  f.normal[1] = peak.phi /\
  f.normal[2] = peak.r   /\
  f.offset    = peak.e
```

### Classification

For two competing peaks A and B, the winner at weights `(C_phi, C_r)` is:

```
W_A = e_A + C_phi*phi_A + C_r*r_A
W_B = e_B + C_phi*phi_B + C_r*r_B

Winner = IF W_A > W_B THEN "Facet-A" ELSE "Facet-B"
```

### Kink Line

The boundary where `W_A = W_B`:

```
C_r = (e_A - e_B + C_phi*(phi_A - phi_B)) / (r_B - r_A)
```

For ConversionFront:
```
C_r = (1 + C_phi) / 4
```

## 5. Verification Chain

```
TLA+ Spec (ConversionFront.tla)
    ↓ TLC model checking
Trace files (trace_A.txt, trace_B.txt)
    ↓ trace_to_facet.py
Facet Report (facet_report.json)
    ↓ validate_facet_report.py
Validated Facets
    ↓ export_polyhedron.py
Polyhedron (polyhedron.json)
    ↓ validate_polyhedron.py
Typed Envelope Contract
    ↓ Mirror ingestion
mirror.json (operator-visible)
    ↓ Oracle evaluation
Runtime classification of active facet
```

## 6. Invariant Integration

In `Invariants.tla`:

```tla
EnvelopeOK ==
  \A s \in Reachable : EnvelopeLaws!InEnvelope(s)

Inv ==
  TypeOK /\ OutputWellFormed /\ EnvelopeOK
```

And the mode-specific safety guard:

```tla
EnvelopeSafety ==
  [](mode = "FUSION" => EnvelopeLaws!InEnvelope([phi|->phi, r|->r, e|->e]))
```

## 7. References

- `spec/modules/EnvelopeLaws.tla` — embedding and functional definitions
- `spec/modules/Facets.tla` — facet record type
- `spec/modules/PeakMapping.tla` — classification logic
- `schemas/polyhedron.schema.json` — polyhedron contract schema
- `schemas/facet_report.schema.json` — facet report schema
- `Tools/validate_polyhedron.py` — geometric validation
- `Tools/validate_facet_report.py` — structural validation
# Envelope Laws

## Overview

The Envelope Laws define how hybrid states are embedded into a geometric space
where safety and optimality become linear predicates. This document traces the
full chain from state embedding through facet discovery to operator-visible
classification.

## 1. Embedding (Embed)

A hybrid state `s` is a record with fields `phi`, `r`, `e`, `integ`, `dwell`,
`mode`. The embedding maps `s` into a coordinate frame where the envelope
functional is linear.

### Variants

- **Embed2D(s)** = `(phi, r)` — the resource plane
- **Embed3D(s)** = `(phi, r, e)` — energy + resources
- **EmbedParametric(s)** = `(phi, r, e, integ, dwell)` — extended state
- **EmbedBuild(s)** = `(phi, r, e)` if `mode = "BUILD_COMPRESS"`, else `(0,0,0)`

### Why this matters

The envelope is a half-space in the embedded space. Linearity means TLC can
check it as a simple arithmetic invariant, and the Oracle can evaluate it as a
runtime predicate without solving differential equations.

## 2. Envelope Functional

```
EnvelopeValue(s) = e + C_phi * phi + C_r * r
InEnvelope(s)    = EnvelopeValue(s) <= M
```

- `C_phi` — weight on integration constant
- `C_r`   — weight on readiness
- `M`     — bound (tightest value from facet discovery)

This is the **supporting functional** whose level sets are hyperplanes in
`(C_phi, C_r, M)`-space.

## 3. Facets

A facet is a supporting plane derived from an extremal peak in the reachable
set.

### Facet Record

| Field       | Meaning                          |
|-------------|----------------------------------|
| `id`        | Facet identifier                 |
| `label`     | Human-readable description       |
| `modeGuard` | Mode where this facet is active  |
| `normal`    | Coefficients `[phi, r, 1]`       |
| `offset`    | The `e` value at the peak        |
| `peakState` | The extremal state that spawned it |

### Concrete Facets (ConversionFront)

| Facet   | Peak      | Normal    | Offset | Plane Equation            |
|---------|-----------|-----------|--------|---------------------------|
| Facet-A | (4, 2, 4) | [4, 2, 1] | 4      | `M = 4 + 4*C_phi + 2*C_r` |
| Facet-B | (3, 6, 3) | [3, 6, 1] | 3      | `M = 3 + 3*C_phi + 6*C_r` |

## 4. Peak-to-Facet Mapping

Given a peak `(phi, r, e)` discovered by TLC, the mapping finds the facet
whose normal matches the peak coordinates:

```
PeakToFacet(peak, facets) = CHOOSE f in facets :
  f.normal[1] = peak.phi /\
  f.normal[2] = peak.r   /\
  f.offset    = peak.e
```

### Classification

For two competing peaks A and B, the winner at weights `(C_phi, C_r)` is:

```
W_A = e_A + C_phi*phi_A + C_r*r_A
W_B = e_B + C_phi*phi_B + C_r*r_B

Winner = IF W_A > W_B THEN "Facet-A" ELSE "Facet-B"
```

### Kink Line

The boundary where `W_A = W_B`:

```
C_r = (e_A - e_B + C_phi*(phi_A - phi_B)) / (r_B - r_A)
```

For ConversionFront:
```
C_r = (1 + C_phi) / 4
```

## 5. Verification Chain

```
TLA+ Spec (ConversionFront.tla)
    ↓ TLC model checking
Trace files (trace_A.txt, trace_B.txt)
    ↓ trace_to_facet.py
Facet Report (facet_report.json)
    ↓ validate_facet_report.py
Validated Facets
    ↓ export_polyhedron.py
Polyhedron (polyhedron.json)
    ↓ validate_polyhedron.py
Typed Envelope Contract
    ↓ Mirror ingestion
mirror.json (operator-visible)
    ↓ Oracle evaluation
Runtime classification of active facet
```

## 6. Invariant Integration

In `Invariants.tla`:

```tla
EnvelopeOK ==
  \A s \in Reachable : EnvelopeLaws!InEnvelope(s)

Inv ==
  TypeOK /\ OutputWellFormed /\ EnvelopeOK
```

And the mode-specific safety guard:

```tla
EnvelopeSafety ==
  [](mode = "FUSION" => EnvelopeLaws!InEnvelope([phi|->phi, r|->r, e|->e]))
```

## 7. References

- `spec/modules/EnvelopeLaws.tla` — embedding and functional definitions
- `spec/modules/Facets.tla` — facet record type
- `spec/modules/PeakMapping.tla` — classification logic
- `schemas/polyhedron.schema.json` — polyhedron contract schema
- `schemas/facet_report.schema.json` — facet report schema
- `Tools/validate_polyhedron.py` — geometric validation
- `Tools/validate_facet_report.py` — structural validation
