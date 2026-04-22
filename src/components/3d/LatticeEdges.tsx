/// <reference types="@react-three/fiber" />
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PathState } from "../../lib/types";
import { getNodePosition } from "./latticeLayout";

interface LatticeEdgesProps {
  paths: PathState[];
}

export function LatticeEdges({ paths }: LatticeEdgesProps) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const NODES_PER_QUADRANT = 250;
  
  const edges = useMemo(() => {
    const e: [number, number][] = [];
    for (let q = 0; q < 4; q++) {
      for (let i = 0; i < NODES_PER_QUADRANT - 5; i += 5) {
        e.push([q * NODES_PER_QUADRANT + i, q * NODES_PER_QUADRANT + i + 5]);
      }
      for (let i = 0; i < NODES_PER_QUADRANT - 20; i += 20) {
         e.push([q * NODES_PER_QUADRANT + i, q * NODES_PER_QUADRANT + i + 20]);
      }
    }
    e.push([0, NODES_PER_QUADRANT]);
    e.push([NODES_PER_QUADRANT, NODES_PER_QUADRANT * 2]);
    e.push([NODES_PER_QUADRANT * 2, NODES_PER_QUADRANT * 3]);
    e.push([NODES_PER_QUADRANT * 3, 0]);
    return e;
  }, []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(edges.length * 2 * 3);
    const col = new Float32Array(edges.length * 2 * 3);
    
    edges.forEach(([fromIdx, toIdx], i) => {
      const fromPos = getNodePosition(fromIdx % NODES_PER_QUADRANT, Math.floor(fromIdx / NODES_PER_QUADRANT));
      const toPos = getNodePosition(toIdx % NODES_PER_QUADRANT, Math.floor(toIdx / NODES_PER_QUADRANT));
      
      pos[i * 6 + 0] = fromPos[0];
      pos[i * 6 + 1] = fromPos[1];
      pos[i * 6 + 2] = fromPos[2];
      
      pos[i * 6 + 3] = toPos[0];
      pos[i * 6 + 4] = toPos[1];
      pos[i * 6 + 5] = toPos[2];
    });
    
    return [pos, col];
  }, [edges]);

  useFrame(() => {
    if (!lineRef.current) return;
    const colAttr = lineRef.current.geometry.attributes.color;
    
    edges.forEach(([fromIdx, toIdx], i) => {
      const fromPath = paths[fromIdx];
      const toPath = paths[toIdx];
      const isActive = fromPath?.value > 75 && toPath?.value > 75;
      
      const color = new THREE.Color(isActive ? "#00eaff" : "#1a3a45");
      const opacity = isActive ? 0.4 : 0.05;
      
      colAttr.setXYZ(i * 2 + 0, color.r * opacity, color.g * opacity, color.b * opacity);
      colAttr.setXYZ(i * 2 + 1, color.r * opacity, color.g * opacity, color.b * opacity);
    });
    
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}
