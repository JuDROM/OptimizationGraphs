// frontend/src/components/GraphVisualization.tsx
import React, { useEffect, useRef, useState } from "react";
import { Network, type Data, type Options } from "vis-network";
import "vis-network/styles/vis-network.css";
import { nodeNameFromIndex } from "../utils";
import type { GraphMode, Matrix, VisPositions, PathResult } from "../types";

// Aseguramos que vis-network esté disponible
declare global {
  interface Window {
    vis?: { Network: typeof Network };
  }
}

// Interfaces locales
interface VisNode { id: number; label: string; color?: string; x?: number; y?: number; }
interface VisEdge { from: number; to: number; label?: string; arrows?: { to: boolean }; smooth?: boolean | { enabled: boolean; type: string; roundness: number }; color?: string; width?: number; }
interface ClickParams { nodes?: number[]; edges?: number[]; }

interface GraphVisualizationProps {
  matrix: Matrix;
  numNodes: number;
  isDirected: boolean;
  mode: GraphMode;
  selectedA: number | null;
  selectedB: number | null;
  selectedForEdge: number | null;
  pathResult: PathResult | null;
  nodePositions: VisPositions;
  physicsEnabled: boolean;
  setNodePositions: (positions: VisPositions) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  onSelectNode: (nodeId: number) => void;
  onEdgeNodeClick: (nodeId: number) => void;
  onAddNode: () => void;
  onClearSelections: () => void;
  onClearEdgeSelection: () => void;
}

