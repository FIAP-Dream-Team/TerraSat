"use client"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import type { NivelRisco } from "@/lib/types"
import { scoreLabel } from "@/lib/utils"

export interface Marcador {
  lat: number
  lng: number
  nome: string
  uf: string
  score: number
  nivel: NivelRisco
}

interface Props {
  marcadores: Marcador[]
  centro?: [number, number]
  zoom?: number
}

const COR: Record<NivelRisco, string> = {
  safe:    "#2E7D52",
  warning: "#D4AC0D",
  danger:  "#E74C3C",
}

function FlyTo({ centro, zoom }: { centro: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(centro, zoom, { duration: 1.2 })
  }, [centro, zoom, map])
  return null
}

export default function MapaInterativo({ marcadores, centro, zoom = 10 }: Props) {
  return (
    <MapContainer
      center={[-14.235, -51.9253]}
      zoom={4}
      className="w-full h-full"
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      {centro && <FlyTo centro={centro} zoom={zoom} />}
      {marcadores.map((m, i) => (
        <CircleMarker
          key={i}
          center={[m.lat, m.lng]}
          radius={16}
          pathOptions={{
            color: COR[m.nivel],
            fillColor: COR[m.nivel],
            fillOpacity: 0.82,
            weight: 2.5,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "DM Sans, sans-serif", minWidth: 180, padding: "6px 2px" }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#272521" }}>
                {m.nome} — {m.uf}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  background: COR[m.nivel], color: "white",
                  borderRadius: 6, padding: "3px 12px",
                  fontWeight: 700, fontSize: 22,
                }}>{m.score}</span>
                <span style={{ fontSize: 12, color: "#66635D" }}>{scoreLabel(m.nivel)}</span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
