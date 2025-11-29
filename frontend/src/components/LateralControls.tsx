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
      <div className="toolbar">
        <button
          className={`btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => onModeChange('select')}
          aria-pressed={mode === 'select'}
        >
          🔍 Seleccionar Nodos
        </button>
        <button
          className={`btn ${mode === 'addNode' ? 'active' : ''}`}
          onClick={() => onModeChange('addNode')}
          aria-pressed={mode === 'addNode'}
        >
          ➕ Añadir Nodo
        </button>
        <button
          className={`btn ${mode === 'addEdge' ? 'active' : ''}`}
          onClick={() => onModeChange('addEdge')}
          aria-pressed={mode === 'addEdge'}
        >
          🔗 Añadir Conexión
        </button>
      </div>

      {mode === 'select' && (
        <div className="selected-nodes">
          <strong>Nodos Seleccionados:</strong>
          <div>
            <span style={{ fontWeight: 600 }}>Nodo A:</span>{' '}
            {selectedA === null ? '(Ninguno)' : nodeNameFromIndex(selectedA)}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Nodo B:</span>{' '}
            {selectedB === null ? '(Ninguno)' : nodeNameFromIndex(selectedB)}
          </div>
        </div>
      )}
    </div>
  );
}