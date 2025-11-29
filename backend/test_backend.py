import pytest
import json
import sys
from main import app  # Asegúrate de que tu archivo de backend se llame 'main.py'

# --- CONFIGURACIÓN ---

@pytest.fixture
def client():
    """Configura el cliente de pruebas de Flask."""
    app.config['TESTING'] = True
    # Crea un cliente de prueba usando el contexto de la aplicación
    with app.test_client() as client:
        yield client

# Helper para construir el payload JSON repetitivo
def build_payload(matrix, start, end, algo, is_directed=True):
    return {
        "matrix": matrix,
        "is_directed": is_directed,
        "start_node_index": start,
        "end_node_index": end,
        "algorithm": algo
    }

# --- PRUEBAS DE ENDPOINTS BÁSICOS ---

def test_index_route(client):
    """Verifica que la ruta raíz responda."""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Verifica que el mensaje contenga algo esperado o sea un string
    assert isinstance(data['message'], str)

def test_test_route(client):
    """Verifica la ruta de prueba simple."""
    response = client.get('/test')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "El test funcionó" in data['message']

# --- PRUEBAS DE LÓGICA DE GRAFOS (DIJKSTRA) ---

# HU-04 (Parte 1): Cálculo de ruta más corta con Dijkstra (solo pesos positivos)
def test_dijkstra_simple_path(client):
    """
    Escenario: A -> B (Peso 10) -> C (Peso 5). 
    Camino A(0) a C(2). Total: 15.
    """
    matrix = [
        ["", "10", ""],  # Nodo 0 (A)
        ["", "", "5"],   # Nodo 1 (B)
        ["", "", ""]     # Nodo 2 (C)
    ]
    payload = build_payload(matrix, 0, 2, "dijkstra")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['distance'] == 15
    assert data['path_indices'] == [0, 1, 2]
    assert data['path'] == "A -> B -> C"
    # Verificar que se generaron pasos
    assert len(data['steps']['steps']) > 0

# HU-04 (Parte 2): Dijkstra no debe funcionar con pesos negativos.
def test_dijkstra_negative_weight_rejection(client):
    """
    Escenario: Dijkstra falla si hay un peso negativo B -> C (Peso -5).
    """
    matrix = [
        ["", "10", ""],
        ["", "", "-5"], # Peso negativo
        ["", "", ""]
    ]
    payload = build_payload(matrix, 0, 2, "dijkstra")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['path'] == "Dijkstra no es compatible con pesos negativos. Use Bellman-Ford."
    assert data['distance'] == "N/A"
    # Verificar que el estado se capturó en los pasos
    assert data['steps']['steps'][-1]['negativeCycleDetected'] == False # No es ciclo negativo
    assert "Peso Negativo Detectado" in data['steps']['steps'][-1]['description']

def test_dijkstra_disconnected(client):
    """
    Escenario: A y B no tienen conexión (No hay camino).
    """
    matrix = [
        ["", ""],
        ["", ""]
    ]
    payload = build_payload(matrix, 0, 1, "dijkstra")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert data['distance'] == "No hay camino"
    assert len(data['path_indices']) == 0

# --- PRUEBAS DE LÓGICA DE GRAFOS (BELLMAN-FORD) ---

# HU-04 (Parte 3): Cálculo de ruta más corta con Bellman-Ford (con pesos negativos)
def test_bellman_ford_negative_weight(client):
    """
    Escenario: A -> B (Peso 10), B -> C (Peso -5).
    Total: 5. Bellman-Ford debe manejarlo.
    """
    matrix = [
        ["", "10", ""],
        ["", "", "-5"],
        ["", "", ""]
    ]
    payload = build_payload(matrix, 0, 2, "bellman-ford")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert data['distance'] == 5
    assert data['path_indices'] == [0, 1, 2]
    assert data['path'] == "A -> B -> C"
    assert len(data['steps']['steps']) > 0

