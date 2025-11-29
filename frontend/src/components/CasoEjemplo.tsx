import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Datos del grafo (Meta, Colombia) — dataset completo proporcionado por el usuario
const graphData = {
  "nodes": [
  {"id":"Villavicencio","lat":4.151382,"lon":-73.637688},
  {"id":"Restrepo","lat":4.250000,"lon":-73.566700},
  {"id":"Cumaral","lat":4.271262,"lon":-73.488052},
  {"id":"Ciudad Porfia","lat":4.151382,"lon":-73.637688},
  {"id":"Acacias","lat":3.987778,"lon":-73.759722},
  {"id":"Guamal","lat":3.880430,"lon":-73.765660},
  {"id":"Cubarral","lat":3.791864,"lon":-73.841283},
  {"id":"El dorado","lat":3.737759,"lon":-73.834519},
  {"id":"El castillo","lat":3.561365,"lon":-73.794418},
  {"id":"San Martin","lat":3.696370,"lon":-73.699570},
  {"id":"Granada","lat":3.546250,"lon":-73.706870},
  {"id":"San juan de arama","lat":3.346450,"lon":-73.889410},
  {"id":"Fuente de oro","lat":3.462600,"lon":-73.621600},
  {"id":"Puerto limon","lat":3.369770,"lon":-73.488230},
  {"id":"Puerto lleras","lat":3.268933,"lon":-73.377357},
  {"id":"Mesetas","lat":3.378060,"lon":-74.044700},
  {"id":"vistahermosa","lat":3.127883,"lon":-73.752512},
  {"id":"santa rosa","lat":4.030530,"lon":-73.476520},
  {"id":"surimena","lat":3.850000,"lon":-73.283333},
  {"id":"san carlos de guaroa","lat":3.711110,"lon":-73.242500},
  {"id":"pachaquiaro","lat":4.056320,"lon":-73.173180},
  {"id":"Puerto Lopez","lat":4.085013,"lon":-72.958467},
  {"id":"Puerto Gaitan","lat":4.313000,"lon":-72.083000}
],
  "edges": [
    {"u":"Villavicencio","v":"Restrepo","w":17.37},
    {"u":"Restrepo","v":"Cumaral","w":12.92},
    {"u":"Villavicencio","v":"Ciudad Porfia","w":0.0},
    {"u":"Ciudad Porfia","v":"Acacias","w":22.22},
    {"u":"Villavicencio","v":"Puerto Lopez","w":74.18},
    {"u":"Acacias","v":"Guamal","w":12.27},
    {"u":"Guamal","v":"Cubarral","w":35.09},
    {"u":"Cubarral","v":"El dorado","w":34.64},
    {"u":"El dorado","v":"El castillo","w":35.16},
    {"u":"Guamal","v":"San Martin","w":19.39},
    {"u":"San Martin","v":"Granada","w":26.26},
    {"u":"El castillo","v":"Granada","w":22.25},
    {"u":"Granada","v":"Fuente de oro","w":12.50},
    {"u":"Granada","v":"San juan de arama","w":24.19},
    {"u":"Fuente de oro","v":"Puerto limon","w":3.24},
    {"u":"Puerto limon","v":"Puerto lleras","w":42.65},
    {"u":"San juan de arama","v":"Mesetas","w":125.80},
    {"u":"San juan de arama","v":"vistahermosa","w":40.31},
    {"u":"Villavicencio","v":"santa rosa","w":43.69},
    {"u":"santa rosa","v":"surimena","w":56.69},
    {"u":"surimena","v":"san carlos de guaroa","w":58.03},
    {"u":"santa rosa","v":"pachaquiaro","w":70.31},
    {"u":"pachaquiaro","v":"Puerto lleras","w":48.04},
    {"u":"Puerto lleras","v":"Puerto Gaitan","w":184.31}
  ],
  "weight": {
    "type": "distancia_km",
    "compute": "haversine",
    "unit": "km"
  }
};

// Construir matriz de adyacencia
const nodeIndex: Record<string, number> = {};
graphData.nodes.forEach((n, i) => (nodeIndex[n.id] = i));
const size = graphData.nodes.length;
const adjMatrix: Array<Array<number | string>> = Array.from({ length: size }, () =>
  Array(size).fill("")
);
graphData.edges.forEach(({ u, v, w: weight }) => {
  const i = nodeIndex[u];
  const j = nodeIndex[v];
  const w = weight;
  adjMatrix[i][j] = w !== undefined ? w : "";
  adjMatrix[j][i] = w !== undefined ? w : "";
});

