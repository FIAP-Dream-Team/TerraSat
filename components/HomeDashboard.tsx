"use client"
import { useState, useCallback, useRef } from "react"
import {
  Search, MapPin, Loader2, Satellite, Thermometer,
  Droplets, Flame, Leaf, AlertTriangle, TreePine, Sprout,
} from "lucide-react"
import type { Municipio, ScoreRisco, DadosClima } from "@/lib/types"
import type { DadosMapBiomas } from "@/lib/apis/mapbiomas"
import type { DadosZarc } from "@/lib/apis/zarc"
import { ndviLabel, ndviCor } from "@/lib/utils"
import { geocodarMunicipio } from "@/lib/apis/geocoding"

type ScoreComClima = ScoreRisco & { clima?: DadosClima }

const NIVEL_STYLE = {
  danger:  { cor: "#db0000", dark: "#840000", label: "Risco alto" },
  warning: { cor: "#db9200", dark: "#b07500", label: "Atenção" },
  safe:    { cor: "#083a23", dark: "#051f13", label: "Favorável" },
}

const ZARC_COR: Record<string, { bg: string; text: string }> = {
  o: { bg: "#083a23", text: "#ffffff" },
  t: { bg: "#db9200", text: "#ffffff" },
  r: { bg: "#db0000", text: "#ffffff" },
  n: { bg: "#525252", text: "#ffffff" },
}

