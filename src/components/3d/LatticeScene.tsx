/// <reference types="@react-three/fiber" />
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera, Center, Float } from "@react-three/drei";
import { LatticeNodes } from "./LatticeNodes";
import { LatticeEdges } from "./LatticeEdges";
import { GhostPaths } from "./GhostPaths";
import { OperatorState, PathState } from "../../lib/types";
import { useMemo } from "react";

interface LatticeSceneProps {
  state: {
    telemetry: {
      pathMap: {
        north: PathState[];
        east: PathState[];
        south: PathState[];
        west: PathState[];
      };
    };
    ui: {
      selectedSignalId?: string;
      focusMode: "SCAN" | "FOCUS" | "SIMULATE";
      targetId?: string;
    };
  };
  onSelectNode: (id: string) => void;
}

import { OmegaSeal } from "./OmegaSeal";

export default function LatticeScene({ state, onSelectNode }: LatticeSceneProps) {
  // Flatten path map into a single list of 96 paths for the visualizer
  const allPaths = useMemo(() => {
    const p = state.telemetry.pathMap;
    return [...p.north, ...p.east, ...p.south, ...p.west];
  }, [state.telemetry.pathMap]);

  // Mock predictions for visualization (Simulate Mode)
  const predictions = useMemo(() => {
    return [
      { from: 10, to: 35 },
      { from: 35, to: 60 },
      { from: 60, to: 82 },
    ];
  }, []);

  return (
    <div className="w-full h-full bg-[#05070a] relative">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[52, 30, 52]} fov={46} />
        
        <color attach="background" args={["#02050a"]} />
        <fog attach="fog" args={["#02050a", 36, 170]} />
        
        <ambientLight intensity={0.22} />
        <pointLight position={[30, 60, 30]} intensity={2.6} color="#33e7ff" />
        <pointLight position={[-30, -30, -30]} intensity={1.8} color="#18ff9c" />
        <spotLight position={[0, 100, 0]} intensity={2} angle={0.3} penumbra={1} color="#ffffff" castShadow />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Center>
            <group>
              <LatticeNodes 
                paths={allPaths} 
                selectedId={state.ui.selectedSignalId} 
                targetId={state.ui.targetId}
                onSelect={onSelectNode} 
              />
              <LatticeEdges paths={allPaths} />
              
              {state.ui.focusMode === "SIMULATE" && <GhostPaths predictions={predictions} />}
              
              <OmegaSeal />
            </group>
          </Center>
        </Float>

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true} 
          maxDistance={150}
          minDistance={10}
          autoRotate={state.ui.focusMode === "SCAN"}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* 3D Overlay HUD */}
      <div className="absolute top-6 left-6 pointer-events-none space-y-3">
        <h3 className="text-[10px] uppercase tracking-[0.4em] text-[#33e7ff] font-black opacity-80">Chorus_Field</h3>
        <div className="flex items-center gap-4 glass-panel chorus-panel px-3 py-2 glow-border">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#33e7ff] animate-pulse status-dot" />
             <span className="text-[9px] text-white font-mono uppercase tracking-widest">{state.ui.focusMode} VIEW</span>
           </div>
           <div className="w-[1px] h-3 bg-[#1a3a45]" />
           <span className="text-[9px] text-[#8899a6] font-mono">VOICES: {allPaths.length} / ACT: {allPaths.filter(p => p.value > 72).length}</span>
        </div>
      </div>
    </div>
  );
}
