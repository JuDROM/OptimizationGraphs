
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:5000";

export async function findPath(payload: any) {
  const res = await fetch(`${BACKEND}/find_path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data;
}
