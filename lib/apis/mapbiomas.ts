// MapBiomas Collection 9 — uso do solo por município
// API pública, sem autenticação necessária
// Docs: https://api.mapbiomas.org/

export interface DadosMapBiomas {
  bioma: string
  usoAgricola: number      // % da área do município
  vegetacaoNativa: number  // %
  pastagem: number         // %
  anoReferencia: number
  fonte: string
}

// Bioma predominante por UF (simplificado para municípios sem dado)
const BIOMA_POR_UF: Record<string, string> = {
  AM: "Amazônia",  PA: "Amazônia",  RO: "Amazônia",  AC: "Amazônia",
  RR: "Amazônia",  AP: "Amazônia",  TO: "Cerrado",
  MA: "Cerrado",   PI: "Caatinga",  CE: "Caatinga",  RN: "Caatinga",
  PB: "Caatinga",  PE: "Caatinga",  AL: "Mata Atlântica",
  SE: "Caatinga",  BA: "Caatinga",  MG: "Cerrado",
  ES: "Mata Atlântica", RJ: "Mata Atlântica", SP: "Mata Atlântica",
  PR: "Mata Atlântica", SC: "Mata Atlântica", RS: "Pampa",
  MS: "Cerrado",   MT: "Cerrado",   GO: "Cerrado",   DF: "Cerrado",
}

// IDs de classe MapBiomas Collection 9
const IDS_VEGNATVA = [3, 4, 5, 6, 11, 12, 32, 49, 50]
const IDS_AGRICULTURA = [39, 20, 40, 41, 62, 36]
const IDS_PASTAGEM = [15]

export async function buscarDadosMapBiomas(
  ibgeId: number,
  uf: string
): Promise<DadosMapBiomas> {
  const fallback: DadosMapBiomas = {
    bioma: BIOMA_POR_UF[uf] ?? "Brasil",
    usoAgricola: 0,
    vegetacaoNativa: 0,
    pastagem: 0,
    anoReferencia: 2022,
    fonte: "estimado",
  }

  try {
    // MapBiomas GraphQL Statistics API (pública, sem auth)
    const geocode = String(ibgeId).padStart(7, "0")
    const query = `{
      allMapbiomasClassStatistics(geocode: "${geocode}", year: 2022) {
        classId
        area
      }
    }`

    const res = await fetch("https://api.mapbiomas.org/api/v1/statistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return fallback
    const json = await res.json()
    const stats: { classId: number; area: number }[] =
      json?.data?.allMapbiomasClassStatistics ?? []

    if (!stats.length) return { ...fallback, bioma: BIOMA_POR_UF[uf] ?? "Brasil" }

    const total = stats.reduce((s, c) => s + (c.area || 0), 0)
    if (total === 0) return fallback

    const soma = (ids: number[]) =>
      stats.filter(c => ids.includes(c.classId)).reduce((s, c) => s + c.area, 0)

    return {
      bioma: BIOMA_POR_UF[uf] ?? "Brasil",
      usoAgricola: Math.round((soma(IDS_AGRICULTURA) / total) * 100),
      vegetacaoNativa: Math.round((soma(IDS_VEGNATVA) / total) * 100),
      pastagem: Math.round((soma(IDS_PASTAGEM) / total) * 100),
      anoReferencia: 2022,
      fonte: "MapBiomas",
    }
  } catch {
    return fallback
  }
}
