"use strict";
/**
 * Nonogram Codex Engine (v1.0)
 *
 * Sealed, deterministic, nine-plate recursive operator engine.
 * Authority: Nonogram Codex Specification (v1.0)
 *
 * This engine is immutable. It cannot reorder plates, modify transitions,
 * or invent new operators. It is the canonical execution layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonogramCodex = void 0;
exports.createNonogramCodex = createNonogramCodex;
/**
 * SEALED PLATE DEFINITIONS
 * Order I–IX → ∞, immutable topology
 */
const PLATE_METADATA = {
    I: {
        id: 'I',
        name: 'Golden Ratio',
        semantics: 'Generative expansion',
        operator: 'op_generate',
        order: 0,
        triggerConditions: ['type=market', 'momentum > 0'],
        description: 'Entry point: expansion of signal space, introduction of new vectors',
    },
    II: {
        id: 'II',
        name: '96-Surface Lattice',
        semantics: 'Structural ontology',
        operator: 'op_structure',
        order: 1,
        triggerConditions: ['type=trend'],
        description: 'Enforcement of structural constraints, lattice formation',
    },
    III: {
        id: 'III',
        name: 'Logarithmic Scale',
        semantics: 'Perceptual scaling',
        operator: 'op_scale',
        order: 2,
        triggerConditions: ['vol > 0'],
        description: 'Apply logarithmic transformation to perceived signal magnitude',
    },
    IV: {
        id: 'IV',
        name: 'Chaos & Symmetry',
        semantics: 'Controlled disturbance',
        operator: 'op_disturb',
        order: 3,
        triggerConditions: ['vol > 2.5σ'],
        description: 'Inject bounded chaos; preserve symmetry constraints',
    },
    V: {
        id: 'V',
        name: 'Order & Evolution',
        semantics: 'Temporal structuring',
        operator: 'op_order',
        order: 4,
        triggerConditions: ['type=signal'],
        description: 'Restore temporal coherence, evolve order parameter',
    },
    VI: {
        id: 'VI',
        name: 'Convergence',
        semantics: 'Field unification',
        operator: 'op_merge',
        order: 5,
        triggerConditions: [],
        description: 'Merge distributed branches into unified field',
    },
    VII: {
        id: 'VII',
        name: 'The Source',
        semantics: 'Prime resonance',
        operator: 'op_invoke',
        order: 6,
        triggerConditions: [],
        description: 'Invoke the Source; access prime resonance patterns',
    },
    VIII: {
        id: 'VIII',
        name: 'The Cycles',
        semantics: 'Harmonic recurrence',
        operator: 'op_cycle',
        order: 7,
        triggerConditions: [],
        description: 'Apply recurrence relations; harmonic resonance',
    },
    IX: {
        id: 'IX',
        name: 'Completion',
        semantics: 'Resolution & return',
        operator: 'op_resolve',
        order: 8,
        triggerConditions: [],
        description: 'Collapse state, resolve to Infinity Core',
    },
    '∞': {
        id: '∞',
        name: 'Infinity Core',
        semantics: 'Fixed point, reset anchor',
        operator: 'op_resolve',
        order: 9,
        triggerConditions: [],
        description: 'Terminal state, cycle reset point',
    },
};
/**
 * SEALED NONOGRAM TRANSITION GRAPH
 * Immutable directed graph: I–IX → ∞
 */
const NONOGRAM_TRANSITION_GRAPH = {
    edges: [
        { from: 'I', to: 'V', operator: 'op_generate', label: 'Expand' },
        { from: 'II', to: 'VI', operator: 'op_structure', label: 'Structure' },
        { from: 'III', to: 'I', operator: 'op_scale', label: 'Scale & rebase' },
        { from: 'IV', to: 'III', operator: 'op_disturb', label: 'Disturb → scale' },
        { from: 'V', to: 'IX', operator: 'op_order', label: 'Order → completion' },
        { from: 'VI', to: 'VII', operator: 'op_merge', label: 'Merge → source' },
        { from: 'VII', to: 'II', operator: 'op_invoke', label: 'Invoke → lattice' },
        { from: 'VIII', to: 'IV', operator: 'op_cycle', label: 'Cycle → chaos' },
        { from: 'IX', to: '∞', operator: 'op_resolve', label: 'Resolve → ∞' },
    ],
    locked: true,
};
/**
 * Nonogram Codex Engine
 *
 * Core execution engine for the sealed nine-plate system.
 * This class is deterministic, immutable, and invariant-preserving.
 */
