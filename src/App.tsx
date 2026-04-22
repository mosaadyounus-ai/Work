/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CodexProvider } from "./context/CodexContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OperatorConsole } from "./console";
import LatticePage from "./pages/LatticePage";
import HomePage from "./pages/HomePage";
import CodexPage from "./pages/CodexPage";

export default function App() {
  return (
    <CodexProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LatticePage />} />
          <Route path="/overview" element={<HomePage />} />
          <Route path="/console" element={<OperatorConsole />} />
          <Route path="/lattice" element={<LatticePage />} />
          <Route path="/codex" element={<CodexPage />} />
        </Routes>
      </BrowserRouter>
    </CodexProvider>
  );
}


