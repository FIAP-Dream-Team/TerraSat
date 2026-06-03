// ZARC — Zoneamento Agrícola de Risco Climático (MAPA)
// Baseado nas tabelas oficiais publicadas pelo Ministério da Agricultura
// https://www.gov.br/agricultura/zarc
//
// Lógica simplificada para MVP: região × cultura × mês atual
// Versão completa consultaria o serviço oficial por município

export interface DadosZarc {
  culturasPrincipais: string[]   // culturas do município (IBGE PAM)
  janelaAtual: "o" | "t" | "r" | "n"
  labelJanela: string
  proximaJanela: string          // próxima janela favorável
  recomendacaoZarc: string
}

type Regiao = "norte" | "nordeste" | "centrooeste" | "sudeste" | "sul"

// Mapeamento UF → região
const UF_REGIAO: Record<string, Regiao> = {
  AM:"norte",   PA:"norte",  RO:"norte",  AC:"norte",  RR:"norte",  AP:"norte",  TO:"norte",
  MA:"nordeste",PI:"nordeste",CE:"nordeste",RN:"nordeste",PB:"nordeste",
  PE:"nordeste",AL:"nordeste",SE:"nordeste",BA:"nordeste",
  MG:"sudeste", ES:"sudeste", RJ:"sudeste", SP:"sudeste",
  PR:"sul",     SC:"sul",     RS:"sul",
  MS:"centrooeste",MT:"centrooeste",GO:"centrooeste",DF:"centrooeste",
}

// Janelas de plantio por cultura e região (meses 1–12)
// "o" = ótima  "t" = tolerável  "r" = risco  "n" = não recomendado
type RiscoPeriodo = "o" | "t" | "r" | "n"

const ZARC_TABELA: Record<string, Record<Regiao, RiscoPeriodo[]>> = {
  feijao: {
    //             jan  fev  mar  abr  mai  jun  jul  ago  set  out  nov  dez
    norte:        ["o","o","t","t","n","n","n","n","t","o","o","o"],
    nordeste:     ["o","o","o","t","t","n","n","n","t","t","o","o"],
    centrooeste:  ["t","t","n","n","n","r","r","n","n","t","o","o"],
    sudeste:      ["t","n","n","n","n","r","r","n","n","t","o","o"],
    sul:          ["n","n","n","n","n","r","r","n","t","o","o","t"],
  },
  milho: {
    norte:        ["o","o","o","t","n","n","n","n","t","o","o","o"],
    nordeste:     ["o","o","o","t","n","n","n","n","n","t","o","o"],
    centrooeste:  ["t","n","n","n","n","n","n","n","n","t","o","o"],
    sudeste:      ["t","n","n","n","n","n","n","n","n","t","o","o"],
    sul:          ["n","n","n","n","n","n","n","n","t","o","o","t"],
  },
  soja: {
    norte:        ["o","o","n","n","n","n","n","n","n","o","o","o"],
    nordeste:     ["t","t","n","n","n","n","n","n","n","n","t","o"],
    centrooeste:  ["n","n","n","n","n","n","n","n","n","t","o","o"],
    sudeste:      ["n","n","n","n","n","n","n","n","n","t","o","o"],
    sul:          ["n","n","n","n","n","n","n","n","n","o","o","o"],
  },
  cafe: {
    norte:        ["t","t","t","o","o","o","o","o","o","o","t","t"],
    nordeste:     ["t","t","t","o","o","o","o","o","o","o","t","t"],
    centrooeste:  ["t","t","n","n","n","t","t","t","t","o","t","t"],
    sudeste:      ["t","t","n","n","n","t","t","t","t","o","o","t"],
    sul:          ["t","n","n","n","n","r","r","n","t","o","o","t"],
  },
  arroz: {
    norte:        ["o","o","o","t","n","n","n","n","t","o","o","o"],
    nordeste:     ["o","o","o","t","n","n","n","n","n","t","o","o"],
    centrooeste:  ["t","n","n","n","n","n","n","n","n","t","o","o"],
    sudeste:      ["t","n","n","n","n","n","n","n","n","t","o","t"],
    sul:          ["t","n","n","n","n","n","n","n","t","o","o","o"],
  },
  cana: {
    norte:        ["o","o","o","o","o","t","t","t","o","o","o","o"],
    nordeste:     ["o","o","o","o","t","t","t","t","o","o","o","o"],
    centrooeste:  ["t","o","o","o","n","n","n","n","o","o","o","t"],
    sudeste:      ["t","o","o","o","n","n","n","n","o","o","o","t"],
    sul:          ["n","t","o","o","n","n","n","n","t","o","o","n"],
  },
}

