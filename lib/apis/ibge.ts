// Wrapper para API do IBGE
// Docs: https://servicodados.ibge.gov.br/api/docs

import type { Municipio } from "../types"

const BASE = "https://servicodados.ibge.gov.br/api/v1"

export async function getMunicipiosPorUF(uf: string): Promise<Municipio[]> {
  const res = await fetch(`${BASE}/localidades/estados/${uf}/municipios`, {
    next: { revalidate: 86400 }, // cache 24h
  })
  if (!res.ok) throw new Error(`IBGE error: ${res.status}`)

  const data = await res.json()
  return data.map((m: { id: number; nome: string }) => ({
    id:   m.id,
    nome: m.nome,
    uf:   uf.toUpperCase(),
    lat:  0,
    lng:  0,
  }))
}

export async function getMunicipio(id: number): Promise<Municipio | null> {
  const res = await fetch(`${BASE}/localidades/municipios/${id}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null

  const m = await res.json()
  return {
    id:   m.id,
    nome: m.nome,
    uf:   m.microrregiao?.mesorregiao?.UF?.sigla ?? "",
    lat:  0,
    lng:  0,
  }
}

export async function buscarMunicipio(query: string): Promise<Municipio[]> {
  const res = await fetch(
    `${BASE}/localidades/municipios?orderBy=nome`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return []

  const data = await res.json()
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  return data
    .filter((m: { nome: string }) => {
      const nome = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return nome.includes(q)
    })
    .slice(0, 8)
    .map((m: { id: number; nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } }) => ({
      id:   m.id,
      nome: m.nome,
      uf:   m.microrregiao?.mesorregiao?.UF?.sigla ?? "",
      lat:  0,
      lng:  0,
    }))
}
