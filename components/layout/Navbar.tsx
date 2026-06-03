"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Satellite, Menu, X } from "lucide-react"
import { useState } from "react"

const links = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/mapa",           label: "Mapa NDVI" },
  { href: "/dashboard",      label: "Dashboard" },
  { href: "/alertas",        label: "Alertas" },
  { href: "/propriedades",   label: "Cadastro" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.07] shadow-sm" style={{ backgroundColor: "#fafafa" }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#083a23" }}>
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight" style={{ color: "#000000" }}>TerraSat</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={cn(
              "px-3 py-1.5 rounded-md text-base transition-colors",
              pathname === href
                ? "font-medium bg-green-50"
                : "hover:bg-slate-100"
            )} style={{ color: "#000000" }}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center ml-auto">
          <Link
            href="/mapa"
            className="ts-btn px-4 py-2 text-base font-medium text-white rounded-lg"
            style={{ backgroundColor: "#083a23" }}
          >
            Explorar mapa
          </Link>
        </div>

        <button className="md:hidden ml-auto" onClick={() => setOpen(!open)} aria-label="Menu" style={{ color: "#525252" }}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/[0.06] px-4 py-3 flex flex-col gap-1 animate-fade-in" style={{ backgroundColor: "#fafafa" }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn("px-3 py-2 rounded-lg text-base",
                pathname === href ? "bg-green-50 font-medium" : "hover:bg-slate-100"
              )} style={{ color: "#000000" }}>
              {label}
            </Link>
          ))}
          <Link
            href="/mapa"
            onClick={() => setOpen(false)}
            className="ts-btn justify-center mt-2 text-base font-medium text-white rounded-lg"
            style={{ backgroundColor: "#083a23" }}
          >
            Explorar mapa
          </Link>
        </div>
      )}
    </header>
  )
}
