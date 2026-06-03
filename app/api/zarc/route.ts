import { NextRequest, NextResponse } from "next/server"
import { consultarZarc } from "@/lib/apis/zarc"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uf = searchParams.get("uf") ?? ""
  const culturasParam = searchParams.get("culturas") ?? ""

  if (!uf) {
    return NextResponse.json({ sucesso: false, erro: "uf obrigatório" }, { status: 400 })
  }

  const culturas = culturasParam ? culturasParam.split(",").map(c => c.trim()) : []
  const dados = consultarZarc(uf, culturas)
  return NextResponse.json({ sucesso: true, data: dados })
}
