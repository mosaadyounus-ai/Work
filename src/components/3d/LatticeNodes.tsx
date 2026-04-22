/// <reference types="@react-three/fiber" />
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PathState } from "../../lib/types";
import { getNodePosition } from "./latticeLayout";

interface LatticeNodesProps {
  paths: PathState[];
  selectedId?: string;
  targetId?: string;
  onSelect: (id: string) => void;
}

const colorTemp = new THREE.Color();
const dummy = new THREE.Object3D();

export function LatticeNodes({ paths, selectedId, targetId, onSelect }: LatticeNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredIdx, setHovered] = useState<number | null>(null);
  
  const NODES_PER_QUADRANT = 250;
  
  // Static positions generated once
  const positions = useMemo(() => {
    return paths.map((_, i) => getNodePosition(i % NODES_PER_QUADRANT, Math.floor(i / NODES_PER_QUADRANT)));
  }, [paths.length]);

  const getColor = (path: PathState, isSelected: boolean, isTarget: boolean) => {
    if (isSelected) return "#ffffff";
    if (isTarget) return "#33e7ff";
    const e = path.value / 100;
    if (e > 0.88) return "#42f4ff";
    if (e > 0.62) return "#18ff9c";
    if (e > 0.34) return "#92d72c";
    if (e > 0.16) return "#436e2e";
    return "#14313c";
  };

  useFrame((state) => {
    if (!meshRef.current) return;

    paths.forEach((path, i) => {
      const pos = positions[i];
      const isSelected = selectedId === path.id;
      const isTarget = targetId === path.id;
      const isHovered = hoveredIdx === i;
      
      const activeState = isSelected || isTarget;
      const baseScale = activeState ? 2.5 : 1.0;
      const energyPulseSpeed = (path.value / 100) * 5 + 1;
      const pulse = Math.sin(state.clock.elapsedTime * energyPulseSpeed + i) * (path.value / 400);
      
      const scale = baseScale + pulse + (isHovered ? 0.5 : 0);
      
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.setScalar(scale * (0.4 + (path.importance || 0) * 0.4));
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      colorTemp.set(getColor(path, isSelected, isTarget));
      meshRef.current.setColorAt(i, colorTemp);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const hoveredPath = hoveredIdx !== null ? paths[hoveredIdx] : null;
  const selectedPath = paths.find(p => p.id === selectedId);
  const activeLabelPath = hoveredPath || selectedPath;
  const activeLabelPos = activeLabelPath ? positions[paths.indexOf(activeLabelPath)] : null;

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, paths.length]} 
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onSelect(paths[e.instanceId].id);
        }}
        onPointerOver={(e) => {
          if (e.instanceId !== undefined) setHovered(e.instanceId);
        }}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshBasicMaterial 
          transparent 
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {activeLabelPath && activeLabelPos && (
        <group position={activeLabelPos}>
          <Html distanceFactor={15} center position={[0, 2, 0]}>
            <div className="glass-panel chorus-panel p-3 border border-[#33e7ff33] rounded-xs pointer-events-none whitespace-nowrap shadow-[0_0_25px_rgba(0,234,255,0.2)]">
              <div className="text-[10px] text-[#33e7ff] font-black uppercase tracking-[0.2em]">{activeLabelPath.id}</div>
              <div className="flex gap-3 mt-2 border-t border-[#1a3a45] pt-2">
                <div className="flex flex-col">
                  <span className="text-[7px] text-[#8899a6] uppercase font-bold">Tone</span>
                  <span className="text-[9px] text-[#18ff9c] font-mono">{(activeLabelPath.value/100).toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-[#8899a6] uppercase font-bold">Drift</span>
                  <span className="text-[9px] text-[#ffcb4c] font-mono">{activeLabelPath.momentum.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
