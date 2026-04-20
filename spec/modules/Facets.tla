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
