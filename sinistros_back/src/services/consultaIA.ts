import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const responseSchema = {
  type: "object",
  properties: {
    locais: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          observacao: { type: "string" },
        },
        required: ["nome", "observacao"],
      },
    },
    faixaPrecoEstimada: { type: "string" },
    dica: { type: "string" },
  },
  required: ["locais", "faixaPrecoEstimada", "dica"],
}

export async function consultarPeca(
  descricaoPeca: string,
  marca: string,
  modelo: string | null,
  ano: number
) {
  const prompt = `Você é um assistente de uma oficina mecânica no Brasil.
Preciso de informações sobre a seguinte peça automotiva para o veículo indicado:

Peça: ${descricaoPeca}
Veículo: ${marca} ${modelo ?? ""} ${ano}

Retorne:
1. De 2 a 4 tipos de locais/fornecedores onde essa peça costuma ser encontrada no Brasil (ex: loja de autopeças, concessionária, desmanche/ferro-velho, e-commerce), cada um com uma breve observação de quando vale a pena escolher essa opção.
2. Uma faixa de preço estimada em reais (R$) para essa peça no mercado brasileiro.
3. Uma dica prática de onde costuma ser mais barato comprar essa peça específica.`

  const resposta = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  })

  return JSON.parse(resposta.text || "{}")
}