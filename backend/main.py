# backend/app.py (Corregido)

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS # <-- Importar
import json
import heapq
import numpy as np
import os

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

def node_name_from_index(index):
    name = ""
    num = index + 1
    while num > 0:
        remainder = num % 26
        if remainder == 0:
            name = 'Z' + name
            num = num // 26 - 1
        else:
            name = chr(64 + remainder) + name
            num = num // 26
    return name

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
def find_path():
    
    # --- INICIO DE LA CORRECCIÓN MANUAL DE CORS ---
    # Esto captura la solicitud 'OPTIONS' (preflight) y responde
    # con las cabeceras correctas antes de que el código 'POST' se ejecute.
    if request.method == 'OPTIONS':
        response = app.make_response(jsonify({"message": "Preflight OK"}))
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response
    # --- FIN DE LA CORRECCIÓN MANUAL DE CORS ---

    # Si el método es 'POST', el código continúa aquí
    try:
        data = request.get_json()
        matrix_data = data['matrix']
        is_directed = data['is_directed']
        start_node_index = int(data['start_node_index'])
        end_node_index = int(data['end_node_index'])
        algorithm = data.get('algorithm', 'bellman-ford')

        n = len(matrix_data)
        graph = {i: {} for i in range(n)}
        has_negative_weights = False

        for i in range(n):
            for j in range(n):
                cell_value = str(matrix_data[i][j]).strip()
                if cell_value != "":
                    weight = int(cell_value)
                    graph[i][j] = weight
                    if weight < 0:
                        has_negative_weights = True
                    if not is_directed and i != j:
                        if str(matrix_data[j][i]).strip() == "":
                             graph[j][i] = weight

        min_distance = INF
        path_result = []

        if algorithm == 'dijkstra':
            if has_negative_weights:
                pass 
            min_distance, path_result = dijkstra(graph, start_node_index, end_node_index, n)
        elif algorithm == 'bellman-ford':
            min_distance, path_result = bellman_ford(graph, start_node_index, end_node_index, n)
        else:
            return jsonify({'error': 'Algoritmo no válido'}), 400

        if path_result == "Ciclo Negativo Detectado":
             response = {
                'distance': "N/A",
                'path': path_result,
                'path_indices': [],
                'algorithm': algorithm
            }
        elif min_distance == INF:
            response = {
                'distance': "No hay camino",
                'path': "No hay camino posible entre los nodos seleccionados.",
                'path_indices': [],
                'algorithm': algorithm
            }
        else:
            path_string = " -> ".join([node_name_from_index(i) for i in path_result])
            response = {
                'distance': min_distance,
                'path': path_string,
                'path_indices': path_result,
                'algorithm': algorithm
            }

        # ¡Importante! Asegúrate de que la respuesta POST también incluya la cabecera
        # aunque CORS(app) debería manejar esto, no hace daño ser explícito.
        response_json = jsonify(response)
        response_json.headers.add("Access-Control-Allow-Origin", "*")
        return response_json

    except Exception as e:
        return jsonify({'error': f'Error en el procesamiento de datos: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")