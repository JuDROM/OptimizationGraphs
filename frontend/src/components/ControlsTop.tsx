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
    // Esta sección ya no tiene su propio fondo, 
    // será estilizada por el div ".controls-rojo" en el padre
    <div className="controls-top"> 
      <div className="input-row">
        <label>
          <input
            type="checkbox"
            checked={isDirected}
            onChange={(e) => onDirectedChange(e.target.checked)}
          />{' '}
          Grafo dirigido
        </label>
        <button className="btn" onClick={() => onClearMatrix()}>
          Limpiar Matriz
        </button>
        <button className="btn" onClick={onLoadExample}>
          Cargar ejemplo
        </button>
      </div>
      <div className="actions-row">
        <button
          className="btn"
          onClick={() => onFindPath('bellman-ford')}
          disabled={mode !== 'select'}
        >
          Buscar (Bellman-Ford)
        </button>
        <button
          className="btn"
          onClick={() => onFindPath('dijkstra')}
          disabled={mode !== 'select'}
        >
          Buscar (Dijkstra)
        </button>
      </div>
    </div>
  );
}