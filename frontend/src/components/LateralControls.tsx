// frontend/src/components/LateralControls.tsx
import React from 'react';
import { nodeNameFromIndex } from '../utils';
import type { GraphMode } from '../types';

interface LateralControlsProps {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  selectedA: number | null;
  selectedB: number | null;
}

export default function LateralControls({
  mode,
  onModeChange,
  selectedA,
  selectedB,
}: LateralControlsProps): React.JSX.Element {
  return (
    <div className="lateral-controls">
      {/* <p><strong>Modo de Edición:</strong></p> */}
      <div className="toolbar">
        <button
          className={`btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => onModeChange('select')}
        >
          🔍 Seleccionar Nodos (A/B)
        </button>
        <button
          className={`btn ${mode === 'addNode' ? 'active' : ''}`}
          onClick={() => onModeChange('addNode')}
        >
          ➕ Añadir Nodo
        </button>
        <button
          className={`btn ${mode === 'addEdge' ? 'active' : ''}`}
          onClick={() => onModeChange('addEdge')}
        >
          🔗 Añadir Conexión
        </button>
      </div>

      <div className="selected-nodes">
        <strong>Modo Selección:</strong>
        <div>
          Nodo A:{' '}
          {selectedA === null ? '(Ninguno)' : nodeNameFromIndex(selectedA)}
        </div>
        <div>
          Nodo B:{' '}
          {selectedB === null ? '(Ninguno)' : nodeNameFromIndex(selectedB)}
        </div>
      </div>
    </div>
  );
}