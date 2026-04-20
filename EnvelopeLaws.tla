----------------------------- MODULE EnvelopeLaws -----------------------------


----------------------------- MODULE EnvelopeLaws -----------------------------
EXTENDS Naturals, Reals

(*)
  Hybrid state is assumed to be a record with fields:
    phi   : Real
    r     : Real
    e     : Real
    integ : Real
    dwell : Real
    mode  : STRING
*)

CONSTANTS
  C_phi,    \* weight on phi
  C_r,      \* weight on r
  M         \* envelope bound

(***************************************************************************)
(* Embeddings                                                              *)
(***************************************************************************)

Embed2D(s) ==
  << s.phi, s.r >>

Embed3D(s) ==
  << s.phi, s.r, s.e >>

EmbedParametric(s) ==
  << s.phi, s.r, s.e, s.integ, s.dwell >>

EmbedBuild(s) ==
  IF s.mode = "BUILD_COMPRESS"
  THEN << s.phi, s.r, s.e >>
  ELSE << 0.0, 0.0, 0.0 >>

(***************************************************************************)
(* Envelope functional and predicate                                       *)
(***************************************************************************)

EnvelopeValue(s) ==
  s.e + C_phi * s.phi + C_r * s.r

InEnvelope(s) ==
  EnvelopeValue(s) <= M

(***************************************************************************)
(* Supporting plane for a peak state                                      *)
(***************************************************************************)

SupportingPlane(p) ==
  [ normal |-> << p.phi, p.r, 1.0 >>,
    offset |-> p.e ]

=============================================================================