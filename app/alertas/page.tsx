"use client"
import { useState, useCallback, useRef } from "react"
import {
  Search, MapPin, Loader2, AlertTriangle, CheckCircle,
  Droplets, Thermometer, Flame, Wind, Leaf,
} from "lucide-react"
import type { Municipio, Alerta, TipoAlerta } from "@/lib/types"
import { geocodarMunicipio } from "@/lib/apis/geocoding"
import { formatData } from "@/lib/utils"

const TIPO_INFO: Record<TipoAlerta, { label: string; icon: React.ReactNode; cor: string }> = {
  seca:           { label: "Seca",            icon: <Droplets className="w-4 h-4" />,    cor: "#D4AC0D" },
  excesso_hidrico:{ label: "Excesso hídrico", icon: <Droplets className="w-4 h-4" />,    cor: "#3B82F6" },
  calor_extremo:  { label: "Calor extremo",   icon: <Thermometer className="w-4 h-4" />, cor: "#E74C3C" },
  geada:          { label: "Geada",           icon: <Wind className="w-4 h-4" />,        cor: "#60A5FA" },
  queimada:       { label: "Queimada",        icon: <Flame className="w-4 h-4" />,       cor: "#F97316" },
  queda_ndvi:     { label: "Queda de NDVI",   icon: <Leaf className="w-4 h-4" />,        cor: "#6B7280" },
}

const FILTROS: { value: TipoAlerta | "todos"; label: string }[] = [
  { value: "todos",          label: "Todos" },
  { value: "seca",           label: "Seca" },
  { value: "calor_extremo",  label: "Calor extremo" },
  { value: "queimada",       label: "Queimada" },
  { value: "excesso_hidrico",label: "Excesso hídrico" },
  { value: "geada",          label: "Geada" },
]

export default function Alertas() {
  const [query, setQuery] = useState("")
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [municipioAtual, setMunicipioAtual] = useState<string>("")
  const [filtro, setFiltro] = useState<TipoAlerta | "todos">("todos")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buscar = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setMunicipios([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/municipios?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        if (json.sucesso) { setMunicipios(json.data); setShowDropdown(true) }
      } finally {
        setBuscando(false)
      }
    }, 300)
  }, [])

  const selecionar = async (m: Municipio) => {
    setShowDropdown(false)
    setQuery(`${m.nome} — ${m.uf}`)
    setCarregando(true)
    setAlertas([])
    setMunicipioAtual(`${m.nome} — ${m.uf}`)

    let { lat, lng } = m
    if (!lat || !lng) {
      const coords = await geocodarMunicipio(m.nome, m.uf)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }
    if (!lat || !lng) { setCarregando(false); return }

    try {
      const params = new URLSearchParams({
        lat: String(lat), lng: String(lng),
        id: String(m.id), nome: m.nome, uf: m.uf,
      })
      const res = await fetch(`/api/score?${params}`)
      const json = await res.json()
      if (json.sucesso) setAlertas(json.data.alertas ?? [])
    } finally {
      setCarregando(false)
    }
  }

  const alertasFiltrados = filtro === "todos"
    ? alertas
    : alertas.filter(a => a.tipo === filtro)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-green-700">Alertas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Alertas automáticos gerados por satélite e dados climáticos</p>
      </div>

      {/* Busca */}
      <div className="ts-card p-4">
        <p className="ts-label mb-2">Buscar alertas por município</p>
        <div className="relative">
          <input
            className="ts-input pr-9"
            placeholder="Ex: Patos, PB"
            value={query}
            autoComplete="off"
            onChange={e => { setQuery(e.target.value); buscar(e.target.value) }}
            onFocus={() => municipios.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {buscando
              ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              : <Search className="w-4 h-4 text-slate-400" />}
          </div>
          {showDropdown && municipios.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.09] rounded-xl shadow-lg z-50 overflow-hidden">
              {municipios.map(m => (
                <button
                  key={m.id}
                  onMouseDown={() => selecionar(m)}
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
      </div>

      {/* Filtros */}
      {alertas.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                filtro === f.value
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-slate-600 border-black/[0.08] hover:bg-slate-50"
              }`}
            >
              {f.label}
              {f.value !== "todos" && (
                <span className="ml-1.5 opacity-70">
                  ({alertas.filter(a => a.tipo === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {carregando && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="ts-skeleton rounded-xl h-24" />)}
        </div>
      )}

      {/* Vazio inicial */}
      {!carregando && alertas.length === 0 && !municipioAtual && (
        <div className="ts-card p-16 text-center text-slate-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">Nenhum município selecionado</p>
          <p className="text-sm mt-1">Busque acima para ver os alertas</p>
        </div>
      )}

      {/* Sem alertas */}
      {!carregando && municipioAtual && alertas.length === 0 && (
        <div className="ts-card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <p className="font-semibold text-slate-700">Nenhum alerta ativo</p>
          <p className="text-sm text-slate-500 mt-1">
            {municipioAtual} está com condições favoráveis no momento.
          </p>
        </div>
      )}

      {/* Lista de alertas */}
      {!carregando && alertasFiltrados.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <p className="text-sm text-slate-500">
            {alertasFiltrados.length} alerta(s) em <strong className="text-slate-700">{municipioAtual}</strong>
          </p>
          {alertasFiltrados.map(a => {
            const info = TIPO_INFO[a.tipo]
            return (
              <div
                key={a.id}
                className={`ts-card p-5 border-l-4 ${
                  a.nivel === "danger" ? "border-l-red-500" :
                  a.nivel === "warning" ? "border-l-amber-400" :
                  "border-l-green-500"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${info.cor}18`, color: info.cor }}
                  >
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-800">{a.titulo}</h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: `${info.cor}18`, color: info.cor }}
                      >
                        {info.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        a.nivel === "danger"  ? "bg-red-100 text-red-700" :
                        a.nivel === "warning" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {a.nivel === "danger" ? "Emergência" : a.nivel === "warning" ? "Atenção" : "Info"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{a.descricao}</p>
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Recomendação</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.recomendacao}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Emitido em {formatData(a.criado_em)} · Válido até {formatData(a.valido_ate)}
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
