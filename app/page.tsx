import Link from "next/link"
import HomeDashboard from "@/components/HomeDashboard"
import { Map, BarChart3, Bell, Satellite, Shield, Zap } from "lucide-react"

const features = [
  {
    icon: Map,
    title: "Mapa NDVI Nacional",
    desc: "Visualize a saúde da vegetação em todos os municípios do Brasil.",
    href: "/mapa",
  },
  {
    icon: BarChart3,
    title: "Score de Risco",
    desc: "Número de 0 a 100 calculado semanalmente — simples de entender.",
    href: "/dashboard",
  },
  {
    icon: Bell,
    title: "Alertas Automáticos",
    desc: "Seca, calor, queimada — receba avisos em linguagem clara.",
    href: "/alertas",
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-section relative overflow-hidden bg-white">
        <div className="hero-dots" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Coluna esquerda — texto */}
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold mb-8"
                style={{ backgroundColor: "#147b4b" }}
              >
                <Satellite className="w-3 h-3" />
                Dados de satélite · Global Solution 2026
              </span>

              <h1
                className="font-display font-extrabold leading-[1.08] mb-6"
                style={{ fontSize: "52px", color: "#0a0a0a" }}
              >
                O co-piloto do{" "}
                <span style={{ color: "#0f5132" }}>agricultor<br />brasileiro</span>
              </h1>

              <p className="leading-relaxed mb-10 max-w-md"
                style={{ fontSize: "18px", color: "#525252" }}>
                Monitoramento agrícola inteligente por satélite. Veja o campo do espaço e receba alertas simples — sem jargão técnico.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/mapa"
                  className="ts-btn px-6 py-3 text-base font-semibold text-white rounded-lg"
                  style={{ backgroundColor: "#083a23" }}>
                  Explorar mapa do Brasil
                </Link>
                <Link href="/propriedades"
                  className="ts-btn px-6 py-3 text-base font-medium rounded-lg border"
                  style={{ backgroundColor: "#ffffff", color: "#0a0a0a", borderColor: "rgba(0,0,0,0.12)" }}>
                  Cadastrar minha propriedade
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {[
                  { icon: Shield,    text: "Sem cadastro" },
                  { icon: Zap,       text: "Gratuito" },
                  { icon: Satellite, text: "Funciona em 3G" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: "#147b4b" }} />
                    <span className="text-sm" style={{ color: "#737373" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna direita — imagem + cards flutuantes */}
            <div className="relative hidden lg:block">
              {/* Imagem aérea */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ aspectRatio: "4/3" }}>
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&q=80"
                  alt="Vista aérea de lavoura brasileira"
                  className="w-full h-full object-cover"
                />
                {/* Overlay sutil verde */}
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(15,81,50,0.25) 0%, transparent 60%)" }} />
              </div>

              {/* Card flutuante — Score */}
              <div className="absolute -left-6 top-8 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#ffc23320" }}>
                  <BarChart3 className="w-5 h-5" style={{ color: "#db9200" }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>Score de risco</p>
                  <p className="font-display font-bold text-xl leading-none" style={{ color: "#db9200" }}>62</p>
                  <p className="text-xs font-medium" style={{ color: "#db9200" }}>Atenção</p>
                </div>
              </div>

              {/* Card flutuante — Alerta */}
              <div className="absolute -right-4 bottom-12 bg-white rounded-xl shadow-lg px-4 py-3 max-w-[200px]"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#db9200" }} />
                  <p className="text-xs font-semibold" style={{ color: "#0a0a0a" }}>Alerta ativo</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#525252" }}>
                  Seca prevista nos próximos 10 dias na sua região.
                </p>
              </div>

              {/* Card flutuante — NDVI */}
              <div className="absolute left-4 -bottom-4 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#e8f5ee" }}>
                  <Satellite className="w-4 h-4" style={{ color: "#0f5132" }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#737373" }}>NDVI · Sentinel-2</p>
                  <p className="text-sm font-bold" style={{ color: "#0f5132" }}>0.61 — Saudável</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" style={{ backgroundColor: "#0f5132" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={title}
                href={href}
                className="feature-card block rounded-xl p-6"
                style={{ backgroundColor: "#fafafa" }}
              >
                {/* Ícone */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#0f5132" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#95daba" }} />
                </div>

                <h3 className="font-display font-bold text-lg mb-2" style={{ color: "#0a0a0a" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#525252" }}>
                  {desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard interativo */}
      <HomeDashboard />
    </>
  )
}