export default function HomeDashboard() {
  const [query, setQuery] = useState("")
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [score, setScore] = useState<ScoreComClima | null>(null)
  const [municipioSel, setMunicipioSel] = useState<Municipio | null>(null)
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
      const params = new URLSearchParams({
        lat: String(lat), lng: String(lng),
        id: String(m.id), nome: m.nome, uf: m.uf,
      })
      const [scoreRes, mbRes, zarcRes] = await Promise.allSettled([
        fetch(`/api/score?${params}`).then(r => r.json()),
        fetch(`/api/mapbiomas?id=${m.id}&uf=${m.uf}`).then(r => r.json()),
        fetch(`/api/zarc?uf=${m.uf}`).then(r => r.json()),
      ])

      if (scoreRes.status === "fulfilled" && scoreRes.value.sucesso)
        setScore(scoreRes.value.data)
      if (mbRes.status === "fulfilled" && mbRes.value.sucesso)
        setMapbiomas(mbRes.value.data)
      if (zarcRes.status === "fulfilled" && zarcRes.value.sucesso)
        setZarc(zarcRes.value.data)
    } finally {
      setCarregando(false)
    }
  }

  const nivel = score ? NIVEL_STYLE[score.nivel] ?? NIVEL_STYLE.safe : NIVEL_STYLE.safe
  const zarcEstilo = zarc ? ZARC_COR[zarc.janelaAtual] ?? ZARC_COR["n"] : null

  return (
    <section className="bg-white py-20" id="consultar">
      <div className="max-w-7xl mx-auto px-6">

        {/* Título da seção */}
        <div className="text-center mb-10">
          <h2
            className="font-display font-extrabold mb-3"
            style={{ fontSize: "36px", color: "#0a0a0a" }}
          >
            Consulte seu município agora
          </h2>
          <p style={{ color: "#525252", fontSize: "18px" }}>
            Sem cadastro. Digite o nome e veja o score de risco em segundos.
          </p>
        </div>

        {/* Busca */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <input
              className="ts-input pr-12 py-4 text-base rounded-xl shadow-sm"
              placeholder="Ex: Salgueiro, PE ou Ribeirão Preto, SP"
              value={query}
              autoComplete="off"
              onChange={e => { setQuery(e.target.value); buscar(e.target.value) }}
              onFocus={() => municipios.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {buscando
                ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                : <Search className="w-5 h-5 text-slate-400" />}
            </div>

            {showDropdown && municipios.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.09] rounded-xl shadow-lg z-50 overflow-hidden">
                {municipios.map(m => (
                  <button
                    key={m.id}
                    onMouseDown={() => selecionar(m)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
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
          <div className="max-w-xl mx-auto text-center py-12 rounded-2xl border"
            style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.06)" }}>
            <Satellite className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "#525252" }} />
            <p className="font-medium" style={{ color: "#525252" }}>
              Digite um município para ver o score de risco agrícola
            </p>
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="ts-skeleton h-36 rounded-2xl" />)}
          </div>
        )}

        {/* Resultado */}
        {score && !carregando && (
          <div className="max-w-4xl mx-auto animate-slide-up space-y-4">

            {/* Nome do município + chips */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-xl" style={{ color: "#0a0a0a" }}>
                {municipioSel?.nome} — {municipioSel?.uf}
              </h3>
              {mapbiomas?.bioma && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#e8f5ee", color: "#0f5132" }}>
                  <TreePine className="w-3 h-3" />
                  {mapbiomas.bioma}
                </span>
              )}
              {zarcEstilo && zarc && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: zarcEstilo.bg, color: zarcEstilo.text }}>
                  <Leaf className="w-3 h-3" />
                  ZARC: {zarc.labelJanela}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">

              {/* Score */}
              <div className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="h-1.5" style={{ backgroundColor: nivel.cor }} />
                <div className="p-5">
                  <p className="ts-label mb-1">Score de risco</p>
                  <p className="font-display font-bold leading-none mt-1"
                    style={{ fontSize: "52px", color: nivel.cor }}>
                    {score.score}
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: nivel.cor }}>
                    {nivel.label}
                  </span>
                  <p className="text-xs mt-3 leading-relaxed" style={{ color: "#525252" }}>
                    {score.recomendacao}
                  </p>
                </div>
              </div>

              {/* Dados climáticos */}
              <div className="rounded-2xl border p-5 space-y-3"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
                <p className="ts-label">Dados climáticos</p>
                <div className="space-y-2.5">
                  {[
                    { icon: <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ndviCor(score.ndvi) }} />, label: "NDVI", value: `${score.ndvi.toFixed(2)} — ${ndviLabel(score.ndvi)}` },
                    { icon: <Thermometer className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />, label: "Temperatura máx.", value: `${score.temperatura_maxima_c}°C` },
                    { icon: <Droplets className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />, label: "Chuva prevista", value: `${score.precipitacao_prevista_mm}mm / 15 dias` },
                    ...(score.focos_calor_proximos > 0 ? [{ icon: <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />, label: "Focos de calor", value: `${score.focos_calor_proximos} em raio de 50km` }] : []),
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      {icon}
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>{label}</p>
                        <p className="text-sm font-semibold truncate" style={{ color: "#0a0a0a" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MapBiomas */}
                {mapbiomas && mapbiomas.usoAgricola > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Sprout className="w-3 h-3" style={{ color: "#083a23" }} />
                      <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>
                        Uso do solo · MapBiomas 2022
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: "#525252" }}>
                      {mapbiomas.usoAgricola}% agrícola · {mapbiomas.vegetacaoNativa}% vegetação nativa · {mapbiomas.pastagem}% pastagem
                    </p>
                  </div>
                )}
              </div>

              {/* Alertas */}
              <div className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: "#fafafa", borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <p className="ts-label">Alertas ativos ({score.alertas.length})</p>
                </div>
                <div className="p-4 space-y-2 max-h-52 overflow-y-auto">
                  {score.alertas.length === 0 ? (
                    <div className="text-center py-6">
                      <Leaf className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium" style={{ color: "#525252" }}>Nenhum alerta</p>
                      <p className="text-xs mt-0.5" style={{ color: "#737373" }}>Condições favoráveis</p>
                    </div>
                  ) : score.alertas.map(a => {
                    const n = NIVEL_STYLE[a.nivel] ?? NIVEL_STYLE.safe
                    return (
                      <div key={a.id} className="rounded-lg overflow-hidden">
                        <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: n.cor }}>
                          <AlertTriangle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                          <p className="text-xs font-semibold text-white truncate">{a.titulo}</p>
                        </div>
                        <div className="px-3 py-2" style={{ backgroundColor: "#f5f5f5" }}>
                          <p className="text-xs leading-relaxed" style={{ color: "#525252" }}>{a.descricao}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ZARC detalhe */}
            {zarc && zarc.janelaAtual !== "o" && (
              <div className="rounded-xl p-4 flex items-start gap-3"
                style={{ backgroundColor: zarcEstilo?.bg ?? "#525252" }}>
                <Leaf className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{zarc.labelJanela}</p>
                  <p className="text-xs text-white opacity-80 mt-0.5">{zarc.recomendacaoZarc}</p>
                  {zarc.proximaJanela && zarc.proximaJanela !== "Agora é a janela ideal" && (
                    <p className="text-xs text-white opacity-70 mt-1">
                      Próxima janela favorável: <strong>{zarc.proximaJanela}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
