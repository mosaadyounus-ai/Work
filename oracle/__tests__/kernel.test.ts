import { OracleKernel } from '../kernel';
import { join } from 'path';

describe('OracleKernel — Two-Peak ConversionFront', () => {
  const kernel = new OracleKernel(join(__dirname, '../../mirror/two_peak_example.json'));

  test('loads contract correctly', () => {
    expect(kernel).toBeDefined();
  });

  test('evaluates envelope at origin', () => {
    const state = { phi: 0, r: 0, e: 0, mode: 'IDLE' };
    expect(kernel.evaluateEnvelope(state)).toBe(0);
  });

  test('classifies below kink (Facet-A wins)', () => {
    // C_r = 0.2 < 0.25
    const result = kernel.classifyPoint(0, 0.2);
    expect(result.facet).toBe('Facet-A');
  });

  test('classifies above kink (Facet-B wins)', () => {
    // C_r = 0.3 > 0.25
    const result = kernel.classifyPoint(0, 0.3);
    expect(result.facet).toBe('Facet-B');
  });

  test('computes M_min at kink boundary', () => {
    const M = kernel.computeMmin(0, 0.25);
    // Both facets should tie at kink
    const MA = kernel.computeMmin(0, 0.249);
    const MB = kernel.computeMmin(0, 0.251);
    expect(MA).toBeCloseTo(4.5, 1);
    expect(MB).toBeCloseTo(4.5, 1);
  });

  test('detects support gap', () => {
    const gap = kernel.supportGap(0, 0.2);
    expect(gap.current).toBeGreaterThan(gap.next);
    expect(gap.gap).toBeGreaterThan(0);
  });

  test('full evaluation produces valid output', () => {
    const state = { phi: 4, r: 2, e: 4, mode: 'FUSION' };
    const result = kernel.evaluate(state, 0, 0.2);
    
    expect(result.envelope.W).toBe(4.4); // 4 + 0 + 0.2*2
    expect(result.facet.facet).toBe('Facet-A');
    expect(result.envelope.inside).toBe(true); // 4.4 < 4.5
    expect(result.timestamp).toBeDefined();
  });
});
