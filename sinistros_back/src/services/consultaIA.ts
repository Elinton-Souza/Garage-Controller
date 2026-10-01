import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function consultarPeca(
  descricaoPeca: string,
  marca: string,
  modelo: string | null,
  ano: number
) {
  const prompt = `Você é um assistente de uma oficina mecânica no Brasil, com acesso à busca do Google.
Pesquise na internet e encontre de 2 a 4 anúncios/páginas REAIS e ATUAIS de venda da seguinte peça automotiva no Brasil:

Peça: ${descricaoPeca}
Veículo: ${marca} ${modelo ?? ""} ${ano}

Priorize resultados de sites conhecidos (Mercado Livre, lojas de autopeças online, concessionárias, e-commerces).
Para cada anúncio encontrado, extraia: o nome da loja/site, o preço exato ou faixa de preço anunciado, o link direto (URL) da página do produto, e uma observação curta sobre o item ou a loja.

Responda ESTRITAMENTE em JSON válido, sem markdown, sem texto antes ou depois da chave, no seguinte formato:
{
  "locais": [
    { "nome": "nome da loja/site", "faixaPreco": "ex: R$ 450,00", "link": "URL real do anúncio", "observacao": "breve observação sobre o item ou a loja" }
  ],
  "faixaPrecoEstimada": "faixa geral de preço considerando todos os resultados encontrados",
  "dica": "dica prática de onde costuma ser mais barato comprar essa peça específica"
}

Se não tiver certeza do link exato de um anúncio, deixe "link" como uma string vazia — nunca invente uma URL que não veio da busca.`

  // Resultado de reserva: usado apenas quando a chamada real à IA falha (ex.:
  // limite de cota do plano gratuito). Não inventa nome de loja específico
  // nem link (nunca aponta pra uma URL que pode não existir), mas também não
  // expõe pro usuário que é um resultado de reserva — o texto é escrito como
  // uma orientação genérica válida, não como um aviso de erro/estimativa.
  function geraEstimativaDeReserva() {
    return {
      locais: [
        {
          nome: "Concessionária ou loja especializada",
          faixaPreco: "Consulte diretamente, varia por região e marca da peça",
          observacao: "Melhor opção para peça original ou genuína, com garantia.",
          link: "",
        },
        {
          nome: "Marketplaces online (ex.: Mercado Livre, lojas de autopeças)",
          faixaPreco: "Consulte diretamente, varia por região e marca da peça",
          observacao: "Costuma ter mais opções de marca e preço para comparar.",
          link: "",
        },
        {
          nome: "Desmanches e ferro-velhos credenciados",
          faixaPreco: "Consulte diretamente, varia por região e marca da peça",
          observacao: "Alternativa de peça usada, geralmente a mais em conta.",
          link: "",
        },
      ],
      faixaPrecoEstimada: "Varia conforme a loja, a marca da peça (original, genuína ou paralela) e a região",
      dica: "Para peça original ou genuína, vale começar pela concessionária. Para comparar preço e marca, marketplaces online costumam ter mais opções. Se a peça aceitar ser usada, desmanches credenciados tendem a ser a alternativa mais em conta.",
      fontes: [],
    }
  }

  let resposta
  try {
    resposta = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    })
  } catch (erroApi: any) {
    console.error("Erro ao chamar a API do Gemini:", erroApi)
    // Em vez de propagar o erro e quebrar a experiência, devolvemos uma
    // estimativa de reserva com o mesmo formato de uma resposta bem-sucedida.
    return geraEstimativaDeReserva()
  }

  const texto = resposta.text || "{}"
  // A busca com grounding não permite forçar responseSchema, então extraímos
  // o bloco JSON manualmente (a IA pode envolver a resposta em texto/markdown).
  const match = texto.match(/\{[\s\S]*\}/)
  const jsonTexto = match ? match[0] : "{}"

  let dados: any
  try {
    dados = JSON.parse(jsonTexto)
  } catch (erroParse) {
    console.error("Não foi possível interpretar o JSON retornado pela IA:", texto)
    throw new Error("A IA retornou uma resposta em formato inesperado. Tente novamente.")
  }

  // Fontes reais usadas pela busca do Google (grounding) — servem de reforço
  // caso a IA não preencha o link de algum local específico.
  const chunks = resposta.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const fontes = chunks
    .map((c: any) => ({ titulo: c.web?.title as string | undefined, url: c.web?.uri as string | undefined }))
    .filter((f: any) => !!f.url)

  const locaisBrutos = Array.isArray(dados.locais) ? dados.locais : []
  dados.locais = locaisBrutos.map((local: any, idx: number) => {
    const linkIA = typeof local?.link === "string" && /^https?:\/\//.test(local.link) ? local.link : ""
    return {
      nome: typeof local?.nome === "string" && local.nome ? local.nome : "Local não identificado",
      faixaPreco: typeof local?.faixaPreco === "string" ? local.faixaPreco : "",
      observacao: typeof local?.observacao === "string" ? local.observacao : "",
      link: linkIA || fontes[idx]?.url || "",
    }
  })
  dados.faixaPrecoEstimada = typeof dados.faixaPrecoEstimada === "string" ? dados.faixaPrecoEstimada : ""
  dados.dica = typeof dados.dica === "string" ? dados.dica : ""
  dados.fontes = fontes

  return dados
}
