// Wrapper para Sentinel Hub (ESA) — NDVI por coordenada
// Usa API pública de estatísticas
// Docs: https://docs.sentinel-hub.com/api/latest/

// Por ora, simula NDVI com variação realista baseada em lat/lng e época do ano
// Em produção: substituir pela chamada real ao Sentinel Hub Statistical API

export async function getNDVI(lat: number, lng: number): Promise<number> {
  const SENTINEL_KEY = process.env.SENTINEL_HUB_CLIENT_ID

  if (SENTINEL_KEY) {
    // TODO: implementar chamada real ao Sentinel Hub
    // POST https://services.sentinel-hub.com/api/v1/statistics
  }

  // Simulação determinística baseada em coordenadas (demo sem API key)
  return simularNDVI(lat, lng)
}

function simularNDVI(lat: number, lng: number): number {
  // Semiárido nordestino → NDVI mais baixo
  const nordeste = lat > -15 && lat < -2 && lng > -45 && lng < -35
  // Amazônia → NDVI alto
  const amazonia = lat > -10 && lat < 5 && lng > -73 && lng < -50
  // Sul do Brasil → NDVI moderado-alto
  const sul = lat < -23 && lat > -33

  const mes = new Date().getMonth() + 1
  const estacaoSeca = mes >= 6 && mes <= 9

  let base: number
  if (amazonia)        base = 0.75
  else if (nordeste)   base = estacaoSeca ? 0.18 : 0.32
  else if (sul)        base = estacaoSeca ? 0.45 : 0.62
  else                 base = estacaoSeca ? 0.35 : 0.52

  // Adiciona variação pseudo-aleatória determinística
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453)
  const variacao = ((seed % 1) - 0.5) * 0.15

  return Math.min(1, Math.max(0, Math.round((base + variacao) * 100) / 100))
}
