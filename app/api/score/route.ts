import { NextRequest, NextResponse } from "next/server"
import { calcularScore } from "@/lib/score-engine"
import { getNDVI } from "@/lib/apis/ndvi"
import { getPrecipitacaoPrevista, getClima } from "@/lib/apis/clima"
import { getFocosCalor } from "@/lib/apis/firms"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat  = parseFloat(searchParams.get("lat")  ?? "0")
  const lng  = parseFloat(searchParams.get("lng")  ?? "0")
  const id   = parseInt(searchParams.get("id")     ?? "0")
  const nome = searchParams.get("nome") ?? "Município"
  const uf   = searchParams.get("uf")  ?? "BR"

  if (!lat || !lng) {
    return NextResponse.json({ sucesso: false, erro: "lat e lng são obrigatórios" }, { status: 400 })
  }

  try {
    const [ndvi, precipitacao, clima, focos] = await Promise.all([
      getNDVI(lat, lng),
      getPrecipitacaoPrevista(lat, lng, 15),
      getClima(lat, lng),
      getFocosCalor(lat, lng),
    ])

    const resultado = calcularScore(
      { ndvi, precipitacao_prevista_mm: precipitacao, temperatura_maxima_c: clima.temperatura_maxima_c, focos_calor_proximos: focos },
      id, nome, uf
    )

    return NextResponse.json({ data: { ...resultado, clima }, sucesso: true, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error("[/api/score]", err)
    return NextResponse.json({ sucesso: false, erro: "Erro ao calcular score" }, { status: 500 })
  }
}
