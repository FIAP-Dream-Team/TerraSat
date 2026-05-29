"use client"
import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import {
  Search, MapPin, Loader2, Satellite, AlertTriangle,
  CheckCircle, Thermometer, Droplets, Wind, Flame,
} from "lucide-react"
import type { Municipio, ScoreRisco, DadosClima } from "@/lib/types"
import { scoreLabel, scoreBg, ndviLabel, ndviCor, formatDataCurta } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"
import type { Marcador } from "@/components/map/MapaInterativo"

const MapaInterativo = dynamic(
  () => import("@/components/map/MapaInterativo"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-green-50 flex items-center justify-center">
        <Satellite className="w-10 h-10 text-green-200 animate-pulse" />
      </div>
    ),
  }
)

type ScoreComClima = ScoreRisco & { clima?: DadosClima }

export default function Home() {
  const [query, setQuery] = useState("")
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [score, setScore] = useState<ScoreComClima | null>(null)
  const [marcadores, setMarcadores] = useState<Marcador[]>([])
  const [centro, setCentro] = useState<[number, number] | undefined>(undefined)
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
    setScore(null)

    let { lat, lng } = m
    if (!lat || !lng) {
      const coords = await geocodarMunicipio(m.nome, m.uf)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }

    if (!lat || !lng) {
      setCarregando(false)
      return
    }

    try {
      const params = new URLSearchParams({
        lat: String(lat), lng: String(lng),
        id: String(m.id), nome: m.nome, uf: m.uf,
      })
      const res = await fetch(`/api/score?${params}`)
      const json = await res.json()
      if (json.sucesso) {
        setScore(json.data)
        const nivel = json.data.nivel
        setMarcadores([{ lat, lng, nome: m.nome, uf: m.uf, score: json.data.score, nivel }])
        setCentro([lat, lng])
      }
    } finally {
      setCarregando(false)
    }
  }

  const nivelCor = score?.nivel === "danger" ? "#E74C3C" : score?.nivel === "warning" ? "#D4AC0D" : "#2E7D52"

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-black/[0.07] flex flex-col overflow-hidden">
        {/* Busca */}
        <div className="p-4 border-b border-black/[0.06]">
          <p className="ts-label mb-2">Buscar município</p>
          <div className="relative">
            <input
              className="ts-input pr-9"
              placeholder="Ex: Salgueiro, PE"
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
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
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

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {carregando && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="ts-skeleton rounded-xl h-20" />
              ))}
            </div>
          )}

          {!carregando && !score && (
            <div className="text-center py-16 text-slate-400 animate-fade-in">
              <Satellite className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm leading-relaxed">
                Digite um município para ver<br />o score de risco agrícola
              </p>
            </div>
          )}

          {!carregando && score && (
            <div className="animate-slide-up space-y-4">
              {/* Score principal */}
              <div className={`ts-card p-4 border ${scoreBg(score.nivel)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="ts-label mb-1">Score de risco</p>
                    <p className="font-display text-5xl font-bold leading-none" style={{ color: nivelCor }}>
                      {score.score}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${nivelCor}18`, color: nivelCor }}
                  >
                    {scoreLabel(score.nivel)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{score.recomendacao}</p>
              </div>

              {/* Clima */}
              {score.clima && (
                <div className="ts-card p-4">
                  <p className="ts-label mb-3">Clima atual</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Thermometer, label: "Temperatura", value: `${score.clima.temperatura_atual_c}°C` },
                      { icon: Thermometer, label: "Máxima hoje", value: `${score.clima.temperatura_maxima_c}°C` },
                      { icon: Droplets, label: "Umidade", value: `${score.clima.umidade_percent}%` },
                      { icon: Droplets, label: "Chuva prevista", value: `${score.precipitacao_prevista_mm}mm` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Icon className="w-3 h-3 text-slate-400" />
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{label}</p>
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Previsão 7 dias */}
                  {score.clima.previsao_7dias?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/[0.05]">
                      <p className="ts-label mb-2">Próximos 7 dias</p>
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {score.clima.previsao_7dias.slice(0, 7).map((d, i) => (
                          <div key={i} className="flex-shrink-0 flex flex-col items-center text-center bg-slate-50 rounded-lg p-2 min-w-[48px]">
                            <p className="text-[10px] text-slate-500 font-medium">{formatDataCurta(d.data)}</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{d.temp_max}°</p>
                            <p className="text-[10px] text-blue-500">{d.precipitacao_mm}mm</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NDVI */}
              <div className="ts-card p-4">
                <p className="ts-label mb-3">Saúde da vegetação (NDVI)</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: ndviCor(score.ndvi) }}
                  >
                    {score.ndvi.toFixed(2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{ndviLabel(score.ndvi)}</p>
                    <p className="text-xs text-slate-500">{score.ndvi_status}</p>
                  </div>
                </div>
              </div>

              {/* Focos de calor */}
              {score.focos_calor_proximos > 0 && (
                <div className="ts-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {score.focos_calor_proximos} foco(s) de calor
                    </p>
                    <p className="text-xs text-slate-500">Detectados em raio de 50 km</p>
                  </div>
                </div>
              )}

              {/* Alertas */}
              {score.alertas.length > 0 ? (
                <div className="space-y-2">
                  <p className="ts-label">Alertas ativos ({score.alertas.length})</p>
                  {score.alertas.map(a => (
                    <div
                      key={a.id}
                      className={`ts-alert ts-alert-${a.nivel === "danger" ? "danger" : a.nivel === "warning" ? "warning" : "safe"}`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs">{a.titulo}</p>
                        <p className="text-xs mt-0.5 opacity-80 leading-snug">{a.recomendacao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ts-alert ts-alert-safe">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">Nenhum alerta ativo para este município</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Mapa ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <MapaInterativo marcadores={marcadores} centro={centro} />
        {!centro && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-5 py-2 text-sm text-slate-600 shadow-md pointer-events-none select-none flex items-center gap-2">
            <Satellite className="w-4 h-4 text-green-600" />
            Busque um município para visualizar no mapa
          </div>
        )}
      </div>
    </div>
  )
}
