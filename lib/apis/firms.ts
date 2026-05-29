// Wrapper para NASA FIRMS (Fire Information for Resource Management System)
// Dados de focos de calor via satélites MODIS/VIIRS
// Docs: https://firms.modaps.eosdis.nasa.gov/api/

const FIRMS_API_KEY = process.env.FIRMS_API_KEY ?? "DEMO_KEY"
const BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

export async function getFocosCalor(
  lat: number,
  lng: number,
  raioKm = 50,
  dias = 7
): Promise<number> {
  // Calcula bounding box aproximado a partir do centro e raio
  const grausLat = raioKm / 111
  const grausLng = raioKm / (111 * Math.cos((lat * Math.PI) / 180))

  const bbox = [
    (lng - grausLng).toFixed(4),
    (lat - grausLat).toFixed(4),
    (lng + grausLng).toFixed(4),
    (lat + grausLat).toFixed(4),
  ].join(",")

  try {
    const url = `${BASE}/${FIRMS_API_KEY}/VIIRS_SNPP_NRT/${bbox}/${dias}`
    const res = await fetch(url, { next: { revalidate: 3600 } })

    if (!res.ok) return 0

    const csv = await res.text()
    // Conta linhas de dados (exclui header)
    const linhas = csv.trim().split("\n").filter(Boolean)
    return Math.max(0, linhas.length - 1)
  } catch {
    // Se API key não disponível, retorna 0 (sem focos)
    return 0
  }
}
