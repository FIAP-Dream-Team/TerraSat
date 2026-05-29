import { NextRequest, NextResponse } from "next/server"
import { buscarMunicipio } from "@/lib/apis/ibge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json({ data: [], sucesso: true, timestamp: new Date().toISOString() })
  try {
    const municipios = await buscarMunicipio(q)
    return NextResponse.json({ data: municipios, sucesso: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Erro ao buscar municípios" }, { status: 500 })
  }
}
