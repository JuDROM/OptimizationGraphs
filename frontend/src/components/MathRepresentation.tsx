// frontend/src/components/MathRepresentation.tsx
import React, { useMemo } from 'react';
import { nodeNameFromIndex } from '../utils';
import type { Matrix } from '../types';

interface MathRepProps {
  matrix: Matrix;
  numNodes: number;
  isDirected: boolean;
}

export default function MathRepresentation({
  matrix,
  numNodes,
  isDirected,
}: MathRepProps): React.JSX.Element {
  
  const mathematicalRepresentation = useMemo(() => {
    const nodeSet = Array.from({ length: numNodes }, (_, i) =>
      nodeNameFromIndex(i)
    ).join(', ');

    const edgesSet: string[] = [];
    const added = new Set<string>();

    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        const w = matrix[i] && matrix[i][j] ? matrix[i][j].trim() : '';
        if (w === '') continue;

        const nodeFrom = nodeNameFromIndex(i);
        const nodeTo = nodeNameFromIndex(j);
        const edgeString = `(${nodeFrom}, ${nodeTo}, ${w})`;

        if (!isDirected) {
          const rev = `${j}-${i}`;
          if (added.has(rev)) continue;
          edgesSet.push(edgeString);
          added.add(`${i}-${j}`);
        } else {
          edgesSet.push(edgeString);
        }
      }
    }

    const edgesSetString = edgesSet.join(', ');

    return {
      nSet: `{ ${nodeSet} }`,
      aSet: `{ ${edgesSetString} }`,
    };
  }, [matrix, numNodes, isDirected]);

  return (
    <div className="math-representation">
      <p style={{ marginBottom: 'var(--space-3)' }}>
        <strong style={{ color: 'var(--indigo-600)' }}>G</strong> ={' '}
        <strong>{'{'} N, A {'}'}</strong>
      </p>
      <p style={{ marginBottom: 'var(--space-2)' }}>
        <strong style={{ color: 'var(--indigo-600)' }}>N</strong> ={' '}
        {mathematicalRepresentation.nSet}
      </p>
      <p style={{ margin: 0 }}>
        <strong style={{ color: 'var(--indigo-600)' }}>A</strong> ={' '}
        {mathematicalRepresentation.aSet || '{ }'}
      </p>
    </div>
  );
}