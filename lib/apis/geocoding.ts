export async function geocodarMunicipio(
  nome: string,
  uf: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=8&language=pt&format=json`,
      { cache: "force-cache" }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.length) return null

    const resultados = data.results.filter(
      (r: { country_code: string }) => r.country_code === "BR"
    )
    if (!resultados.length) return null

    // Tenta achar o que menciona a UF no admin1
    const match = resultados.find((r: { admin1?: string }) =>
      r.admin1?.toLowerCase().includes(uf.toLowerCase())
    )
    const resultado = match ?? resultados[0]
    return { lat: resultado.latitude, lng: resultado.longitude }
  } catch {
    return null
  }
}