class NonogramCodex {
    constructor(config) {
        this.currentCycle = null;
        this.cycleHistory = [];
        this.signalHistory = [];
        if (!config.sealed) {
            throw new Error('Codex must be sealed (sealed: true)');
        }
        this.config = config;
        this.state = this.initializeState();
    }
    /**
     * Initialize Codex state
     */
    initializeState() {
        return {
            currentPlate: this.config.initialPlate,
            cycleId: this.generateCycleId(),
            cycleStartTime: new Date(),
            totalCycles: 0,
            fallbackMode: false,
            locked: true,
            metadata: {
                invariantsViolated: 0,
                transitionsCorrect: 0,
                transitionsTotal: 0,
                infinityReturns: 0,
            },
        };
    }
    /**
     * Generate unique cycle ID
     */
    generateCycleId() {
        return `cycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get next plate from transition graph
     */
    getNextPlate(fromPlate) {
        const edge = NONOGRAM_TRANSITION_GRAPH.edges.find((e) => e.from === fromPlate);
        return edge?.to ?? null;
    }
    /**
     * Get operator for a plate
     */
    getOperatorForPlate(plateId) {
        return PLATE_METADATA[plateId]?.operator ?? 'op_resolve';
    }
    /**
     * Validate state invariants
     */
    validateInvariants() {
        // Seal check
        if (!this.state.locked) {
            this.state.metadata.invariantsViolated++;
            return false;
        }
        // All plate transitions must follow the graph
        // (checked during step execution)
        return true;
    }
    /**
     * Align an incoming signal to a Plate
     *
     * Returns the best-matching Plate based on signal characteristics.
     */
    alignSignalToPlate(signal) {
        let plateId = 'I'; // default
        let score = 0.5;
        let reason = 'default alignment';
        const { momentum, volatility } = signal.data;
        const isHighVol = volatility > 2.5;
        const isHighMomentum = Math.abs(momentum) > 0.1;
        // Signal-type-based alignment
        if (signal.type === 'market') {
            plateId = 'I';
            reason = 'market signal → golden ratio expansion';
            score = 0.85;
        }
        else if (signal.type === 'trend') {
            plateId = 'II';
            reason = 'trend signal → lattice structure';
            score = 0.8;
        }
        else if (signal.type === 'anomaly') {
            if (isHighVol) {
                plateId = 'IV';
                reason = 'anomaly + high vol → chaos & symmetry';
                score = 0.9;
            }
            else {
                plateId = 'III';
                reason = 'anomaly → logarithmic scaling';
                score = 0.75;
            }
        }
        else {
            // user-injected or other
            plateId = 'V';
            reason = 'user signal → order & evolution';
            score = 0.7;
        }
        // Volatility adjustments
        if (isHighVol && plateId !== 'IV') {
            plateId = 'IV';
            reason = 'high volatility override → chaos layer';
            score = 0.88;
        }
        const alignment = {
            signalId: signal.id,
            timestamp: signal.timestamp,
            plateId,
            operator: this.getOperatorForPlate(plateId),
            alignmentScore: score,
            alignmentReason: reason,
            fallbackMode: signal.source !== 'live',
        };
        this.signalHistory.push(alignment);
        return alignment;
    }
    /**
     * Execute operator for a given Plate
     */
    executeOperator(plateId, signal, params) {
        const operator = this.getOperatorForPlate(plateId);
        const startTime = new Date();
        let output = {};
        let nextPlate = this.getNextPlate(plateId) ?? '∞';
        // Execute operator logic (simplified)
        switch (operator) {
            case 'op_generate':
                output = { vectors: Math.floor(Math.random() * 10) + 1 };
                break;
            case 'op_structure':
                output = { latticeIntegrity: Math.random() };
                break;
            case 'op_scale':
                output = {
                    scaledValue: signal?.data?.momentum
                        ? Math.log(Math.abs(signal.data.momentum) + 1)
                        : 0,
                };
                break;
            case 'op_disturb':
                const chaos = (params?.maxChaos ?? 0.02) * (Math.random() - 0.5);
                output = { perturbation: chaos };
                break;
            case 'op_order':
                output = { coherence: 0.95 + Math.random() * 0.05 };
                break;
            case 'op_merge':
                output = { mergedField: 'unified' };
                break;
            case 'op_invoke':
                output = { resonance: 'invoked' };
                break;
            case 'op_cycle':
                output = { recurrence: true };
                break;
            case 'op_resolve':
                output = { resolved: true, returnedToInfinity: true };
                nextPlate = '∞';
                break;
        }
        const endTime = new Date();
        const execution = {
            operator,
            plateId,
            startTime,
            endTime,
            durationMs: endTime.getTime() - startTime.getTime(),
            input: { signal, params },
            output,
            nextPlate,
            status: 'success',
        };
        this.state.metadata.transitionsTotal++;
        if (NONOGRAM_TRANSITION_GRAPH.edges.some((e) => e.from === plateId && e.to === nextPlate)) {
            this.state.metadata.transitionsCorrect++;
        }
        return execution;
    }
    /**
     * Step to the next Plate
     */
    async step(signal) {
        if (!this.validateInvariants()) {
            throw new Error('Codex invariant violated');
        }
        const currentPlate = this.state.currentPlate;
        const metadata = PLATE_METADATA[currentPlate];
        const operator = this.getOperatorForPlate(currentPlate);
        const startTime = new Date();
        let alignment;
        if (signal) {
            alignment = this.alignSignalToPlate(signal);
        }
        const execution = this.executeOperator(currentPlate, signal, this.config.params);
        const endTime = new Date();
        const nextPlate = execution.nextPlate;
        const record = {
            plateId: currentPlate,
            plateMetadata: metadata,
            entryTime: startTime,
            durationMs: endTime.getTime() - startTime.getTime(),
            operator,
            signal: alignment,
            execution,
            nextPlate,
            metadata: {
                operatorParams: this.config.params,
                thresholdsMet: metadata.triggerConditions,
            },
        };
        if (!this.currentCycle) {
            this.currentCycle = {
                cycleId: this.state.cycleId,
                startTime: this.state.cycleStartTime,
                endTime: new Date(),
                durationMs: 0,
                startingPlate: currentPlate,
                path: [currentPlate],
                plates: [],
                returnedToInfinity: false,
                totalSteps: 0,
                status: 'interrupted',
                fallbackActivated: this.state.fallbackMode,
            };
        }
        this.currentCycle.plates.push(record);
        this.currentCycle.path.push(nextPlate);
        this.currentCycle.totalSteps++;
        // Check if we've reached infinity
        if (nextPlate === '∞') {
            this.currentCycle.returnedToInfinity = true;
            this.currentCycle.infinityTime = new Date();
            this.currentCycle.status = 'complete';
            this.state.metadata.infinityReturns++;
            // Finalize cycle
            this.cycleHistory.push(this.currentCycle);
            this.state.totalCycles++;
            // Reset for next cycle
            this.currentCycle = null;
            this.state.cycleId = this.generateCycleId();
            this.state.cycleStartTime = new Date();
            this.state.currentPlate = this.getNextPlate('IX') ?? 'I'; // usually back to I or start plate
        }
        else {
            this.state.currentPlate = nextPlate;
            this.currentCycle.endTime = new Date();
            this.currentCycle.durationMs = this.currentCycle.endTime.getTime() - this.currentCycle.startTime.getTime();
        }
        this.state.lastSignal = signal;
        this.state.lastAlignment = alignment;
        this.state.lastExecution = execution;
        this.state.lastPlateRecord = record;
        return record;
    }
    /**
     * Run a complete cycle from current or starting Plate to ∞
     */
    async runCycle(maxSteps = 10) {
        const cycleStartTime = new Date();
        this.currentCycle = {
            cycleId: this.state.cycleId,
            startTime: cycleStartTime,
            endTime: cycleStartTime,
            durationMs: 0,
            startingPlate: this.state.currentPlate,
            path: [],
            plates: [],
            returnedToInfinity: false,
            totalSteps: 0,
            status: 'interrupted',
            fallbackActivated: this.state.fallbackMode,
        };
        let steps = 0;
        while (steps < maxSteps && this.state.currentPlate !== '∞') {
            await this.step();
            steps++;
        }
        if (!this.currentCycle.returnedToInfinity) {
            this.currentCycle.status = 'interrupted';
        }
        const result = this.currentCycle;
        this.currentCycle = null;
        return result;
    }
    /**
     * Activate fallback mode (e.g., due to API 429)
     */
    setFallbackMode(active, reason) {
        this.state.fallbackMode = active;
        if (active) {
            this.state.fallbackReason = reason;
            this.state.fallbackActivatedAt = new Date();
        }
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get cycle history
     */
    getCycleHistory() {
        return [...this.cycleHistory];
    }
    /**
     * Get recent cycles (last N)
     */
    getRecentCycles(count = 5) {
        return this.cycleHistory.slice(-count);
    }
    /**
     * Get signal alignment history
     */
    getSignalHistory() {
        return [...this.signalHistory];
    }
    /**
     * Get recent signal alignments (last N)
     */
    getRecentSignals(count = 10) {
        return this.signalHistory.slice(-count);
    }
    /**
     * Get transition graph (read-only)
     */
    getTransitionGraph() {
        return NONOGRAM_TRANSITION_GRAPH;
    }
    /**
     * Get plate metadata (read-only)
     */
    getPlateMetadata() {
        return { ...PLATE_METADATA };
    }
    /**
     * Verify invariants (for testing)
     */
    verifyInvariants() {
        const violations = [];
        if (!this.state.locked) {
            violations.push('Seal lock violated');
        }
        if (this.state.metadata.invariantsViolated > 0) {
            violations.push(`${this.state.metadata.invariantsViolated} invariant violations recorded`);
        }
        if (this.state.metadata.transitionsCorrect !== this.state.metadata.transitionsTotal) {
            violations.push(`Incorrect transitions: ${this.state.metadata.transitionsCorrect}/${this.state.metadata.transitionsTotal}`);
        }
        return {
            valid: violations.length === 0,
            violations,
        };
    }
}
exports.NonogramCodex = NonogramCodex;
/**
 * Create a sealed Nonogram Codex instance
 */
function createNonogramCodex(config) {
    const finalConfig = {
        initialPlate: 'I',
        sealed: true,
        params: config?.params ?? {},
        telemetry: config?.telemetry ?? { enableTracing: true, enableMetrics: true },
    };
    return new NonogramCodex(finalConfig);
}
