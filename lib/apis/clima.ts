// Wrapper para Open-Meteo (gratuito, sem API key)
// Docs: https://open-meteo.com/en/docs

import type { DadosClima, PrevisaoDia } from "../types"

const BASE_URL = "https://api.open-meteo.com/v1/forecast"

export async function getClima(lat: number, lng: number): Promise<DadosClima> {
  const params = new URLSearchParams({
    latitude:           lat.toString(),
    longitude:          lng.toString(),
    current:            "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    daily:              "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone:           "America/Sao_Paulo",
    forecast_days:      "7",
    wind_speed_unit:    "kmh",
  })

  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: 3600 } })

  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)

  const json = await res.json()
  const c = json.current
  const d = json.daily

  const previsao_7dias: PrevisaoDia[] = d.time.map((data: string, i: number) => ({
    data,
    temp_max:       Math.round(d.temperature_2m_max[i]),
    temp_min:       Math.round(d.temperature_2m_min[i]),
    precipitacao_mm: Math.round(d.precipitation_sum[i] * 10) / 10,
    descricao:      descricaoWMO(d.weather_code[i]),
  }))

  return {
    temperatura_atual_c:  Math.round(c.temperature_2m),
    temperatura_maxima_c: Math.round(d.temperature_2m_max[0]),
    temperatura_minima_c: Math.round(d.temperature_2m_min[0]),
    umidade_percent:      Math.round(c.relative_humidity_2m),
    precipitacao_mm:      Math.round(c.precipitation * 10) / 10,
    vento_kmh:            Math.round(c.wind_speed_10m),
    descricao:            descricaoWMO(c.weather_code),
    previsao_7dias,
  }
}

// Precipitação prevista acumulada para os próximos N dias
export async function getPrecipitacaoPrevista(lat: number, lng: number, dias = 15): Promise<number> {
  const params = new URLSearchParams({
    latitude:      lat.toString(),
    longitude:     lng.toString(),
    daily:         "precipitation_sum",
    timezone:      "America/Sao_Paulo",
    forecast_days: Math.min(dias, 16).toString(),
  })

  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) return 0

  const json = await res.json()
  const soma = (json.daily?.precipitation_sum ?? []).reduce((a: number, b: number) => a + b, 0)
  return Math.round(soma * 10) / 10
}

// Mapeamento de código WMO para descrição
function descricaoWMO(code: number): string {
  const map: Record<number, string> = {
    0: "Céu limpo", 1: "Predominantemente limpo", 2: "Parcialmente nublado", 3: "Nublado",
    45: "Névoa", 48: "Névoa com geada",
    51: "Garoa leve", 53: "Garoa moderada", 55: "Garoa densa",
    61: "Chuva leve", 63: "Chuva moderada", 65: "Chuva forte",
    71: "Neve leve", 73: "Neve moderada", 75: "Neve intensa",
    80: "Pancadas de chuva leve", 81: "Pancadas de chuva", 82: "Pancadas intensas",
    95: "Tempestade", 96: "Tempestade com granizo", 99: "Tempestade severa",
  }
  return map[code] ?? "Condição variável"
}
