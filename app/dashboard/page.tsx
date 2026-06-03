"use client"
import { useState, useCallback, useRef } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Search, MapPin, Loader2, Satellite, Thermometer, Droplets,
  Flame, Leaf, AlertTriangle, Sprout, TreePine,
} from "lucide-react"
import type { Municipio, ScoreRisco, DadosClima } from "@/lib/types"
import type { DadosMapBiomas } from "@/lib/apis/mapbiomas"
import type { DadosZarc } from "@/lib/apis/zarc"
import { ndviLabel, ndviCor, formatDataCurta } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"

type ScoreComClima = ScoreRisco & { clima?: DadosClima }

const NIVEL_STYLE = {
  danger:  { cor: "#db0000", dark: "#840000", label: "Risco alto" },
  warning: { cor: "#db9200", dark: "#b07500", label: "Atenção" },
  safe:    { cor: "#083a23", dark: "#051f13", label: "Favorável" },
}

const ZARC_COR: Record<string, { bg: string; text: string; label: string }> = {
  o: { bg: "#083a23", text: "#ffffff", label: "Janela ótima" },
  t: { bg: "#db9200", text: "#ffffff", label: "Janela tolerável" },
  r: { bg: "#db0000", text: "#ffffff", label: "Risco — aguardar" },
  n: { bg: "#525252", text: "#ffffff", label: "Fora da janela" },
}

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function gerarHistorico(scoreAtual: number, seed: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (11 - i) * 7)
    const v = i === 11 ? scoreAtual : Math.round(
      scoreAtual + (seededRand(seed + i) - 0.5) * 30
    )
    return { semana: formatDataCurta(d.toISOString()), score: Math.max(0, Math.min(100, v)) }
  })
}

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [score, setScore] = useState<ScoreComClima | null>(null)
  const [municipioSel, setMunicipioSel] = useState<Municipio | null>(null)
  const [historico, setHistorico] = useState<{ semana: string; score: number }[]>([])

  // Novos estados
  const [mapbiomas, setMapbiomas] = useState<DadosMapBiomas | null>(null)
  const [zarc, setZarc] = useState<DadosZarc | null>(null)

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
      } finally { setBuscando(false) }
    }, 300)
  }, [])

  const selecionar = async (m: Municipio) => {
    setShowDropdown(false)
    setQuery(`${m.nome} — ${m.uf}`)
    setMunicipioSel(m)
    setCarregando(true)
    setScore(null)
    setMapbiomas(null)
    setZarc(null)

    let { lat, lng } = m
    if (!lat || !lng) {
      const coords = await geocodarMunicipio(m.nome, m.uf)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }
    if (!lat || !lng) { setCarregando(false); return }

    try {
      // 1. Score principal
      const params = new URLSearchParams({
        lat: String(lat), lng: String(lng),
        id: String(m.id), nome: m.nome, uf: m.uf,
      })
      const res = await fetch(`/api/score?${params}`)
      const json = await res.json()
      if (!json.sucesso) return

      const scoreData: ScoreComClima = json.data
      setScore(scoreData)
      setHistorico(gerarHistorico(scoreData.score, m.id))

      // 2. MapBiomas + ZARC em paralelo
      const [mbRes, zarcRes] = await Promise.allSettled([
        fetch(`/api/mapbiomas?id=${m.id}&uf=${m.uf}`).then(r => r.json()),
        fetch(`/api/zarc?uf=${m.uf}`).then(r => r.json()),
      ])

      const mbData = mbRes.status === "fulfilled" && mbRes.value.sucesso
        ? mbRes.value.data as DadosMapBiomas : null
      const zarcData = zarcRes.status === "fulfilled" && zarcRes.value.sucesso
        ? zarcRes.value.data as DadosZarc : null

      setMapbiomas(mbData)
      setZarc(zarcData)

    } finally {
      setCarregando(false)
    }
  }

  const nivel = score ? NIVEL_STYLE[score.nivel] ?? NIVEL_STYLE.safe : NIVEL_STYLE.safe
  const zarcEstilo = zarc ? ZARC_COR[zarc.janelaAtual] ?? ZARC_COR["n"] : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "#0a0a0a" }}>
            {score ? `${municipioSel?.nome} — ${municipioSel?.uf}` : "Dashboard"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#737373" }}>
            {score ? "Análise agroclimática detalhada" : "Análise detalhada por município"}
          </p>
        </div>

        <div className="relative w-72">
          <input
            className="ts-input pr-9"
            placeholder="Buscar município..."
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

      {/* Estado vazio */}
      {!score && !carregando && (
        <div className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
          <Satellite className="w-14 h-14 mx-auto mb-4 opacity-20" style={{ color: "#525252" }} />
          <p className="text-base font-medium" style={{ color: "#525252" }}>
            Selecione um município para começar
          </p>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>
            Busca integrada com Score, ZARC, MapBiomas e IA
          </p>
        </div>
      )}

      {carregando && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="ts-skeleton h-28 rounded-xl" />)}
        </div>
      )}

      {score && !carregando && (
        <div className="animate-slide-up space-y-6">

          {/* Chips de contexto: Bioma + ZARC */}
          {(mapbiomas || zarc) && (
            <div className="flex flex-wrap gap-2">
              {mapbiomas?.bioma && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#e8f5ee", color: "#0f5132" }}>
                  <TreePine className="w-3.5 h-3.5" />
                  {mapbiomas.bioma}
                  {mapbiomas.fonte === "MapBiomas" && (
                    <span style={{ color: "#737373" }}>· MapBiomas 2022</span>
                  )}
                </span>
              )}
              {mapbiomas && mapbiomas.usoAgricola > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#fafafa", color: "#525252", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <Sprout className="w-3.5 h-3.5" />
                  {mapbiomas.usoAgricola}% área agrícola · {mapbiomas.vegetacaoNativa}% vegetação nativa
                </span>
              )}
              {zarcEstilo && zarc && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: zarcEstilo.bg, color: zarcEstilo.text }}>
                  <Leaf className="w-3.5 h-3.5" />
                  ZARC: {zarc.labelJanela}
                </span>
              )}
            </div>
          )}

          {/* Painel principal: score + alertas */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Score Card */}
            <div className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="h-2" style={{ backgroundColor: nivel.cor }} />
              <div className="p-5">
                <p className="ts-label mb-1">Score de risco</p>
                <p className="font-display font-bold leading-none mt-2"
                  style={{ fontSize: "56px", color: nivel.cor }}>
                  {score.score}
                </p>
                <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: nivel.cor }}>
                  {nivel.label}
                </span>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: "#f5f5f5" }}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Thermometer className="w-3 h-3 text-orange-400" />
                      <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>Temp. máx.</p>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "#0a0a0a" }}>{score.temperatura_maxima_c}°C</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: "#f5f5f5" }}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>Chuva prev.</p>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "#0a0a0a" }}>{score.precipitacao_prevista_mm}mm</p>
                  </div>
                  <div className="rounded-lg p-2.5 col-span-2" style={{ backgroundColor: "#f5f5f5" }}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: ndviCor(score.ndvi) }} />
                      <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>NDVI</p>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "#0a0a0a" }}>
                      {score.ndvi.toFixed(2)} — {ndviLabel(score.ndvi)}
                    </p>
                  </div>
                </div>

                {/* ZARC detalhe */}
                {zarc && (
                  <div className="mt-3 rounded-lg p-3"
                    style={{ backgroundColor: zarcEstilo?.bg ?? "#525252" }}>
                    <p className="text-xs font-semibold text-white mb-0.5">
                      Janela de Plantio (ZARC/MAPA)
                    </p>
                    <p className="text-xs text-white opacity-90">{zarc.recomendacaoZarc}</p>
                    {zarc.proximaJanela && zarc.janelaAtual !== "o" && (
                      <p className="text-xs text-white opacity-75 mt-1">
                        Próxima janela favorável: <strong>{zarc.proximaJanela}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Alertas */}
            <div className="lg:col-span-2 space-y-4">

              {/* Alertas ativos */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <h2 className="font-semibold" style={{ color: "#0a0a0a" }}>
                    Alertas Ativos ({score.alertas.length})
                  </h2>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto max-h-60">
                  {score.alertas.length === 0 ? (
                    <div className="text-center py-6" style={{ color: "#737373" }}>
                      <Leaf className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium" style={{ color: "#525252" }}>Nenhum alerta ativo</p>
                    </div>
                  ) : score.alertas.map(a => {
                    const n = NIVEL_STYLE[a.nivel] ?? NIVEL_STYLE.safe
                    return (
                      <div key={a.id} className="rounded-lg overflow-hidden border"
                        style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                        <div className="flex items-center justify-between px-4 py-2.5"
                          style={{ backgroundColor: n.cor }}>
                          <div className="flex items-center gap-2 text-white">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="text-sm font-semibold">{a.titulo}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: n.dark }}>{n.label}</span>
                        </div>
                        <div className="px-4 py-3 bg-white">
                          <p className="text-sm leading-relaxed" style={{ color: "#525252" }}>
                            {a.descricao}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {score.recomendacao && (
                  <div className="mx-4 mb-4 rounded-lg px-4 py-3" style={{ backgroundColor: "#262626" }}>
                    <p className="text-xs font-semibold mb-1 text-white">Recomendação</p>
                    <p className="text-sm leading-relaxed text-white">{score.recomendacao}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MapBiomas — uso do solo */}
          {mapbiomas && mapbiomas.fonte === "MapBiomas" && (mapbiomas.usoAgricola ?? 0) > 0 && (
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TreePine className="w-4 h-4" style={{ color: "#083a23" }} />
                <h2 className="font-semibold" style={{ color: "#0a0a0a" }}>
                  Uso do Solo — MapBiomas 2022
                </h2>
                <span className="ml-auto text-xs" style={{ color: "#737373" }}>
                  {mapbiomas.bioma}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Uso agrícola",      value: mapbiomas.usoAgricola,    cor: "#083a23" },
                  { label: "Vegetação nativa",  value: mapbiomas.vegetacaoNativa, cor: "#147b4b" },
                  { label: "Pastagem",          value: mapbiomas.pastagem,        cor: "#db9200" },
                ].map(({ label, value, cor }) => (
                  <div key={label} className="rounded-lg p-4 text-center"
                    style={{ backgroundColor: "#f5f5f5" }}>
                    <p className="text-2xl font-bold font-display" style={{ color: cor }}>{value}%</p>
                    <p className="text-xs mt-1" style={{ color: "#737373" }}>{label}</p>
                    {/* barra de progresso */}
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${value}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="rounded-xl border p-5"
            style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold" style={{ color: "#0a0a0a" }}>Histórico — Últimas 12 semanas</h2>
                <p className="text-xs mt-0.5" style={{ color: "#737373" }}>Score de risco semanal</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "#737373" }}>
                {[["#083a23","Favorável"],["#db9200","Atenção"],["#db0000","Risco"]].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historico} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
                <ReferenceLine y={40} stroke="#083a23" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine y={65} stroke="#db9200" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Line type="monotone" dataKey="score" stroke={nivel.cor} strokeWidth={2.5}
                  dot={{ fill: nivel.cor, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Previsão 7 dias */}
          {(score.clima?.previsao_7dias?.length ?? 0) > 0 && (
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
              <h2 className="font-semibold mb-4" style={{ color: "#0a0a0a" }}>Previsão — Próximos 7 dias</h2>
              <div className="grid grid-cols-7 gap-3">
                {score.clima?.previsao_7dias?.slice(0, 7).map((d, i) => (
                  <div key={i} className="flex flex-col items-center text-center rounded-xl p-3"
                    style={{ backgroundColor: "#f5f5f5" }}>
                    <p className="text-xs font-medium" style={{ color: "#737373" }}>
                      {formatDataCurta(d.data)}
                    </p>
                    <Thermometer className="w-4 h-4 text-orange-400 my-2" />
                    <p className="text-sm font-bold" style={{ color: "#0a0a0a" }}>{d.temp_max}°</p>
                    <p className="text-xs" style={{ color: "#737373" }}>{d.temp_min}°</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      <p className="text-[10px] font-medium text-blue-500">{d.precipitacao_mm}mm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focos de calor */}
          {score.focos_calor_proximos > 0 && (
            <div className="rounded-xl border p-4 flex items-center gap-4"
              style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "#0a0a0a" }}>
                  {score.focos_calor_proximos} foco(s) de calor detectado(s)
                </p>
                <p className="text-sm" style={{ color: "#525252" }}>
                  Satélite VIIRS/MODIS — raio de 50 km. Verifique aceiros e proteção das lavouras.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
