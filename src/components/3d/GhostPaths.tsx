/// <reference types="@react-three/fiber" />
import { Line } from "@react-three/drei";
import { getNodePosition } from "./latticeLayout";

interface GhostPathsProps {
  predictions: { from: number; to: number }[];
}

export function GhostPaths({ predictions }: GhostPathsProps) {
  return (
    <>
      {predictions.map((p, i) => {
        const fromPos = getNodePosition(p.from % 24, Math.floor(p.from / 24));
        const toPos = getNodePosition(p.to % 24, Math.floor(p.to / 24));
        
        return (
          <Line
            key={`ghost-${i}`}
            points={[fromPos, toPos]}
            color="#00ffff"
            lineWidth={2}
            transparent
            opacity={0.3}
            dashed
            dashScale={2}
            dashSize={0.5}
            dashOffset={0}
          />
        );
      })}
    </>
  );
}
