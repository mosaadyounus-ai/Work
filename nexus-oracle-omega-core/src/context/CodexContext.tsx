import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { generateAlerts } from "../lib/alerts";
import {
  createDemoPredictions,
  createDemoRuntimeSnapshot,
  createDemoTraceEntries,
  DemoRuntimeSnapshot,
  saveDemoAnnotations,
  tickDemoRuntimeSnapshot,
} from "../lib/demoRuntime";
import {
  OracleControls,
  OracleEvaluation,
  ProofRecord,
  HybridRuntimeState,
  buildHybridRuntimeState,
  buildProofRecords,
  createDefaultOracleControls,
  evaluateHybridOracle,
} from "../lib/hybridWorkbench";
import {
  CodexStep,
  GuardrailEvent,
  MeridianTelemetry,
  ProcessedSignal,
  TraceAnnotation,
} from "../lib/types";
import type { OracleInsight } from "../services/geminiService";
import { generateOracleAnalysis } from "../services/geminiService";

interface CodexContextType {
  data: ProcessedSignal[];
  meridian: MeridianTelemetry | null;
  codexHistory: CodexStep[];
  annotations: TraceAnnotation[];
  guardrailEvents: GuardrailEvent[];
  plateCounts: Record<string, number>;
  alerts: string[];
  isProcessing: boolean;
  lastSync: string;
  phi: number;
  readiness: number;
  energy: number;
  rateLimitState: "STABLE" | "THROTTLED";
  bootSequence: boolean;
  runtimeMode: "live" | "demo";
  focusMode: "SCAN" | "FOCUS" | "SIMULATE";
  addAnnotation: (a: Omit<TraceAnnotation, "id" | "createdAt">) => Promise<void>;
  setFocusMode: (mode: "SCAN" | "FOCUS" | "SIMULATE") => void;
  selectedSignalId?: string;
  setSelectedSignal: (id: string) => void;
  stabilizeSystem: () => void;
  sendIntent: (action: string, meta?: unknown) => void;
  runOracleAnalysis: () => Promise<void>;
  lastAck: { action: string; status: string; result?: string; timestamp: number } | null;
  predictions: unknown[];
  trace: { tick: number; hash: string }[];
  oracleInsight: OracleInsight | null;
  isAnalyzing: boolean;
  hybridRuntime: HybridRuntimeState;
  oracleControls: OracleControls;
  setOracleControls: (updates: Partial<OracleControls>) => void;
  oracleEvaluation: OracleEvaluation;
  proofRecords: ProofRecord[];
}

