// ── Municípios ────────────────────────────────────────────────────────────
export interface Municipio {
  id: number
  nome: string
  uf: string
  lat: number
  lng: number
  populacao?: number
  area_km2?: number
  culturas_principais?: string[]
}

// ── Score de risco ─────────────────────────────────────────────────────────
export type NivelRisco = "safe" | "warning" | "danger"

export interface ScoreRisco {
  municipio_id: number
  municipio_nome: string
  uf: string
  score: number
  nivel: NivelRisco
  ndvi: number
  ndvi_status: string
  precipitacao_prevista_mm: number
  temperatura_maxima_c: number
  focos_calor_proximos: number
  recomendacao: string
  alertas: Alerta[]
  atualizado_em: string
}

// ── Alerta ─────────────────────────────────────────────────────────────────
export type TipoAlerta =
  | "seca"
  | "excesso_hidrico"
  | "calor_extremo"
  | "geada"
  | "queimada"
  | "queda_ndvi"

export interface Alerta {
  id: string
  tipo: TipoAlerta
  nivel: NivelRisco
  titulo: string
  descricao: string
  recomendacao: string
  municipio_id: number
  municipio_nome: string
  uf: string
  criado_em: string
  valido_ate: string
}

// ── Clima ──────────────────────────────────────────────────────────────────
export interface DadosClima {
  temperatura_atual_c: number
  temperatura_maxima_c: number
  temperatura_minima_c: number
  umidade_percent: number
  precipitacao_mm: number
  vento_kmh: number
  descricao: string
  previsao_7dias: PrevisaoDia[]
}

export interface PrevisaoDia {
  data: string
  temp_max: number
  temp_min: number
  precipitacao_mm: number
  descricao: string
}

// ── NDVI ───────────────────────────────────────────────────────────────────
export interface DadosNDVI {
  municipio_id: number
  valor: number
  status: "seco" | "estresse" | "atencao" | "normal" | "saudavel"
  data_imagem: string
  fonte: string
}

// ── Propriedade ────────────────────────────────────────────────────────────
export interface Propriedade {
  id: string
  nome: string
  municipio_id: number
  municipio_nome: string
  uf: string
  lat: number
  lng: number
  area_hectares?: number
  culturas: string[]
  usuario_id: string
  criada_em: string
}

// ── Usuário ────────────────────────────────────────────────────────────────
export type PerfilUsuario = "produtor" | "tecnico" | "cooperativa" | "gestor"

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  municipio_id?: number
  propriedades?: Propriedade[]
  criado_em: string
}

// ── API responses ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  sucesso: boolean
  erro?: string
  timestamp: string
}

// ── Score engine ───────────────────────────────────────────────────────────
export interface InputScoreEngine {
  ndvi: number
  precipitacao_prevista_mm: number
  temperatura_maxima_c: number
  focos_calor_proximos: number
  historico_score_medio?: number
}