function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Crear el mapa
      const map = L.map(mapRef.current!).setView([4.1, -73.6], 8);

      // Agregar capa de mosaicos
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Dibujar aristas
      graphData.edges.forEach(({ u, v, w }) => {
        const nu = graphData.nodes.find((n) => n.id === u);
        const nv = graphData.nodes.find((n) => n.id === v);
        if (!nu || !nv) return;
        const weight = w;
        const latlngs: Array<[number, number]> = [
          [nu.lat, nu.lon],
          [nv.lat, nv.lon],
        ];

        L.polyline(latlngs, {
          color: "#007bff",
          weight: 3,
          opacity: 0.7,
        })
          .bindPopup(`${u} → ${v}<br/>Peso: ${weight}`)
          .addTo(map);
      });

      // Dibujar nodos
      graphData.nodes.forEach((n) => {
        L.circleMarker([n.lat, n.lon], {
          radius: 8,
          fillColor: "#007bff",
          color: "#004a8f",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(n.id)
          .addTo(map);
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current && typeof mapInstanceRef.current === "object" && "remove" in mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: 12 }} />;
}

const CasoEjemplo: React.FC<{ onClose: () => void; darkMode?: boolean }> = ({ onClose, darkMode = false }) => {
  return (
    <div className={`modal-bg ${darkMode ? 'dark-mode' : ''}`}>
      <div className="modal-content">
        <button className="btn close-btn" onClick={onClose}>
          Cerrar
        </button>
        <h2>Grafo de Ejemplo: Meta, Colombia</h2>
        <p style={{ fontSize: 13, lineHeight: 1.4 }}>
          El Departamento del Meta – este ejemplo utiliza ubicaciones aproximadas de
          municipios y las conexiones eléctricas entre ellos, tomadas como referencia
          de la Electrificadora del Meta (EMSA). El grafo muestra nodos en posiciones
          geográficas fijas y aristas que representan las líneas de conexión. El peso
          de cada arista está dado por el campo <code>w</code> en el dataset y expresa
          un valor numérico asociado al nivel relativo de tensión / costo / distancia
          (según los datos disponibles). Los marcadores en el mapa son estáticos
          (no arrastrables) para preservar la fidelidad geográfica.
        </p>
        <div style={{ display: "flex", gap: 24, maxHeight: "600px" }}>
          <div style={{ width: 600, height: 500, flex: "0 0 600px" }}>
            <MapComponent />
            <div style={{ fontSize: 12, marginTop: 8 }}>
              <b>Leyenda:</b> <span style={{ color: "#007bff" }}>Azul</span> =
              conexión, <b>Peso</b> = nivel de tensión eléctrica (g1)
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <h3>Matriz de Adyacencia</h3>
            <table className="adjacency-matrix" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th></th>
                  {graphData.nodes.map((n) => (
                    <th key={n.id} title={n.id}>
                      {n.id.substring(0, 5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adjMatrix.map((row, i) => (
                  <tr key={i}>
                    <th title={graphData.nodes[i].id}>
                      {graphData.nodes[i].id.substring(0, 5)}
                    </th>
                    {row.map((val, j) => (
                      <td key={j} style={{ textAlign: "center" }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .modal-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.35);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-bg.dark-mode {
          background: rgba(0, 0, 0, 0.7);
        }
        .modal-content {
          background: #fff;
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-bg.dark-mode .modal-content {
          background: #1e293b;
          color: #f8fafc;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .modal-bg.dark-mode .modal-content h2,
        .modal-bg.dark-mode .modal-content h3 {
          color: #f8fafc;
        }
        .modal-bg.dark-mode .modal-content p {
          color: #cbd5e1;
        }
        .modal-bg.dark-mode .modal-content code {
          background: #0f172a;
          color: #818cf8;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .close-btn {
          float: right;
          margin-bottom: 12px;
        }
        .modal-bg.dark-mode .close-btn {
          background: #4f46e5;
          color: white;
        }
        .modal-bg.dark-mode .close-btn:hover {
          background: #4338ca;
        }
        .adjacency-matrix {
          border-collapse: collapse;
          margin-top: 12px;
          width: 100%;
        }
        .adjacency-matrix th,
        .adjacency-matrix td {
          border: 1px solid #e0e0e0;
          padding: 4px 6px;
          font-size: 10px;
        }
        .modal-bg.dark-mode .adjacency-matrix th,
        .modal-bg.dark-mode .adjacency-matrix td {
          border-color: #475569;
        }
        .adjacency-matrix th {
          background: #007bff;
          color: #fff;
          font-weight: 600;
        }
        .modal-bg.dark-mode .adjacency-matrix th {
          background: #4f46e5;
        }
        .modal-bg.dark-mode .adjacency-matrix td {
          background: #0f172a;
          color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default CasoEjemplo;
