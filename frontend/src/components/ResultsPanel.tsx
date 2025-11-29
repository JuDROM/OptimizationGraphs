// frontend/src/components/ResultsPanel.tsx
import React from 'react';
import type { PathResult, GraphMode } from '../types';

interface ResultsPanelProps {
  pathResult: PathResult | null;
  mode: GraphMode;
}

export default function ResultsPanel({ 
  pathResult, 
  mode 
}: ResultsPanelProps): React.JSX.Element {
  
  if (mode !== 'select') {
    return (
      <div className="results">
        <p style={{ color: 'var(--slate-500)', fontStyle: 'italic' }}>
          💡 Selecciona el modo "Seleccionar Nodos" para buscar rutas
        </p>
      </div>
    );
  }

  if (!pathResult) {
    return (
      <div className="results">
        <p style={{ color: 'var(--slate-500)', fontStyle: 'italic' }}>
          🎯 Selecciona el Nodo A y Nodo B, luego presiona un botón de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="results">
      <div style={{
        padding: 'var(--space-3)',
        backgroundColor: 'var(--indigo-50)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--indigo-200)',
      }}>
        <p style={{ marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--slate-600)' }}>Algoritmo:</span>{' '}
          <strong style={{ 
            color: 'var(--indigo-600)', 
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em'
          }}>
            {pathResult.algorithm ?? 'N/A'}
          </strong>
        </p>
        <p style={{ marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--slate-600)' }}>Distancia total:</span>{' '}
          <strong style={{ color: 'var(--indigo-600)', fontSize: '1.125rem' }}>
            {String(pathResult.distance ?? '∞')}
          </strong>
        </p>
        <p style={{ 
          margin: 0,
          padding: 'var(--space-2)',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: 'var(--slate-600)' }}>Ruta:</span>{' '}
          <strong style={{ color: 'var(--indigo-600)' }}>
            {String(pathResult.path ?? 'No encontrada')}
          </strong>
        </p>
      </div>
    </div>
  );
}