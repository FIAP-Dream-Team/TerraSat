import { NextRequest, NextResponse } from "next/server"
import { buscarDadosMapBiomas } from "@/lib/apis/mapbiomas"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ibgeId = Number(searchParams.get("id"))
  const uf = searchParams.get("uf") ?? ""

  if (!ibgeId || !uf) {
    return NextResponse.json({ sucesso: false, erro: "id e uf obrigatórios" }, { status: 400 })
  }

  const dados = await buscarDadosMapBiomas(ibgeId, uf)
  return NextResponse.json({ sucesso: true, data: dados })
}
