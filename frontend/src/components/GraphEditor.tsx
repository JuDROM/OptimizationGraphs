// frontend/src/components/GraphEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { findPath } from '../api';
import type { Matrix, VisPositions, GraphMode, PathResult, HoverRC } from '../types';
import GraphVisualization from './GraphVisualization';
import AdjacencyMatrix from './AdjacencyMatrix';
import MathRepresentation from './MathRepresentation';
import ResultsPanel from './ResultsPanel';
import CustomModal from './CustomModal';
import CasoEjemplo from './CasoEjemplo';
import { nodeNameFromIndex } from '../utils';
import { useHistory } from '../hooks/useHistory';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './GraphEditor.css';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  showInput?: boolean;
  onConfirm: (value: string) => void;
}

interface GraphState {
  matrix: Matrix;
  numNodes: number;
}

// Componente interno para visualización paso a paso
function StepByStepModal({ 
  onClose, 
  darkMode,
  algorithm,
  startNode,
  endNode 
}: { 
  onClose: () => void; 
  darkMode: boolean;
  algorithm: 'dijkstra' | 'bellman-ford';
  startNode: string;
  endNode: string;
}): React.JSX.Element {
  return (
    <div className={`step-modal-overlay ${darkMode ? 'dark-mode' : ''}`}>
      <div className="step-modal-container">
        <div className="step-modal-header">
          <h2>
            {algorithm === 'dijkstra' ? '⚡ Dijkstra' : '🔍 Bellman-Ford'} - Paso a Paso
          </h2>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="step-modal-body">
          <div className="info-box">
            <p><strong>Origen:</strong> {startNode}</p>
            <p><strong>Destino:</strong> {endNode}</p>
            <p><strong>Algoritmo:</strong> {algorithm}</p>
          </div>
          <div className="step-content">
            <p style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
              La visualización paso a paso requiere datos adicionales del backend.
              <br />
              Por ahora, puedes ver el resultado final en el panel de resultados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GraphEditor(): React.JSX.Element {

  // Estados básicos
  const [mode, setMode] = useState<GraphMode>('select');
  const [isDirected, setIsDirected] = useState<boolean>(true);
  const [nodePositions, setNodePositions] = useState<VisPositions>({});
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(true);
  const [selectedForEdge, setSelectedForEdge] = useState<number | null>(null);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [hoverRC, setHoverRC] = useState<HoverRC>({ row: null, col: null });
  const [showCasoEjemplo, setShowCasoEjemplo] = useState<boolean>(false);
  const [showStepByStep, setShowStepByStep] = useState<{ show: boolean; algorithm: 'dijkstra' | 'bellman-ford' | null }>({ show: false, algorithm: null });
  
  // Estado del panel lateral
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(false);
  
  // Modo oscuro
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('graph-dark-mode', false);
  
  // Historial
  const {
    state: graphState,
    setState: setGraphState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<GraphState>({
    matrix: [],
    numNodes: 2,
  });
  
  const matrix = graphState.matrix;
  const numNodes = graphState.numNodes;
  
  const [, setSavedGraph] = useLocalStorage<GraphState>('graph-state', graphState);
  
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    showInput: false,
    onConfirm: () => {},
  });

  const handleClearMatrix = useCallback((initialNodes: unknown = 2): void => {
    let count = 2;
    if (typeof initialNodes === 'number' && Number.isFinite(initialNodes) && initialNodes > 0) {
      count = Math.floor(initialNodes);
    }
    const m: Matrix = Array.from({ length: count }, () => new Array(count).fill(''));
    setGraphState({
      matrix: m,
      numNodes: count,
    });
    setSelectedA(null);
    setSelectedB(null);
    setPathResult(null);
    setNodePositions({});
    setPhysicsEnabled(true);
  }, [setGraphState]);

  const updateCell = useCallback((i: number, j: number, value: string): void => {
    setPathResult(null);
    const copy = matrix.map((r) => r.slice());
    const cleanValue = value.replace(/[^\d-]/g, '');
    copy[i][j] = cleanValue;
    if (!isDirected && i !== j) copy[j][i] = cleanValue;
    setGraphState({
      matrix: copy,
      numNodes,
    });
  }, [matrix, numNodes, isDirected, setGraphState]);

  const handleAddNode = useCallback((): void => {
    setPathResult(null);
    const newMatrix = matrix.map((r) => [...r, '']);
    newMatrix.push(new Array(numNodes + 1).fill(''));
    setGraphState({
      matrix: newMatrix,
      numNodes: numNodes + 1,
    });
    setPhysicsEnabled(true);
  }, [matrix, numNodes, setGraphState]);

  // --- EFECTOS ---

  // Inicialización
  useEffect(() => {
    handleClearMatrix(2);
  }, [handleClearMatrix]);

  // Aplicar modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Guardar en localStorage
  useEffect(() => {
    setSavedGraph(graphState);
  }, [graphState, setSavedGraph]);

  // Limpiar selecciones
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

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) redo();
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedA !== null) {
          console.log('Borrar nodo:', selectedA);
        }
      }
      
      if (e.key === 'n' || e.key === 'N') {
        handleAddNode();
      }
      
      if (e.key === 'p' || e.key === 'P') {
        setSidePanelOpen(prev => !prev);
      }
      
      if (e.key === 'd' || e.key === 'D') {
        setDarkMode(prev => !prev);
      }
      
      // Atajos para modos de edición
      if (e.key === '1') {
        setMode('select');
      }
      
      if (e.key === '2') {
        setMode('addNode');
      }
      
      if (e.key === '3') {
        setMode('addEdge');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedA, canUndo, canRedo, undo, redo, darkMode, handleAddNode, setDarkMode]);

  // --- FUNCIONES RESTANTES ---

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
      setModalState({
        isOpen: true,
        title: '⚠️ Conexión no válida',
        message: 'No puedes crear una conexión de un nodo a sí mismo.',
        showInput: false,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          setSelectedForEdge(null);
        },
      });
      return;
    }
    
    setModalState({
      isOpen: true,
      title: '🔗 Nueva Conexión',
      message: `Ingresa el peso:\n${nodeNameFromIndex(selectedForEdge)} → ${nodeNameFromIndex(nodeId)}`,
      showInput: true,
      onConfirm: (value: string) => {
        const clean = value.replace(/[^\d-]/g, '');
        if (clean) {
          updateCell(selectedForEdge!, nodeId, clean);
        }
        setModalState(prev => ({ ...prev, isOpen: false }));
        setSelectedForEdge(null);
      },
    });
  }

  function loadExample(): void {
    setShowCasoEjemplo(true);
  }

  async function handleFindPath(algorithm: 'dijkstra' | 'bellman-ford', showSteps: boolean = false): Promise<void> {
    if (selectedA === null || selectedB === null) {
      setModalState({
        isOpen: true,
        title: '🎯 Selección Incompleta',
        message: 'Debes seleccionar ambos nodos (A y B) antes de buscar una ruta.',
        showInput: false,
        onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }
    
    if (showSteps) {
      setShowStepByStep({ show: true, algorithm });
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
      setModalState({
        isOpen: true,
        title: '❌ Error',
        message: 'Error: ' + (err instanceof Error ? err.message : 'Error desconocido'),
        showInput: false,
        onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
      });
    }
  }

  function handleExportPNG(): void {
    const canvas = document.querySelector('.graph-canvas canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('No se pudo exportar la imagen');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `grafo-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="editor-root">
      
      {/* CANVAS (Grafo) */}
      <div className="graph-canvas-wrapper">
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
      </div>
      
      {/* TOP BAR */}
      <div className="top-bar">
        <label>
          <input
            type="checkbox"
            checked={isDirected}
            onChange={(e) => setIsDirected(e.target.checked)}
          />
          Dirigido
        </label>
        
        <button className="btn btn-sm" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">↶</button>
        <button className="btn btn-sm" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">↷</button>
        <button className="btn btn-sm" onClick={() => handleClearMatrix()}>🗑️ Limpiar</button>
        <button className="btn btn-sm" onClick={loadExample}>📊 Ejemplo</button>
        <button className="btn btn-sm" onClick={() => handleFindPath('bellman-ford')} disabled={mode !== 'select'}>🔍 Bellman-Ford</button>
        <button className="btn btn-sm" onClick={() => handleFindPath('bellman-ford', true)} disabled={mode !== 'select'} title="Ver paso a paso">📋 BF Paso a Paso</button>
        <button className="btn btn-sm" onClick={() => handleFindPath('dijkstra')} disabled={mode !== 'select'}>⚡ Dijkstra</button>
        <button className="btn btn-sm" onClick={() => handleFindPath('dijkstra', true)} disabled={mode !== 'select'} title="Ver paso a paso">📋 D Paso a Paso</button>
        <button className="btn btn-sm" onClick={handleExportPNG} title="Exportar">📸</button>
        <button className="btn btn-sm" onClick={() => setDarkMode(!darkMode)} title="Modo oscuro (D)">{darkMode ? '☀️' : '🌙'}</button>
      </div>
      
      {/* PESTAÑA LATERAL */}
      {!sidePanelOpen && (
        <button className="panel-tab-trigger" onClick={() => setSidePanelOpen(true)}>MATRIZ</button>
      )}
      
      {/* SIDE PANEL */}
      <div className={`side-panel ${sidePanelOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h3>Panel de Datos</h3>
          <button className="close-panel-btn" onClick={() => setSidePanelOpen(false)}>✕</button>
        </div>
        
        <div className="side-panel-content">
          <div className="panel-section">
            <div className="panel-section-header"><h4>Matriz de Adyacencia</h4></div>
            <div className="panel-section-body">
              <AdjacencyMatrix
                matrix={matrix}
                numNodes={numNodes}
                isDirected={isDirected}
                hoverRC={hoverRC}
                onCellChange={updateCell}
                onCellEnter={(i, j) => setHoverRC({ row: i, col: j })}
                onCellLeave={() => setHoverRC({ row: null, col: null })}
              />
            </div>
          </div>
          
          <div className="panel-section">
            <div className="panel-section-header"><h4>Representación</h4></div>
            <div className="panel-section-body">
              <MathRepresentation matrix={matrix} numNodes={numNodes} isDirected={isDirected} />
            </div>
          </div>
          
          {mode === 'select' && (
            <div className="panel-section">
              <div className="panel-section-header"><h4>Resultados</h4></div>
              <div className="panel-section-body">
                <ResultsPanel pathResult={pathResult} mode={mode} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* BOTTOM DOCK */}
      <div className="bottom-dock">
        <button className={`dock-tool ${mode === 'select' ? 'active' : ''}`} onClick={() => setMode('select')} data-tooltip="Seleccionar (1)"><span>🔘</span></button>
        <button className={`dock-tool ${mode === 'addNode' ? 'active' : ''}`} onClick={() => setMode('addNode')} data-tooltip="Añadir Nodo (2)"><span>➕</span></button>
        <button className={`dock-tool ${mode === 'addEdge' ? 'active' : ''}`} onClick={() => setMode('addEdge')} data-tooltip="Añadir Conexión (3)"><span>🔗</span></button>
        <div className="dock-separator"></div>
        <button className="dock-tool" onClick={() => setSidePanelOpen(!sidePanelOpen)} data-tooltip={sidePanelOpen ? "Ocultar (P)" : "Mostrar (P)"}><span>{sidePanelOpen ? '▶' : '◀'}</span></button>
        
        {mode === 'select' && (
          <>
            <div className="dock-separator"></div>
            <div style={{ fontSize: '0.75rem', color: darkMode ? '#94a3b8' : '#64748b', padding: '0 8px' }}>
              A: {selectedA === null ? '—' : nodeNameFromIndex(selectedA)} | B: {selectedB === null ? '—' : nodeNameFromIndex(selectedB)}
            </div>
          </>
        )}
      </div>
      
      {/* Modal Personalizado */}
      <CustomModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        placeholder="Ej: 5"
        showInput={modalState.showInput}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
      
      {/* Modal Caso Ejemplo */}
      {showCasoEjemplo && (
        <CasoEjemplo 
          onClose={() => setShowCasoEjemplo(false)}
          darkMode={darkMode}
        />
      )}
      
      {/* Modal Paso a Paso */}
      {showStepByStep.show && showStepByStep.algorithm && selectedA !== null && selectedB !== null && (
        <StepByStepModal
          onClose={() => setShowStepByStep({ show: false, algorithm: null })}
          darkMode={darkMode}
          algorithm={showStepByStep.algorithm}
          startNode={nodeNameFromIndex(selectedA)}
          endNode={nodeNameFromIndex(selectedB)}
        />
      )}
      
      <style>{`
        .step-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .step-modal-overlay.dark-mode {
          background: rgba(0, 0, 0, 0.8);
        }
        
        .step-modal-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .step-modal-overlay.dark-mode .step-modal-container {
          background: #1e293b;
          color: #f8fafc;
        }
        
        .step-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .step-modal-overlay.dark-mode .step-modal-header {
          border-color: #475569;
        }
        
        .step-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .step-modal-body {
          min-height: 200px;
        }
        
        .info-box {
          background: #eef2ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #4f46e5;
        }
        
        .step-modal-overlay.dark-mode .info-box {
          background: #334155;
          border-color: #818cf8;
        }
        
        .info-box p {
          margin: 8px 0;
        }
        
        .step-content {
          padding: 20px;
        }
      `}</style>
    </div>
  );
}