/// <reference types="@react-three/fiber" />
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { LatticeState, getShellColor, HARMONIC_SHELLS } from "../../lib/frequency-map";
import { InterferenceField } from "./InterferenceField";
import { LatticeEdges } from "./LatticeEdges";
import { LatticeNodes } from "./LatticeNodes";

interface LatticeSceneProps {
  latticeState: LatticeState;
  focusMode: "SCAN" | "FOCUS" | "SIMULATE";
  selectedNodeId?: string;
  onSelectNode: (id: string) => void;
  onInteractionChange?: (active: boolean) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

export default function LatticeScene({
  latticeState,
  focusMode,
  selectedNodeId,
  onSelectNode,
  onInteractionChange,
  onCanvasReady,
}: LatticeSceneProps) {
  const [interactionActive, setInteractionActive] = useState(false);
  const colors = useMemo(
    () => ({
      core: getShellColor(HARMONIC_SHELLS[0], latticeState.controls.hue),
      telemetry: getShellColor(HARMONIC_SHELLS[4], latticeState.controls.hue),
      threshold: getShellColor(HARMONIC_SHELLS[5], latticeState.controls.hue),
    }),
    [latticeState.controls.hue],
  );

  useEffect(() => {
    onInteractionChange?.(interactionActive);
  }, [interactionActive, onInteractionChange]);

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[34px] border border-white/10 bg-[#05070f] shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          onCanvasReady?.(gl.domElement);
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 6, 13]} fov={42} />

        <color attach="background" args={["#040810"]} />
        <fog attach="fog" args={["#040810", 10, 48]} />

        <ambientLight intensity={0.18} />
        <pointLight position={[4, 7, 6]} intensity={5.2} color={colors.core} />
        <pointLight position={[-8, 5, -6]} intensity={2.8} color={colors.telemetry} />
        <pointLight position={[0, -2, -10]} intensity={1.6} color={colors.threshold} />

        <Stars radius={80} depth={30} count={2200} factor={4} saturation={0} fade speed={0.5} />

        <group rotation={[0.16, 0.2, 0]}>
          <InterferenceField
            nodes={latticeState.nodes}
            speed={latticeState.controls.speed}
            radius={latticeState.summary.shellRadius * 2.45}
          />
          <LatticeEdges
            nodes={latticeState.nodes}
            edges={latticeState.edges}
            hueShift={latticeState.controls.hue}
            speed={latticeState.controls.speed}
          />
          <LatticeNodes
            nodes={latticeState.nodes}
            selectedId={selectedNodeId}
            hueShift={latticeState.controls.hue}
            speed={latticeState.controls.speed}
            onSelect={onSelectNode}
          />
        </group>

        <OrbitControls
          enablePan
          enableRotate
          enableZoom
          minDistance={6}
          maxDistance={26}
          autoRotate={
            latticeState.controls.autoRotate &&
            focusMode === "SCAN" &&
            !interactionActive
          }
          autoRotateSpeed={0.5}
          onStart={() => setInteractionActive(true)}
          onEnd={() => setInteractionActive(false)}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-6 top-6 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00eaff33] bg-[#071120]/76 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#77c9ff] backdrop-blur-xl">
          Harmonic lattice / 167.89 field
        </div>
        <div className="rounded-[18px] border border-white/10 bg-[#071120]/76 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-[#d7e2f8] backdrop-blur-xl">
          <div className="font-mono text-white">
            {latticeState.summary.coreHz.toFixed(2)} Hz
          </div>
          <div className="mt-1 text-[#8bb6ff]">
            {latticeState.summary.nodeCount} nodes / {focusMode.toLowerCase()} mode
          </div>
        </div>
      </div>
    </div>
  );
}
