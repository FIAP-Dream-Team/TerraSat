# TerraSat

Plataforma de monitoramento agrícola inteligente por satélite voltada ao produtor rural brasileiro. Integra dados públicos de múltiplas fontes — satélites, clima, IBGE, INPE — e os entrega em linguagem simples, sem necessidade de cadastro.

Desenvolvido como Global Solution 2026.

---

## O problema

O Brasil tem mais de 3.800 municípios com economia predominantemente agrícola. A maioria dos produtores toma decisões críticas baseadas em experiência própria e na previsão do tempo básica do celular. O TerraSat é a camada de integração que faltava: agrega dados já existentes e os transforma em informação acionável.

---

## Funcionalidades

| Módulo                      | Descrição                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Mapa NDVI Nacional**      | Visualização da saúde da vegetação em todos os municípios do Brasil via mapa interativo Leaflet            |
| **Score de Risco**          | Índice de 0 a 100 calculado em tempo real com base em NDVI, precipitação, temperatura e focos de calor     |
| **Alertas Automáticos**     | Detecção de seca, calor extremo, geada, queimadas e excesso hídrico com recomendações práticas             |
| **Dashboard por Município** | Análise agroclimática detalhada com histórico de 12 semanas, previsão de 7 dias e janela de plantio (ZARC) |
| **Uso do Solo**             | Dados de bioma e cobertura do solo por município via MapBiomas 2022                                        |
| **Propriedades**            | Cadastro e monitoramento de propriedades rurais individuais                                                |

---

## Fontes de dados integradas

| Fonte                  | Dado                                   | Licença               |
| ---------------------- | -------------------------------------- | --------------------- |
| **Sentinel-2 · ESA**   | NDVI (índice de vegetação)             | Aberta                |
| **Open-Meteo**         | Clima atual e previsão 7–16 dias       | Gratuita, sem API key |
| **NASA FIRMS**         | Focos de calor (VIIRS/MODIS)           | Aberta                |
| **IBGE API**           | Lista de municípios, coordenadas, UF   | Aberta                |
| **ZARC · MAPA**        | Janela de plantio por cultura e UF     | Pública               |
| **MapBiomas**          | Uso do solo e cobertura vegetal (2022) | Aberta                |
| **BDQueimadas · INPE** | Histórico de queimadas                 | Aberta                |
| **ANA Hidroweb**       | Dados hidrológicos                     | Pública               |

---

## Motor de Score de Risco

O score (0–100) é calculado pela combinação ponderada de quatro variáveis:

| Variável                        | Peso |
| ------------------------------- | ---- |
| NDVI                            | 35%  |
| Precipitação prevista (15 dias) | 30%  |
| Temperatura máxima              | 20%  |
| Focos de calor (raio 50 km)     | 10%  |
| Histórico médio                 | 5%   |

**Níveis de risco:**

- `0–40` → Favorável (verde)
- `41–65` → Atenção (amarelo)
- `66–100` → Risco alto (vermelho)

---

## Stack tecnológica

### Frontend

- **Next.js 16** — App Router, Server Components, Route Handlers
- **React 19** — com hooks e Suspense
- **TypeScript 5**
- **Tailwind CSS 4**
- **Leaflet + React-Leaflet** — mapa interativo
- **Recharts** — gráficos de série temporal
- **Lucide React** — ícones

### Backend (API Routes — Next.js)

- `/api/score` — calcula score de risco integrando NDVI + clima + focos de calor
- `/api/clima` — proxy para Open-Meteo
- `/api/municipios` — busca de municípios via IBGE
- `/api/mapbiomas` — dados de uso do solo
- `/api/zarc` — janela de plantio ZARC/MAPA

### Infraestrutura

- Deploy recomendado: **Vercel**
- Cache de requisições via `next: { revalidate: 3600 }` nas chamadas a APIs externas

---

## Estrutura do projeto

```
terrasat/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Dashboard por município
│   ├── mapa/page.tsx         # Mapa NDVI interativo
│   ├── alertas/page.tsx      # Central de alertas
│   ├── propriedades/page.tsx # Gestão de propriedades
│   └── api/                  # Route Handlers
│       ├── score/
│       ├── clima/
│       ├── municipios/
│       ├── mapbiomas/
│       └── zarc/
├── components/
│   ├── HomeDashboard.tsx
│   ├── map/MapaInterativo.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── score-engine.ts       # Motor de cálculo de risco
│   ├── types.ts              # Tipos TypeScript globais
│   ├── utils.ts
│   └── apis/
│       ├── clima.ts          # Open-Meteo
│       ├── ndvi.ts           # Sentinel Hub
│       ├── firms.ts          # NASA FIRMS
│       ├── ibge.ts           # IBGE
│       ├── geocoding.ts
│       ├── mapbiomas.ts
│       └── zarc.ts
```

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

A aplicação funciona sem nenhuma variável de ambiente — todas as fontes de dados têm fallback de simulação ou são APIs públicas sem autenticação. Para habilitar o NDVI real via Sentinel Hub, configure:

```env
SENTINEL_HUB_CLIENT_ID=seu_client_id
```

---

## Alinhamento ODS

O TerraSat contribui diretamente com os Objetivos de Desenvolvimento Sustentável da ONU:

- **ODS 2** — Fome zero e agricultura sustentável
- **ODS 8** — Trabalho decente e crescimento econômico
- **ODS 9** — Indústria, inovação e infraestrutura
- **ODS 11** — Cidades e comunidades sustentáveis
- **ODS 13** — Ação contra a mudança global do clima

---

## Público-alvo

- **Agricultores familiares** que precisam saber se podem plantar essa semana
- **Técnicos agrícolas** que monitoram dezenas de famílias em múltiplos municípios
- **Gestores de cooperativas** que precisam de relatórios para crédito rural

---
