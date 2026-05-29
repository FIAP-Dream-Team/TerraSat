import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { NivelRisco } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Score helpers ──────────────────────────────────────────────────────────
export function scoreCor(nivel: NivelRisco) {
  return {
    safe:    "text-green-700",
    warning: "text-amber-600",
    danger:  "text-red-600",
  }[nivel]
}

export function scoreBg(nivel: NivelRisco) {
  return {
    safe:    "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger:  "bg-red-50 border-red-200",
  }[nivel]
}

export function scoreLabel(nivel: NivelRisco) {
  return {
    safe:    "Favorável",
    warning: "Atenção",
    danger:  "Risco alto",
  }[nivel]
}

export function scoreEmoji(nivel: NivelRisco) {
  return { safe: "🟢", warning: "🟡", danger: "🔴" }[nivel]
}

// ── NDVI helpers ───────────────────────────────────────────────────────────
export function ndviCor(ndvi: number): string {
  if (ndvi <= 0.2) return "#C0392B"
  if (ndvi <= 0.3) return "#E67E22"
  if (ndvi <= 0.5) return "#F1C40F"
  if (ndvi <= 0.7) return "#82E07A"
  return "#2E7D52"
}

export function ndviLabel(ndvi: number): string {
  if (ndvi <= 0.2) return "Seco"
  if (ndvi <= 0.3) return "Estresse"
  if (ndvi <= 0.5) return "Atenção"
  if (ndvi <= 0.7) return "Normal"
  return "Saudável"
}

// ── Formatações ────────────────────────────────────────────────────────────
export function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export function formatDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short",
  })
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  })
}

// ── Coordenadas de capitais por UF (para fallback) ─────────────────────────
export const CAPITAIS: Record<string, { lat: number; lng: number; nome: string }> = {
  AC: { lat: -9.9754,   lng: -67.8249,  nome: "Rio Branco" },
  AL: { lat: -9.6658,   lng: -35.7350,  nome: "Maceió" },
  AP: { lat:  0.0349,   lng: -51.0694,  nome: "Macapá" },
  AM: { lat: -3.1190,   lng: -60.0217,  nome: "Manaus" },
  BA: { lat: -12.9714,  lng: -38.5014,  nome: "Salvador" },
  CE: { lat: -3.7172,   lng: -38.5433,  nome: "Fortaleza" },
  DF: { lat: -15.7801,  lng: -47.9292,  nome: "Brasília" },
  ES: { lat: -20.3155,  lng: -40.3128,  nome: "Vitória" },
  GO: { lat: -16.6864,  lng: -49.2643,  nome: "Goiânia" },
  MA: { lat: -2.5307,   lng: -44.3068,  nome: "São Luís" },
  MT: { lat: -15.5989,  lng: -56.0949,  nome: "Cuiabá" },
  MS: { lat: -20.4428,  lng: -54.6461,  nome: "Campo Grande" },
  MG: { lat: -19.9167,  lng: -43.9345,  nome: "Belo Horizonte" },
  PA: { lat: -1.4558,   lng: -48.5044,  nome: "Belém" },
  PB: { lat: -7.1195,   lng: -34.8450,  nome: "João Pessoa" },
  PR: { lat: -25.4195,  lng: -49.2646,  nome: "Curitiba" },
  PE: { lat: -8.0539,   lng: -34.8811,  nome: "Recife" },
  PI: { lat: -5.0892,   lng: -42.8019,  nome: "Teresina" },
  RJ: { lat: -22.9035,  lng: -43.1729,  nome: "Rio de Janeiro" },
  RN: { lat: -5.7793,   lng: -35.2009,  nome: "Natal" },
  RS: { lat: -30.0346,  lng: -51.2177,  nome: "Porto Alegre" },
  RO: { lat: -8.7612,   lng: -63.9004,  nome: "Porto Velho" },
  RR: { lat:  2.8235,   lng: -60.6758,  nome: "Boa Vista" },
  SC: { lat: -27.5954,  lng: -48.5480,  nome: "Florianópolis" },
  SP: { lat: -23.5505,  lng: -46.6333,  nome: "São Paulo" },
  SE: { lat: -10.9091,  lng: -37.0677,  nome: "Aracaju" },
  TO: { lat: -10.2491,  lng: -48.3243,  nome: "Palmas" },
}
