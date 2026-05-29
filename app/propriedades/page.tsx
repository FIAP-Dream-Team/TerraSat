"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Search, MapPin, Loader2, Plus, Trash2, Leaf,
  Thermometer, Droplets, AlertTriangle, X, CheckCircle,
} from "lucide-react"
import type { Municipio, NivelRisco } from "@/lib/types"
import { scoreLabel, scoreBg, ndviLabel, ndviCor, formatData } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"

const CULTURAS = [
  "Soja", "Milho", "Feijão", "Café", "Cana-de-açúcar",
  "Algodão", "Arroz", "Trigo", "Mandioca", "Tomate",
]

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

  // Form state
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

    // Busca score em background
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

    // Reset form
    setNome(""); setArea(""); setCulturasSel([]); setMunicipioForm(null); setQueryForm("")
    setShowForm(false); setSalvando(false)
  }

  const remover = (id: string) => {
    const lista = propriedades.filter(p => p.id !== id)
    salvarNoStorage(lista)
  }

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

  const nivelCor = (nivel?: NivelRisco) =>
    nivel === "danger" ? "#E74C3C" : nivel === "warning" ? "#D4AC0D" : "#2E7D52"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-green-700">Propriedades</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie e monitore suas propriedades</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="ts-btn ts-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova propriedade
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="ts-card p-6 border border-green-100 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800">Cadastrar nova propriedade</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className="ts-label block mb-1.5">Nome da propriedade</label>
                <input
                  className="ts-input"
                  placeholder="Ex: Sítio São João"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>

              {/* Área */}
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

            {/* Município */}
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
                        <span className="font-medium text-slate-800">{m.nome}</span>
                        <span className="text-xs text-slate-400 ml-auto">{m.uf}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {municipioForm && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">
                    {municipioForm.nome} — {municipioForm.uf} selecionado
                  </p>
                </div>
              )}
            </div>

            {/* Culturas */}
            <div>
              <label className="ts-label block mb-2">Culturas (opcional)</label>
              <div className="flex flex-wrap gap-2">
                {CULTURAS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCultura(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                      culturasSel.includes(c)
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-slate-600 border-black/[0.08] hover:bg-slate-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={salvarPropriedade}
                disabled={!nome.trim() || !municipioForm || salvando}
                className="ts-btn ts-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Salvar propriedade
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="ts-btn ts-btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {propriedades.length === 0 && !showForm && (
        <div className="ts-card p-16 text-center text-slate-400">
          <Leaf className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium text-slate-600">Nenhuma propriedade cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova propriedade" para começar</p>
        </div>
      )}

      {/* Cards de propriedades */}
      {propriedades.length > 0 && (
        <div className="space-y-4">
          {propriedades.map(p => (
            <div key={p.id} className="ts-card p-5">
              <div className="flex items-start gap-4">
                {/* Score badge */}
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white"
                  style={{ background: nivelCor(p.nivel) }}
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

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">{p.nome}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-500">{p.municipioNome} — {p.uf}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.nivel && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${nivelCor(p.nivel)}18`, color: nivelCor(p.nivel) }}
                        >
                          {scoreLabel(p.nivel)}
                        </span>
                      )}
                      <button
                        onClick={() => atualizarScore(p)}
                        disabled={loadingScores[p.id]}
                        className="text-xs text-green-700 hover:text-green-800 font-medium disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Atualizar
                      </button>
                      <button
                        onClick={() => remover(p.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {p.areaHectares > 0 && (
                      <div className="flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-600">{p.areaHectares} ha</span>
                      </div>
                    )}
                    {p.ndvi !== undefined && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ndviCor(p.ndvi) }} />
                        <span className="text-xs text-slate-600">NDVI {p.ndvi.toFixed(2)} · {ndviLabel(p.ndvi)}</span>
                      </div>
                    )}
                    {p.tempMax !== undefined && (
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs text-slate-600">{p.tempMax}°C</span>
                      </div>
                    )}
                    {p.precipitacao !== undefined && (
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-slate-600">{p.precipitacao}mm previstos</span>
                      </div>
                    )}
                    {p.culturas.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">
                          {p.culturas.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    Cadastrada em {formatData(p.criadaEm)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
