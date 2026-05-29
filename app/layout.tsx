import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: {
    default: "TerraSat — Monitoramento Agrícola por Satélite",
    template: "%s | TerraSat",
  },
  description:
    "Plataforma de monitoramento agrícola inteligente que transforma dados de satélites em alertas claros para produtores rurais, cooperativas e gestores públicos.",
  keywords: ["agricultura", "satélite", "NDVI", "monitoramento", "alertas", "agronegócio", "seca", "clima"],
  authors: [{ name: "Equipe TerraSat — FIAP 2026" }],
  openGraph: {
    title: "TerraSat",
    description: "O co-piloto do agricultor brasileiro — que vê o campo do espaço.",
    locale: "pt_BR",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
