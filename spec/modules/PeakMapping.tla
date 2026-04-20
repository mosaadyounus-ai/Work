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