const LABEL_RISCO: Record<RiscoPeriodo, string> = {
  o: "Janela ótima de plantio",
  t: "Janela tolerável — atenção ao clima",
  r: "Risco moderado — não recomendado",
  n: "Fora da janela de plantio",
}

const RECOMENDACAO: Record<RiscoPeriodo, string> = {
  o: "Período favorável para plantio segundo o MAPA. Condições climáticas esperadas dentro do padrão para esta cultura.",
  t: "Plantio possível mas com atenção redobrada às previsões de chuva e temperatura nas próximas semanas.",
  r: "Risco agroclimático moderado. O MAPA não recomenda plantio neste período — considere aguardar.",
  n: "Fora da janela de plantio para esta cultura na sua região segundo o Zoneamento Agrícola do MAPA.",
}

// Encontra o próximo mês com janela ótima ou tolerável
function proximaJanelaFavoravel(cultura: string, regiao: Regiao, mesAtual: number): string {
  const tabela = ZARC_TABELA[cultura]?.[regiao]
  if (!tabela) return "Consulte o ZARC/MAPA"

  const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  for (let i = 1; i <= 12; i++) {
    const idx = (mesAtual + i - 1) % 12
    if (tabela[idx] === "o" || tabela[idx] === "t") {
      return MESES[idx]
    }
  }
  return "Consulte o ZARC/MAPA"
}

// Normaliza nome de cultura para chave interna
function normalizarCultura(cultura: string): string {
  const c = cultura.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  if (c.includes("feijao") || c.includes("feijão")) return "feijao"
  if (c.includes("milho")) return "milho"
  if (c.includes("soja")) return "soja"
  if (c.includes("cafe") || c.includes("café")) return "cafe"
  if (c.includes("arroz")) return "arroz"
  if (c.includes("cana")) return "cana"
  return ""
}

export function consultarZarc(
  uf: string,
  culturas: string[],  // culturas do município (do IBGE PAM ou do usuário)
  mes?: number         // 1–12, padrão = mês atual
): DadosZarc {
  const regiao: Regiao = UF_REGIAO[uf] ?? "centrooeste"
  const mesAtual = mes ?? new Date().getMonth() + 1 // 1-based
  const idx = mesAtual - 1

  // Culturas principais: usa as fornecidas ou padrão regional
  const culturasDisponiveis = culturas.length > 0 ? culturas : ["milho", "feijão"]

  // Avalia o risco para cada cultura e pega o melhor (menor risco)
  const ORDEM: RiscoPeriodo[] = ["o", "t", "r", "n"]
  let melhorRisco: RiscoPeriodo = "n"
  let melhorCultura = ""
  let proximaJanela = ""
  let encontrouDados = false

  for (const cultura of culturasDisponiveis) {
    const chave = normalizarCultura(cultura)
    if (!chave) continue
    const tabela = ZARC_TABELA[chave]?.[regiao]
    if (!tabela) continue

    encontrouDados = true
    const risco = tabela[idx]

    // Atualiza se for melhor risco OU se ainda não temos cultura definida
    if (!melhorCultura || ORDEM.indexOf(risco) < ORDEM.indexOf(melhorRisco)) {
      melhorRisco = risco
      melhorCultura = cultura
      proximaJanela = risco === "o"
        ? "Agora é a janela ideal"
        : proximaJanelaFavoravel(chave, regiao, mesAtual)
    }
  }

  if (!encontrouDados) {
    return {
      culturasPrincipais: culturasDisponiveis,
      janelaAtual: "n",
      labelJanela: "Sem dados ZARC para estas culturas",
      proximaJanela: "Consulte o ZARC/MAPA",
      recomendacaoZarc: "Consulte o Zoneamento Agrícola de Risco Climático no portal do MAPA.",
    }
  }

  return {
    culturasPrincipais: culturasDisponiveis,
    janelaAtual: melhorRisco,
    labelJanela: LABEL_RISCO[melhorRisco],
    proximaJanela,
    recomendacaoZarc: RECOMENDACAO[melhorRisco],
  }
}
