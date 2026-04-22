import { useMemo, useState } from "react";
import {
  FacetBoundaryLine,
  FacetGeometryCell,
  OracleControls,
  OracleEvaluation,
  createFacetBoundaryLines,
  createFacetGeometryCells,
} from "../lib/hybridWorkbench";

const width = 520;
const height = 340;
const padding = { top: 24, right: 20, bottom: 40, left: 46 };
const palette = ["#60a5fa", "#d4af37", "#8b5cf6", "#34d399", "#f87171"];

function scaleX(value: number) {
  const innerWidth = width - padding.left - padding.right;
  return padding.left + (value / 0.5) * innerWidth;
}

function scaleY(value: number) {
  const innerHeight = height - padding.top - padding.bottom;
  return height - padding.bottom - (value / 0.5) * innerHeight;
}

function buildFacetPalette(cells: FacetGeometryCell[], activeFacet: string) {
  const facetIds = Array.from(
    new Set([...cells.map((cell) => cell.facet), activeFacet].filter((facet) => facet.length > 0)),
  );

  return Object.fromEntries(
    facetIds.map((facetId, index) => [facetId, `${palette[index % palette.length]}AA`]),
  ) as Record<string, string>;
}

function strokeColorForFacet(facetId: string, colors: Record<string, string>) {
  const color = colors[facetId] ?? "#ffffff";
  return color.replace("AA", "");
}

export function FacetRegionMap({
  controls,
  evaluation,
}: {
  controls: OracleControls;
  evaluation: OracleEvaluation;
}) {
  const [hoveredCell, setHoveredCell] = useState<FacetGeometryCell | null>(null);
  const cells = useMemo(() => createFacetGeometryCells(controls, 15), [controls]);
  const boundaries = useMemo(() => createFacetBoundaryLines(controls, 36), [controls]);
  const colors = useMemo(() => buildFacetPalette(cells, evaluation.facet), [cells, evaluation.facet]);
  const cellWidth = (width - padding.left - padding.right) / 16;
  const cellHeight = (height - padding.top - padding.bottom) / 16;
  const legendFacets = Array.from(new Set(cells.map((cell) => cell.facet)));

  return (
    <div>
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#07111f]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
          <rect x="0" y="0" width={width} height={height} fill="#07111f" />

          {Array.from({ length: 6 }, (_, index) => {
            const tick = index * 0.1;
            return (
              <g key={tick}>
                <line
                  x1={scaleX(tick)}
                  y1={padding.top}
                  x2={scaleX(tick)}
                  y2={height - padding.bottom}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 4"
                />
                <line
                  x1={padding.left}
                  y1={scaleY(tick)}
                  x2={width - padding.right}
                  y2={scaleY(tick)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 4"
                />
                <text
                  x={scaleX(tick)}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9eb5db"
                >
                  {tick.toFixed(1)}
                </text>
                <text
                  x={18}
                  y={scaleY(tick) + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9eb5db"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {cells.map((cell) => (
            <rect
              key={`${cell.c_phi}-${cell.c_r}`}
              x={scaleX(cell.c_phi) - cellWidth / 2}
              y={scaleY(cell.c_r) - cellHeight / 2}
              width={cellWidth}
              height={cellHeight}
              fill={colors[cell.facet] ?? "rgba(255,255,255,0.45)"}
              opacity={
                hoveredCell?.c_phi === cell.c_phi && hoveredCell?.c_r === cell.c_r ? 0.95 : 0.6
              }
              stroke="rgba(255,255,255,0.04)"
              onMouseEnter={() => setHoveredCell(cell)}
            />
          ))}

          {boundaries.map((boundary, index) => (
            <polyline
              key={boundary.edge_id}
              points={boundary.points.map((point) => `${scaleX(point.c_phi)},${scaleY(point.c_r)}`).join(" ")}
              fill="none"
              stroke={palette[index % palette.length]}
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity={0.9}
            />
          ))}

          <circle
            cx={scaleX(controls.c_phi)}
            cy={scaleY(controls.c_r)}
            r="6.5"
            fill="#ffffff"
            stroke={strokeColorForFacet(evaluation.facet, colors)}
            strokeWidth="3"
          />

          <text
            x={width / 2}
            y={16}
            textAnchor="middle"
            fontSize="11"
            fill="#dce7fb"
            letterSpacing="0.24em"
          >
            WINNER-REGION MAP
          </text>
          <text
            x={width / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="11"
            fill="#9eb5db"
            letterSpacing="0.22em"
          >
            C_phi
          </text>
          <text
            x={16}
            y={height / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#9eb5db"
            transform={`rotate(-90 16 ${height / 2})`}
            letterSpacing="0.22em"
          >
            C_r
          </text>
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {legendFacets.slice(0, 2).map((facet) => (
          <LegendSwatch
            key={facet}
            label={`Facet ${facet} region`}
            color={strokeColorForFacet(facet, colors)}
            note={facet === evaluation.facet ? "current winning support" : "projected support region"}
          />
        ))}
        <LegendSwatch
          label="Current point"
          color="#ffffff"
          note={`${controls.c_phi.toFixed(2)}, ${controls.c_r.toFixed(2)}${controls.surfaceMode === "advanced-3d" ? `, C_s=${controls.c_s.toFixed(2)}` : ""}`}
        />
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-[#b7cae7]">
        {hoveredCell ? (
          <>
            Hovered point: <span className="font-mono text-white">C_phi={hoveredCell.c_phi.toFixed(2)}</span>{" "}
            / <span className="font-mono text-white">C_r={hoveredCell.c_r.toFixed(2)}</span>. Active facet{" "}
            <span className="font-semibold text-white">{hoveredCell.facet}</span> with{" "}
            <span className="font-mono text-white">M_min={hoveredCell.m_min.toFixed(2)}</span>.
          </>
        ) : (
          <>
            {controls.surfaceMode === "advanced-3d"
              ? "The dashed lines are projected pairwise boundaries at the current C_s slice. The white marker shows the live coefficient point inside that 2D projection."
              : "The dashed line is the verified kink boundary where both support planes tie. The white marker is the live coefficient point driving the current Oracle evaluation."}
          </>
        )}
      </div>

      {controls.surfaceMode === "advanced-3d" && boundaries.length > 0 ? (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-[#9fb7d7]">
          {boundaries.map((boundary: FacetBoundaryLine) => (
            <div key={boundary.edge_id}>
              {boundary.edge_id}: <span className="font-mono text-white">{boundary.formula}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LegendSwatch({
  label,
  color,
  note,
}: {
  label: string;
  color: string;
  note: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#dce7fb]">{label}</span>
      </div>
      <div className="mt-2 text-sm leading-6 text-[#95afcf]">{note}</div>
    </div>
  );
}
