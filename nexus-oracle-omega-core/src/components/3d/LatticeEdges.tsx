/// <reference types="@react-three/fiber" />
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  FrequencyNode,
  HARMONIC_SHELLS,
  LatticeEdge,
  getShellColor,
} from "../../lib/frequency-map";

interface LatticeEdgesProps {
  nodes: FrequencyNode[];
  edges: LatticeEdge[];
  hueShift: number;
  speed: number;
}

export function LatticeEdges({
  nodes,
  edges,
  hueShift,
  speed,
}: LatticeEdgesProps) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const channelColorLookup = useMemo(
    () =>
      new Map(
        HARMONIC_SHELLS.map((shell) => [shell.channel, getShellColor(shell, hueShift)]),
      ),
    [hueShift],
  );

  const [positions, colors] = useMemo(() => {
    const positionBuffer = new Float32Array(edges.length * 2 * 3);
    const colorBuffer = new Float32Array(edges.length * 2 * 3);

    edges.forEach((edge, edgeIndex) => {
      const fromNode = nodeLookup.get(edge.source);
      const toNode = nodeLookup.get(edge.target);
      if (!fromNode || !toNode) {
        return;
      }

      positionBuffer[edgeIndex * 6 + 0] = fromNode.position[0];
      positionBuffer[edgeIndex * 6 + 1] = fromNode.position[1];
      positionBuffer[edgeIndex * 6 + 2] = fromNode.position[2];
      positionBuffer[edgeIndex * 6 + 3] = toNode.position[0];
      positionBuffer[edgeIndex * 6 + 4] = toNode.position[1];
      positionBuffer[edgeIndex * 6 + 5] = toNode.position[2];
    });

    return [positionBuffer, colorBuffer];
  }, [edges, nodeLookup]);

  useFrame((state) => {
    if (!lineRef.current) {
      return;
    }

    const attribute = lineRef.current.geometry.attributes.color;
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * (0.28 + speed * 0.5)) * 0.2;

    edges.forEach((edge, index) => {
      const color = new THREE.Color(
        channelColorLookup.get(edge.channel) ?? "#00eaff",
      );
      const opacity = Math.max(0.08, edge.strength * 0.24 * pulse);
      attribute.setXYZ(index * 2, color.r * opacity, color.g * opacity, color.b * opacity);
      attribute.setXYZ(
        index * 2 + 1,
        color.r * opacity,
        color.g * opacity,
        color.b * opacity,
      );
    });

    attribute.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