const CodexContext = createContext<CodexContextType | undefined>(undefined);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatSync(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function makeAck(action: string, status: string, result?: string) {
  return {
    action,
    status,
    result,
    timestamp: Date.now(),
  };
}

function toMeridianTelemetry(payload: any): MeridianTelemetry {
  const telemetry = payload.telemetry;

  return {
    vitalityIndex: telemetry.SVI,
    cognitiveBandwidth: telemetry.CBU,
    environmentalQuality: telemetry.ESQ,
    operationalMomentum: telemetry.OM,
    anomalyPressure: telemetry.AP,
    pathMap: telemetry.pathMap,
    decisionLoop: {
      perception: "Complete",
      interpretation: "Complete",
      decision: "In-Motion",
      action: "Open",
      learning: "Open",
    },
    metrics: {
      stability: payload.currentSignal?.score || 88,
      load: telemetry.CBU,
      clarity: telemetry.ESQ,
      momentum: telemetry.OM,
      risk: payload.currentSignal?.risk || 12,
      harmonicAlignment: 92,
      fractalDensity: 45,
      snr: 12.5,
    },
    guardians: [
      { id: "g1", name: "Synthesis", symbol: "S", status: "ACTIVE", alignment: 94 },
      { id: "g2", name: "Traverser", symbol: "T", status: "ACTIVE", alignment: 88 },
    ],
    operator: {
      name: payload.operatorId || "Mohammad Saad Younus",
      focus: 0.92,
      energy: 0.85,
      cadence: 1.2,
      driftCorrection: 0.05,
    },
    resilience: {
      rateLimitState: payload.resilience?.rateLimitState === "THROTTLED" ? "LOCKED_CACHE" : "NORMAL",
      cacheState: payload.resilience?.rateLimitState === "THROTTLED" ? "LOCKED" : "HOT",
    },
    world: {
      globalPulse: "Transitional",
      marketTemperature: "Neutral",
      techSignal: "Accelerating",
      weather: { location: "Hosted runtime", temp: 22, condition: "Clear", visibility: "Stable" },
    },
    health: {
      heartbeat: true,
      artifactIntegrity: true,
      guardianAlignment: true,
      pathMapPosition: 0.42,
    },
  };
}

export const CodexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialDemoSnapshot = useMemo(() => createDemoRuntimeSnapshot(), []);
  const demoSnapshotRef = useRef<DemoRuntimeSnapshot>(initialDemoSnapshot);
  const wsRef = useRef<WebSocket | null>(null);
  const demoTickerRef = useRef<number | null>(null);
  const runtimeModeRef = useRef<"live" | "demo">("demo");
  const liveOpenedRef = useRef(false);

  const [data, setData] = useState<ProcessedSignal[]>(initialDemoSnapshot.data);
  const [meridian, setMeridian] = useState<MeridianTelemetry | null>(initialDemoSnapshot.meridian);
  const [codexHistory, setCodexHistory] = useState<CodexStep[]>(initialDemoSnapshot.codexHistory);
  const [annotations, setAnnotations] = useState<TraceAnnotation[]>(initialDemoSnapshot.annotations);
  const [guardrailEvents, setGuardrailEvents] = useState<GuardrailEvent[]>(initialDemoSnapshot.guardrailEvents);
  const [plateCounts, setPlateCounts] = useState<Record<string, number>>(initialDemoSnapshot.plateCounts);
  const [alerts, setAlerts] = useState<string[]>(generateAlerts(initialDemoSnapshot.data));
  const [bootSequence, setBootSequence] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSync, setLastSync] = useState(initialDemoSnapshot.lastSync);
  const [phi, setPhi] = useState(initialDemoSnapshot.phi);
  const [readiness, setReadiness] = useState(initialDemoSnapshot.readiness);
  const [energy, setEnergy] = useState(initialDemoSnapshot.energy);
  const [rateLimitState, setRateLimitState] = useState<"STABLE" | "THROTTLED">(
    initialDemoSnapshot.rateLimitState,
  );
  const [focusMode, setFocusModeLocal] = useState<"SCAN" | "FOCUS" | "SIMULATE">("SCAN");
  const [selectedSignalId, setSelectedSignalId] = useState<string | undefined>(undefined);
  const [runtimeMode, setRuntimeMode] = useState<"live" | "demo">("demo");
  const [lastAck, setLastAck] = useState<{
    action: string;
    status: string;
    result?: string;
    timestamp: number;
  } | null>(null);
  const [predictions, setPredictions] = useState<unknown[]>([]);
  const [trace, setTrace] = useState<{ tick: number; hash: string }[]>([]);
  const [oracleInsight, setOracleInsight] = useState<OracleInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(initialDemoSnapshot.updatedAt);
  const [oracleControls, setOracleControlsState] = useState<OracleControls>(() =>
    createDefaultOracleControls(),
  );

  const syncDemoSnapshot = useCallback((snapshot: DemoRuntimeSnapshot) => {
    demoSnapshotRef.current = snapshot;
    setData(snapshot.data);
    setMeridian(snapshot.meridian);
    setCodexHistory(snapshot.codexHistory);
    setAnnotations(snapshot.annotations);
    setGuardrailEvents(snapshot.guardrailEvents);
    setPlateCounts(snapshot.plateCounts);
    setPhi(snapshot.phi);
    setReadiness(snapshot.readiness);
    setEnergy(snapshot.energy);
    setRateLimitState(snapshot.rateLimitState);
    setAlerts(generateAlerts(snapshot.data));
    setLastSync(snapshot.lastSync);
    setUpdatedAt(snapshot.updatedAt);
  }, []);

  const stopDemoTicker = useCallback(() => {
    if (demoTickerRef.current !== null) {
      window.clearInterval(demoTickerRef.current);
      demoTickerRef.current = null;
    }
  }, []);

  const startDemoMode = useCallback(() => {
    runtimeModeRef.current = "demo";
    setRuntimeMode("demo");

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    syncDemoSnapshot(createDemoRuntimeSnapshot());

    if (demoTickerRef.current === null) {
      demoTickerRef.current = window.setInterval(() => {
        const nextSnapshot = tickDemoRuntimeSnapshot(demoSnapshotRef.current);
        syncDemoSnapshot(nextSnapshot);
      }, 4_000);
    }
  }, [syncDemoSnapshot]);

  const fetchInitialLabData = useCallback(async () => {
    try {
      const endpoints = ["/api/codex/annotations", "/api/codex/guardrails/events"];
      const responses = await Promise.all(endpoints.map((url) => fetch(url)));
      const results = await Promise.all(
        responses.map(async (response, index) => {
          if (!response.ok) {
            throw new Error(`Fetch failed for ${endpoints[index]}: ${response.status}`);
          }

          return response.json();
        }),
      );

      setAnnotations(results[0] || []);
      setGuardrailEvents(results[1] || []);
    } catch (error) {
      console.warn("[LAB_FETCH_WARN]", error instanceof Error ? error.message : String(error));
    }
  }, []);

  const runOracleAnalysis = useCallback(async () => {
    if (!meridian) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const insight = await generateOracleAnalysis({
        SVI: meridian.vitalityIndex,
        OM: meridian.operationalMomentum,
        AP: meridian.anomalyPressure,
        phi,
        readiness,
        energy,
        mode: focusMode,
      });
      setOracleInsight(insight);
    } catch (error) {
      console.error("[ORACLE_ERR]", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [energy, focusMode, meridian, phi, readiness]);

  const addAnnotation = useCallback(
    async (annotation: Omit<TraceAnnotation, "id" | "createdAt">) => {
      if (runtimeModeRef.current === "live" && wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          const response = await fetch("/api/codex/annotations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(annotation),
          });
          if (!response.ok) {
            throw new Error("Annotation persistence failed");
          }
          const nextAnnotation = (await response.json()) as TraceAnnotation;
          setAnnotations((current) => [...current, nextAnnotation]);
        } catch (error) {
          console.error("[ANNOTATION_POST_ERR]", error);
        }
        return;
      }

      const nextAnnotation: TraceAnnotation = {
        id: `demo-annotation-${Date.now()}`,
        createdAt: new Date().toISOString(),
        author: "LOCAL_OPERATOR",
        ...annotation,
      };

      setAnnotations((current) => {
        const nextAnnotations = [...current, nextAnnotation];
        saveDemoAnnotations(nextAnnotations);
        demoSnapshotRef.current = {
          ...demoSnapshotRef.current,
          annotations: nextAnnotations,
        };
        return nextAnnotations;
      });
    },
    [],
  );

  const setFocusMode = useCallback((mode: "SCAN" | "FOCUS" | "SIMULATE") => {
    setFocusModeLocal(mode);

    if (runtimeModeRef.current === "live" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "UI_EVENT",
          payload: { action: "SET_FOCUS_MODE", mode },
        }),
      );
    }
  }, []);

  const setSelectedSignal = useCallback((id: string) => {
    setSelectedSignalId(id);

    if (runtimeModeRef.current === "live" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "UI_EVENT",
          payload: { action: "SELECT_SIGNAL", id },
        }),
      );
    }
  }, []);

  const sendIntent = useCallback(
    (action: string, meta?: unknown) => {
      const normalizedAction = action.toUpperCase();

      if (runtimeModeRef.current === "live" && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "INTENT",
            payload: { action: normalizedAction, meta },
          }),
        );
        return;
      }

      const now = Date.now();
      const currentSnapshot = demoSnapshotRef.current;

      if (normalizedAction === "STABILIZE") {
        const nextSnapshot: DemoRuntimeSnapshot = {
          ...currentSnapshot,
          meridian: currentSnapshot.meridian
            ? {
                ...currentSnapshot.meridian,
                vitalityIndex: clamp(currentSnapshot.meridian.vitalityIndex + 4.5, 0, 100),
                operationalMomentum: clamp(currentSnapshot.meridian.operationalMomentum - 2.8, 0, 100),
                anomalyPressure: clamp(currentSnapshot.meridian.anomalyPressure - 4.8, 0, 100),
                metrics: {
                  ...currentSnapshot.meridian.metrics,
                  stability: clamp(currentSnapshot.meridian.metrics.stability + 6, 0, 100),
                  risk: clamp(currentSnapshot.meridian.metrics.risk - 5, 0, 100),
                },
                resilience: {
                  rateLimitState: "NORMAL",
                  cacheState: "HOT",
                },
              }
            : currentSnapshot.meridian,
          phi: clamp(currentSnapshot.phi - 6, 0, 100),
          readiness: clamp(currentSnapshot.readiness + 4, 0, 100),
          energy: clamp(currentSnapshot.energy - 3, 0, 100),
          rateLimitState: "STABLE",
          lastSync: formatSync(now),
          updatedAt: now,
        };
        syncDemoSnapshot(nextSnapshot);
        setLastAck(makeAck(normalizedAction, "OK", "Hosted demo stabilization pulse emitted."));
        return;
      }

      if (normalizedAction === "BOOST") {
        const nextSnapshot: DemoRuntimeSnapshot = {
          ...currentSnapshot,
          meridian: currentSnapshot.meridian
            ? {
                ...currentSnapshot.meridian,
                vitalityIndex: clamp(currentSnapshot.meridian.vitalityIndex + 2, 0, 100),
                operationalMomentum: clamp(currentSnapshot.meridian.operationalMomentum + 6.5, 0, 100),
                anomalyPressure: clamp(currentSnapshot.meridian.anomalyPressure + 2.4, 0, 100),
                metrics: {
                  ...currentSnapshot.meridian.metrics,
                  momentum: clamp(currentSnapshot.meridian.metrics.momentum + 8, 0, 100),
                },
              }
            : currentSnapshot.meridian,
          phi: clamp(currentSnapshot.phi + 5, 0, 100),
          readiness: clamp(currentSnapshot.readiness + 2, 0, 100),
          energy: clamp(currentSnapshot.energy + 8, 0, 100),
          rateLimitState: currentSnapshot.rateLimitState,
          lastSync: formatSync(now),
          updatedAt: now,
        };
        syncDemoSnapshot(nextSnapshot);
        setLastAck(makeAck(normalizedAction, "OK", "Hosted demo boost sequence ignited."));
        return;
      }

      if (normalizedAction === "PREDICTION") {
        const steps =
          meta && typeof meta === "object" && "steps" in (meta as Record<string, unknown>)
            ? Number((meta as Record<string, unknown>).steps)
            : 12;
        setPredictions(createDemoPredictions(clamp(steps, 1, 100), currentSnapshot));
        setFocusModeLocal("SIMULATE");
        setLastAck(makeAck(normalizedAction, "OK", `Projected ${steps} hosted demo futures.`));
        return;
      }

      if (normalizedAction === "TRACE") {
        const limit =
          meta && typeof meta === "object" && "limit" in (meta as Record<string, unknown>)
            ? Number((meta as Record<string, unknown>).limit)
            : 25;
        setTrace(createDemoTraceEntries(clamp(limit, 1, 100), currentSnapshot.codexHistory));
        setLastAck(makeAck(normalizedAction, "OK", "Hosted demo trace buffer recalled."));
        return;
      }

      setLastAck(makeAck(normalizedAction, "IGNORED", "Command not available in hosted demo mode."));
    },
    [syncDemoSnapshot],
  );

  const stabilizeSystem = useCallback(() => {
    sendIntent("STABILIZE");
  }, [sendIntent]);

  const setOracleControls = useCallback((updates: Partial<OracleControls>) => {
    setOracleControlsState((current) => ({
      ...current,
      ...updates,
    }));
  }, []);

  const baseHybridRuntime = useMemo(
    () =>
      buildHybridRuntimeState({
        phiSignal: phi,
        readinessSignal: readiness,
        energySignal: energy,
        updatedAt,
        focusMode,
        controls: oracleControls,
      }),
    [energy, focusMode, oracleControls, phi, readiness, updatedAt],
  );

  const oracleEvaluation = useMemo(
    () => evaluateHybridOracle(oracleControls, baseHybridRuntime),
    [baseHybridRuntime, oracleControls],
  );

  const hybridRuntime = useMemo(
    () => ({
      ...baseHybridRuntime,
      thresholds: {
        ...baseHybridRuntime.thresholds,
        envelope: oracleEvaluation.envelope.m_min,
      },
    }),
    [baseHybridRuntime, oracleEvaluation],
  );

  const proofRecords = useMemo(
    () =>
      buildProofRecords({
        runtime: hybridRuntime,
        oracle: oracleEvaluation,
        controls: oracleControls,
        checkedAt: updatedAt,
      }),
    [hybridRuntime, oracleEvaluation, oracleControls, updatedAt],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setBootSequence(false), 1_600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "wss:" : "ws:";
    const host = window.location.host || "localhost:3000";
    const wsUrl = `${protocol}//${host}/`;

    const timeout = window.setTimeout(() => {
      if (!liveOpenedRef.current && !cancelled) {
        startDemoMode();
      }
    }, 1_800);

    try {
      const connection = new WebSocket(wsUrl);
      wsRef.current = connection;

      connection.onopen = async () => {
        if (cancelled) {
          connection.close();
          return;
        }

        liveOpenedRef.current = true;
        stopDemoTicker();
        runtimeModeRef.current = "live";
        setRuntimeMode("live");
        window.clearTimeout(timeout);
        await fetchInitialLabData();
      };

      connection.onmessage = (event) => {
        try {
          setIsProcessing(true);
          const message = JSON.parse(event.data);

          if (message.type === "STATE_UPDATE" || message.type === "SYNC") {
            const payload = message.payload || message;

            if (payload.ui?.focusMode) {
              setFocusModeLocal(payload.ui.focusMode);
            }
            if (payload.ui?.selectedSignalId) {
              setSelectedSignalId(payload.ui.selectedSignalId);
            }

            const nextData = message.signals || payload.signals || payload.data;
            if (nextData) {
              setData(nextData);
              setAlerts(generateAlerts(nextData));
            }

            if (payload.readiness !== undefined) {
              setReadiness(payload.readiness);
            }
            if (payload.phi !== undefined) {
              setPhi(payload.phi);
            }
            if (payload.energy !== undefined) {
              setEnergy(payload.energy);
            }
            if (payload.resilience?.rateLimitState) {
              setRateLimitState(payload.resilience.rateLimitState);
            }

            if (payload.telemetry) {
              setMeridian(toMeridianTelemetry(payload));
            }
            if (payload.steps) {
              setCodexHistory(payload.steps);
            }
            if (payload.annotations) {
              setAnnotations(payload.annotations);
            }
            if (payload.guardrailEvents) {
              setGuardrailEvents(payload.guardrailEvents);
            }
            if (payload.plateCounts) {
              setPlateCounts(payload.plateCounts);
            }

            setLastSync(formatSync(Date.now()));
            setUpdatedAt(payload.updatedAt ?? Date.now());
          } else if (message.type === "ACK") {
            setLastAck(message.payload);
          } else if (message.type === "PREDICTION_VECT") {
            setPredictions(message.payload.snapshots || []);
          } else if (message.type === "TRACE_RESULT") {
            setTrace(message.payload.entries || []);
          }
        } catch (error) {
          console.error("[CODEX_WS_ERR]", error);
        } finally {
          window.setTimeout(() => setIsProcessing(false), 800);
        }
      };

      connection.onerror = () => {
        if (!liveOpenedRef.current && !cancelled) {
          startDemoMode();
        }
      };

      connection.onclose = () => {
        if (!cancelled) {
          startDemoMode();
        }
      };
    } catch {
      startDemoMode();
    }

    return () => {
      cancelled = true;
      stopDemoTicker();
      window.clearTimeout(timeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchInitialLabData, startDemoMode, stopDemoTicker]);

  return (
    <CodexContext.Provider
      value={{
        data,
        meridian,
        codexHistory,
        annotations,
        guardrailEvents,
        plateCounts,
        alerts,
        isProcessing,
        lastSync,
        phi,
        readiness,
        energy,
        rateLimitState,
        bootSequence,
        runtimeMode,
        focusMode,
        selectedSignalId,
        lastAck,
        predictions,
        trace,
        oracleInsight,
        isAnalyzing,
        hybridRuntime,
        oracleControls,
        oracleEvaluation,
        proofRecords,
        addAnnotation,
        setFocusMode,
        setSelectedSignal,
        stabilizeSystem,
        sendIntent,
        runOracleAnalysis,
        setOracleControls,
      }}
    >
      {children}
    </CodexContext.Provider>
  );
};

export const useCodex = () => {
  const context = useContext(CodexContext);
  if (context === undefined) {
    throw new Error("useCodex must be used within a CodexProvider");
  }
  return context;
};
