import { useOracleStream } from '../src/hooks/useOracleStream';
/**
 * Operator Console React Component
 *
 * Real-time interface for monitoring and controlling the Nonogram Codex
 */

'use client';


import React, { useState, useEffect, useCallback } from 'react';
import { useCodex } from '../src/context/CodexContext';
import type {
  OperatorConsoleState,
  CodexState,
  PlateId,
  CycleRecord,
  SignalAlignment,
  TelemetrySnapshot,
  MarketSignal,
} from '../../../packages/codex/types';


interface OperatorConsoleProps {
  // No longer needs props, uses context
}

/**
 * Plate Monitor View - Shows current plate and operator
 */
function PlateMonitor({ state }: { state: OperatorConsoleState }) {
  const { codexState } = state;
  const currentPlate = codexState.currentPlate;

  const plateNames: Record<PlateId, string> = {
    'I': 'Golden Ratio',
    'II': '96-Surface Lattice',
    'III': 'Logarithmic Scale',
    'IV': 'Chaos & Symmetry',
    'V': 'Order & Evolution',
    'VI': 'Convergence',
    'VII': 'The Source',
    'VIII': 'The Cycles',
    'IX': 'Completion',
    '∞': 'Infinity Core',
  };

  const plateSemantics: Record<PlateId, string> = {
    'I': 'Generative expansion',
    'II': 'Structural ontology',
    'III': 'Perceptual scaling',
    'IV': 'Controlled disturbance',
    'V': 'Temporal structuring',
    'VI': 'Field unification',
    'VII': 'Prime resonance',
    'VIII': 'Harmonic recurrence',
    'IX': 'Resolution & return',
    '∞': 'Fixed point, reset anchor',
  };

  const lastExecution = codexState.lastExecution;
  const lastSignal = codexState.lastSignal;

  return (
    <div className="plate-monitor" style={styles.monitor}>
      <h3 style={styles.title}>Nonogram Codex — Operator Console</h3>

      <div style={styles.plateSection}>
        <div style={styles.plateHeader}>Current Plate: {currentPlate}</div>
        <div style={styles.plateName}>{plateNames[currentPlate]}</div>
        <div style={styles.plateSemantics}>{plateSemantics[currentPlate]}</div>
      </div>

      <div style={styles.separator}></div>

      {lastExecution && (
        <div style={styles.operatorSection}>
          <div style={styles.label}>Operator:</div>
          <div style={styles.value}>{lastExecution.operator}()</div>
          <div style={{ ...styles.label, marginTop: 8 }}>
            Status:
          </div>
          <div style={styles.value}>{lastExecution.status}</div>
          <div style={{ ...styles.label, marginTop: 8 }}>
            Duration:
          </div>
          <div style={styles.value}>{lastExecution.durationMs}ms</div>
          <div style={{ ...styles.label, marginTop: 8 }}>
            → Next Plate: {lastExecution.nextPlate}
          </div>
        </div>
      )}

      {lastSignal && (
        <div style={styles.signalSection}>
          <div style={styles.label}>Signal:</div>
          <div style={styles.value}>
            type={lastSignal.type}, momentum={lastSignal.data.momentum?.toFixed(4)},
            vol={lastSignal.data.volatility?.toFixed(1)}σ
          </div>
          <div style={{ ...styles.label, marginTop: 8 }}>
            Timestamp:
          </div>
          <div style={styles.value}>{lastSignal.timestamp?.toISOString()}</div>
          {codexState.fallbackMode && (
            <div style={{ ...styles.value, color: '#ff9800', marginTop: 8 }}>
              ⚠️ OMEGA_FALLBACK ({codexState.fallbackReason})
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Signal Trace View - Historical signals and alignments
 */
function SignalTraceView({ signals }: { signals: SignalAlignment[] }) {
  return (
    <div style={styles.traceView}>
      <h4 style={styles.subTitle}>Signal Trace (Last 10)</h4>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Plate</th>
              <th style={styles.th}>Operator</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Fallback</th>
            </tr>
          </thead>
          <tbody>
            {signals.slice(-10).map((sig) => (
              <tr key={sig.signalId} style={styles.tableRow}>
                <td style={styles.td}>{sig.timestamp.toISOString().slice(11, 23)}</td>
                <td style={styles.td}>{sig.plateId}</td>
                <td style={styles.td}>{sig.operator}</td>
                <td style={styles.td}>{(sig.alignmentScore * 100).toFixed(0)}%</td>
                <td style={styles.td}>{sig.fallbackMode ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Nonogram Graph - Text representation
 */
function NonogramGraphView() {
  return (
    <div style={styles.graphView}>
      <h4 style={styles.subTitle}>Nonogram Transition Graph</h4>
      <pre style={styles.graphCode}>
        {`I ─→ V
II ─→ VI
III ─→ I
IV ─→ III
V ─→ IX
VI ─→ VII
VII ─→ II
VIII ─→ IV
IX ─→ ∞`}
      </pre>
    </div>
  );
}

/**
 * Operator Registry View
 */
function OperatorRegistryView() {
  const operators = [
    {
      name: 'op_generate',
      plate: 'I',
      semantics: 'Expand / introduce new vectors',
      trigger: 'market signals',
      next: 'V',
    },
    {
      name: 'op_structure',
      plate: 'II',
      semantics: 'Enforce structure / lattice',
      trigger: 'trend signals',
      next: 'VI',
    },
    {
      name: 'op_scale',
      plate: 'III',
      semantics: 'Apply logarithmic scaling',
      trigger: 'vol > 0',
      next: 'I',
    },
    {
      name: 'op_disturb',
      plate: 'IV',
      semantics: 'Inject bounded chaos',
      trigger: 'vol > 2.5σ',
      next: 'III',
    },
    {
      name: 'op_order',
      plate: 'V',
      semantics: 'Restore temporal coherence',
      trigger: 'signal type',
      next: 'IX',
    },
    {
      name: 'op_merge',
      plate: 'VI',
      semantics: 'Unify branches',
      trigger: '—',
      next: 'VII',
    },
    {
      name: 'op_invoke',
      plate: 'VII',
      semantics: 'Call the Source',
      trigger: '—',
      next: 'II',
    },
    {
      name: 'op_cycle',
      plate: 'VIII',
      semantics: 'Apply recurrence',
      trigger: '—',
      next: 'IV',
    },
    {
      name: 'op_resolve',
      plate: 'IX',
      semantics: 'Collapse and return to ∞',
      trigger: 'cycle complete',
      next: '∞',
    },
  ];

  return (
    <div style={styles.registryView}>
      <h4 style={styles.subTitle}>Operator Registry</h4>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Operator</th>
              <th style={styles.th}>Plate</th>
              <th style={styles.th}>Semantics</th>
              <th style={styles.th}>Trigger</th>
              <th style={styles.th}>Next</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.name} style={styles.tableRow}>
                <td style={styles.td}>{op.name}</td>
                <td style={styles.td}>{op.plate}</td>
                <td style={styles.td}>{op.semantics}</td>
                <td style={styles.td}>{op.trigger}</td>
                <td style={styles.td}>{op.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Telemetry Dashboard
 */
function TelemetryDashboard({ telemetry }: { telemetry: TelemetrySnapshot }) {
  return (
    <div style={styles.telemetryView}>
      <h4 style={styles.subTitle}>Telemetry</h4>
      <div style={styles.metricGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Cycle Count</div>
          <div style={styles.metricValue}>{telemetry.cycleCount}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Signal Arrival (signals/cycle)</div>
          <div style={styles.metricValue}>{telemetry.signalArrivalRate.toFixed(2)}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Mean Cycle Latency</div>
          <div style={styles.metricValue}>{telemetry.meanCycleLatency.toFixed(0)}ms</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Transition Correctness</div>
          <div style={styles.metricValue}>{(telemetry.transitionCorrectness * 100).toFixed(1)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Infinity Return Rate</div>
          <div style={styles.metricValue}>{(telemetry.infinityReturnRate * 100).toFixed(1)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Fallback Activations</div>
          <div style={styles.metricValue}>{telemetry.fallbackActivations}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Control Panel
 */
function ControlPanel({ onCommand }: { onCommand: (cmd: string, payload?: any) => void }) {
  return (
    <div style={styles.controlPanel}>
      <h4 style={styles.subTitle}>Controls</h4>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => onCommand('step')}>
          Step
        </button>
        <button style={styles.button} onClick={() => onCommand('cycle', { maxSteps: 10 })}>
          Run Cycle
        </button>
        <button style={styles.button} onClick={() => onCommand('toggle_fallback', { active: true })}>
          Enable Fallback
        </button>
        <button style={styles.button} onClick={() => onCommand('toggle_fallback', { active: false })}>
          Disable Fallback
        </button>
        <button style={styles.button} onClick={() => onCommand('reset')}>
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Main OperatorConsole Component
 */
export function OperatorConsoleComponent() {
  const { state, sendCommand } = useCodex();
  const { data, loading, error, streamOracle } = useOracleStream();
  const [prompt, setPrompt] = React.useState('Why is the sky blue?');

  if (!state) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <PlateMonitor state={state} />

      <div style={styles.grid}>
        <div style={styles.column}>
          <SignalTraceView signals={state.recentSignals} />
          <NonogramGraphView />
        </div>

        <div style={styles.column}>
          <OperatorRegistryView />
          <TelemetryDashboard telemetry={state.telemetry} />
        </div>
      </div>

      <ControlPanel onCommand={sendCommand} />

      {/* Oracle Streaming Demo */}
      <div style={{ marginTop: 32, background: '#111', padding: 16, borderRadius: 4 }}>
        <h4 style={styles.subTitle}>Oracle Streaming Inference</h4>
        <form
          onSubmit={e => {
            e.preventDefault();
            streamOracle(prompt);
          }}
        >
          <input
            style={{ width: 400, marginRight: 8, padding: 4, fontFamily: 'monospace' }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Streaming...' : 'Ask Oracle'}
          </button>
        </form>
        <div style={{ marginTop: 12, minHeight: 40, whiteSpace: 'pre-wrap', color: '#00ff88', fontFamily: 'monospace', background: '#222', padding: 8, borderRadius: 4 }}>
          {error ? <span style={{ color: '#ff5252' }}>{error}</span> : data}
        </div>
      </div>
    </div>
  );
}

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'monospace',
    backgroundColor: '#0a0e27',
    color: '#00ff88',
    padding: '20px',
    borderRadius: '4px',
    border: '1px solid #00ff88',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  monitor: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '16px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  subTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  plateSection: {
    marginBottom: '16px',
  },
  plateHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  plateName: {
    fontSize: '14px',
    color: '#ffaa00',
    marginBottom: '2px',
  },
  plateSemantics: {
    fontSize: '12px',
    color: '#888',
  },
  operatorSection: {
    marginBottom: '12px',
    paddingTop: '12px',
  },
  signalSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #00ff8833',
  },
  separator: {
    height: '1px',
    backgroundColor: '#00ff8833',
    margin: '12px 0',
  },
  label: {
    fontSize: '12px',
    color: '#00ff88',
    fontWeight: 'bold',
    marginTop: 4,
  },
  value: {
    fontSize: '12px',
    color: '#ffffff',
    marginTop: 2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  traceView: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '12px',
    borderRadius: '4px',
  },
  graphView: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '12px',
    borderRadius: '4px',
  },
  registryView: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '12px',
    borderRadius: '4px',
  },
  telemetryView: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '12px',
    borderRadius: '4px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
  },
  tableHeader: {
    backgroundColor: '#1a1f3a',
    borderBottom: '1px solid #00ff88',
  },
  th: {
    padding: '6px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  tableRow: {
    borderBottom: '1px solid #00ff8833',
  },
  td: {
    padding: '4px 6px',
    color: '#ffffff',
  },
  graphCode: {
    backgroundColor: '#000000',
    padding: '8px',
    borderRadius: '2px',
    fontSize: '11px',
    overflow: 'auto',
    margin: 0,
    color: '#00ff88',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  metric: {
    backgroundColor: '#000000',
    border: '1px solid #00ff8833',
    padding: '8px',
    borderRadius: '2px',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  controlPanel: {
    backgroundColor: '#0f1430',
    border: '1px solid #00ff88',
    padding: '12px',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#00ff88',
    color: '#000000',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

export default OperatorConsoleComponent;
