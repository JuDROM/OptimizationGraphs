# backend/app.py (Corregido)

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS # <-- Importar
import json
import heapq
import numpy as np
import os
import string

app = Flask(__name__, template_folder="templates", static_folder="static")

# Inicializa CORS globalmente
CORS(app)

INF = float('inf')

def bellman_ford(graph, start_node, end_node, num_nodes):
    if start_node == end_node:
        return 0, [start_node]

    distances = {i: INF for i in range(num_nodes)}
    distances[start_node] = 0
    predecessors = {i: None for i in range(num_nodes)}

    for _ in range(num_nodes - 1):
        relaxed = False
        for u in range(num_nodes):
            for v, weight in graph[u].items():
                if distances[u] != INF and distances[u] + weight < distances[v]:
                    distances[v] = distances[u] + weight
                    predecessors[v] = u
                    relaxed = True
        if not relaxed:
            break

    for u in range(num_nodes):
        for v, weight in graph[u].items():
            if distances[u] != INF and distances[u] + weight < distances[v]:
                return None, "Ciclo Negativo Detectado"

    if distances[end_node] == INF:
        return INF, []

    path = []
    current = end_node
    while current is not None:
        path.append(current)
        if current == start_node:
            break
        current = predecessors[current]
    path.reverse()
    if not path or path[0] != start_node:
         return INF, []

    return distances[end_node], path

def dijkstra(graph, start_node, end_node, num_nodes):
    if start_node == end_node:
        return 0, [start_node]

    distances = {i: INF for i in range(num_nodes)}
    distances[start_node] = 0
    predecessors = {i: None for i in range(num_nodes)}
    priority_queue = [(0, start_node)]

    while priority_queue:
        current_distance, u = heapq.heappop(priority_queue)
        if current_distance > distances[u]:
            continue
        for v, weight in graph[u].items():
            if weight < 0:
                pass
            distance = current_distance + weight
            if distance < distances[v]:
                distances[v] = distance
                predecessors[v] = u
                heapq.heappush(priority_queue, (distance, v))

    if distances[end_node] == INF:
        return INF, []

    path = []
    current = end_node
    while current is not None:
        path.append(current)
        if current == start_node:
            break
        current = predecessors[current]
    path.reverse()
    if not path or path[0] != start_node:
         return INF, []
    return distances[end_node], path

INF = float('inf')

# Helper function (usada en el backend)
def node_name_from_index(index: int) -> str:
    """Convierte un índice numérico a un nombre de nodo alfabético (A, B, C...)."""
    if index < 0:
        return ""
    
    # 26 letras en mayúsculas (A-Z)
    base = len(string.ascii_uppercase)
    
    name = ""
    while True:
        # Módulo para el carácter actual (0=A, 1=B, ...)
        char_index = index % base
        name = string.ascii_uppercase[char_index] + name
        
        # Siguiente grupo: index // base - 1 (para manejar la base 0)
        # Ejemplo: 25 -> Z (queda en 0). 26 -> A A (queda en 1, el -1 lo hace 0)
        index = index // base - 1
        if index < 0:
            break
            
    return name

def reconstruct_path(predecessors, end_node):
    path = []
    current = end_node
    while current is not None:
        path.append(current)
        current = predecessors.get(current)
    return path[::-1] if path and path[0] == path[0] else [] 

def get_path_edges(predecessors, num_nodes):
    edges = []
    for node, predecessor in predecessors.items():
        if predecessor is not None and node < num_nodes: 
            edges.append([predecessor, node])
    return edges
