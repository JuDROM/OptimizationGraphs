// frontend/src/components/AdjacencyMatrix.tsx
import React from 'react';
import { nodeNameFromIndex } from '../utils';
import type { Matrix, HoverRC } from '../types';

interface MatrixProps {
  matrix: Matrix;
  numNodes: number;
  isDirected: boolean;
  hoverRC: HoverRC;
  onCellChange: (i: number, j: number, value: string) => void;
  onCellEnter: (i: number, j: number) => void;
  onCellLeave: () => void;
}

export default function AdjacencyMatrix({
  matrix,
  numNodes,
  isDirected,
  hoverRC,
  onCellChange,
  onCellEnter,
  onCellLeave,
}: MatrixProps): React.JSX.Element {
  return (
    <div className="matrix-container">
      <table className="adjacency-matrix">
        <thead>
          <tr>
            <th aria-label="Matriz de adyacencia"></th>
            {Array.from({ length: numNodes }).map((_, j) => (
              <th
                key={'h' + j}
                className={hoverRC.col === j ? 'hover-col' : ''}
              >
                {nodeNameFromIndex(j)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numNodes }).map((_, i) => (
            <tr key={'r' + i} className={hoverRC.row === i ? 'hover-row' : ''}>
              <th className={hoverRC.row === i ? 'hover-row' : ''}>
                {nodeNameFromIndex(i)}
              </th>
              {Array.from({ length: numNodes }).map((_, j) => (
                <td
                  key={`c-${i}-${j}`}
                  onMouseEnter={() => onCellEnter(i, j)}
                  onMouseLeave={onCellLeave}
                  className={`${hoverRC.row === i ? 'hover-row' : ''} ${hoverRC.col === j ? 'hover-col' : ''}`.trim()}
                >
                  <input
                    className="matrix-input"
                    value={(matrix[i] && matrix[i][j]) || ''}
                    onChange={(e) => onCellChange(i, j, e.target.value)}
                    disabled={!isDirected && i > j}
                    inputMode="numeric"
                    aria-label={`Peso de ${nodeNameFromIndex(i)} a ${nodeNameFromIndex(j)}`}
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}