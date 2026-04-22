/// <reference types="@react-three/fiber" />
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  FrequencyNode,
  HARMONIC_SHELLS,
  getShellColor,
} from "../../lib/frequency-map";

interface LatticeNodesProps {
  nodes: FrequencyNode[];
  selectedId?: string;
  hueShift: number;
  speed: number;
  onSelect: (id: string) => void;
}

const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

export function LatticeNodes({
  nodes,
  selectedId,
  hueShift,
  speed,
  onSelect,
}: LatticeNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const shellColorLookup = useMemo(
    () =>
      new Map(
        HARMONIC_SHELLS.map((shell) => [shell.id, getShellColor(shell, hueShift)]),
      ),
    [hueShift],
  );

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    nodes.forEach((node, index) => {
      const selected = node.id === selectedId;
      const hovered = index === hoveredIndex;
      const pulse =
        Math.sin(state.clock.elapsedTime * (0.55 + speed * 0.8) + node.phase) *
        0.16 *
        node.amplitude;
      const scale =
        (selected ? 1.7 : hovered ? 1.4 : 1) *
        (0.55 + node.coherence * 0.72 + pulse);

      dummy.position.set(...node.position);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);

      tempColor.set(shellColorLookup.get(node.shellId) ?? "#ffffff");
      if (selected) {
        tempColor.lerp(new THREE.Color("#ffffff"), 0.45);
      } else if (hovered) {
        tempColor.lerp(new THREE.Color("#f7d76f"), 0.25);
      }
      meshRef.current.setColorAt(index, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const activeNode =
    (hoveredIndex !== null ? nodes[hoveredIndex] : undefined) ??
    nodes.find((node) => node.id === selectedId) ??
    null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onClick={(event) => {
          event.stopPropagation();
          if (event.instanceId !== undefined) {
            onSelect(nodes[event.instanceId].id);
          }
        }}
        onPointerOver={(event) => {
          if (event.instanceId !== undefined) {
            setHoveredIndex(event.instanceId);
          }
        }}
        onPointerOut={() => setHoveredIndex(null)}
      >
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          transparent
          opacity={0.92}
          toneMapped={false}
          emissive="#0a1527"
          emissiveIntensity={0.5}
        />
      </instancedMesh>

      {activeNode ? (
        <group position={activeNode.position}>
          <Html center distanceFactor={12} position={[0, 1.8, 0]}>
            <div className="pointer-events-none min-w-[190px] rounded-[18px] border border-[#00eaff33] bg-[#071120]/88 px-4 py-3 shadow-[0_0_30px_rgba(0,229,255,0.18)] backdrop-blur-md">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#77c9ff]">
                {activeNode.shellId}
              </div>
              <div className="mt-2 text-sm font-black tracking-[0.18em] text-white">
                {activeNode.id}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.18em] text-[#9eb5db]">
                <span>Hz</span>
                <span className="text-right font-mono text-white">
                  {activeNode.baseHz.toFixed(2)}
                </span>
                <span>Amp</span>
                <span className="text-right font-mono text-white">
                  {activeNode.amplitude.toFixed(2)}
                </span>
                <span>Coherence</span>
                <span className="text-right font-mono text-white">
                  {activeNode.coherence.toFixed(2)}
                </span>
                <span>State</span>
                <span className="text-right font-mono text-white">
                  {activeNode.state}
                </span>
              </div>
            </div>
          </Html>
        </group>
      ) : null}
    </group>
  );
}