def bellman_ford_with_steps(graph, start_node, end_node, num_nodes):
    distances = {i: INF for i in range(num_nodes)}
    distances[start_node] = 0
    predecessors = {i: None for i in range(num_nodes)}
    steps = []

    # Estado Inicial
    steps.append({
        'description': f"Inicialización: Distancia a {node_name_from_index(start_node)} = 0, el resto es ∞.",
        'activeNodeIndex': None,
        'activeEdgeIndices': None,
        'settledNodeIndices': [],
        'updatedNodeIndices': [start_node],
        'pathEdgesIndices': [],
        'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
        'iteration': 0,
        'negativeCycleDetected': False,
    })
    
    # |V| - 1 pases de relajación
    for i in range(1, num_nodes):
        relaxed_in_pass = False
        updated_in_pass = set()
        
        # Iterar sobre todos los nodos 'u' y sus vecinos 'v'
        for u in range(num_nodes):
            for v, weight in graph[u].items():
                
                # Relajación
                if distances[u] != INF and distances[u] + weight < distances[v]:
                    distances[v] = distances[u] + weight
                    predecessors[v] = u
                    relaxed_in_pass = True
                    updated_in_pass.add(v)

                    # Capturar paso
                    steps.append({
                        'description': f"Paso {i}: Relajación del borde ({node_name_from_index(u)} -> {node_name_from_index(v)}) con peso {weight}. Distancia a {node_name_from_index(v)} actualizada a {distances[v]}.",
                        'activeNodeIndex': u,
                        'activeEdgeIndices': [u, v],
                        'settledNodeIndices': [],
                        'updatedNodeIndices': list(updated_in_pass), 
                        'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
                        'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
                        'iteration': i,
                        'negativeCycleDetected': False,
                    })

        # Si no hubo relajaciones, el algoritmo converge y podemos parar
        if not relaxed_in_pass:
            steps.append({
                'description': f"Paso {i}: No hubo relajaciones. El algoritmo converge y se detiene.",
                'activeNodeIndex': None,
                'activeEdgeIndices': None,
                'settledNodeIndices': list(range(num_nodes)), # Todos settled
                'updatedNodeIndices': [],
                'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
                'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
                'iteration': i,
                'negativeCycleDetected': False,
            })
            break

    # Paso |V|: Revisión de ciclo negativo
    for u in range(num_nodes):
        for v, weight in graph[u].items():
            if distances[u] != INF and distances[u] + weight < distances[v]:
                # Ciclo negativo detectado
                steps.append({
                    'description': f"¡Advertencia! Se detectó un ciclo negativo. El borde ({node_name_from_index(u)} -> {node_name_from_index(v)}) se relajó en la iteración |V|.",
                    'activeNodeIndex': u,
                    'activeEdgeIndices': [u, v],
                    'settledNodeIndices': [],
                    'updatedNodeIndices': [v],
                    'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
                    'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
                    'iteration': num_nodes,
                    'negativeCycleDetected': True,
                })
                return "Ciclo Negativo Detectado", [], distances.get(end_node), steps
    
    final_path = reconstruct_path(predecessors, end_node)
    final_distance = distances.get(end_node, INF)
    return "OK", final_path, final_distance, steps


# =======================================================
# NUEVA FUNCIÓN CON PASOS: DIJKSTRA
# =======================================================
def dijkstra_with_steps(graph, start_node, end_node, num_nodes):
    distances = {i: INF for i in range(num_nodes)}
    distances[start_node] = 0
    predecessors = {i: None for i in range(num_nodes)}
    priority_queue = [(0, start_node)]
    steps = []
    settled_nodes = set()

    # Estado Inicial
    steps.append({
        'description': f"Inicialización: Distancia a {node_name_from_index(start_node)} = 0. Nodo inicial añadido a la cola de prioridad.",
        'activeNodeIndex': None,
        'activeEdgeIndices': None,
        'settledNodeIndices': [],
        'updatedNodeIndices': [start_node],
        'pathEdgesIndices': [],
        'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
        'iteration': 0,
    })

    iteration_count = 1
    while priority_queue:
        current_distance, u = heapq.heappop(priority_queue)

        if u in settled_nodes:
            continue
        
        # Asentamiento (Settlement) del nodo
        settled_nodes.add(u)
        
        # Capturar paso: Selección/Asentamiento
        steps.append({
            'description': f"Iteración {iteration_count}: Nodo {node_name_from_index(u)} seleccionado (distancia mínima: {current_distance}). Este nodo se considera 'fijado'.",
            'activeNodeIndex': u,
            'activeEdgeIndices': None,
            'settledNodeIndices': list(settled_nodes),
            'updatedNodeIndices': [u],
            'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
            'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
            'iteration': iteration_count,
        })
        iteration_count += 1

        if u == end_node:
            break

        # Relajación
        for v, weight in graph[u].items():
            
            # Chequeo de pesos negativos
            if weight < 0:
                 steps.append({
                    'description': f"¡Error de Dijkstra! El algoritmo ha encontrado un peso negativo en el borde ({node_name_from_index(u)} -> {node_name_from_index(v)}) con peso: {weight}.",
                    'activeNodeIndex': u,
                    'activeEdgeIndices': [u, v],
                    'settledNodeIndices': list(settled_nodes),
                    'updatedNodeIndices': [v],
                    'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
                    'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
                    'iteration': iteration_count,
                })
                 return "Peso Negativo Detectado", [], distances.get(end_node), steps

            new_distance = current_distance + weight
            
            if new_distance < distances[v]:
                distances[v] = new_distance
                predecessors[v] = u
                heapq.heappush(priority_queue, (new_distance, v))

                # Capturar paso: Relajación
                steps.append({
                    'description': f"Relajación del borde ({node_name_from_index(u)} -> {node_name_from_index(v)}) con peso {weight}. Distancia a {node_name_from_index(v)} actualizada a {new_distance}. Añadido/Actualizado en la cola de prioridad.",
                    'activeNodeIndex': u,
                    'activeEdgeIndices': [u, v],
                    'settledNodeIndices': list(settled_nodes),
                    'updatedNodeIndices': [v],
                    'pathEdgesIndices': get_path_edges(predecessors, num_nodes),
                    'currentDistances': {k: v if v != INF else "∞" for k, v in distances.items()},
                    'iteration': iteration_count - 1,
                })

    final_path = reconstruct_path(predecessors, end_node)
    final_distance = distances.get(end_node, INF)
    return "OK", final_path, final_distance, steps



