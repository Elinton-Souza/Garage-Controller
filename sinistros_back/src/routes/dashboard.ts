import { prisma } from "../../lib/prisma"
import { Router } from 'express'

const router = Router()

const STATUS_VALIDOS = [
  "INICIAL",
  "AGUARDANDO_AUTORIZACAO",
  "AUTORIZADO_COMPRA_PECAS",
  "EM_SERVICO",
  "FINALIZADO",
  "ENTREGUE",
] as const

type StatusValor = typeof STATUS_VALIDOS[number]

function parseStatusFiltro(query: any): StatusValor[] | null {
  const bruto = query.status
  if (!bruto) return null
  const lista = Array.isArray(bruto) ? bruto : [bruto]
  const validos = lista.filter((s): s is StatusValor =>
    typeof s === "string" && (STATUS_VALIDOS as readonly string[]).includes(s)
  )
  return validos.length > 0 ? validos : null
}

router.get("/resumo", async (req, res) => {
  /*
  #swagger.tags = ["Dashboard"];
  #swagger.summary = "Retorna o resumo de dados para o dashboard";
  #swagger.description = "Retorna sinistros por status, sinistros por tipo de atendimento, veículos por marca e o valor total de orçamentos por mês. Aceita filtros opcionais via query string: status (repetível, ex: ?status=INICIAL&status=EM_SERVICO), ano (ex: ?ano=2026) e mes (1-12, ex: ?mes=9) para isolar um mês específico — sem 'mes', retorna o acumulado do ano.";
  #swagger.parameters['status'] = { in: 'query', required: false, description: 'Filtra por status do sinistro (pode repetir o parâmetro)', schema: { type: 'string' } };
  #swagger.parameters['ano'] = { in: 'query', required: false, description: 'Ano de referência (padrão: ano atual)', schema: { type: 'integer' } };
  #swagger.parameters['mes'] = { in: 'query', required: false, description: 'Mês (1-12) para isolar; se omitido, retorna o acumulado do ano', schema: { type: 'integer' } };
  */
  try {
    const statusFiltro = parseStatusFiltro(req.query)
    const hoje = new Date()
    const ano = req.query.ano ? Number(req.query.ano) : hoje.getFullYear()
    const mesFiltro = req.query.mes ? Number(req.query.mes) : null

    const inicioPeriodo = mesFiltro
      ? new Date(ano, mesFiltro - 1, 1)
      : new Date(ano, 0, 1)
    const fimPeriodo = mesFiltro
      ? new Date(ano, mesFiltro, 1)
      : new Date(ano + 1, 0, 1)

    const whereSinistro = {
      dataAbertura: { gte: inicioPeriodo, lt: fimPeriodo },
      ...(statusFiltro ? { statusAtual: { in: statusFiltro } } : {}),
    }

    const sinistrosPorStatus = await prisma.sinistro.groupBy({
      by: ["statusAtual"],
      where: whereSinistro,
      _count: { _all: true },
    })

    const sinistrosPorTipo = await prisma.sinistro.groupBy({
      by: ["tipoAtendimento"],
      where: whereSinistro,
      _count: { _all: true },
    })

    const veiculosPorMarca = await prisma.veiculo.groupBy({
      by: ["marca"],
      _count: { _all: true },
    })

    const orcamentos = await prisma.orcamento.findMany({
      where: {
        dataCriacao: { gte: inicioPeriodo, lt: fimPeriodo },
        ...(statusFiltro ? { sinistro: { statusAtual: { in: statusFiltro } } } : {}),
      },
      select: { dataCriacao: true, valorTotal: true },
    })

    const valorPorMes = new Map<string, number>()
    // zera todos os meses do período para o gráfico não "pular" meses sem orçamento
    // e para o mês atual sempre aparecer, mesmo com valor zero.
    const mesesDoPeriodo = mesFiltro ? [mesFiltro] : Array.from({ length: 12 }, (_, i) => i + 1)
    for (const m of mesesDoPeriodo) {
      valorPorMes.set(`${ano}-${String(m).padStart(2, "0")}`, 0)
    }
    for (const o of orcamentos) {
      const chave = `${o.dataCriacao.getFullYear()}-${String(o.dataCriacao.getMonth() + 1).padStart(2, "0")}`
      const atual = valorPorMes.get(chave) ?? 0
      valorPorMes.set(chave, atual + Number(o.valorTotal))
    }

    const valorOrcamentosPorMes = Array.from(valorPorMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }))

    const mesAtualChave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`

    res.status(200).json({
      filtros: { status: statusFiltro, ano, mes: mesFiltro },
      mesAtualChave,
      geradoEm: hoje.toISOString(),
      sinistrosPorStatus: sinistrosPorStatus.map((s) => ({
        status: s.statusAtual,
        quantidade: s._count._all,
      })),
      sinistrosPorTipo: sinistrosPorTipo.map((s) => ({
        tipo: s.tipoAtendimento,
        quantidade: s._count._all,
      })),
      veiculosPorMarca: veiculosPorMarca.map((v) => ({
        marca: v.marca,
        quantidade: v._count._all,
      })),
      valorOrcamentosPorMes,
    })
  } catch (error) {
    console.error("Erro ao gerar resumo do dashboard:", error)
    res.status(500).json({
      erro: "Erro ao gerar resumo do dashboard",
      detalhe: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router
