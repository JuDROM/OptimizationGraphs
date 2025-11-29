// frontend/src/types.ts

// --- Tipos de Estado ---
export type Matrix = string[][];
export type VisPositions = { [nodeId: number]: { x: number; y: number } };
export type GraphMode = "select" | "addNode" | "addEdge";

export interface PathResult {
  distance: number | string;
  path: string;
  path_indices?: number[];
  algorithm?: string;
}

export interface HoverRC {
  row: number | null;
  col: number | null;
}
export interface AlgorithmStep {
  description: string; 
  activeNodeIndex?: number; 
  activeEdgeIndices?: [number, number]; 
  settledNodeIndices: number[]; 
  updatedNodeIndices: number[]; 
  pathEdgesIndices: [number, number][]; 
  currentDistances: { [key: number]: number | string }; 
  iteration?: number; 
  negativeCycleDetected?: boolean;
}

export interface StepByStepResult {
  algorithm: 'dijkstra' | 'bellman-ford';
  steps: AlgorithmStep[];
}

// Actualizar PathResult para incluir los pasos
export interface PathResult {
  distance: number | string;
  path: string;
  path_indices?: number[];
  algorithm?: string;
  steps?: StepByStepResult; // ¡NUEVO!
}

export interface HoverRC {
  row: number | null;
  col: number | null;
}