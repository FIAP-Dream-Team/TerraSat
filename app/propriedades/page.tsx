"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Search, MapPin, Loader2, Plus, Trash2, Leaf,
  Thermometer, Droplets, CheckCircle, X,
} from "lucide-react"
import type { Municipio, NivelRisco } from "@/lib/types"
import { scoreLabel, ndviLabel, ndviCor, formatData } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"

const CULTURAS = [
  "Soja", "Milho", "Feijão", "Café", "Cana-de-açúcar",
  "Algodão", "Arroz", "Trigo", "Mandioca", "Tomate",
]

const NIVEL_COR = {
  danger:  "#db0000",
  warning: "#db9200",
  safe:    "#083a23",
}

interface PropriedadeSalva {
  id: string
  nome: string
  municipioId: number
  municipioNome: string
  uf: string
  lat: number
  lng: number
  areaHectares: number
  culturas: string[]
  criadaEm: string
  score?: number
  nivel?: NivelRisco
  ndvi?: number
  tempMax?: number
  precipitacao?: number
}

export default function Propriedades() {
  const [propriedades, setPropriedades] = useState<PropriedadeSalva[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loadingScores, setLoadingScores] = useState<Record<string, boolean>>({})

  const [nome, setNome] = useState("")
  const [area, setArea] = useState("")
  const [culturasSel, setCulturasSel] = useState<string[]>([])
  const [municipioForm, setMunicipioForm] = useState<Municipio | null>(null)
  const [queryForm, setQueryForm] = useState("")
  const [municipiosBusca, setMunicipiosBusca] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const salvas = localStorage.getItem("terrasat_propriedades")
    if (salvas) setPropriedades(JSON.parse(salvas))
  }, [])

  const salvarNoStorage = (lista: PropriedadeSalva[]) => {
    localStorage.setItem("terrasat_propriedades", JSON.stringify(lista))
    setPropriedades(lista)
  }

  const buscarMunicipio = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setMunicipiosBusca([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/municipios?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        if (json.sucesso) { setMunicipiosBusca(json.data); setShowDropdown(true) }
      } finally {
        setBuscando(false)
      }
    }, 300)
  }, [])

  const selecionarMunicipio = (m: Municipio) => {
    setMunicipioForm(m)
    setQueryForm(`${m.nome} — ${m.uf}`)
    setShowDropdown(false)
  }

  const toggleCultura = (c: string) => {
    setCulturasSel(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const salvarPropriedade = async () => {
    if (!nome.trim() || !municipioForm) return
    setSalvando(true)

    let { lat, lng } = municipioForm
    if (!lat || !lng) {
      const coords = await geocodarMunicipio(municipioForm.nome, municipioForm.uf)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }

    const nova: PropriedadeSalva = {
      id: `prop_${Date.now()}`,
      nome: nome.trim(),
      municipioId: municipioForm.id,
      municipioNome: municipioForm.nome,
      uf: municipioForm.uf,
      lat, lng,
      areaHectares: parseFloat(area) || 0,
      culturas: culturasSel,
      criadaEm: new Date().toISOString(),
    }

    const nova_lista = [...propriedades, nova]
    salvarNoStorage(nova_lista)

    if (lat && lng) {
      setLoadingScores(prev => ({ ...prev, [nova.id]: true }))
      fetch(`/api/score?lat=${lat}&lng=${lng}&id=${municipioForm.id}&nome=${municipioForm.nome}&uf=${municipioForm.uf}`)
        .then(r => r.json())
        .then(json => {
          if (json.sucesso) {
            setPropriedades(prev => {
              const atualizada = prev.map(p => p.id === nova.id
                ? { ...p, score: json.data.score, nivel: json.data.nivel, ndvi: json.data.ndvi, tempMax: json.data.temperatura_maxima_c, precipitacao: json.data.precipitacao_prevista_mm }
                : p
              )
              localStorage.setItem("terrasat_propriedades", JSON.stringify(atualizada))
              return atualizada
            })
          }
        })
        .finally(() => setLoadingScores(prev => ({ ...prev, [nova.id]: false })))
    }

    setNome(""); setArea(""); setCulturasSel([]); setMunicipioForm(null); setQueryForm("")
    setShowForm(false); setSalvando(false)
  }

  const remover = (id: string) => salvarNoStorage(propriedades.filter(p => p.id !== id))

  const atualizarScore = async (p: PropriedadeSalva) => {
    if (!p.lat || !p.lng) return
    setLoadingScores(prev => ({ ...prev, [p.id]: true }))
    try {
      const res = await fetch(`/api/score?lat=${p.lat}&lng=${p.lng}&id=${p.municipioId}&nome=${p.municipioNome}&uf=${p.uf}`)
      const json = await res.json()
      if (json.sucesso) {
        setPropriedades(prev => {
          const atualizada = prev.map(x => x.id === p.id
            ? { ...x, score: json.data.score, nivel: json.data.nivel, ndvi: json.data.ndvi, tempMax: json.data.temperatura_maxima_c, precipitacao: json.data.precipitacao_prevista_mm }
            : x
          )
          localStorage.setItem("terrasat_propriedades", JSON.stringify(atualizada))
          return atualizada
        })
      }
    } finally {
      setLoadingScores(prev => ({ ...prev, [p.id]: false }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "#0a0a0a" }}>
            Propriedades
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#737373" }}>
            Gerencie e monitore suas propriedades
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#083a23" }}
        >
          <Plus className="w-4 h-4" />
          Nova propriedade
        </button>
      </div>

      {/* Formulário de cadastro */}
      {showForm && (
        <div className="rounded-xl border overflow-hidden animate-slide-up"
          style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>

          {/* Cabeçalho do modal */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold" style={{ color: "#0a0a0a" }}>
                Cadastre sua propriedade
              </h2>
              <p className="text-sm mt-1" style={{ color: "#525252" }}>
                Receba alertas personalizados quando o score da sua região mudar.
              </p>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: "#737373" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="ts-label block mb-1.5">Nome da propriedade</label>
                <input
                  className="ts-input"
                  placeholder="Ex: Sítio São João"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
              <div>
                <label className="ts-label block mb-1.5">Área (hectares)</label>
                <input
                  className="ts-input"
                  placeholder="Ex: 12.5"
                  type="number"
                  min="0"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="ts-label block mb-1.5">Município</label>
              <div className="relative">
                <input
                  className="ts-input pr-9"
                  placeholder="Buscar município..."
                  value={queryForm}
                  autoComplete="off"
                  onChange={e => { setQueryForm(e.target.value); buscarMunicipio(e.target.value) }}
                  onFocus={() => municipiosBusca.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {buscando
                    ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    : <Search className="w-4 h-4 text-slate-400" />}
                </div>
                {showDropdown && municipiosBusca.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.09] rounded-xl shadow-lg z-50 overflow-hidden">
                    {municipiosBusca.map(m => (
                      <button
                        key={m.id}
                        onMouseDown={() => selecionarMunicipio(m)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium" style={{ color: "#0a0a0a" }}>{m.nome}</span>
                        <span className="text-xs ml-auto" style={{ color: "#737373" }}>{m.uf}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {municipioForm && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#0f5132" }} />
                  <p className="text-xs font-medium" style={{ color: "#0f5132" }}>
                    {municipioForm.nome} — {municipioForm.uf} selecionado
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="ts-label block mb-2">Culturas (opcional)</label>
              <div className="flex flex-wrap gap-2">
                {CULTURAS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCultura(c)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors font-medium"
                    style={culturasSel.includes(c)
                      ? { backgroundColor: "#083a23", color: "#fafafa", borderColor: "#083a23" }
                      : { backgroundColor: "#ffffff", color: "#525252", borderColor: "rgba(0,0,0,0.1)" }
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2 space-y-2">
              <button
                onClick={salvarPropriedade}
                disabled={!nome.trim() || !municipioForm || salvando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#083a23" }}
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Cadastrar e receber alertas
              </button>
              <p className="text-xs text-center" style={{ color: "#737373" }}>
                Seus dados são protegidos. Notificações por e-mail ou WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {propriedades.length === 0 && !showForm && (
        <div className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
          <Leaf className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "#525252" }} />
          <p className="text-base font-medium" style={{ color: "#525252" }}>
            Nenhuma propriedade cadastrada
          </p>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Clique em "Nova propriedade" para começar
          </p>
        </div>
      )}

      {/* Cards de propriedades */}
      {propriedades.length > 0 && (
        <div className="space-y-4">
          {propriedades.map(p => {
            const cor = p.nivel ? NIVEL_COR[p.nivel] : "#083a23"
            return (
              <div key={p.id} className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>

                {/* Tira colorida de score */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white"
                    style={{ backgroundColor: cor }}
                  >
                    {loadingScores[p.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : p.score !== undefined ? (
                      <>
                        <span className="font-display font-bold text-xl leading-none">{p.score}</span>
                        <span className="text-[9px] font-medium opacity-80 mt-0.5 uppercase">score</span>
                      </>
                    ) : (
                      <Leaf className="w-5 h-5 opacity-60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold" style={{ color: "#0a0a0a" }}>{p.nome}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" style={{ color: "#a3a3a3" }} />
                          <p className="text-sm" style={{ color: "#525252" }}>
                            {p.municipioNome} — {p.uf}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.nivel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: cor }}>
                            {scoreLabel(p.nivel)}
                          </span>
                        )}
                        <button
                          onClick={() => atualizarScore(p)}
                          disabled={loadingScores[p.id]}
                          className="text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "#083a23" }}
                        >
                          Atualizar
                        </button>
                        <button
                          onClick={() => remover(p.id)}
                          className="p-1 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: "#a3a3a3" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {p.areaHectares > 0 && (
                        <div className="flex items-center gap-1">
                          <Leaf className="w-3.5 h-3.5" style={{ color: "#a3a3a3" }} />
                          <span className="text-xs" style={{ color: "#525252" }}>{p.areaHectares} ha</span>
                        </div>
                      )}
                      {p.ndvi !== undefined && (
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: ndviCor(p.ndvi) }} />
                          <span className="text-xs" style={{ color: "#525252" }}>
                            NDVI {p.ndvi.toFixed(2)} · {ndviLabel(p.ndvi)}
                          </span>
                        </div>
                      )}
                      {p.tempMax !== undefined && (
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs" style={{ color: "#525252" }}>{p.tempMax}°C</span>
                        </div>
                      )}
                      {p.precipitacao !== undefined && (
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs" style={{ color: "#525252" }}>{p.precipitacao}mm</span>
                        </div>
                      )}
                      {p.culturas.length > 0 && (
                        <span className="text-xs" style={{ color: "#737373" }}>
                          {p.culturas.join(", ")}
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-1.5" style={{ color: "#a3a3a3" }}>
                      Cadastrada em {formatData(p.criadaEm)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
