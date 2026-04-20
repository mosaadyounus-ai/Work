/**
 * Lattice Page
 *
 * 3D Lattice visualization and operator controls
 */

import React, { useRef, useEffect } from 'react';
import { useCodex } from '../context/CodexContext';

const LatticePage: React.FC = () => {
  const { state, isConnected, error, injectSignal } = useCodex();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple 3D lattice renderer (placeholder)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple lattice drawing
    const drawLattice = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;

      const spacing = 50;
      for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw current plate
      if (state) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px monospace';
        ctx.fillText(`Plate: ${state.codexState.currentPlate}`, 20, 40);

        ctx.fillText(`Connected: ${isConnected ? 'YES' : 'NO'}`, 20, 70);

        if (error) {
          ctx.fillStyle = '#ff0000';
          ctx.fillText(`Error: ${error}`, 20, 100);
        }
      }
    };

    drawLattice();

    // Redraw on state change
    const interval = setInterval(drawLattice, 1000);
    return () => clearInterval(interval);
  }, [state, isConnected, error]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state) return;

    // Generate a test signal based on click position
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const signal = {
      id: `click-${Date.now()}`,
      timestamp: new Date(),
      type: 'user-injected' as const,
      data: {
        momentum: x / rect.width,
        volatility: y / rect.height,
        price: Math.random() * 100,
        volume: Math.random() * 1000
      },
      source: 'live' as const,
      fallbackMode: false
    };

    try {
      await injectSignal(signal);
    } catch (err) {
      console.error('Failed to inject signal:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>OMEGA Lattice</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc', cursor: 'crosshair' }}
        onClick={handleCanvasClick}
      />
      <p>Click on the lattice to inject signals</p>
      {state && (
        <div>
          <h2>Current State</h2>
          <pre>{JSON.stringify(state.codexState, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default LatticePage;