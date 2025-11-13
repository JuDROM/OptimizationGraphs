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