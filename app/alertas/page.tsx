"use client"
import { useState, useCallback, useRef } from "react"
import {
  Search, MapPin, Loader2, AlertTriangle, CheckCircle,
  Droplets, Thermometer, Flame, Wind, Leaf, Bell,
} from "lucide-react"
import type { Municipio, Alerta, TipoAlerta } from "@/lib/types"
import { geocodarMunicipio } from "@/lib/apis/geocoding"
import { formatData } from "@/lib/utils"

const TIPO_INFO: Record<TipoAlerta, { label: string; icon: React.ReactNode }> = {
  seca:           { label: "Seca",            icon: <Droplets className="w-4 h-4" /> },
  excesso_hidrico:{ label: "Excesso hídrico", icon: <Droplets className="w-4 h-4" /> },
  calor_extremo:  { label: "Calor extremo",   icon: <Thermometer className="w-4 h-4" /> },
  geada:          { label: "Geada",           icon: <Wind className="w-4 h-4" /> },
  queimada:       { label: "Queimada",        icon: <Flame className="w-4 h-4" /> },
  queda_ndvi:     { label: "Queda de NDVI",   icon: <Leaf className="w-4 h-4" /> },
}

const NIVEL_STYLE = {
  danger:  { bg: "#db0000", dark: "#840000", label: "Risco alto" },
  warning: { bg: "#ffc233", dark: "#db9200", label: "Atenção" },
  safe:    { bg: "#083a23", dark: "#051f13", label: "Normal" },
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
  const [scoreAtual, setScoreAtual] = useState<number | null>(null)
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
      if (json.sucesso) {
        setAlertas(json.data.alertas ?? [])
        setScoreAtual(json.data.score)
      }
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
        <h1 className="font-display text-2xl font-bold" style={{ color: "#0a0a0a" }}>Alertas</h1>
        <p className="text-sm mt-0.5" style={{ color: "#737373" }}>
          Alertas automáticos gerados por satélite e dados climáticos
        </p>
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
                  <span className="font-medium" style={{ color: "#0a0a0a" }}>{m.nome}</span>
                  <span className="text-xs ml-auto" style={{ color: "#737373" }}>{m.uf}</span>
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
              className="text-sm px-3 py-1.5 rounded-full font-medium transition-colors border"
              style={filtro === f.value
                ? { backgroundColor: "#083a23", color: "#fafafa", borderColor: "#083a23" }
                : { backgroundColor: "#fafafa", color: "#525252", borderColor: "rgba(0,0,0,0.1)" }
              }
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
          {[1, 2, 3].map(i => <div key={i} className="ts-skeleton rounded-xl h-40" />)}
        </div>
      )}

      {/* Vazio inicial */}
      {!carregando && alertas.length === 0 && !municipioAtual && (
        <div className="ts-card p-16 text-center" style={{ color: "#737373" }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium" style={{ color: "#525252" }}>Nenhum município selecionado</p>
          <p className="text-sm mt-1">Busque acima para ver os alertas</p>
        </div>
      )}

      {/* Sem alertas */}
      {!carregando && municipioAtual && alertas.length === 0 && (
        <div className="ts-card p-12 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "#e8f5ee" }}>
            <CheckCircle className="w-7 h-7" style={{ color: "#0f5132" }} />
          </div>
          <p className="font-semibold" style={{ color: "#0a0a0a" }}>Nenhum alerta ativo</p>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            {municipioAtual} está com condições favoráveis no momento.
          </p>
        </div>
      )}

      {/* Lista de alertas */}
      {!carregando && alertasFiltrados.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm" style={{ color: "#737373" }}>
            {alertasFiltrados.length} alerta(s) em{" "}
            <strong style={{ color: "#0a0a0a" }}>{municipioAtual}</strong>
            {scoreAtual !== null && (
              <span> · Score de Risco: <strong style={{ color: "#0a0a0a" }}>{scoreAtual}</strong></span>
            )}
          </p>

          {alertasFiltrados.map(a => {
            const info = TIPO_INFO[a.tipo]
            const nivel = NIVEL_STYLE[a.nivel] ?? NIVEL_STYLE.safe
            const isWarning = a.nivel === "warning"
            const isDanger  = a.nivel === "danger"

            return (
              <div key={a.id} className="rounded-xl overflow-hidden border"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>

                {/* Cabeçalho colorido */}
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ backgroundColor: nivel.bg }}>
                  <div className="flex items-center gap-2 text-white">
                    {info.icon}
                    <span className="text-sm font-semibold">{info.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: nivel.dark }}>
                    {nivel.label}
                    {scoreAtual !== null && ` (Score ${scoreAtual})`}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="px-5 py-4 space-y-4">
                  <h3 className="font-semibold text-base" style={{ color: "#0a0a0a" }}>
                    {a.titulo}
                  </h3>

                  {/* Divisor */}
                  <div className="h-px" style={{ backgroundColor: "#e5e5e5" }} />

                  {/* O que foi detectado */}
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: "#0a0a0a" }}>
                      O que foi detectado
                    </p>
                    <div className="space-y-1.5">
                      {a.descricao.split(".").filter(s => s.trim().length > 4).map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="font-bold mt-0.5 flex-shrink-0"
                            style={{ color: isDanger ? "#840000" : isWarning ? "#db9200" : "#083a23" }}>•</span>
                          <p className="text-sm leading-relaxed" style={{ color: "#0a0a0a" }}>
                            {s.trim()}.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* O que pode acontecer */}
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#0a0a0a" }}>
                      O que pode acontecer
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#525252" }}>
                      {a.recomendacao}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="pt-1">
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#083a23" }}
                    >
                      <Bell className="w-4 h-4" />
                      Me avisa quando mudar
                    </button>
                    <p className="text-xs text-center mt-2" style={{ color: "#737373" }}>
                      Receba notificação por e-mail ou WhatsApp quando o score mudar
                    </p>
                  </div>

                  <p className="text-xs" style={{ color: "#a3a3a3" }}>
                    Emitido em {formatData(a.criado_em)} · Válido até {formatData(a.valido_ate)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
