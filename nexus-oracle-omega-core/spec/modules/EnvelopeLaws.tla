----------------------------- MODULE EnvelopeLaws -----------------------------

EXTENDS Naturals, Reals, Sequences

CONSTANTS
  epsilon,
  PhiFacetFamily,
  InEnvelope(_)

VARIABLES
  state,
  history,
  activeFacet

\* Near-recursion: the current state re-enters a previously observed neighborhood.
NearRecursion ==
  \E i \in DOMAIN history : history[i] = state

\* Irreversibility proxy: there is no earlier fusion/collapse state preserving phi, r, and e.
Irreversible ==
  ~\E i \in DOMAIN history :
    /\ history[i].mode \in {"FUSION", "COLLAPSE"}
    /\ history[i].phi = state.phi
    /\ history[i].r = state.r
    /\ history[i].e = state.e

\* G_phi is the admissible slice of the phi-governed facet family.
InG_Phi ==
  /\ activeFacet \in PhiFacetFamily
  /\ InEnvelope(state)

\* Law phi-A:
\*   near-recursion plus irreversibility implies eventual entry into G_phi.
LawPhiA ==
  []((NearRecursion /\ Irreversible) => <> InG_Phi)

=============================================================================
