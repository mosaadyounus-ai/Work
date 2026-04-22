import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Compass, Network, Orbit, Radar, Sparkles } from "lucide-react";
import {
  GuardianName,
  MysticMapData,
  MysticNode,
  guardianPalette,
  omegaDossier,
} from "../data/omegaDossier";

export type GuardianFilter = GuardianName | "All";

const viewBox = { minX: 0, minY: 0, width: 100, height: 100 };

function isDormant(node: MysticNode) {
  return node.notes.toLowerCase().includes("dormant: true");
}

function labelWeight(node: MysticNode) {
  if (node.type === "central") return 1.8;
  if (node.type === "cluster") return 1.2;
  return 0.8;
}

export function MysticMapExplorer({
  data,
  compact = false,
  guardianFilter: controlledGuardianFilter,
  onGuardianFilterChange,
  selectedId: controlledSelectedId,
  onSelectNode,
}: {
  data: MysticMapData;
  compact?: boolean;
  guardianFilter?: GuardianFilter;
  onGuardianFilterChange?: (guardian: GuardianFilter) => void;
  selectedId?: string;
  onSelectNode?: (node: MysticNode) => void;
}) {
  const [internalGuardianFilter, setInternalGuardianFilter] = useState<GuardianFilter>("All");
  const [internalSelectedId, setInternalSelectedId] = useState("C01");
  const [showLabels, setShowLabels] = useState(!compact);

  const guardianFilter = controlledGuardianFilter ?? internalGuardianFilter;
  const selectedId = controlledSelectedId ?? internalSelectedId;

  const updateGuardianFilter = (guardian: GuardianFilter) => {
    if (controlledGuardianFilter === undefined) {
      setInternalGuardianFilter(guardian);
    }
    onGuardianFilterChange?.(guardian);
  };

  const updateSelectedId = (nodeId: string) => {
    if (controlledSelectedId === undefined) {
      setInternalSelectedId(nodeId);
    }
  };

  const nodesById = useMemo(
    () =>
      data.nodes.reduce<Record<string, MysticNode>>((lookup, node) => {
        lookup[node.node_id] = node;
        return lookup;
      }, {}),
    [data.nodes],
  );

  const adjacency = useMemo(
    () =>
      data.transitions.reduce<Record<string, string[]>>((lookup, transition) => {
        lookup[transition.from] = [...(lookup[transition.from] ?? []), transition.to];
        if (transition.bidirectional) {
          lookup[transition.to] = [...(lookup[transition.to] ?? []), transition.from];
        }
        return lookup;
      }, {}),
    [data.transitions],
  );

  const visibleNodes = useMemo(() => {
    if (guardianFilter === "All") return data.nodes;
    return data.nodes.filter(
      (node) =>
        node.guardian === guardianFilter ||
        node.node_id === "C01" ||
        adjacency[selectedId]?.includes(node.node_id),
    );
  }, [adjacency, data.nodes, guardianFilter, selectedId]);

  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.node_id)),
    [visibleNodes],
  );

  const visibleTransitions = useMemo(
    () =>
      data.transitions.filter(
        (transition) =>
          visibleIds.has(transition.from) && visibleIds.has(transition.to),
      ),
    [data.transitions, visibleIds],
  );

  useEffect(() => {
    if (!visibleIds.has(selectedId)) {
      updateSelectedId("C01");
    }
  }, [controlledSelectedId, selectedId, visibleIds]);

  const selectedNode = nodesById[selectedId] ?? data.nodes[0];
  const neighbors = adjacency[selectedNode.node_id] ?? [];
  const selectedTransitions = data.transitions.filter(
    (transition) =>
      transition.from === selectedNode.node_id || transition.to === selectedNode.node_id,
  );

  useEffect(() => {
    onSelectNode?.(selectedNode);
  }, [onSelectNode, selectedNode]);

  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-[#08111f]/90 shadow-[0_30px_120px_rgba(0,0,0,0.45)] ${
        compact ? "overflow-hidden" : "overflow-hidden"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-[#8bb6ff]">
            <Orbit size={14} />
            Mystic Map
          </div>
          <h3 className="mt-2 text-lg font-black tracking-tight text-white">
            {data.node_count} Nodes / {data.transition_count} Transitions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!compact && (
            <button
              onClick={() => setShowLabels((current) => !current)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#c5d9ff] transition-colors hover:border-[#8bb6ff]/50 hover:text-white"
            >
              {showLabels ? "Hide Labels" : "Show Labels"}
            </button>
          )}
          <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#f7d76f]">
            Nexus Locked
          </span>
        </div>
      </div>

      <div className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_35%),linear-gradient(180deg,_#08111f_0%,_#050914_100%)]">
          {!compact && (
            <div className="flex flex-wrap gap-2 border-b border-white/10 px-6 py-4">
              {(["All", ...omegaDossier.guardianSummaries.map((entry) => entry.guardian)] as GuardianFilter[]).map(
                (guardian) => (
                  <button
                    key={guardian}
                    onClick={() => updateGuardianFilter(guardian)}
                    className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition-all ${
                      guardianFilter === guardian
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/10 bg-transparent text-[#8ba1c7] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {guardian}
                  </button>
                ),
              )}
            </div>
          )}

          <div className={compact ? "p-4" : "p-6"}>
            <svg
              viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
              className="aspect-square w-full"
              role="img"
              aria-label="Mystic Map lattice explorer"
            >
              <defs>
                <radialGradient id="mapAura" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.22)" />
                  <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="100" height="100" fill="transparent" />
              <circle cx="50" cy="50" r="42" fill="url(#mapAura)" />

              {visibleTransitions.map((transition) => {
                const from = nodesById[transition.from];
                const to = nodesById[transition.to];
                const active =
                  transition.from === selectedNode.node_id ||
                  transition.to === selectedNode.node_id;

                return (
                  <line
                    key={transition.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={active ? "#f7d76f" : "#2c4a76"}
                    strokeOpacity={active ? 0.58 : 0.82}
                    strokeWidth={active ? 0.42 : 0.16}
                  />
                );
              })}

              {visibleNodes.map((node) => {
                const selected = node.node_id === selectedNode.node_id;
                const dormant = isDormant(node);
                const radius =
                  node.type === "central" ? 1.5 : node.type === "cluster" ? 0.9 : 0.62;

                return (
                  <g
                    key={node.node_id}
                    onClick={() => updateSelectedId(node.node_id)}
                    style={{ cursor: "pointer" }}
                  >
                    {selected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius * 3.8}
                        fill={guardianPalette[node.guardian]}
                        fillOpacity="0.18"
                      />
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={selected ? "#f7d76f" : guardianPalette[node.guardian]}
                      fillOpacity={selected ? 1 : dormant ? 0.45 : 0.92}
                      stroke={selected ? "#ffffff" : "rgba(255,255,255,0.22)"}
                      strokeWidth={selected ? 0.26 : 0.08}
                    />

                    {showLabels && (
                      <>
                        <text
                          x={node.x}
                          y={node.y - radius * 2.1}
                          textAnchor="middle"
                          fill={selected ? "#ffffff" : "rgba(229,236,255,0.7)"}
                          fontSize={node.type === "central" ? "1.7" : "1.08"}
                          fontWeight={selected ? 700 : 500}
                        >
                          {node.node_id}
                        </text>
                        {(selected || labelWeight(node) > 1) && (
                          <text
                            x={node.x}
                            y={node.y + radius * 3}
                            textAnchor="middle"
                            fill="rgba(203,216,243,0.55)"
                            fontSize="0.9"
                          >
                            {node.label}
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {!compact && (
          <aside className="border-l border-white/10 bg-[linear-gradient(180deg,_rgba(4,9,20,0.98),_rgba(8,13,24,0.98))] p-6">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                  <Compass size={14} />
                  Selected Node
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: guardianPalette[selectedNode.guardian] }}
                  />
                  <div>
                    <div className="text-lg font-black tracking-tight text-white">
                      {selectedNode.node_id} - {selectedNode.label}
                    </div>
                    <div className="text-sm text-[#b4c8ef]">
                      {selectedNode.guardian} - {selectedNode.triad} - {selectedNode.hexagram}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#c6d4ee]">
                  {selectedNode.notes.replace("Dormant: false.", "").trim()}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <MetricPanel
                  icon={<Network size={14} />}
                  label="Neighbors"
                  value={neighbors.length.toString()}
                />
                <MetricPanel
                  icon={<Sparkles size={14} />}
                  label="Weight"
                  value={selectedNode.weight.toFixed(2)}
                />
                <MetricPanel
                  icon={<Radar size={14} />}
                  label="Node Type"
                  value={selectedNode.type}
                />
                <MetricPanel
                  icon={<Orbit size={14} />}
                  label="Transitions"
                  value={selectedTransitions.length.toString()}
                />
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] uppercase tracking-[0.3em] text-[#8bb6ff]">
                  Conditions
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...selectedNode.entry_conditions, ...selectedNode.exit_conditions].map((condition) => (
                    <span
                      key={condition}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#d9e4f8]"
                    >
                      {condition.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-[#9eb5db]">
                  {selectedNode.liveness_target}
                </p>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function MetricPanel({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#8bb6ff]">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-xl font-black uppercase tracking-tight text-white">
        {value}
      </div>
    </motion.div>
  );
}
