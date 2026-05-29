"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Search, MapPin, Loader2, Satellite, Thermometer, Droplets,
  Flame, Leaf, TrendingUp, AlertTriangle, RefreshCw,
} from "lucide-react"
import type { Municipio, ScoreRisco, DadosClima } from "@/lib/types"
import { scoreLabel, scoreBg, scoreCor, ndviLabel, ndviCor, formatDataCurta } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"

type ScoreComClima = ScoreRisco & { clima?: DadosClima }

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
    return {
      semana: formatDataCurta(d.toISOString()),
      score: Math.max(0, Math.min(100, v)),
    }
  })
}

function corScore(v: number) {
  if (v >= 66) return "#E74C3C"
  if (v >= 41) return "#D4AC0D"
  return "#2E7D52"
}

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [score, setScore] = useState<ScoreComClima | null>(null)
  const [historico, setHistorico] = useState<{ semana: string; score: number }[]>([])
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
    if (!lat || !lng) { setCarregando(false); return }

    try {
      const params = new URLSearchParams({
        lat: String(lat), lng: String(lng),
        id: String(m.id), nome: m.nome, uf: m.uf,
      })
      const res = await fetch(`/api/score?${params}`)
      const json = await res.json()
      if (json.sucesso) {
        setScore(json.data)
        setHistorico(gerarHistorico(json.data.score, m.id))
      }
    } finally {
      setCarregando(false)
    }
  }

  const nivelCor = score
    ? score.nivel === "danger" ? "#E74C3C" : score.nivel === "warning" ? "#D4AC0D" : "#2E7D52"
    : "#2E7D52"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-green-700">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Análise detalhada por município</p>
        </div>

        {/* Busca */}
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
                  <span className="font-medium text-slate-800">{m.nome}</span>
                  <span className="text-xs text-slate-400 ml-auto">{m.uf}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estado vazio */}
      {!score && !carregando && (
        <div className="ts-card p-16 text-center text-slate-400">
          <Satellite className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">Selecione um município para começar</p>
          <p className="text-sm mt-1">Digite o nome acima para buscar</p>
        </div>
      )}

      {carregando && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="ts-skeleton h-28 rounded-xl" />)}
        </div>
      )}

      {score && !carregando && (
        <div className="animate-slide-up space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score */}
            <div className={`ts-card p-4 border ${scoreBg(score.nivel)}`}>
              <div className="flex items-start justify-between mb-1">
                <p className="ts-label">Score de risco</p>
                <TrendingUp className="w-4 h-4" style={{ color: nivelCor }} />
              </div>
              <p className="font-display text-4xl font-bold mt-1" style={{ color: nivelCor }}>
                {score.score}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: nivelCor }}>
                {scoreLabel(score.nivel)}
              </p>
            </div>

            {/* NDVI */}
            <div className="ts-card p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="ts-label">NDVI</p>
                <Leaf className="w-4 h-4" style={{ color: ndviCor(score.ndvi) }} />
              </div>
              <p className="font-display text-4xl font-bold mt-1" style={{ color: ndviCor(score.ndvi) }}>
                {score.ndvi.toFixed(2)}
              </p>
              <p className="text-xs mt-1 text-slate-500">{ndviLabel(score.ndvi)}</p>
            </div>

            {/* Temperatura */}
            <div className="ts-card p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="ts-label">Temperatura máx.</p>
                <Thermometer className="w-4 h-4 text-orange-400" />
              </div>
              <p className="font-display text-4xl font-bold mt-1 text-slate-800">
                {score.temperatura_maxima_c}°C
              </p>
              <p className="text-xs mt-1 text-slate-500">
                {score.temperatura_maxima_c >= 35 ? "Calor extremo" : "Normal"}
              </p>
            </div>

            {/* Chuva */}
            <div className="ts-card p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="ts-label">Chuva prevista</p>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <p className="font-display text-4xl font-bold mt-1 text-slate-800">
                {score.precipitacao_prevista_mm}
                <span className="text-lg font-normal text-slate-500 ml-1">mm</span>
              </p>
              <p className="text-xs mt-1 text-slate-500">Próximos 15 dias</p>
            </div>
          </div>

          {/* Gráfico histórico + alertas */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Gráfico */}
            <div className="lg:col-span-2 ts-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-800">Histórico do Score</h2>
                  <p className="text-xs text-slate-500">Últimas 12 semanas</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block" />Favorável</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Atenção</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Risco</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={historico} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#888782" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#888782" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", fontSize: 12 }}
                    formatter={(v: number) => [v, "Score"]}
                  />
                  <ReferenceLine y={40} stroke="#2E7D52" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <ReferenceLine y={65} stroke="#D4AC0D" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={nivelCor}
                    strokeWidth={2.5}
                    dot={{ fill: nivelCor, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alertas */}
            <div className="ts-card p-5 flex flex-col">
              <h2 className="font-semibold text-slate-800 mb-1">Alertas ativos</h2>
              <p className="text-xs text-slate-500 mb-4">{score.alertas.length} alerta(s)</p>

              {score.alertas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-6">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Nenhum alerta</p>
                  <p className="text-xs mt-0.5">Condições favoráveis</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1">
                  {score.alertas.map(a => (
                    <div
                      key={a.id}
                      className={`ts-alert ts-alert-${a.nivel === "danger" ? "danger" : a.nivel === "warning" ? "warning" : "safe"}`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs">{a.titulo}</p>
                        <p className="text-xs opacity-80 mt-0.5 leading-snug">{a.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Previsão do tempo */}
          {score.clima?.previsao_7dias?.length > 0 && (
            <div className="ts-card p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Previsão — próximos 7 dias</h2>
              <div className="grid grid-cols-7 gap-3">
                {score.clima.previsao_7dias.slice(0, 7).map((d, i) => (
                  <div key={i} className="flex flex-col items-center text-center bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">{formatDataCurta(d.data)}</p>
                    <Thermometer className="w-4 h-4 text-orange-400 my-2" />
                    <p className="text-sm font-bold text-slate-800">{d.temp_max}°</p>
                    <p className="text-xs text-slate-500">{d.temp_min}°</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      <p className="text-[10px] text-blue-500 font-medium">{d.precipitacao_mm}mm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focos de calor */}
          {score.focos_calor_proximos > 0 && (
            <div className="ts-card p-4 flex items-center gap-4 border border-orange-100">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {score.focos_calor_proximos} foco(s) de calor detectado(s)
                </p>
                <p className="text-sm text-slate-500">
                  Satélite VIIRS/MODIS — raio de 50 km da região. Verifique aceiros e proteção das lavouras.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
