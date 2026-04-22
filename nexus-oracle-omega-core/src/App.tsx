import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Orbit } from "lucide-react";
import { CodexProvider } from "./context/CodexContext";

const OperatorConsole = lazy(() =>
  import("./console").then((module) => ({ default: module.OperatorConsole })),
);
const CodexArchivePage = lazy(() => import("./pages/CodexArchivePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const LatticePage = lazy(() => import("./pages/LatticePage"));
const OracleWorkbenchPage = lazy(() => import("./pages/OracleWorkbenchPage"));
const ProofPage = lazy(() => import("./pages/ProofPage"));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] text-white">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.34em] text-[#8bb6ff]">
          <Orbit size={14} className="animate-spin" />
          Omega Core
        </div>
        <div className="mt-3 text-lg font-black tracking-tight text-white">
          Loading operator surface
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CodexProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/oracle" element={<OracleWorkbenchPage />} />
            <Route path="/console" element={<OperatorConsole />} />
            <Route path="/proof" element={<ProofPage />} />
            <Route path="/artifacts" element={<CodexArchivePage />} />
            <Route path="/codex" element={<CodexArchivePage />} />
            <Route path="/lattice" element={<LatticePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CodexProvider>
  );
}
