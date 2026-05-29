import Link from "next/link"
import { Satellite } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-black/[0.07] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-green-700 flex items-center justify-center">
                <Satellite className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-extrabold text-green-700 tracking-tight">TerraSat</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Monitoramento agrícola inteligente por satélite. Alertas para produtores rurais, cooperativas e gestores públicos.
            </p>
            <p className="text-2xs text-slate-300 mt-1">Dados: Sentinel-2 (ESA) · NASA FIRMS · Open-Meteo · IBGE</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm">
            {[["Mapa","/"],["Dashboard","/dashboard"],["Alertas","/alertas"],["Propriedades","/propriedades"]].map(([label, href]) => (
              <Link key={href} href={href} className="text-slate-500 hover:text-green-700 transition-colors py-0.5">{label}</Link>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="ts-label">Alinhado aos ODS ONU</span>
            <div className="flex flex-wrap gap-1.5">
              {["ODS 2","ODS 8","ODS 9","ODS 11","ODS 13"].map(o => (
                <span key={o} className="px-2 py-0.5 rounded text-2xs font-medium bg-green-50 text-green-700 border border-green-200">{o}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-black/[0.06] mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© 2026 TerraSat · Global Solution 2 — FIAP · Turma 1SIOR</p>
          <p className="text-xs text-slate-300">Projeto acadêmico — consulte sempre um agrônomo</p>
        </div>
      </div>
    </footer>
  )
}
