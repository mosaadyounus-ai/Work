/**
 * Oracle Kernel — Milestone 2
 * 
 * Loads a validated mirror.json and provides:
 * - envelope evaluation
 * - facet classification
 * - M_min computation
 * - support gap analysis
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Types matching mirror.json schema
interface Peak {
  peak_id: string;
  cluster_id: string;
  coordinates: { phi: number; r: number; e: number };
  envelope_value: number;
  facet_assignment: string;
  dominance_condition: string;
}

interface Facet {
  facet_id: string;
  normal: [number, number, number]; // [phi, r, 1]
  offset: number;
  plane_equation: string;
  dominance_region: { C_r_min?: number; C_r_max?: number };
}

interface KinkEdge {
  edge_id: string;
  vertices: [string, string];
  kink_equation: {
    slope: number;
    intercept: number;
    formula: string;
  };
}

interface MirrorContract {
  schema_version: string;
  embedding: {
    type: string;
    coordinates: string[];
  };
  envelope: {
    parameters: {
      C_phi: number;
      C_r: number;
      M: number;
    };
    functional: string;
  };
  peaks: Peak[];
  facets: Facet[];
  adjacency: KinkEdge[];
}

interface HybridState {
  phi: number;
  r: number;
  e: number;
  mode: string;
  integ?: number;
  dwell?: number;
}

class OracleKernel {
  private contract: MirrorContract;
  private activeFacet: string | null = null;

  constructor(mirrorPath: string) {
    const raw = readFileSync(resolve(mirrorPath), 'utf-8');
    this.contract = JSON.parse(raw) as MirrorContract;
    
    // Validate schema version
    if (this.contract.schema_version !== '1.0.0') {
      throw new Error(`Unsupported mirror schema: ${this.contract.schema_version}`);
    }
  }

  /**
   * Evaluate envelope functional on current state
   */
  evaluateEnvelope(state: HybridState): number {
    const { C_phi, C_r } = this.contract.envelope.parameters;
    return state.e + C_phi * state.phi + C_r * state.r;
  }

  /**
   * Check if state is inside envelope
   */
  inEnvelope(state: HybridState): boolean {
    const W = this.evaluateEnvelope(state);
    return W <= this.contract.envelope.parameters.M;
  }

  /**
   * Classify which facet dominates for given weights
   */
  classifyPoint(C_phi: number, C_r: number): { facet: string; label: string } {
    // For each facet, compute plane value at (C_phi, C_r)
    const values = this.contract.facets.map(f => ({
      id: f.facet_id,
      value: f.offset + f.normal[0] * C_phi + f.normal[1] * C_r,
      label: f.plane_equation
    }));

    // Winner is max value (upper envelope)
    const winner = values.reduce((a, b) => a.value > b.value ? a : b);
    this.activeFacet = winner.id;
    
    return { facet: winner.id, label: winner.label };
  }

  /**
   * Compute tight M_min for current weights
   */
  computeMmin(C_phi: number, C_r: number): number {
    const { facet } = this.classifyPoint(C_phi, C_r);
    const f = this.contract.facets.find(f => f.facet_id === facet)!;
    return f.offset + f.normal[0] * C_phi + f.normal[1] * C_r;
  }

  /**
   * Compute support gap: how much margin before hitting next facet
   */
  supportGap(C_phi: number, C_r: number): { current: number; next: number; gap: number } {
    const values = this.contract.facets.map(f => ({
      id: f.facet_id,
      value: f.offset + f.normal[0] * C_phi + f.normal[1] * C_r
    })).sort((a, b) => b.value - a.value); // descending

    const current = values[0].value;
    const next = values[1]?.value ?? current;
    
    return {
      current,
      next,
      gap: current - next
    };
  }

  /**
   * Get kink line for current C_phi
   */
  getKink(C_phi: number): number {
    const edge = this.contract.adjacency[0];
    if (!edge) return Infinity;
    
    const { slope, intercept } = edge.kink_equation;
    return intercept + slope * C_phi;
  }

  /**
   * Full evaluation for operator surface
   */
  evaluate(state: HybridState, C_phi: number, C_r: number) {
    const W = this.evaluateEnvelope(state);
    const classification = this.classifyPoint(C_phi, C_r);
    const M_min = this.computeMmin(C_phi, C_r);
    const gap = this.supportGap(C_phi, C_r);
    const kink = this.getKink(C_phi);
    const inside = W <= M_min;

    return {
      state,
      weights: { C_phi, C_r },
      envelope: { W, M_min, inside },
      facet: classification,
      gap,
      kink,
      timestamp: new Date().toISOString()
    };
  }
}

export { OracleKernel, MirrorContract, HybridState };
