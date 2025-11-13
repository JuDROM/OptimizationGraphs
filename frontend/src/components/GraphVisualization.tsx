// frontend/src/components/GraphVisualization.tsx
import React, { useEffect, useRef, useState } from "react";
import { Network, type Data, type Options } from "vis-network";
import "vis-network/styles/vis-network.css";
import { nodeNameFromIndex } from "../utils";
import type { GraphMode, Matrix, VisPositions, PathResult } from "../types";

declare global {
    interface Window {
      vis?: { Network: typeof Network };
    }
}

interface VisNode {
    id: number;
    label: string;
    color?: string;
    x?: number;
    y?: number;
}

interface VisEdge {
    from: number;
    to: number;
    label?: string;
    arrows?: { to: boolean };
    smooth?: boolean | { enabled: boolean; type: string; roundness: number };
    color?: string;
    width?: number;
}

interface ClickParams {
    nodes?: number[];
    edges?: number[];
}

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

    useEffect(() => {
      if (!containerRef.current) return;

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

      // --- NODOS ---
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
            x: nodePositions[i]?.x,
            y: nodePositions[i]?.y,
          });
      }

      // --- ARISTAS ---
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

            if (!isDirected) {
                const rev = `${j}-${i}`;
                if (added.has(rev)) continue;
                edgesArray.push({
                  from: i,
                  to: j,
                  label: w,
            // arrows: { to: false } // No es necesario, la opción global lo maneja
                  color: baseColor,
                  width: isPathEdge ? pathWidth : 1.5,
                });
                added.add(id);
                added.add(rev);
            } else {
                const reverseExists = matrix[j]?.[i]?.trim();
                if (reverseExists && i !== j) {
                  edgesArray.push({
                      from: i,
                      to: j,
                      label: w,
                      arrows: { to: true },
                      color: isPathEdge ? pathColor : "#97c2e8",
                      width: isPathEdge ? pathWidth : 1.5,
                      smooth: { enabled: true, type: "curvedCW", roundness: -0.25 },
                  });
                  edgesArray.push({
                      from: j,
                      to: i,
                      label: reverseExists,
                      arrows: { to: true },
                      color: pathEdgeIds.has(`${j}-${i}`) ? pathColor : "#97c2e8",
                      width: pathEdgeIds.has(`${j}-${i}`) ? pathWidth : 1.5,
                      smooth: { enabled: true, type: "curvedCCW", roundness: 0.25 },
                  });
                  added.add(id);
                  added.add(`${j}-${i}`);
                } else {
                  edgesArray.push({
                      from: i,
                      to: j,
                      label: w,
                      arrows: { to: true },
                      color: baseColor,
                      width: isPathEdge ? pathWidth : 1.5,
                  });
                  added.add(id);
                }
            }
          }
      }

      const data: Data = { nodes: nodesArray, edges: edgesArray };

      const options: Options = {
          nodes: { shape: "circle", size: 30, font: { color: "#000" } },
          edges: {
            font: { align: "top" },
            arrows: isDirected ? { to: { enabled: true, scaleFactor: 0.8 } } : undefined,
            smooth: false,
            shadow: false,
          },
          physics: { enabled: physicsEnabled, solver: "forceAtlas2Based" },
          interaction: {
            hover: true,
            hoverConnectedEdges: false,
            selectConnectedEdges: false,
            multiselect: false,
            zoomView: true,
            dragView: true,
            dragNodes: true,
          },
      };

      if (network) {
          try {
            network.destroy();
          } catch {/* Ignorar errores al destruir la red antigua */}
      }

      const VisNetworkCtor = window.vis?.Network ?? Network;
      const net = new VisNetworkCtor(containerRef.current, data, options) as Network;

      // Guardar posiciones al estabilizar
      net.once("stabilizationIterationsDone", () => {
          setNodePositions(net.getPositions());
          net.setOptions({ physics: false });
          setPhysicsEnabled(false);
      });

      net.on("dragEnd", () => {
          setNodePositions(net.getPositions());
      });

      // Clicks por modo
      net.on("click", (params: ClickParams) => {
      const nodes = params.nodes ?? [];
          if (nodes.length > 0) {
            const nodeId = nodes[0];
            switch (mode) {
                case "select": onSelectNode(nodeId); break;
                case "addEdge": onEdgeNodeClick(nodeId); break;
            }
          } else {
            switch (mode) {
                case "addNode": onAddNode(); break;
                case "select": onClearSelections(); break;
                case "addEdge": onClearEdgeSelection(); break;
            }
          }
      });

    // *** BLOQUE ELIMINADO ***
    // Se eliminó el bloque net.on("selectNode", ...) que causaba el conflicto.
    // La opción 'selectConnectedEdges: false' en 'interaction' ya hace este trabajo.

      setNetwork(net);
      return () => net.destroy();
    }, [
      matrix,
      numNodes,
      isDirected,
      mode,
      selectedA,
      selectedB,
      selectedForEdge,
      nodePositions,
      physicsEnabled,
      pathResult,
    ]);

    return (
      <div className="canvas-container">
          <div
            ref={containerRef}
            className="graph-canvas"
            title={`Modo actual: ${mode}. (Arrastra nodos para moverlos)`}
          />
      </div>
    );
}