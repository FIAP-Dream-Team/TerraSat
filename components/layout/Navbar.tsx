"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Satellite, Bell, Map, LayoutDashboard, Menu, X } from "lucide-react"
import { useState } from "react"

const links = [
  { href: "/",          label: "Mapa",      icon: Map },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alertas",   label: "Alertas",   icon: Bell },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/[0.07] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg text-green-700 tracking-tight">TerraSat</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              pathname === href
                ? "text-green-700 bg-green-50 font-medium"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link href="/alertas" className="relative p-1">
            <Bell className="w-4 h-4 text-slate-500 hover:text-green-700 transition-colors" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <Link href="/propriedades" className="ts-btn-primary text-xs px-3 py-1.5">
            Cadastrar propriedade
          </Link>
        </div>

        <button className="md:hidden ml-auto text-slate-500" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/[0.06] bg-white px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                pathname === href ? "text-green-700 bg-green-50 font-medium" : "text-slate-600 hover:bg-slate-50"
              )}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          <Link href="/propriedades" onClick={() => setOpen(false)} className="ts-btn-primary justify-center mt-2 text-sm">
            Cadastrar propriedade
          </Link>
        </div>
      )}
    </header>
  )
}
