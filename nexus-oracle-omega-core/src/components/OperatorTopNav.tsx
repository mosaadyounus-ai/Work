import { Archive, Compass, LayoutDashboard, Orbit, ShieldCheck, TerminalSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Surface", to: "/", icon: Orbit },
  { label: "Oracle", to: "/oracle", icon: Compass },
  { label: "Console", to: "/console", icon: TerminalSquare },
  { label: "Lattice", to: "/lattice", icon: LayoutDashboard },
  { label: "Proof", to: "/proof", icon: ShieldCheck },
  { label: "Artifacts", to: "/artifacts", icon: Archive },
];

export function OperatorTopNav({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <header className="rounded-[30px] border border-white/10 bg-white/[0.03] px-5 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.36em] text-[#8bb6ff]">
            <Orbit size={13} />
            Nexus Oracle Omega Core
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#a9bfdc] md:text-base">
            {subtitle}
          </p>
        </div>

        {badge ? (
          <div className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f7d76f]">
            {badge}
          </div>
        ) : null}
      </div>

      <nav className="mt-5 flex flex-wrap gap-2">
        {tabs.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.24em] transition-all ${
                isActive
                  ? "border-[#8bb6ff]/40 bg-[#8bb6ff]/12 text-white"
                  : "border-white/10 bg-white/[0.02] text-[#a9bfdc] hover:border-[#8bb6ff]/30 hover:text-white"
              }`
            }
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
