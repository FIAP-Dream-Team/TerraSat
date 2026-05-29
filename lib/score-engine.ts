import type { InputScoreEngine, NivelRisco, Alerta, TipoAlerta } from "./types"

// ── Pesos do motor de score ────────────────────────────────────────────────
const PESOS = {
  ndvi:               0.35,
  precipitacao:       0.30,
  temperatura:        0.20,
  focos_calor:        0.10,
  historico:          0.05,
}

// ── Thresholds ─────────────────────────────────────────────────────────────
const THRESHOLDS = {
  ndvi: {
    seco:     0.2,
    estresse: 0.3,
    atencao:  0.5,
    normal:   0.7,
  },
  precipitacao_critica_mm: 10,   // abaixo disso em 15 dias = risco de seca
  temperatura_extrema_c:   35,
  temperatura_geada_c:     5,
  chuva_excesso_mm:        80,   // acima disso em 3 dias = excesso hídrico
  focos_raio_km:           50,
}

// ── Normalização de variáveis para 0-100 ──────────────────────────────────

function scoreNDVI(ndvi: number): number {
  // NDVI baixo = risco alto. Score alto = risco alto.
  if (ndvi <= 0.2) return 100
  if (ndvi <= 0.3) return 80
  if (ndvi <= 0.5) return 50
  if (ndvi <= 0.7) return 20
  return 0
}

function scorePrecipitacao(mm: number, tempMax: number): number {
  // Pouca chuva + calor = risco alto
  if (mm < THRESHOLDS.precipitacao_critica_mm && tempMax > THRESHOLDS.temperatura_extrema_c) return 100
  if (mm < THRESHOLDS.precipitacao_critica_mm) return 75
  if (mm > THRESHOLDS.chuva_excesso_mm) return 85  // excesso também é risco
  if (mm < 25) return 40
  return 0
}

function scoreTemperatura(tempMax: number): number {
  if (tempMax >= 40) return 100
  if (tempMax >= 38) return 80
  if (tempMax >= 35) return 60
  if (tempMax <= THRESHOLDS.temperatura_geada_c) return 90  // geada
  return 0
}

function scoreFocosCalor(focos: number): number {
  if (focos >= 10) return 100
  if (focos >= 5)  return 70
  if (focos >= 1)  return 40
  return 0
}

// ── Determinação do nível ──────────────────────────────────────────────────
export function determinaNivel(score: number): NivelRisco {
  if (score >= 66) return "danger"
  if (score >= 41) return "warning"
  return "safe"
}

// ── Status NDVI em texto ───────────────────────────────────────────────────
export function statusNDVI(ndvi: number): string {
  if (ndvi <= 0.2) return "Seco"
  if (ndvi <= 0.3) return "Estresse hídrico"
  if (ndvi <= 0.5) return "Atenção"
  if (ndvi <= 0.7) return "Normal"
  return "Saudável"
}

