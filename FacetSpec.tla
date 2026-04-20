----------------------------- MODULE FacetSpec -----------------------------

EXTENDS Reals, EnvelopeLaws

(* Facet record structure *)
FacetRecord == [
  id        : STRING,       \* e.g., "Facet-A-phi-dominant"
  label     : STRING,       \* e.g., "High-phi, low-r peak"
  modeGuard : STRING,       \* e.g., "BUILD_COMPRESS"
  normal    : Seq(Real),    \* [phi, r, 1]
  offset    : Real,         \* e value
  peakState : State,        \* The extremal point that generates this facet
  dominance : Real -> Real  \* C_r range where this facet is active
]

(* Example facet set *)
FacetSet == {
  [id |-> "Facet-A", label |-> "phi-dominant", modeGuard |-> "BUILD_COMPRESS", normal |-> <<4,2,1>>, offset |-> 4, peakState |-> [phi |-> 4, r |-> 2, e |-> 4], dominance |-> (LAMBDA C_phi: LAMBDA C_r: C_r < (1+C_phi)/4)],
  [id |-> "Facet-B", label |-> "r-dominant", modeGuard |-> "BUILD_COMPRESS", normal |-> <<3,6,1>>, offset |-> 3, peakState |-> [phi |-> 3, r |-> 6, e |-> 3], dominance |-> (LAMBDA C_phi: LAMBDA C_r: C_r > (1+C_phi)/4)]
}

(* Peak-to-facet mapping *)
PeakToFacet(peak, facetSet) ==
  CHOOSE f \in facetSet :
    /\ f.normal[1] = peak.phi
    /\ f.normal[2] = peak.r
    /\ f.offset    = peak.e

(* Runtime classifier *)
ClassifyPeak(peak, C_phi, C_r) ==
  LET W_A == 4 + C_phi*4 + C_r*2
      W_B == 3 + C_phi*3 + C_r*6
  IN  IF W_A > W_B THEN "Facet-A" ELSE "Facet-B"

===============================================================================