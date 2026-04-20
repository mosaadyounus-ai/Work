## Envelope Laws — Embedding, Facets, and Peak Mapping

### Step A — Concrete Embedding (TLA+-ready)

The embedding maps hybrid state records to the envelope coordinate frame:

```tla
Embed2D(s) == << s.phi, s.r >>
Embed3D(s) == << s.phi, s.r, s.e >>
EmbedParametric(s) == << s.phi, s.r, s.e, s.integ, s.dwell >>
EmbedBuild(s) == IF s.mode = "BUILD_COMPRESS" THEN << s.phi, s.r, s.e >> ELSE << 0.0, 0.0, 0.0 >>
EnvelopeValue(s) == s.e + C_phi * s.phi + C_r * s.r
InEnvelope(s) == EnvelopeValue(s) <= M
SupportingPlane(p) == [ normal |-> << p.phi, p.r, 1.0 >>, offset |-> p.e ]
```

#### Invariant

```tla
EnvelopeInvariant ==
  \A s \in Reachable : InEnvelope(s)
```

---

### Step B — Facet Structure (Module Outline)

```tla
----------------------------- MODULE Facets ----------------------------------
EXTENDS Reals, Sequences

CONSTANTS State

FacetRecord(f) ==
  /\ f.id \in STRING
  /\ f.label \in STRING
  /\ f.modeGuard \in STRING
  /\ f.normal \in Seq(Real)
  /\ Len(f.normal) = 3
  /\ f.offset \in Real
  /\ f.peakState \in State

Facets ==
  { f \in [ id        : STRING,
            label     : STRING,
            modeGuard : STRING,
            normal    : Seq(Real),
            offset    : Real,
            peakState : State ] :
      FacetRecord(f)
  }
==============================================================================
```

---

### Step C — Peak-to-Facet Mapping (Module Outline)

```tla
----------------------------- MODULE PeakMapping -----------------------------
EXTENDS Reals, Sequences, EnvelopeLaws, Facets

PeakToFacet(peak, facetSet) ==
  CHOOSE f \in facetSet :
    /\ f.normal[1] = peak.phi
    /\ f.normal[2] = peak.r
    /\ f.offset    = peak.e

ClassifyPeak(peak, C_phi, C_r) ==
  LET W_A == 4.0 + C_phi * 4.0 + C_r * 2.0
      W_B == 3.0 + C_phi * 3.0 + C_r * 6.0
  IN  IF W_A > W_B THEN "Facet-A" ELSE "Facet-B"
=============================================================================
```

---

### Integration Example (for Invariants.tla)

```tla
EnvelopeOK == EnvelopeLaws!EnvelopeInvariant
Inv == TypeOK /\ OutputWellFormed /\ EnvelopeOK
EnvelopeSafety == [](mode = "FUSION" => EnvelopeLaws!InEnvelope([phi |-> phi, r |-> r, e |-> e]))
```

---

> The embedding `Embed3D` maps any hybrid state `s` to the triple `(s.phi, s.r, s.e)`. The envelope is the intersection of half-spaces `M >= e + C_phi*phi + C_r*r` over all reachable states. The extremal points (peaks) are vertices of the primal set; their supporting planes define the H-representation.
