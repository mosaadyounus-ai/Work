import { Cpu, ShieldCheck } from "lucide-react";
import { type AssignmentResult, type ModeState, type RTTSEvidence } from "../../lib/chorus-stack";

export function LatticeGovernancePanel({
  modeState,
  queueDepth,
  queueThreshold,
  contaminationSeverity,
  assignmentPreview,
  sapStatus,
  semanticLockOpen,
  terminalClosure,
  evidenceRows,
}: {
  modeState: ModeState;
  queueDepth: number;
  queueThreshold: number;
  contaminationSeverity: string;
  assignmentPreview: AssignmentResult;
  sapStatus: string;
  semanticLockOpen: boolean;
  terminalClosure: boolean;
  evidenceRows: RTTSEvidence[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f7d76f]">
          <Cpu size={13} />
          Governance Layer
        </div>
        <div className="mt-5 grid gap-4">
          <GovernanceBlock
            title="Control Kernel"
            accent={modeState.mode === "INVERTED" ? "#ff8c8c" : "#77c9ff"}
            lines={[
              `mode ${modeState.mode}`,
              `queue ${queueDepth}/${queueThreshold}`,
              contaminationSeverity,
            ]}
          />
          <GovernanceBlock
            title="Assignment Engine"
            accent="#f7d76f"
            lines={[
              assignmentPreview.strategy,
              assignmentPreview.frozen ? "demotions frozen" : "ranking live",
              `${assignmentPreview.assignments.length} slots planned`,
            ]}
          />
          <GovernanceBlock
            title="Semantic Lock"
            accent={semanticLockOpen ? "#8ae6b0" : "#ff8c8c"}
            lines={[
              sapStatus,
              semanticLockOpen ? "committed" : "blocked",
              terminalClosure ? "terminal closure" : "open",
            ]}
          />
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
              Assignment Slots
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#d7e2f8]">
              {assignmentPreview.assignments.map((assignment) => (
                <div key={assignment.slot} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[#f7d76f]">#{assignment.slot}</span>
                  <span className="flex-1 truncate">{assignment.arbiterId}</span>
                  <span className="text-[#7f93b3]">{assignment.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f7d76f]">
          <ShieldCheck size={13} />
          Evidence Banding
        </div>
        <div className="mt-5 space-y-3">
          {evidenceRows.map((row) => (
            <div
              key={row.arbiterId}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[#8bb6ff]">
                    {row.arbiterId}
                  </div>
                  <div className="mt-1 text-sm text-white">
                    quality {row.qualityScore.toFixed(2)} / service {row.serviceScore.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-[#7f93b3]">
                    {row.signalState}
                  </div>
                  <div className="mt-1 text-lg font-black tracking-tight text-white">
                    {row.band}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GovernanceBlock({
  title,
  accent,
  lines,
}: {
  title: string;
  accent: string;
  lines: string[];
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: accent }}>
        {title}
      </div>
      <div className="mt-3 space-y-2 text-sm uppercase tracking-[0.18em] text-[#d7e2f8]">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}