export default function GraphVisualization({
  matrix,
  numNodes,
  isDirected,
  mode,
  selectedA,
  selectedB,
  selectedForEdge,
  pathResult,
  nodePositions,
  physicsEnabled,
  setNodePositions,
  setPhysicsEnabled,
  onSelectNode,
  onEdgeNodeClick,
  onAddNode,
  onClearSelections,
  onClearEdgeSelection,
}: GraphVisualizationProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);

  // --- EFECTO PRINCIPAL: CREAR/ACTUALIZAR GRAFO ---
  useEffect(() => {
    if (!containerRef.current) return;

    // Colores y estilos
    const pathColor = "#f0a500";
    const pathWidth = 4;
    const pathNodeIds = new Set<number>(pathResult?.path_indices ?? []);
    const pathEdgeIds = new Set<string>();

    if (pathResult?.path_indices && pathResult.path_indices.length > 1) {
      for (let i = 0; i < pathResult.path_indices.length - 1; i++) {
        const u = pathResult.path_indices[i];
        const v = pathResult.path_indices[i + 1];
        pathEdgeIds.add(`${u}-${v}`);
      }
    }

    // 1. Preparar Nodos
    const nodesArray: VisNode[] = [];
    for (let i = 0; i < numNodes; i++) {
      let color = "#97c2e8";
      if (pathNodeIds.has(i)) color = pathColor;
      if (mode === "select" && (i === selectedA || i === selectedB)) color = "#28a745";
      if (mode === "addEdge" && i === selectedForEdge) color = "#ffc107";

      nodesArray.push({
        id: i,
        label: nodeNameFromIndex(i),
        color,
        x: nodePositions[i]?.x, // Mantener posición si existe
        y: nodePositions[i]?.y,
      });
    }

    // 2. Preparar Aristas
    const edgesArray: VisEdge[] = [];
    const added = new Set<string>();

    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        const w = matrix[i]?.[j]?.trim();
        if (!w) continue;

        const id = `${i}-${j}`;
        if (added.has(id)) continue;

        const isPathEdge = pathEdgeIds.has(id);
        const baseColor = isPathEdge ? pathColor : "#97c2e8";

        // Lógica para aristas dirigidas vs no dirigidas
        if (!isDirected) {
          const rev = `${j}-${i}`;
          if (added.has(rev)) continue;
          edgesArray.push({
            from: i,
            to: j,
            label: w,
            color: baseColor,
            width: isPathEdge ? pathWidth : 1.5,
          });
          added.add(id);
          added.add(rev);
        } else {
          // Dirigido
          const reverseExists = matrix[j]?.[i]?.trim();
          if (reverseExists && i !== j) {
            // Caso especial: Curvar si hay doble sentido
            edgesArray.push({
              from: i, to: j, label: w, arrows: { to: true },
              color: isPathEdge ? pathColor : "#97c2e8",
              width: isPathEdge ? pathWidth : 1.5,
              smooth: { enabled: true, type: "curvedCW", roundness: -0.25 },
            });
            edgesArray.push({
              from: j, to: i, label: reverseExists, arrows: { to: true },
              color: pathEdgeIds.has(`${j}-${i}`) ? pathColor : "#97c2e8",
              width: pathEdgeIds.has(`${j}-${i}`) ? pathWidth : 1.5,
              smooth: { enabled: true, type: "curvedCCW", roundness: 0.25 },
            });
            added.add(id);
            added.add(`${j}-${i}`);
          } else {
            // Normal
            edgesArray.push({
              from: i, to: j, label: w, arrows: { to: true },
              color: baseColor,
              width: isPathEdge ? pathWidth : 1.5,
            });
            added.add(id);
          }
        }
      }
    }

    const data: Data = { nodes: nodesArray, edges: edgesArray };

    // 3. Opciones de Vis-Network
    const options: Options = {
      nodes: { shape: "circle", size: 30, font: { color: "#000" } },
      edges: {
        font: { align: "top" },
        arrows: isDirected ? { to: { enabled: true, scaleFactor: 0.8 } } : undefined,
        smooth: false,
      },
      physics: {
        enabled: physicsEnabled, // Usamos el estado para activar/desactivar física
        solver: "forceAtlas2Based",
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        zoomSpeed: 0.5,
      },
    };

    // 4. Inicializar (o Reinicializar con cuidado)
    // NOTA: Si ya existe 'network', podríamos actualizar datos en vez de destruir, 
    // pero para simplicidad destruimos y recreamos, PERO SIN 'network' en dependencias para evitar bucle.
    if (network) {
        // Opción A: Solo actualizar datos (más suave)
        // network.setData(data);
        // network.setOptions(options);
        
        // Opción B: Destruir y recrear (más robusto ante cambios estructurales)
        // Para este caso, como cambiamos 'isDirected' y estructura, recreamos es más seguro,
        // pero DEBEMOS asegurar que network.destroy() se llame.
        network.destroy();
    }

    const VisNetworkCtor = window.vis?.Network ?? Network;
    const net = new VisNetworkCtor(containerRef.current, data, options) as Network;

    // Eventos
    net.once("stabilizationIterationsDone", () => {
      setNodePositions(net.getPositions());
      net.setOptions({ physics: false }); // Congelar después de estabilizar
      setPhysicsEnabled(false);
    });

    net.on("dragEnd", () => {
      setNodePositions(net.getPositions());
    });

    net.on("click", (params: ClickParams) => {
      const nodes = params.nodes ?? [];
      if (nodes.length > 0) {
        const nodeId = nodes[0];
        if (mode === "select") onSelectNode(nodeId);
        if (mode === "addEdge") onEdgeNodeClick(nodeId);
      } else {
        if (mode === "addNode") onAddNode();
        if (mode === "select") onClearSelections();
        if (mode === "addEdge") onClearEdgeSelection();
      }
    });

    setNetwork(net);

    // Cleanup al desmontar
    return () => {
      net.destroy();
    };

    // ¡¡OJO AQUI!!: Quitamos 'network' de las dependencias para evitar el bucle infinito
  }, [matrix, numNodes, isDirected, mode, selectedA, selectedB, selectedForEdge, pathResult, physicsEnabled]); 

  // --- EFECTO SECUNDARIO: Atajos de teclado (Espacio) ---
  useEffect(() => {
    if (!network) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        network.setOptions({ interaction: { dragView: true } });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [network]);

  // CORRECCIÓN FINAL: Eliminamos el <div className="canvas-container"> intermedio
  return (
      <div
        ref={containerRef}
        className="graph-canvas"
        style={{ width: '100%', height: '100%' }} // Forzamos tamaño por si acaso
        title={`Modo actual: ${mode}`}
      />
  );
}