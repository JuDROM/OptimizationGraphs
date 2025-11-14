// frontend/src/components/GraphEditor.tsx
import React, { useState, useEffect } from 'react';
import { findPath } from '../api';
import type { Matrix, VisPositions, GraphMode, PathResult, HoverRC } from '../types';
import GraphVisualization from './GraphVisualization';
import ControlsTop from './ControlsTop';
import LateralControls from './LateralControls';
import MathRepresentation from './MathRepresentation';
import AdjacencyMatrix from './AdjacencyMatrix';
import ResultsPanel from './ResultsPanel';
import { nodeNameFromIndex } from '../utils';
import './GraphEditor.css'; // <-- Corregido (decía GraphEdit)

export default function GraphEditor(): React.JSX.Element {

  const [mode, setMode] = useState<GraphMode>('select');
  const [numNodes, setNumNodes] = useState<number>(0);
  const [matrix, setMatrix] = useState<Matrix>([]);
  const [isDirected, setIsDirected] = useState<boolean>(true);
  const [nodePositions, setNodePositions] = useState<VisPositions>({});
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(true);
  const [selectedForEdge, setSelectedForEdge] = useState<number | null>(null);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [hoverRC, setHoverRC] = useState<HoverRC>({ row: null, col: null });

  useEffect(() => {
    handleClearMatrix(2);
  }, []);

  useEffect(() => {
    if (mode !== 'select') {
      setPathResult(null);
      setSelectedA(null);
      setSelectedB(null);
    }
    if (mode !== 'addEdge') {
      setSelectedForEdge(null);
    }
  }, [mode]);

  // Accept either a number (explicit initial node count) or calls from DOM event handlers
  // (which pass a MouseEvent). Normalize to a positive integer defaulting to 2.
  function handleClearMatrix(initialNodes: unknown = 2): void {
    let count = 2;
    if (typeof initialNodes === 'number' && Number.isFinite(initialNodes) && initialNodes > 0) {
      count = Math.floor(initialNodes);
    }
    const m: Matrix = Array.from({ length: count }, () => new Array(count).fill(''));
  setNumNodes(count);
    setMatrix(m);
    setSelectedA(null);
    setSelectedB(null);
    setPathResult(null);
    setNodePositions({});
    setPhysicsEnabled(true);
  }

  function updateCell(i: number, j: number, value: string): void {
    setPathResult(null);
    const copy = matrix.map((r) => r.slice());
    const cleanValue = value.replace(/[^\d-]/g, '');
    copy[i][j] = cleanValue;
    if (!isDirected && i !== j) copy[j][i] = cleanValue;
    setMatrix(copy);
  }

  function handleSelectNode(nodeId: number): void {
    setPathResult(null);
    if (selectedA === null) {
      setSelectedA(nodeId);
    } else if (selectedB === null && nodeId !== selectedA) {
      setSelectedB(nodeId);
    } else {
      setSelectedA(nodeId);
      setSelectedB(null);
    }
  }

  function handleEdgeNodeClick(nodeId: number): void {
    setPathResult(null);
    if (selectedForEdge === null) {
      setSelectedForEdge(nodeId);
      return;
    }
    if (nodeId === selectedForEdge) {
      alert('No se permite crear una arista reflexiva (del nodo a sí mismo).');
      setSelectedForEdge(null);
      return;
    }
    const weight = prompt(
      `Ingrese el peso (distancia) para la arista:\n${nodeNameFromIndex(selectedForEdge)} -> ${nodeNameFromIndex(nodeId)}`
    );
    if (weight) {
      const clean = weight.replace(/[^\d-]/g, '');
      updateCell(selectedForEdge, nodeId, clean);
    }
    setSelectedForEdge(null);
  }

  function handleAddNode(): void {
    setPathResult(null);
    const newMatrix = matrix.map((r) => [...r, '']);
    newMatrix.push(new Array(numNodes + 1).fill(''));
    setMatrix(newMatrix);
    setNumNodes(numNodes + 1);
    setPhysicsEnabled(true);
  }

  function loadExample(): void {
    const example: Matrix = [
      ["", "4", "", "", "2", "", "", "1", "", "2", "", "", "3", "", ""],
      ["", "", "3", "", "", "", "", "", "", "", "", "4", "", "", ""],
      ["2", "", "", "1", "", "", "", "", "1", "", "", "", "", "", ""],
      ["1", "", "", "", "", "1", "", "1", "", "3", "2", "", "1", "", ""],
      ["", "1", "", "", "", "", "8", "", "", "", "", "", "", "", ""],
      ["", "", "", "2", "", "", "", "4", "", "", "", "1", "", "", ""],
      ["", "1", "", "", "", "1", "", "", "5", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "3", "", "", "", "", "1"],
      ["", "", "", "1", "", "", "", "", "", "", "6", "", "", "", ""],
      ["2", "", "", "", "", "", "", "", "", "", "", "2", "", "", ""],
      ["", "", "3", "", "", "", "1", "", "", "", "", "", "7", "", ""],
      ["", "", "", "1", "", "", "", "", "", "", "", "", "", "1", ""],
      ["", "", "1", "", "1", "", "", "", "", "", "", "", "", "", "9"],
      ["", "", "", "5", "", "", "", "1", "", "", "", "", "1", "", ""],
      ["", "", "", "", "1", "", "", "", "", "", "3", "", "", "10", ""],
    ];
    setNumNodes(example.length);
    setMatrix(example);
    setIsDirected(true);
    setSelectedA(null);
    setSelectedB(null);
    setPathResult(null);
    setNodePositions({});
    setPhysicsEnabled(true);
  }

  async function handleFindPath(algorithm: 'dijkstra' | 'bellman-ford'): Promise<void> {
    if (selectedA === null || selectedB === null) {
      alert("Modo 'Seleccionar': Debes seleccionar un Nodo A y un Nodo B.");
      return;
    }
    try {
      const payload = {
        matrix,
        is_directed: isDirected,
        start_node_index: selectedA,
        end_node_index: selectedB,
        algorithm,
      };
      const res = await findPath(payload);
      setPathResult({
        distance: res.distance ?? 'N/A',
        path: res.path ?? '',
        path_indices: Array.isArray(res.path_indices)
          ? res.path_indices.map((x: unknown) => Number(x))
          : [],
        algorithm: res.algorithm ?? algorithm,
      });
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  }

  return (
    <div className="editor-root">
      
      <main className="main-content">
        
        <div className="main-left-column">
          
          <header className="main-header">
              <div className="Header-title">
              <h1>Editor Interactivo de Grafos</h1>
              <p>Usa los controles para construir un grafo o cargar un ejemplo.</p>
              </div>
              <ControlsTop
                isDirected={isDirected}
                onDirectedChange={setIsDirected}
                onClearMatrix={handleClearMatrix}
                onLoadExample={loadExample}
                onFindPath={handleFindPath}
                mode={mode}
              />
          </header>

          <div className="matriz-vista-container">
            <section className="panel-matriz panel-gris">
              <h3>Matriz de Adyacencia</h3>
              <AdjacencyMatrix
                matrix={matrix}
                numNodes={numNodes}
                isDirected={isDirected}
                hoverRC={hoverRC}
                onCellChange={updateCell}
                onCellEnter={(i, j) => setHoverRC({ row: i, col: j })}
                onCellLeave={() => setHoverRC({ row: null, col: null })}
              />
            </section>
            <section className="panel-grafo grafo-azul">
              <GraphVisualization
                matrix={matrix}
                numNodes={numNodes}
                isDirected={isDirected}
                mode={mode}
                selectedA={selectedA}
                selectedB={selectedB}
                selectedForEdge={selectedForEdge}
                pathResult={pathResult}
                nodePositions={nodePositions}
                physicsEnabled={physicsEnabled}
                setNodePositions={setNodePositions}
                setPhysicsEnabled={setPhysicsEnabled}
                onSelectNode={handleSelectNode}
                onEdgeNodeClick={handleEdgeNodeClick}
                onAddNode={handleAddNode}
                onClearSelections={() => {
                  setSelectedA(null);
                  setSelectedB(null);
                }}
                onClearEdgeSelection={() => setSelectedForEdge(null)}
              />
            </section>
          </div>
        </div>

        <aside className="panel-lateral panel-verde">
          <h3>Modo de Edición</h3>
          <LateralControls
            mode={mode}
            onModeChange={setMode}
            selectedA={selectedA}
            selectedB={selectedB}
          />
        </aside>
      </main>
      <footer className="main-footer">
        <section className="panel-matematica panel-morado">
          <h3>Representación Matemática</h3>
          <MathRepresentation
            matrix={matrix}
            numNodes={numNodes}
            isDirected={isDirected}
          />
        </section>
        <section className="panel-resultados panel-vino">
          <h3>Resultado Búsqueda</h3>
          <ResultsPanel pathResult={pathResult} mode={mode} />
        </section>
      </footer>
    </div>
  );
}