@app.route('/', methods=['GET'])
def index():
    info = {
        "message": "Backend del proyecto Grafos (usa el frontend en React para interfaz).",
        "endpoints": ["/find_path (POST)"]
    }
    return jsonify(info)

@app.route('/test', methods=['GET'])
def test_route():
    print("--- LA RUTA DE TEST SÍ FUNCIONA ---")
    return jsonify({"message": "El test funcionó. El servidor está actualizado."})

@app.route('/find_path', methods=['POST', 'OPTIONS'])
def find_path_route():
    """
    Ruta principal para encontrar el camino más corto utilizando Dijkstra o Bellman-Ford.
    También maneja la solicitud OPTIONS (preflight de CORS).
    """
    if request.method == 'OPTIONS':
        response = app.make_response(jsonify({"message": "Preflight OK"}))
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response

    # --- Lógica POST ---
    try:
        data = request.get_json()
        matrix_data = data['matrix']
        is_directed = data['is_directed']
        start_node_index = int(data['start_node_index'])
        end_node_index = int(data['end_node_index'])
        algorithm = data.get('algorithm', 'bellman-ford') # Bellman-Ford por defecto
    except Exception as e:
        # Captura errores de parsing JSON o de claves faltantes
        return jsonify({'error': f'Solicitud JSON inválida o incompleta: {str(e)}'}), 400

    
    # Lógica de construcción de grafo
    n = len(matrix_data)
    graph = {i: {} for i in range(n)}
    has_negative_weights = False

    try:
        for i in range(n):
            for j in range(n):
                cell_value = str(matrix_data[i][j]).strip()
                if cell_value != "":
                    # Intentar convertir a entero, si falla, es un valor inválido
                    weight = int(cell_value)
                    
                    graph[i][j] = weight
                    if weight < 0:
                        has_negative_weights = True
                        
                    # Manejo de grafo no dirigido
                    if not is_directed and i != j:
                        # Si la celda simétrica está vacía, la llenamos con el peso
                        # (La construcción del grafo debe ser simétrica para no dirigido)
                        if str(matrix_data[j][i]).strip() == "":
                            graph[j][i] = weight
                        
    except ValueError:
        return jsonify({'error': 'La matriz debe contener solo números enteros o celdas vacías.'}), 400
    except Exception as e:
        return jsonify({'error': f'Error construyendo el grafo: {str(e)}'}), 500

    
    # Validar índices de nodos
    if not (0 <= start_node_index < n and 0 <= end_node_index < n):
        return jsonify({'error': 'Índices de nodo inicial o final fuera de rango.'}), 400

    
    # Llamar al algoritmo con pasos
    status = "OK"
    path_result = []
    min_distance = INF
    steps = []

    if algorithm == 'dijkstra':
        if has_negative_weights:
            status = "Peso Negativo Detectado"
            # FIX para evitar IndexError: Se añade un paso de error
            steps.append({
                'description': "Peso Negativo Detectado. Dijkstra no es aplicable a grafos con aristas de peso negativo.",
                'activeNodeIndex': None,
                'activeEdgeIndices': None,
                'settledNodeIndices': [],
                'updatedNodeIndices': [],
                'pathEdgesIndices': [],
                'currentDistances': {},
                'iteration': 0,
                'negativeCycleDetected': False,
            })
        else:
            status, path_result, min_distance, steps = dijkstra_with_steps(graph, start_node_index, end_node_index, n)
            
    elif algorithm == 'bellman-ford':
        status, path_result, min_distance, steps = bellman_ford_with_steps(graph, start_node_index, end_node_index, n)
    else:
        return jsonify({'error': 'Algoritmo no válido'}), 400

    # Estructurar la respuesta final (incluyendo el objeto steps)
    base_response = {
        'algorithm': algorithm,
        'steps': {
            'algorithm': algorithm,
            'steps': steps
        }
    }

    if status == "Ciclo Negativo Detectado":
        response = {
            'distance': "N/A",
            'path': "Ciclo Negativo Detectado. La ruta más corta es indefinida.",
            'path_indices': [],
            **base_response
        }
    elif status == "Peso Negativo Detectado":
        response = {
            'distance': "N/A",
            'path': "Dijkstra no es compatible con pesos negativos. Use Bellman-Ford.",
            'path_indices': [],
            **base_response
        }
    elif min_distance == INF:
        response = {
            'distance': "No hay camino",
            'path': "No hay camino posible entre los nodos seleccionados.",
            'path_indices': [],
            **base_response
        }
    else:
        path_string = " -> ".join([node_name_from_index(i) for i in path_result])
        response = {
            'distance': min_distance,
            'path': path_string,
            'path_indices': path_result,
            **base_response
        }
    
    # Asegurar que la respuesta JSON incluye la cabecera de CORS para el POST
    response_json = jsonify(response)
    response_json.headers.add("Access-Control-Allow-Origin", "*")
    return response_json

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")