import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Archive, Database, FileStack, Search, ShieldCheck } from "lucide-react";
import { OperatorTopNav } from "../components/OperatorTopNav";
import { operatorArtifacts } from "../data/operatorArtifacts";
import { omegaDossier } from "../data/omegaDossier";

type FilterValue = "All" | string;

export default function CodexArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const deferredQuery = useDeferredValue(query);

  const facetFilter: FilterValue = searchParams.get("facet") ?? "All";
  const invariantFilter: FilterValue = searchParams.get("invariant") ?? "All";
  const modeFilter: FilterValue = searchParams.get("mode") ?? "All";
  const runFilter: FilterValue = searchParams.get("run") ?? "All";

  const filterOptions = useMemo(() => {
    const facets = new Set<string>();
    const invariants = new Set<string>();
    const modes = new Set<string>();
    const runs = new Set<string>();

    operatorArtifacts.forEach((artifact) => {
      artifact.associatedFacets.forEach((facet) => facets.add(facet));
      artifact.associatedInvariants.forEach((invariant) => invariants.add(invariant));
      artifact.associatedModes.forEach((mode) => modes.add(mode));
      if (artifact.run) {
        runs.add(artifact.run);
      }
    });

    return {
      facets: ["All", ...Array.from(facets.values()).sort()],
      invariants: ["All", ...Array.from(invariants.values()).sort()],
      modes: ["All", ...Array.from(modes.values()).sort()],
      runs: ["All", ...Array.from(runs.values()).sort()],
    };
  }, []);

  const filteredArtifacts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return operatorArtifacts.filter((artifact) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        artifact.title.toLowerCase().includes(normalizedQuery) ||
        artifact.summary.toLowerCase().includes(normalizedQuery) ||
        artifact.origin.toLowerCase().includes(normalizedQuery) ||
        artifact.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchesFacet =
        facetFilter === "All" || artifact.associatedFacets.includes(facetFilter);
      const matchesInvariant =
        invariantFilter === "All" || artifact.associatedInvariants.includes(invariantFilter);
      const matchesMode =
        modeFilter === "All" || artifact.associatedModes.some((mode) => mode === modeFilter);
      const matchesRun = runFilter === "All" || artifact.run === runFilter;

      return matchesQuery && matchesFacet && matchesInvariant && matchesMode && matchesRun;
    });
  }, [deferredQuery, facetFilter, invariantFilter, modeFilter, runFilter]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "All") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_0%,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,_rgba(8,16,30,0.95),_rgba(5,9,20,1))]" />

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 pb-10 pt-6 md:px-6">
        <OperatorTopNav
          title="Artifacts Vault"
          subtitle="Search the dossier by mode, invariant, facet, or run and keep the intro material available as context rather than a blocker in front of the operator surface."
          badge={`${filteredArtifacts.length} artifacts visible`}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.36fr_0.64fr]">
          <div className="space-y-6">
            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Archive size={13} />
                Dossier Intro
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                {omegaDossier.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#dbe7fb]">{omegaDossier.subtitle}</p>
              <p className="mt-4 text-sm leading-6 text-[#b8cae6]">{omegaDossier.narrative}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {omegaDossier.headlineMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                      {metric.label}
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">
                      {metric.value}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#b8cae6]">{metric.note}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <Database size={13} />
                Vault Filters
              </div>

              <label className="mt-4 flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <Search size={14} className="text-[#8bb6ff]" />
                <input
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setQuery(nextValue);
                    updateFilter("q", nextValue);
                  }}
                  placeholder="Search title, tags, origin..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#7f97b8]"
                />
              </label>

              <div className="mt-4 space-y-4">
                <FilterGroup
                  label="Facet"
                  value={facetFilter}
                  options={filterOptions.facets}
                  onChange={(value) => updateFilter("facet", value)}
                />
                <FilterGroup
                  label="Invariant"
                  value={invariantFilter}
                  options={filterOptions.invariants}
                  onChange={(value) => updateFilter("invariant", value)}
                />
                <FilterGroup
                  label="Mode"
                  value={modeFilter}
                  options={filterOptions.modes}
                  onChange={(value) => updateFilter("mode", value)}
                />
                <FilterGroup
                  label="Run"
                  value={runFilter}
                  options={filterOptions.runs}
                  onChange={(value) => updateFilter("run", value)}
                />
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <ShieldCheck size={13} />
                Quick Jumps
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/oracle"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#dce7fb]"
                >
                  Back to Oracle
                </Link>
                <Link
                  to="/proof"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#dce7fb]"
                >
                  Open Proof Grid
                </Link>
                <Link
                  to="/lattice"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#dce7fb]"
                >
                  Open Lattice
                </Link>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                    Artifact Results
                  </div>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Search by mode, invariant, facet, or run
                  </h3>
                </div>
                <div className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#f7d76f]">
                  {filteredArtifacts.length} matches
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {filteredArtifacts.map((artifact) => (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-[#8bb6ff]">
                          {artifact.type}
                        </div>
                        <div className="mt-2 text-xl font-black tracking-tight text-white">
                          {artifact.title}
                        </div>
                      </div>
                      {artifact.run ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]">
                          {artifact.run}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#b8cae6]">{artifact.summary}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8bb6ff]">
                      Origin: {artifact.origin}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {artifact.associatedFacets.map((facet) => (
                        <Chip key={`${artifact.id}-facet-${facet}`}>{`Facet ${facet}`}</Chip>
                      ))}
                      {artifact.associatedInvariants.slice(0, 2).map((invariant) => (
                        <Chip key={`${artifact.id}-inv-${invariant}`}>{invariant}</Chip>
                      ))}
                      {artifact.associatedModes.slice(0, 2).map((mode) => (
                        <Chip key={`${artifact.id}-mode-${mode}`}>{mode}</Chip>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredArtifacts.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-6 text-[#b8cae6]">
                  No artifacts match the current filter combination. Clear one of the active filters to widen
                  the vault view.
                </div>
              ) : null}
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#8bb6ff]">
                <FileStack size={13} />
                Supporting Context
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {omegaDossier.dossierCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-lg font-black tracking-tight text-white">{card.title}</div>
                    <p className="mt-3 text-sm leading-6 text-[#b8cae6]">{card.excerpt}</p>
                    <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8bb6ff]">
                      {card.source}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:p-6"
    >
      {children}
    </motion.div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-colors ${
              value === option
                ? "border-[#8bb6ff]/40 bg-[#8bb6ff]/12 text-white"
                : "border-white/10 bg-white/[0.03] text-[#b8cae6] hover:border-[#8bb6ff]/30"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dce7fb]">
      {children}
    </span>
  );
}
