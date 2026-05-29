import { NextRequest, NextResponse } from "next/server"
import { getClima } from "@/lib/apis/clima"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") ?? "0")
  const lng = parseFloat(searchParams.get("lng") ?? "0")
  if (!lat || !lng) return NextResponse.json({ sucesso: false, erro: "lat e lng obrigatórios" }, { status: 400 })
  try {
    const dados = await getClima(lat, lng)
    return NextResponse.json({ data: dados, sucesso: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Erro ao buscar clima" }, { status: 500 })
  }
}
