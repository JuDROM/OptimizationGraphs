import { StepByStepResult } from "./types";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

export interface FindPathPayload {
  matrix: string[][];
  is_directed: boolean;
  start_node_index: number;
  end_node_index: number;
  algorithm: 'dijkstra' | 'bellman-ford';
}

export interface FindPathResponse {
  distance: number | string;
  path: string;
  path_indices: number[];
  algorithm: string;
  steps?: StepByStepResult;
}

export async function findPath(payload: FindPathPayload): Promise<FindPathResponse> {
  console.log('🔍 Enviando request a:', `${BACKEND}/find_path`);
  
  try {
    const res = await fetch(`${BACKEND}/find_path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Error del servidor");
    }
    
    return data;
  } catch (error) {
    console.error('💥 Fetch error:', error);
    throw error;
  }
}