// ── Geração de alertas ─────────────────────────────────────────────────────
export function geraAlertas(
  input: InputScoreEngine,
  municipioId: number,
  municipioNome: string,
  uf: string
): Alerta[] {
  const alertas: Alerta[] = []
  const agora = new Date()
  const validoAte = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const base = {
    municipio_id: municipioId,
    municipio_nome: municipioNome,
    uf,
    criado_em: agora.toISOString(),
    valido_ate: validoAte.toISOString(),
  }

  if (input.ndvi <= 0.3 && input.precipitacao_prevista_mm < THRESHOLDS.precipitacao_critica_mm) {
    alertas.push({
      ...base,
      id: `seca-${municipioId}-${Date.now()}`,
      tipo: "seca" as TipoAlerta,
      nivel: input.ndvi <= 0.2 ? "danger" : "warning",
      titulo: "Risco de seca detectado",
      descricao: `NDVI atual de ${input.ndvi.toFixed(2)} indica vegetação em estresse. Chuva prevista abaixo de ${THRESHOLDS.precipitacao_critica_mm}mm nos próximos 15 dias.`,
      recomendacao: "Ative irrigação de emergência se disponível. Evite novo plantio. Monitore diariamente.",
    })
  }

  if (input.temperatura_maxima_c >= THRESHOLDS.temperatura_extrema_c) {
    alertas.push({
      ...base,
      id: `calor-${municipioId}-${Date.now()}`,
      tipo: "calor_extremo" as TipoAlerta,
      nivel: input.temperatura_maxima_c >= 40 ? "danger" : "warning",
      titulo: "Temperatura extrema prevista",
      descricao: `Temperatura máxima de ${input.temperatura_maxima_c}°C prevista. Risco de queimadura foliar e aceleração da perda hídrica.`,
      recomendacao: "Reforce irrigação nas horas mais frescas (manhã cedo e final da tarde). Evite aplicação de defensivos.",
    })
  }

  if (input.temperatura_maxima_c <= THRESHOLDS.temperatura_geada_c) {
    alertas.push({
      ...base,
      id: `geada-${municipioId}-${Date.now()}`,
      tipo: "geada" as TipoAlerta,
      nivel: "danger",
      titulo: "Risco de geada",
      descricao: `Temperatura mínima de ${input.temperatura_maxima_c}°C prevista. Culturas sensíveis podem sofrer dano severo.`,
      recomendacao: "Aplique irrigação noturna para proteção térmica. Cubra mudas jovens. Acione seguro se disponível.",
    })
  }

  if (input.focos_calor_proximos >= 1) {
    alertas.push({
      ...base,
      id: `queimada-${municipioId}-${Date.now()}`,
      tipo: "queimada" as TipoAlerta,
      nivel: input.focos_calor_proximos >= 5 ? "danger" : "warning",
      titulo: `${input.focos_calor_proximos} foco(s) de calor detectado(s)`,
      descricao: `Focos de calor detectados pelo satélite VIIRS/MODIS em raio de ${THRESHOLDS.focos_raio_km}km da região.`,
      recomendacao: "Verifique aceiros e faixas de proteção. Mantenha contato com defesa civil local.",
    })
  }

  if (input.precipitacao_prevista_mm > THRESHOLDS.chuva_excesso_mm) {
    alertas.push({
      ...base,
      id: `excesso-${municipioId}-${Date.now()}`,
      tipo: "excesso_hidrico" as TipoAlerta,
      nivel: "warning",
      titulo: "Risco de excesso hídrico",
      descricao: `Precipitação de ${input.precipitacao_prevista_mm}mm prevista. Risco de encharcamento e perda de nutrientes por lixiviação.`,
      recomendacao: "Verifique drenagem. Suspenda irrigação. Adie aplicações de fertilizantes solúveis.",
    })
  }

  return alertas
}

// ── Motor principal ────────────────────────────────────────────────────────
export function calcularScore(
  input: InputScoreEngine,
  municipioId: number,
  municipioNome: string,
  uf: string
) {
  const s_ndvi      = scoreNDVI(input.ndvi)
  const s_chuva     = scorePrecipitacao(input.precipitacao_prevista_mm, input.temperatura_maxima_c)
  const s_temp      = scoreTemperatura(input.temperatura_maxima_c)
  const s_fogo      = scoreFocosCalor(input.focos_calor_proximos)
  const s_historico = input.historico_score_medio ?? 30

  const score = Math.round(
    s_ndvi      * PESOS.ndvi          +
    s_chuva     * PESOS.precipitacao  +
    s_temp      * PESOS.temperatura   +
    s_fogo      * PESOS.focos_calor   +
    s_historico * PESOS.historico
  )

  const nivel = determinaNivel(score)
  const alertas = geraAlertas(input, municipioId, municipioNome, uf)

  const recomendacoes: Record<NivelRisco, string> = {
    safe:    "Condições favoráveis. Período adequado para plantio e manejo regular.",
    warning: "Monitore a lavoura com frequência. Verifique irrigação e ajuste o manejo conforme necessário.",
    danger:  "Ação imediata necessária. Consulte um técnico agrícola e acione medidas de proteção.",
  }

  return {
    municipio_id: municipioId,
    municipio_nome: municipioNome,
    uf,
    score,
    nivel,
    ndvi: input.ndvi,
    ndvi_status: statusNDVI(input.ndvi),
    precipitacao_prevista_mm: input.precipitacao_prevista_mm,
    temperatura_maxima_c: input.temperatura_maxima_c,
    focos_calor_proximos: input.focos_calor_proximos,
    recomendacao: recomendacoes[nivel],
    alertas,
    atualizado_em: new Date().toISOString(),
  }
}
