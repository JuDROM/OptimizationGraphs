// frontend/src/components/ResultsPanel.tsx
import React from 'react';
import type { PathResult, GraphMode } from '../types';

interface ResultsPanelProps {
  pathResult: PathResult | null;
  mode: GraphMode;
}

export default function ResultsPanel({ pathResult, mode }: ResultsPanelProps): React.JSX.Element | null {
  
  if (mode !== 'select') {
    return null; // No mostrar el panel si no estamos en modo selección
  }

  return (
    <section className="results">
      <h3>Resultado búsqueda</h3>
      {pathResult ? (
        <div>
          <p>
            Algoritmo usado:{' '}
            <strong>{pathResult.algorithm ?? ' - '}</strong>
          </p>
          <p>
            Distancia total:{' '}
            <strong>{String(pathResult.distance ?? '-')}</strong>
          </p>
          <p>
            Ruta: <strong>{String(pathResult.path ?? '-')}</strong>
          </p>
        </div>
      ) : (
        <p>(Selecciona Nodo A y B, y presiona "Buscar ruta")</p>
      )}
    </section>
  );
}