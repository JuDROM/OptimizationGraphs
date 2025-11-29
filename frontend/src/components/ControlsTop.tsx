// frontend/src/components/ControlsTop.tsx
import React from 'react';
import type { GraphMode } from '../types';

interface ControlsTopProps {
  isDirected: boolean;
  onDirectedChange: (isDirected: boolean) => void;
  onClearMatrix: () => void;
  onLoadExample: () => void;
  onFindPath: (algorithm: 'dijkstra' | 'bellman-ford') => void;
  mode: GraphMode;
}

export default function ControlsTop({
  isDirected,
  onDirectedChange,
  onClearMatrix,
  onLoadExample,
  onFindPath,
  mode,
}: ControlsTopProps): React.JSX.Element {
  return (
    <div className="controls-top">
      <div className="input-row">
        <label>
          <input
            type="checkbox"
            checked={isDirected}
            onChange={(e) => onDirectedChange(e.target.checked)}
          />
          Grafo dirigido
        </label>
        <button className="btn" onClick={() => onClearMatrix()}>
          🗑️ Limpiar Matriz
        </button>
        <button className="btn" onClick={onLoadExample}>
          📊 Cargar ejemplo
        </button>
      </div>
      <div className="actions-row">
        <button
          className="btn"
          onClick={() => onFindPath('bellman-ford')}
          disabled={mode !== 'select'}
          title={mode !== 'select' ? 'Selecciona el modo "Seleccionar Nodos" primero' : ''}
        >
          🔍 Bellman-Ford
        </button>
        <button
          className="btn"
          onClick={() => onFindPath('dijkstra')}
          disabled={mode !== 'select'}
          title={mode !== 'select' ? 'Selecciona el modo "Seleccionar Nodos" primero' : ''}
        >
          ⚡ Dijkstra
        </button>
      </div>
    </div>
  );
}