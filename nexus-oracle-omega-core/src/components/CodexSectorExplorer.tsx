import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search, Shield, Sparkles } from "lucide-react";
import {
  CodexGuardianFilter,
  CodexGuardianName,
  codexGuardianSectors,
  codexHexagrams,
  codexPolarityTotals,
  latticeDecisionLoop,
} from "../data/latticeCodex";

function LatticeRadialMap({
  selectedGuardian,
  onSelectGuardian,
}: {
  selectedGuardian: CodexGuardianFilter;
  onSelectGuardian: (guardian: CodexGuardianFilter) => void;
}) {
  const cx = 200;
  const cy = 200;
  const outerRadius = 156;
  const innerRadius = 86;

  return (
    <svg viewBox="0 0 400 400" className="aspect-square w-full" role="img" aria-label="Lattice radial codex map">
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill="none"
        stroke="rgba(0,229,255,0.15)"
        strokeWidth="1"
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        fill="none"
        stroke="rgba(0,229,255,0.08)"
        strokeWidth="1"
      />
      <circle
        cx={cx}
        cy={cy}
        r={120}
        fill="none"
        stroke="rgba(0,229,255,0.05)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />

      {Array.from({ length: 96 }, (_, index) => {
        const angle = (index / 96) * 2 * Math.PI - Math.PI / 2;
        const radius = outerRadius - 8;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const guardianIndex = Math.floor((index / 96) * codexGuardianSectors.length);
        const guardian = codexGuardianSectors[Math.min(guardianIndex, codexGuardianSectors.length - 1)];

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={2}
            fill={guardian.color}
            opacity={selectedGuardian === "All" || selectedGuardian === guardian.guardian ? 0.72 : 0.28}
          />
        );
      })}

      {codexGuardianSectors.map((sector, index) => {
        const startAngle = (index / codexGuardianSectors.length) * 2 * Math.PI - Math.PI / 2;
        const endAngle =
          ((index + 1) / codexGuardianSectors.length) * 2 * Math.PI - Math.PI / 2;
        const midAngle = (startAngle + endAngle) / 2;
        const x = cx + (innerRadius + (outerRadius - innerRadius) / 2) * Math.cos(midAngle);
        const y = cy + (innerRadius + (outerRadius - innerRadius) / 2) * Math.sin(midAngle);
        const selected = selectedGuardian === sector.guardian;

        return (
          <g
            key={sector.guardian}
            onClick={() =>
              onSelectGuardian(selected ? "All" : sector.guardian)
            }
            style={{ cursor: "pointer" }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx + outerRadius * Math.cos(startAngle)}
              y2={cy + outerRadius * Math.sin(startAngle)}
              stroke={selected ? sector.color : "rgba(255,255,255,0.08)"}
              strokeWidth={selected ? 1.8 : 0.7}
            />
            <circle
              cx={x}
              cy={y}
              r={selected ? 16 : 12}
              fill={selected ? `${sector.color}33` : `${sector.color}14`}
              stroke={sector.color}
              strokeWidth={selected ? 1.6 : 1}
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill={sector.color}
              fontFamily="monospace"
            >
              {sector.guardian.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}

      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill="rgba(212,175,55,0.08)"
        stroke="rgba(212,175,55,0.35)"
        strokeWidth="1"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="rgba(247,215,111,0.85)"
        fontFamily="monospace"
      >
        INF
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize="7"
        fill="rgba(0,229,255,0.45)"
        fontFamily="monospace"
      >
        96 PATHS
      </text>
    </svg>
  );
}

function GuardianCard({
  sector,
  selected,
  onClick,
}: {
  sector: (typeof codexGuardianSectors)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="rounded-[22px] border px-4 py-4 text-left transition-all"
      style={{
        borderColor: selected ? `${sector.color}aa` : `${sector.color}33`,
        background: selected ? `${sector.color}18` : "rgba(10, 15, 26, 0.64)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="text-[9px] tracking-[0.35em] uppercase opacity-70"
            style={{ color: sector.color }}
          >
            {sector.title}
          </div>
          <div className="mt-1 text-lg font-black tracking-tight text-white">
            {sector.guardian}
          </div>
        </div>
        <div className="text-right text-[10px]">
          <div className="font-mono text-white">{sector.pathCount} paths</div>
          <div className="text-[#77a6da]">{sector.center}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[10px] tracking-wide">
        <span className="text-[#f7d76f]">A+ {sector.angelu}</span>
        <span className="text-[#ff8c8c]">D- {sector.deminu}</span>
        <span className="text-[#77c9ff]">N {sector.neutral}</span>
        <span
          className="ml-auto font-mono"
          style={{ color: sector.net >= 0 ? "#6bcb77" : "#ff8c8c" }}
        >
          NET {sector.net > 0 ? `+${sector.net}` : sector.net}
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#121b2a]">
        <div className="flex h-full">
          <div
            style={{
              width: `${(sector.angelu / sector.pathCount) * 100}%`,
              background: "#f7d76f",
            }}
          />
          <div
            style={{
              width: `${(sector.neutral / sector.pathCount) * 100}%`,
              background: "rgba(0,229,255,0.38)",
            }}
          />
          <div
            style={{
              width: `${(sector.deminu / sector.pathCount) * 100}%`,
              background: "#ff8c8c",
            }}
          />
        </div>
      </div>
    </motion.button>
  );
}

export function CodexSectorExplorer({
  selectedGuardian,
  onSelectGuardian,
}: {
  selectedGuardian: CodexGuardianFilter;
  onSelectGuardian: (guardian: CodexGuardianFilter) => void;
}) {
  const [search, setSearch] = useState("");

  const activeGuardian =
    selectedGuardian === "All"
      ? null
      : codexGuardianSectors.find((sector) => sector.guardian === selectedGuardian) ?? null;

  const filteredHexagrams = useMemo(() => {
    return codexHexagrams.filter((hexagram) => {
      const guardianMatch =
        selectedGuardian === "All" || hexagram.guardian === selectedGuardian;
      const searchTarget = `${hexagram.code} ${hexagram.guardian} ${hexagram.pathList.join(" ")}`;
      const searchMatch =
        search.trim().length === 0 ||
        searchTarget.toLowerCase().includes(search.trim().toLowerCase());

      return guardianMatch && searchMatch;
    });
  }, [search, selectedGuardian]);

  return (
    <div className="overflow-hidden rounded-[34px] border border-[#d4af37]/18 bg-[linear-gradient(180deg,rgba(7,10,18,0.96),rgba(5,9,20,0.98))] shadow-[0_32px_120px_rgba(0,0,0,0.48)]">
      <div className="border-b border-[#d4af37]/12 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02))] px-6 py-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.36em] text-[#f7d76f]">
          <Shield size={14} />
          Sovereign Lattice Codex
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Radial sectors, guardian filters, and 16 hexagram bands
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9eb5db]">
              This overlay is inspired by the codex-style lattice framing you shared. It
              complements the actual Mystic Map by giving the route a symbolic sector view,
              guardian polarity balance, and a searchable hexagram layer.
            </p>
          </div>
          <div className="rounded-full border border-[#00e5ff]/18 bg-[#00e5ff]/8 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#a5eeff]">
            Infinity core held by Ouroboros
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 2xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[#00e5ff]/14 bg-[#08111f]/90 p-5">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#77c9ff]">
              360 Deg Radial Map
            </div>
            <div className="mt-4">
              <LatticeRadialMap
                selectedGuardian={selectedGuardian}
                onSelectGuardian={onSelectGuardian}
              />
            </div>
            <div className="mt-4 border-t border-white/8 pt-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">
                {activeGuardian ? `${activeGuardian.guardian} / ${activeGuardian.title}` : "All guardians"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[#9eb5db]">
                {activeGuardian
                  ? `${activeGuardian.range} - ${activeGuardian.pathCount} paths distributed across ${activeGuardian.hexagramCount} codex sectors.`
                  : "Select a guardian to synchronize the sector explorer with the actual Mystic Map and narrow the visible hexagram bands."}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d4af37]/14 bg-[#0a0f18]/88 p-5">
            <div className="text-[10px] uppercase tracking-[0.34em] text-[#f7d76f]">
              Polarity Totals
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PolarityStat label="Total Paths" value={codexPolarityTotals.pathCount.toString()} color="#a5eeff" />
              <PolarityStat label="Angelu" value={codexPolarityTotals.angelu.toString()} color="#f7d76f" />
              <PolarityStat label="Deminu" value={codexPolarityTotals.deminu.toString()} color="#ff8c8c" />
              <PolarityStat label="Neutral" value={codexPolarityTotals.neutral.toString()} color="#77c9ff" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.34em] text-[#f7d76f]">
              <Filter size={13} />
              Five Guardians
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {codexGuardianSectors.map((sector) => (
                <GuardianCard
                  key={sector.guardian}
                  sector={sector}
                  selected={selectedGuardian === sector.guardian}
                  onClick={() =>
                    onSelectGuardian(
                      selectedGuardian === sector.guardian ? "All" : sector.guardian,
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d4af37]/14 bg-[#0a0f18]/88 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.34em] text-[#f7d76f]">
                Hexagram Bands - {filteredHexagrams.length} of {codexHexagrams.length}
              </div>
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                <Search size={12} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search paths or hex"
                  className="w-44 bg-transparent text-[#d7e2f8] outline-none placeholder:text-[#6f87ad]"
                />
              </label>
            </div>

            <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredHexagrams.map((hexagram) => {
                const sector = codexGuardianSectors.find(
                  (entry) => entry.guardian === hexagram.guardian,
                );
                const color = sector?.color ?? "#f7d76f";

                return (
                  <motion.div
                    key={hexagram.code}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[18px] border bg-[#08111f]/75 px-4 py-3"
                    style={{ borderColor: `${color}4d` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color }}>
                          Hex {hexagram.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#6f87ad]">
                          {hexagram.span}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: `${color}cc` }}>
                          {hexagram.guardian}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] uppercase tracking-[0.2em]">
                        <span className="text-[#f7d76f]">A+ {hexagram.angelu}</span>
                        <span className="text-[#ff8c8c]">D- {hexagram.deminu}</span>
                        <span className="text-[#77c9ff]">N {hexagram.neutral}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#c6d4ee]">
                      {hexagram.pathList.join(", ")}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: `${color}b0` }}>
                      {hexagram.polarity}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d4af37]/14 bg-[#0a0f18]/88 p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.34em] text-[#f7d76f]">
              <Sparkles size={12} />
              Guardian Decision Loop
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {latticeDecisionLoop.map((phase, index) => (
                <div key={phase} className="flex items-center gap-2">
                  <div className="rounded-full border border-[#d4af37]/26 bg-[#d4af37]/8 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-[#dfe8f8]">
                    {index + 1}. {phase}
                  </div>
                  {index < latticeDecisionLoop.length - 1 && (
                    <div className="h-px w-5 bg-[#d4af37]/20" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#9eb5db]">
              Suggested loop: threshold crossing, weighted convergence, then seal. It is
              meant as an interpretive operator frame layered on top of the verified map,
              not a replacement for the canonical node registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolarityStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[#08111f]/75 px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#6f87ad]">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