# HU-04 (Parte 4): Bellman-Ford debe detectar ciclos negativos.
def test_bellman_ford_negative_cycle(client):
    """
    Escenario: Ciclo negativo. A -> B (1), B -> A (-5).
    Suma del ciclo: -4. El algoritmo debe detectarlo.
    """
    matrix = [
        ["", "1"],
        ["-5", ""]
    ]
    # Intentamos ir de A a B, pero hay un ciclo infinito negativo
    payload = build_payload(matrix, 0, 1, "bellman-ford")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert data['path'] == "Ciclo Negativo Detectado. La ruta más corta es indefinida."
    assert data['distance'] == "N/A"
    # Verificar que se detectó el ciclo negativo en los pasos
    assert data['steps']['steps'][-1]['negativeCycleDetected'] == True

# --- PRUEBAS DE CASOS BORDE (EDGE CASES) ---

def test_start_equals_end(client):
    """
    Escenario: El nodo de inicio es el mismo que el destino.
    Distancia debe ser 0.
    """
    matrix = [["0"]]
    payload = build_payload(matrix, 0, 0, "dijkstra")
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert data['distance'] == 0
    assert data['path_indices'] == [0]

# RF-02 / HU-02: Manejo de grafo no dirigido (Implícito en la construcción del grafo del backend)
def test_undirected_graph(client):
    """
    Escenario: Grafo no dirigido A -- B (Peso 5). 
    Se envía solo A->B=5, con flag is_directed=False. Se pide B->A.
    """
    matrix = [
        ["", "5"],
        ["", ""]
    ]
    # Pedimos ir de B(1) a A(0). Solo es posible si el grafo es no dirigido.
    payload = build_payload(matrix, 1, 0, "dijkstra", is_directed=False)
    
    response = client.post('/find_path', json=payload)
    data = json.loads(response.data)
    
    assert data['distance'] == 5
    assert data['path_indices'] == [1, 0]
    assert data['path'] == "B -> A"

# --- PRUEBAS DE ERROR Y VALIDACIÓN ---

def test_invalid_algorithm(client):
    """Prueba con un nombre de algoritmo que no existe."""
    matrix = [["0"]]
    payload = build_payload(matrix, 0, 0, "super-algoritmo")
    
    response = client.post('/find_path', json=payload)
    
    assert response.status_code == 400
    assert "Algoritmo no válido" in json.loads(response.data)['error']

# Prueba mejorada de malformed request (Código de estado 400 del backend)
def test_malformed_request_missing_key(client):
    """Envío de JSON incompleto (falta 'matrix'). El backend devuelve 400."""
    payload = {
        "start_node_index": 0,
        "end_node_index": 1,
        "algorithm": "dijkstra"
        # Falta 'matrix' y 'is_directed'
    }
    response = client.post('/find_path', json=payload)
    
    # El código de error del backend para JSON incompleto/inválido es 400
    assert response.status_code == 400 
    assert "Solicitud JSON inválida o incompleta" in json.loads(response.data)['error']

def test_invalid_matrix_value(client):
    """Envío de un valor no numérico en la matriz."""
    matrix = [
        ["", "cinco"], # Valor inválido
        ["", ""]
    ]
    payload = build_payload(matrix, 0, 1, "dijkstra")
    
    response = client.post('/find_path', json=payload)
    
    assert response.status_code == 400
    assert "La matriz debe contener solo números enteros" in json.loads(response.data)['error']

def test_options_cors(client):
    """Verifica que el preflight de CORS funcione."""
    response = client.open('/find_path', method='OPTIONS')
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers

# --- ESTO ES LO QUE FALTABA ---
if __name__ == "__main__":
    # Esto le dice a Python: "Si me ejecutan como script, lanza pytest sobre mi mismo archivo"
    # -v: verbose (muestra detalles)
    sys.exit(pytest.main(["-v", __file__]))