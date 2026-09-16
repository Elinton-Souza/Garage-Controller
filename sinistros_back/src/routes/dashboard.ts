import { prisma } from "../../lib/prisma"
import { Router } from 'express'

const router = Router()

router.get("/resumo", async (req, res) => {
  try {
    const sinistrosPorStatus = await prisma.sinistro.groupBy({
      by: ["statusAtual"],
      _count: { _all: true },
    })

    const sinistrosPorTipo = await prisma.sinistro.groupBy({
      by: ["tipoAtendimento"],
      _count: { _all: true },
    })

    const veiculosPorMarca = await prisma.veiculo.groupBy({
      by: ["marca"],
      _count: { _all: true },
    })

    const orcamentos = await prisma.orcamento.findMany({
      select: { dataCriacao: true, valorTotal: true },
    })

    const valorPorMes = new Map<string, number>()
    for (const o of orcamentos) {
      const chave = `${o.dataCriacao.getFullYear()}-${String(o.dataCriacao.getMonth() + 1).padStart(2, "0")}`
      const atual = valorPorMes.get(chave) ?? 0
      valorPorMes.set(chave, atual + Number(o.valorTotal))
    }

    const valorOrcamentosPorMes = Array.from(valorPorMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }))

    res.status(200).json({
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
    console.error(error)
    res.status(500).json({ erro: error })
  }
})

export default router